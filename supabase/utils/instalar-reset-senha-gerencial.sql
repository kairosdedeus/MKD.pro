-- ============================================================
-- Instalar/verificar RPC para redefinir senha pelo Gerencial
-- Seguro para executar em banco já existente.
-- Não cria tabelas.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DROP FUNCTION IF EXISTS public.reset_user_password(UUID, TEXT);

CREATE OR REPLACE FUNCTION public.reset_user_password(
  p_user_profile_id UUID,
  p_new_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_target_auth_user_id UUID;
  v_is_manager BOOLEAN;
BEGIN
  IF length(coalesce(p_new_password, '')) < 8 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'A senha deve ter pelo menos 8 caracteres.'
    );
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.users_profile up
    JOIN public.user_profiles upr ON upr.user_id = up.id
    JOIN public.profiles p ON p.id = upr.profile_id
    WHERE up.auth_user_id = auth.uid()
      AND up.ativo = true
      AND p.codigo = 'gerencial'
  )
  INTO v_is_manager;

  IF NOT v_is_manager THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Apenas usuários gerenciais podem redefinir senhas.'
    );
  END IF;

  SELECT auth_user_id
  INTO v_target_auth_user_id
  FROM public.users_profile
  WHERE id = p_user_profile_id;

  IF v_target_auth_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Usuário sem credenciais de login vinculadas.'
    );
  END IF;

  UPDATE auth.users
  SET encrypted_password = crypt(p_new_password, gen_salt('bf')),
      updated_at = now(),
      recovery_token = '',
      recovery_sent_at = null
  WHERE id = v_target_auth_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Usuário de autenticação não encontrado.'
    );
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

ALTER FUNCTION public.reset_user_password(UUID, TEXT) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.reset_user_password(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reset_user_password(UUID, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.reset_user_password(UUID, TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';

SELECT
  'reset_user_password instalada' AS status,
  n.nspname AS schema,
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS arguments
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'reset_user_password';

