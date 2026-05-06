-- ============================================================
-- Função para atualizar email do usuário no auth.users
-- Execute no SQL Editor do Supabase
-- ============================================================

CREATE OR REPLACE FUNCTION update_user_email(
  p_auth_user_id UUID,
  p_new_email TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o email já existe em outro usuário
  IF EXISTS (
    SELECT 1 FROM auth.users
    WHERE email = p_new_email
      AND id != p_auth_user_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Email já está em uso por outro usuário');
  END IF;

  -- Atualizar email no auth.users
  UPDATE auth.users
  SET
    email = p_new_email,
    email_confirmed_at = NOW(), -- confirmar automaticamente
    updated_at = NOW()
  WHERE id = p_auth_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Usuário não encontrado no auth');
  END IF;

  -- Atualizar também na tabela de identidades
  UPDATE auth.identities
  SET
    identity_data = jsonb_set(
      COALESCE(identity_data, '{}'::jsonb),
      '{email}',
      to_jsonb(p_new_email)
    ),
    updated_at = NOW()
  WHERE user_id = p_auth_user_id
    AND provider = 'email';

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Permissão: apenas authenticated pode chamar (SECURITY DEFINER roda como owner)
REVOKE ALL ON FUNCTION update_user_email(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION update_user_email(UUID, TEXT) TO authenticated;

SELECT '✅ Função update_user_email criada!' AS resultado;
