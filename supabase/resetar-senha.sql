-- ============================================
-- RESETAR SENHA DO USUÁRIO
-- ============================================
-- Execute este script para resetar a senha
-- ============================================

-- Atualizar a senha do usuário para 'senha123'
UPDATE auth.users
SET 
  encrypted_password = crypt('senha123', gen_salt('bf')),
  email_confirmed_at = NOW(),
  confirmed_at = NOW()
WHERE email = 'admin@igreja.com';

-- Verificar se o usuário foi atualizado
SELECT 
  id,
  email,
  email_confirmed_at,
  confirmed_at,
  created_at
FROM auth.users
WHERE email = 'admin@igreja.com';
