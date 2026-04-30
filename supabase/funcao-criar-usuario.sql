-- ============================================
-- FUNÇÃO PARA CRIAR USUÁRIO
-- Esta função cria um usuário no auth.users e users_profile
-- ============================================

CREATE OR REPLACE FUNCTION create_user_with_auth(
  p_nome TEXT,
  p_email TEXT,
  p_password TEXT,
  p_telefone TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_auth_user_id UUID;
  v_user_profile_id UUID;
  v_result JSON;
BEGIN
  -- 1. Criar usuário no auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    invited_at,
    confirmation_token,
    confirmation_sent_at,
    recovery_token,
    recovery_sent_at,
    email_change_token_new,
    email_change,
    email_change_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    phone,
    phone_confirmed_at,
    phone_change,
    phone_change_token,
    phone_change_sent_at,
    email_change_token_current,
    email_change_confirm_status,
    banned_until,
    reauthentication_token,
    reauthentication_sent_at,
    is_sso_user,
    deleted_at
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    p_email,
    crypt(p_password, gen_salt('bf')),
    NOW(),
    NULL,
    '',
    NULL,
    '',
    NULL,
    '',
    '',
    NULL,
    NULL,
    '{"provider":"email","providers":["email"]}',
    '{}',
    FALSE,
    NOW(),
    NOW(),
    NULL,
    NULL,
    '',
    '',
    NULL,
    '',
    0,
    NULL,
    '',
    NULL,
    FALSE,
    NULL
  )
  RETURNING id INTO v_auth_user_id;

  -- 2. Criar identity para o usuário
  INSERT INTO auth.identities (
    provider_id,
    id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    v_auth_user_id::text,
    gen_random_uuid(),
    v_auth_user_id,
    jsonb_build_object(
      'sub', v_auth_user_id::text,
      'email', p_email,
      'email_verified', true,
      'phone_verified', false
    ),
    'email',
    NOW(),
    NOW(),
    NOW()
  );

  -- 3. Criar perfil do usuário
  INSERT INTO users_profile (
    auth_user_id,
    nome,
    email,
    telefone,
    ativo
  )
  VALUES (
    v_auth_user_id,
    p_nome,
    p_email,
    p_telefone,
    TRUE
  )
  RETURNING id INTO v_user_profile_id;

  -- 4. Retornar resultado
  v_result := json_build_object(
    'auth_user_id', v_auth_user_id,
    'user_profile_id', v_user_profile_id,
    'email', p_email,
    'success', TRUE
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Erro ao criar usuário: %', SQLERRM;
END;
$$;

-- Dar permissão para authenticated users
GRANT EXECUTE ON FUNCTION create_user_with_auth TO authenticated;

-- Testar a função (opcional)
-- SELECT create_user_with_auth('Teste Silva', 'teste@mkd.com', 'senha123', '11999999999');
