/**
 * Migration Service
 *
 * Permite executar scripts SQL diretamente do app (apenas gerencial).
 * Usa a função RPC `exec_sql` que precisa ser criada no banco.
 *
 * IMPORTANTE: Execute o SQL abaixo no Supabase para habilitar:
 *
 * CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
 * RETURNS JSONB
 * LANGUAGE plpgsql
 * SECURITY DEFINER
 * AS $$
 * DECLARE result JSONB;
 * BEGIN
 *   EXECUTE sql_query;
 *   result := '{"success": true}'::JSONB;
 *   RETURN result;
 * EXCEPTION WHEN OTHERS THEN
 *   RETURN jsonb_build_object('success', false, 'error', SQLERRM, 'code', SQLSTATE);
 * END;
 * $$;
 *
 * -- Restringir apenas a service_role (não expor para usuários comuns)
 * REVOKE ALL ON FUNCTION exec_sql FROM PUBLIC;
 * GRANT EXECUTE ON FUNCTION exec_sql TO service_role;
 */

import { supabase } from "@/lib/supabaseClient";

export interface MigrationResult {
  success: boolean;
  error?: string;
  code?: string;
  rows_affected?: number;
}

export interface Migration {
  id: string;
  name: string;
  description: string;
  sql: string;
  applied?: boolean;
}

/** Lista de migrations disponíveis no sistema */
export const MIGRATIONS: Migration[] = [
  {
    id: "001",
    name: "system_settings",
    description: "Tabela de configurações do sistema (cobalt API URL, etc.)",
    sql: `
CREATE TABLE IF NOT EXISTS system_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES users_profile(id) ON DELETE SET NULL
);

INSERT INTO system_settings (key, value, description)
VALUES (
  'cobalt_api_url',
  'https://api.cobalt.tools',
  'URL base da API cobalt.tools para conversão YouTube → MP3'
)
ON CONFLICT (key) DO NOTHING;

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "settings_select" ON system_settings;
DROP POLICY IF EXISTS "settings_update" ON system_settings;

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
    `.trim(),
  },
];

export const migrationService = {
  /**
   * Verifica se a tabela system_settings existe.
   * Serve como proxy para saber se a migration 001 foi aplicada.
   */
  async checkMigration001(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("system_settings")
        .select("key")
        .limit(1);
      return !error;
    } catch {
      return false;
    }
  },

  /**
   * Verifica quais migrations já foram aplicadas.
   */
  async getAppliedMigrations(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    results["001"] = await this.checkMigration001();
    return results;
  },

  /**
   * Executa um SQL arbitrário via RPC exec_sql.
   * Requer que a função exec_sql esteja criada no banco.
   */
  async executeSql(sql: string): Promise<MigrationResult> {
    try {
      const { data, error } = await supabase.rpc("exec_sql", {
        sql_query: sql,
      });

      if (error) {
        return { success: false, error: error.message, code: error.code };
      }

      if (data && !data.success) {
        return { success: false, error: data.error, code: data.code };
      }

      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  },

  /**
   * Aplica uma migration específica.
   */
  async applyMigration(migration: Migration): Promise<MigrationResult> {
    return this.executeSql(migration.sql);
  },
};
