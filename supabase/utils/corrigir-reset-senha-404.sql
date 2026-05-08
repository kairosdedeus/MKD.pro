-- ============================================================
-- CORREÇÃO DEFINITIVA: reset_user_password 404
--
-- O PostgREST retorna 404 quando:
-- 1. A função não existe no schema exposto
-- 2. O schema não está na lista de schemas expostos
-- 3. O PostgREST não recarregou após a criação
-- 4. Falta grant para o role que faz a chamada
--
-- Execute este script completo no Supabase SQL Editor.
-- ============================================================

-- DIAGNÓSTICO: verificar se a função existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'reset_user_password'
  ) THEN
    RAISE NOTICE '✅ Função existe no banco';
  ELSE
    RAISE NOTICE '❌ Função NÃO existe - será criada agora';
  END IF;
END $$;

-- PASSO 1: Garantir extensão
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- PASSO 2: Remover versão antiga
DROP FUNCTION IF EXISTS public.reset_user_password(uuid, text);
DROP FUNCTION IF EXISTS reset_user_password(uuid, text);

-- PASSO 3: Criar função com configuração correta para PostgREST
CREATE OR REPLACE FUNCTION public.reset_user_password(
  p_user_profile_id uuid,
  p_new_password     text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
-- CRÍTICO: search_path deve incluir public e auth
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_target_auth_user_id uuid;
  v_is_manager          boolean;
BEGIN
  -- Validar senha
  IF length(coalesce(p_new_password, '')) < 8 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error',   'A senha deve ter pelo menos 8 caracteres.'
    );
  END IF;

  -- Verificar se quem chama é gerencial
  SELECT EXISTS (
    SELECT 1
    FROM   public.users_profile  up
    JOIN   public.user_profiles  upr ON upr.user_id  = up.id
    JOIN   public.profiles       pr  ON pr.id        = upr.profile_id
    WHERE  up.auth_user_id = auth.uid()
      AND  up.ativo        = true
      AND  pr.codigo       = 'gerencial'
  ) INTO v_is_manager;

  IF NOT v_is_manager THEN
    RETURN jsonb_build_object(
      'success', false,
      'error',   'Apenas usuários gerenciais podem redefinir senhas.'
    );
  END IF;

  -- Buscar auth_user_id do alvo
  SELECT auth_user_id
  INTO   v_target_auth_user_id
  FROM   public.users_profile
  WHERE  id = p_user_profile_id
    AND  ativo = true;

  IF v_target_auth_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error',   'Usuário não encontrado ou inativo.'
    );
  END IF;

  -- Atualizar senha
  UPDATE auth.users
  SET    encrypted_password = crypt(p_new_password, gen_salt('bf')),
         updated_at         = now(),
         recovery_token     = '',
         recovery_sent_at   = null
  WHERE  id = v_target_auth_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error',   'Credencial de login não encontrada.'
    );
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- PASSO 4: Owner e grants
ALTER  FUNCTION public.reset_user_password(uuid, text) OWNER TO postgres;
REVOKE ALL     ON FUNCTION public.reset_user_password(uuid, text) FROM PUBLIC;
REVOKE ALL     ON FUNCTION public.reset_user_password(uuid, text) FROM anon;
REVOKE ALL     ON FUNCTION public.reset_user_password(uuid, text) FROM authenticated;
GRANT  EXECUTE ON FUNCTION public.reset_user_password(uuid, text) TO authenticated;
GRANT  EXECUTE ON FUNCTION public.reset_user_password(uuid, text) TO service_role;

-- PASSO 5: Forçar reload do PostgREST
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- PASSO 6: Aguardar e verificar
SELECT pg_sleep(1);

-- PASSO 7: Relatório final
SELECT
  '✅ Instalada' AS status,
  n.nspname      AS schema,
  p.proname      AS funcao,
  pg_get_function_identity_arguments(p.oid) AS argumentos,
  CASE p.prosecdef WHEN true THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END AS seguranca
FROM   pg_proc      p
JOIN   pg_namespace n ON n.oid = p.pronamespace
WHERE  n.nspname = 'public'
  AND  p.proname = 'reset_user_password';

-- PASSO 8: Verificar grants
SELECT
  grantee        AS role,
  privilege_type AS permissao
FROM   information_schema.routine_privileges
WHERE  routine_schema = 'public'
  AND  routine_name   = 'reset_user_password'
ORDER  BY grantee;
