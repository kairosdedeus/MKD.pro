-- ============================================
-- RESETAR SENHA DO USUÁRIO (CORRIGIDO)
-- ============================================

-- Atualizar apenas a senha e confirmação de email
UPDATE auth.users
SET 
  encrypted_password = crypt('senha123', gen_salt('bf')),
  email_confirmed_at = NOW()
WHERE email = 'admin@igreja.com';

-- Verificar se funcionou
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE email = 'admin@igreja.com';
