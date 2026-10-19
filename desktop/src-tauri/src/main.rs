//! Kaizen de computador: uma janela nativa na frente do mesmo servidor Python do
//! modo navegador, empacotado como "sidecar". O app sobe o servidor numa porta
//! local, espera ele responder, abre a janela nele e o derruba ao fechar.

// Sem janela de console no Windows.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs::OpenOptions;
use std::io::Write;
use std::net::{SocketAddr, TcpListener, TcpStream};
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

use tauri::webview::DownloadEvent;
use tauri::{AppHandle, Manager, RunEvent, WebviewUrl, WebviewWindow, WebviewWindowBuilder};
use tauri_plugin_dialog::{DialogExt, MessageDialogButtons, MessageDialogKind};
use tauri_plugin_opener::OpenerExt;
use tauri_plugin_shell::process::{CommandChild, CommandEvent};
use tauri_plugin_shell::ShellExt;
use tauri_plugin_updater::{Update, UpdaterExt};
use url::Url;

/// Porta FIXA de propósito: o app guarda coisas no localStorage (histórico do
/// chat, aba aberta), que é separado por origem. Com porta sorteada a cada
/// abertura, tudo isso sumiria. Só sorteia se essa estiver ocupada.
const PORTA_PREFERIDA: u16 = 47615;
const ESPERA_MAXIMA: Duration = Duration::from_secs(45);

/// Roda em toda página antes dos scripts dela. Marca o modo computador (o app
/// esconde o "instale no celular") e manda link de fora pra navegação comum,
/// que o `on_navigation` desvia pro navegador do sistema: numa janela de
/// programa, `target="_blank"` não abriria nada.
const SCRIPT_INICIAL: &str = r#"
window.KAIZEN_DESKTOP = true;
document.addEventListener("click", (evento) => {
    const link = evento.target.closest && evento.target.closest("a[href]");
    if (!link || link.hasAttribute("download")) return;
    const destino = new URL(link.href, location.href);
    if (destino.origin !== location.origin || link.target === "_blank") {
        evento.preventDefault();
        location.href = destino.href;
    }
}, true);
window.open = (endereco) => { if (endereco) location.href = new URL(endereco, location.href).href; return null; };
"#;

struct Servidor(Mutex<Option<CommandChild>>);

fn escolher_porta() -> u16 {
    if TcpListener::bind(("127.0.0.1", PORTA_PREFERIDA)).is_ok() {
        return PORTA_PREFERIDA;
    }
    TcpListener::bind(("127.0.0.1", 0))
        .and_then(|l| l.local_addr())
        .map(|a| a.port())
        .unwrap_or(PORTA_PREFERIDA)
}

/// Espera o servidor aceitar conexão. Na 1ª abertura o executável ainda se
/// descompacta, então pode levar alguns segundos.
fn esperar_servidor(porta: u16, morreu: &AtomicBool) -> bool {
    let endereco = SocketAddr::from(([127, 0, 0, 1], porta));
    let inicio = Instant::now();
    while inicio.elapsed() < ESPERA_MAXIMA && !morreu.load(Ordering::SeqCst) {
        if TcpStream::connect_timeout(&endereco, Duration::from_millis(300)).is_ok() {
            return true;
        }
        std::thread::sleep(Duration::from_millis(150));
    }
    false
}

/// Link de fora do app abre no navegador do sistema; a janela nunca sai do Kaizen.
fn navegacao_permitida(app: &AppHandle, url: &Url) -> bool {
    let local = matches!(url.host_str(), Some("127.0.0.1" | "localhost" | "tauri.localhost"));
    match url.scheme() {
        "tauri" | "about" | "blob" | "data" => true,
        "http" | "https" if local => true,
        "http" | "https" | "mailto" => {
            let _ = app.opener().open_url(url.as_str(), None::<&str>);
            false
        }
        _ => false,
    }
}

/// O backup do app é um download de blob: vai direto pra pasta Downloads.
fn tratar_download(app: &AppHandle, evento: DownloadEvent) -> bool {
    match evento {
        DownloadEvent::Requested { destination, .. } => {
            let nome = destination
                .file_name()
                .map(|n| n.to_owned())
                .unwrap_or_else(|| "kaizen-backup.json".into());
            let pasta = app
                .path()
                .download_dir()
                .or_else(|_| app.path().home_dir())
                .unwrap_or_else(|_| PathBuf::from("."));
            *destination = pasta.join(nome);
            true
        }
        DownloadEvent::Finished { path, success, .. } => {
            let (tipo, texto) = match (success, path) {
                (true, Some(caminho)) => (MessageDialogKind::Info, format!("Arquivo salvo em:\n{}", caminho.display())),
                _ => (MessageDialogKind::Error, "Não consegui salvar o arquivo.".to_string()),
            };
            app.dialog().message(texto).title("Kaizen").kind(tipo).show(|_| {});
            true
        }
        _ => true,
    }
}

fn parar_servidor(app: &AppHandle) {
    if let Some(estado) = app.try_state::<Servidor>() {
        if let Some(filho) = estado.0.lock().unwrap().take() {
            let _ = filho.kill();
        }
    }
}

