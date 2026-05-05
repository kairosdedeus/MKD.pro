-- ============================================================
-- Migration 001: Tabela de configurações do sistema
-- Execute no SQL Editor do Supabase
-- ============================================================

CREATE TABLE IF NOT EXISTS system_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES users_profile(id) ON DELETE SET NULL
);

-- Seed: URL padrão da API cobalt
INSERT INTO system_settings (key, value, description)
VALUES (
  'cobalt_api_url',
  'https://api.cobalt.tools',
  'URL base da API cobalt.tools para conversão YouTube → MP3'
)
ON CONFLICT (key) DO NOTHING;

-- RLS: apenas gerencial pode alterar, todos autenticados podem ler
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settings_select" ON system_settings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "settings_update" ON system_settings
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN profiles p ON p.id = up.profile_id
      JOIN users_profile u ON u.id = up.user_id
      WHERE u.auth_user_id = auth.uid()
        AND p.codigo = 'gerencial'
    )
  );

SELECT '✅ Migration 001 aplicada!' AS resultado;
