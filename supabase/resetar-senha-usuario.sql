-- ============================================
-- RESETAR SENHA DE USUÁRIO
-- ============================================

-- SUBSTITUA O EMAIL E A NOVA SENHA:
DO $$
DECLARE
  v_email TEXT := 'jsilva@mkd.com';  -- ← EMAIL DO USUÁRIO
  v_new_password TEXT := 'senha123';  -- ← NOVA SENHA
BEGIN
  -- Atualizar senha
  UPDATE auth.users
  SET 
    encrypted_password = crypt(v_new_password, gen_salt('bf')),
    updated_at = NOW()
  WHERE email = v_email;

  IF FOUND THEN
    RAISE NOTICE '✅ Senha atualizada com sucesso!';
    RAISE NOTICE 'Email: %', v_email;
    RAISE NOTICE 'Nova senha: %', v_new_password;
  ELSE
    RAISE EXCEPTION 'Usuário com email % não encontrado', v_email;
  END IF;
END $$;