/// Sobe o servidor Python. Os dados (banco) ficam na pasta do app do usuário,
/// não junto do executável — atualizar o app não pode apagar as tarefas.
fn iniciar_servidor(app: &AppHandle, porta: u16, morreu: Arc<AtomicBool>) -> Result<(), Box<dyn std::error::Error>> {
    let dados = app.path().app_data_dir()?;
    let pasta_log = app.path().app_log_dir()?;
    std::fs::create_dir_all(&pasta_log)?;

    let (mut eventos, filho) = app
        .shell()
        .sidecar("kaizen-servidor")?
        .env("HOST", "127.0.0.1")
        .env("PORT", porta.to_string())
        .env("KAIZEN_DADOS", &dados)
        .env("KAIZEN_VIGIAR_STDIN", "1")
        .env("PYTHONUNBUFFERED", "1")
        .spawn()?;
    app.manage(Servidor(Mutex::new(Some(filho))));

    // Log do servidor em arquivo: é o que dá pra pedir quando alguém disser que não abriu.
    let caminho_log = pasta_log.join("servidor.log");
    tauri::async_runtime::spawn(async move {
        let mut log = OpenOptions::new().create(true).append(true).open(caminho_log).ok();
        while let Some(evento) = eventos.recv().await {
            match evento {
                CommandEvent::Stdout(linha) | CommandEvent::Stderr(linha) => {
                    if let Some(arquivo) = log.as_mut() {
                        let _ = arquivo.write_all(linha.trim_ascii_end());
                        let _ = arquivo.write_all(b"\n");
                    }
                }
                CommandEvent::Terminated(_) => {
                    morreu.store(true, Ordering::SeqCst);
                    break;
                }
                _ => {}
            }
        }
    });
    Ok(())
}

fn mostrar_erro(janela: &WebviewWindow, texto: &str) {
    let texto = serde_json::to_string(texto).unwrap_or_default();
    let _ = janela.eval(format!("window.mostrarErro && window.mostrarErro({texto})"));
}

async fn procurar_atualizacao(app: AppHandle) {
    let Ok(atualizador) = app.updater() else { return };
    let Ok(Some(nova)) = atualizador.check().await else { return };
    let texto = format!(
        "A versão {} do Kaizen está disponível (você está na {}).\n\nAtualizar agora? O app reinicia sozinho e suas tarefas continuam onde estão.",
        nova.version, nova.current_version
    );
    let handle = app.clone();
    app.dialog()
        .message(texto)
        .title("Atualização disponível")
        .buttons(MessageDialogButtons::OkCancelCustom("Atualizar agora".into(), "Depois".into()))
        .show(move |sim| {
            if sim {
                tauri::async_runtime::spawn(instalar_atualizacao(handle, nova));
            }
        });
}

async fn instalar_atualizacao(app: AppHandle, nova: Update) {
    // No Windows o instalador não substitui um executável em uso.
    parar_servidor(&app);
    if let Err(erro) = nova.download_and_install(|_, _| {}, || {}).await {
        app.dialog()
            .message(format!("Não consegui atualizar: {erro}\n\nO Kaizen vai reabrir na versão atual."))
            .title("Atualização")
            .kind(MessageDialogKind::Error)
            .blocking_show();
    }
    app.restart();
}

fn main() {
    tauri::Builder::default()
        // Abrir de novo só traz a janela que já está aberta (dois servidores brigariam pela porta e pelo banco).
        .plugin(tauri_plugin_single_instance::init(|app, _, _| {
            if let Some(janela) = app.get_webview_window("principal") {
                let _ = janela.unminimize();
                let _ = janela.set_focus();
            }
        }))
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            let handle = app.handle().clone();
            let (nav, down) = (handle.clone(), handle.clone());
            let janela = WebviewWindowBuilder::new(app, "principal", WebviewUrl::App("index.html".into()))
                .title("Kaizen")
                .inner_size(1280.0, 820.0)
                .min_inner_size(900.0, 600.0)
                .center()
                .initialization_script(SCRIPT_INICIAL)
                .on_navigation(move |url| navegacao_permitida(&nav, url))
                .on_download(move |_, evento| tratar_download(&down, evento))
                .build()?;

            let porta = escolher_porta();
            let morreu = Arc::new(AtomicBool::new(false));
            if let Err(erro) = iniciar_servidor(&handle, porta, morreu.clone()) {
                mostrar_erro(&janela, &format!("Não consegui iniciar o Kaizen: {erro}"));
                return Ok(());
            }

            tauri::async_runtime::spawn(async move {
                let espera = morreu.clone();
                let pronto = tauri::async_runtime::spawn_blocking(move || esperar_servidor(porta, &espera))
                    .await
                    .unwrap_or(false);
                if !pronto {
                    mostrar_erro(&janela, "O servidor do Kaizen não respondeu. Feche e abra de novo; se continuar, veja o servidor.log na pasta de logs do app.");
                    return;
                }
                let endereco = Url::parse(&format!("http://127.0.0.1:{porta}/")).expect("endereço local válido");
                let _ = janela.navigate(endereco);
                procurar_atualizacao(handle).await;
            });
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("erro ao montar o Kaizen")
        .run(|app, evento| {
            if let RunEvent::Exit = evento {
                parar_servidor(app);
            }
        });
}
