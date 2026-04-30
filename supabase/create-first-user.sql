-- ============================================
-- SCRIPT PARA CRIAR PRIMEIRO USUÁRIO
-- ============================================
-- 
-- INSTRUÇÕES:
-- 1. Primeiro, crie o usuário em Authentication → Users
--    Email: admin@igreja.com
--    Password: senha123
--    ✅ Marque "Auto Confirm User"
-- 
-- 2. Copie o ID do usuário criado
-- 
-- 3. Cole o ID na linha 23 (onde está escrito 'COLE-O-ID-AQUI')
-- 
-- 4. Execute este script no SQL Editor
-- ============================================

DO $$
DECLARE
  v_auth_user_id uuid := 'COLE-O-ID-AQUI'; -- ← COLE O ID DO USUÁRIO AQUI
  v_user_profile_id uuid;
BEGIN
  -- Verificar se o ID foi alterado
  IF v_auth_user_id = 'COLE-O-ID-AQUI' THEN
    RAISE EXCEPTION 'Por favor, substitua COLE-O-ID-AQUI pelo ID real do usuário!';
  END IF;

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
