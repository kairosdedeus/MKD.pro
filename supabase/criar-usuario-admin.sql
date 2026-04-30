-- ============================================
-- CRIAR USUÁRIO ADMINISTRADOR
-- ============================================
-- Execute este script DEPOIS de criar o usuário
-- em Authentication → Users
-- ============================================

DO $$
DECLARE
  v_auth_user_id uuid := 'd77293d2-c613-46fa-a09b-86f74cc5d8bd';
  v_user_profile_id uuid;
BEGIN
  -- Criar perfil do usuário
  INSERT INTO users_profile (auth_user_id, nome, email, ativo)
  VALUES (
    v_auth_user_id,
    'Administrador',
    'admin@igreja.com',
    true
  )
  ON CONFLICT (auth_user_id) DO UPDATE
  SET nome = EXCLUDED.nome,
      email = EXCLUDED.email,
      ativo = EXCLUDED.ativo
  RETURNING id INTO v_user_profile_id;

  -- Se já existia, pegar o ID
  IF v_user_profile_id IS NULL THEN
    SELECT id INTO v_user_profile_id 
    FROM users_profile 
    WHERE auth_user_id = v_auth_user_id;
  END IF;

  -- Atribuir perfil gerencial
  INSERT INTO user_profiles (user_id, profile_id)
  SELECT 
    v_user_profile_id, 
    p.id 
  FROM profiles p
  WHERE p.codigo = 'gerencial'
  ON CONFLICT (user_id, profile_id) DO NOTHING;

  -- Mensagem de sucesso
  RAISE NOTICE '✅ Usuário criado com sucesso!';
  RAISE NOTICE 'Email: admin@igreja.com';
  RAISE NOTICE 'Senha: senha123';
  RAISE NOTICE 'Perfil: Gerencial';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Agora você pode fazer login no sistema!';
END $$;
