ALTER TABLE audition_responses
  DROP CONSTRAINT IF EXISTS audition_responses_status_check;

UPDATE audition_responses
SET status = 'pendente'
WHERE status = 'analisado';

ALTER TABLE audition_responses
  ADD CONSTRAINT audition_responses_status_check
  CHECK (status IN ('pendente', 'aprovado', 'reprovado'));

CREATE TABLE IF NOT EXISTS audition_settings (
  key TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO audition_settings (key, enabled)
VALUES ('show_approved_results', FALSE)
ON CONFLICT (key) DO NOTHING;

INSERT INTO audition_settings (key, enabled)
VALUES ('show_audition_registrations', TRUE)
ON CONFLICT (key) DO NOTHING;

ALTER TABLE audition_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audition_settings_public_select" ON audition_settings;
CREATE POLICY "audition_settings_public_select"
ON audition_settings
FOR SELECT
TO anon, authenticated
USING (key IN ('show_audition_registrations', 'show_approved_results'));

DROP POLICY IF EXISTS "audition_settings_authenticated_manage" ON audition_settings;
CREATE POLICY "audition_settings_authenticated_manage"
ON audition_settings
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "audition_responses_public_select" ON audition_responses;

DROP POLICY IF EXISTS "audition_responses_authenticated_select" ON audition_responses;
CREATE POLICY "audition_responses_authenticated_select"
ON audition_responses
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "audition_responses_public_approved_select"
ON audition_responses
FOR SELECT
TO anon
USING (status = 'aprovado');

DROP POLICY IF EXISTS "audition_responses_public_approved_select" ON audition_responses;

CREATE OR REPLACE VIEW approved_audition_results AS
SELECT nome, sobrenome, telefone, discipulador
FROM audition_responses
WHERE status = 'aprovado';

GRANT SELECT ON approved_audition_results TO anon, authenticated;