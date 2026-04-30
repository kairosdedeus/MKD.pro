-- ============================================
-- UTILITÁRIO: Resetar senha de usuário
-- ============================================

DO $$
DECLARE
  v_email TEXT := 'COLOQUE_O_EMAIL_AQUI';  -- ← altere aqui
  v_new_password TEXT := 'COLOQUE_A_SENHA_AQUI';  -- ← altere aqui
BEGIN
  UPDATE auth.users
  SET encrypted_password = crypt(v_new_password, gen_salt('bf')),
      updated_at = NOW()
  WHERE email = v_email;

  IF FOUND THEN
    RAISE NOTICE '✅ Senha de % atualizada com sucesso!', v_email;
  ELSE
    RAISE EXCEPTION 'Usuário % não encontrado', v_email;
  END IF;
END $$;
