-- Um cofre por código de sincronia. "dados" já chega criptografado
-- pelo navegador: o Worker nunca vê tarefas nem planos.
CREATE TABLE IF NOT EXISTS cofres (
    id            TEXT PRIMARY KEY,
    versao        INTEGER NOT NULL,
    dados         TEXT NOT NULL,
    atualizado_em INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS cofres_atualizado ON cofres (atualizado_em);
