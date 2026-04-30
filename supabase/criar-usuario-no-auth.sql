-- ============================================
-- CRIAR USUÁRIO NO AUTH PARA USUÁRIO EXISTENTE
-- Execute este script para criar credenciais de login
-- para um usuário que já existe em users_profile
-- ============================================

-- SUBSTITUA OS VALORES ABAIXO:
DO $$
DECLARE
  v_email TEXT := 'mcabrera@mkd.com';  -- ← COLOQUE O EMAIL DO USUÁRIO AQUI
  v_password TEXT := 'senha123';        -- ← COLOQUE A SENHA AQUI
  v_nome TEXT := 'Michael Cabrera';     -- ← COLOQUE O NOME COMPLETO AQUI
  v_auth_user_id UUID;
  v_user_profile_id UUID;
BEGIN
  -- 1. Buscar o ID do perfil do usuário
  SELECT id INTO v_user_profile_id
  FROM users_profile
  WHERE email = v_email;

  IF v_user_profile_id IS NULL THEN
    RAISE EXCEPTION 'Usuário com email % não encontrado em users_profile', v_email;
  END IF;

  -- 2. Verificar se já existe no auth.users
  SELECT id INTO v_auth_user_id
  FROM auth.users
  WHERE email = v_email;

  IF v_auth_user_id IS NOT NULL THEN
    RAISE NOTICE 'Usuário já existe no auth.users com ID: %', v_auth_user_id;
    
    -- Atualizar o auth_user_id no users_profile
    UPDATE users_profile
    SET auth_user_id = v_auth_user_id
    WHERE id = v_user_profile_id;
    
    RAISE NOTICE '✅ auth_user_id atualizado em users_profile';
    RETURN;
  END IF;

  -- 3. Criar usuário no auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    is_sso_user
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    v_email,
    crypt(v_password, gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('name', v_nome),
    FALSE,
    FALSE
  )
  RETURNING id INTO v_auth_user_id;

  -- 4. Criar identity
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
      'email', v_email,
      'email_verified', true,
      'phone_verified', false
    ),
    'email',
    NOW(),
    NOW(),
    NOW()
  );

  -- 5. Atualizar users_profile com o auth_user_id
  UPDATE users_profile
  SET auth_user_id = v_auth_user_id
  WHERE id = v_user_profile_id;

  RAISE NOTICE '✅ Usuário criado no auth.users!';
  RAISE NOTICE 'Email: %', v_email;
  RAISE NOTICE 'Senha: %', v_password;
  RAISE NOTICE 'Auth User ID: %', v_auth_user_id;
  RAISE NOTICE 'User Profile ID: %', v_user_profile_id;
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Agora você pode fazer login!';

END $$;
