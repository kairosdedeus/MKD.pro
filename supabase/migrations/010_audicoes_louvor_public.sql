CREATE TABLE IF NOT EXISTS audition_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    sobrenome TEXT NOT NULL,
    email TEXT NOT NULL,
    telefone TEXT,
    data_nascimento DATE,
    ministerio TEXT,
    instrumentos TEXT[],
    outro_instrumento TEXT,
    encontro_deus TEXT,
    data_encontro TEXT,
    escola_lideres TEXT,
    data_escola TEXT,
    celula TEXT,
    celula_info TEXT,
    tempo_igreja TEXT,
    discipulado TEXT,
    discipulador TEXT,
    endereco TEXT,
    mensagem TEXT,
    chamado TEXT,
    tempo_experiencia TEXT,
    nivel TEXT,
    leitura TEXT,
    experiencia_anterior TEXT,
    experiencia_detalhes TEXT,
    disponibilidade TEXT[],
    compromisso_cultos TEXT,
    compromisso_obs TEXT,
    vida_devocional TEXT,
    video_metodo TEXT DEFAULT 'upload' CHECK (video_metodo IN ('upload', 'whatsapp')),
    video_link TEXT,
    musica_escolhida TEXT,
    observacoes_video TEXT,
    declaracao BOOLEAN DEFAULT FALSE,
    assinatura TEXT,
    data_envio TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'analisado')),
    analise TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT audition_responses_email_unique UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS idx_audition_responses_email ON audition_responses(email);
CREATE INDEX IF NOT EXISTS idx_audition_responses_created_at ON audition_responses(created_at DESC);

ALTER TABLE audition_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audition_responses_public_insert" ON audition_responses;
CREATE POLICY "audition_responses_public_insert"
ON audition_responses
FOR INSERT
TO public
WITH CHECK (true);

DROP POLICY IF EXISTS "audition_responses_public_select" ON audition_responses;
CREATE POLICY "audition_responses_public_select"
ON audition_responses
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "audition_responses_authenticated_update" ON audition_responses;
CREATE POLICY "audition_responses_authenticated_update"
ON audition_responses
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "audition_responses_authenticated_delete" ON audition_responses;
CREATE POLICY "audition_responses_authenticated_delete"
ON audition_responses
FOR DELETE
TO authenticated
USING (true);

CREATE OR REPLACE FUNCTION set_audition_responses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_audition_responses_updated_at ON audition_responses;
CREATE TRIGGER trg_set_audition_responses_updated_at
BEFORE UPDATE ON audition_responses
FOR EACH ROW
EXECUTE FUNCTION set_audition_responses_updated_at();

SELECT 'Tabela de audições criada com regra de envio único por e-mail.' AS status;
