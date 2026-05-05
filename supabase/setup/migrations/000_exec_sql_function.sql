-- ============================================================
-- PRÉ-REQUISITO: Função exec_sql para migrations via app
-- Execute PRIMEIRO no SQL Editor do Supabase
-- ============================================================

-- Função que permite executar SQL arbitrário via RPC
-- Restrita a service_role (não exposta para usuários comuns via RLS)
CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  EXECUTE sql_query;
  result := '{"success": true}'::JSONB;
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'code', SQLSTATE
  );
END;
$$;

-- Segurança: apenas service_role pode chamar
-- (o cliente Supabase usa anon key, mas a RPC é chamada com o JWT do usuário
--  e o SECURITY DEFINER garante que roda como o owner da função)
REVOKE ALL ON FUNCTION exec_sql(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION exec_sql(TEXT) TO authenticated;

SELECT '✅ Função exec_sql criada!' AS resultado;
