-- ============================================
-- UTILITÁRIO: Remover usuário completamente
-- ⚠️ Irreversível — use com cuidado
-- ============================================

DO $$
DECLARE
  v_email TEXT := 'COLOQUE_O_EMAIL_AQUI';  -- ← altere aqui
  v_auth_user_id UUID;
  v_profile_id UUID;
BEGIN
  SELECT id INTO v_auth_user_id FROM auth.users WHERE email = v_email;
  SELECT id INTO v_profile_id FROM users_profile WHERE email = v_email;

  IF v_profile_id IS NOT NULL THEN
    DELETE FROM team_member_functions
    WHERE team_member_id IN (SELECT id FROM team_members WHERE user_id = v_profile_id);

    DELETE FROM team_members WHERE user_id = v_profile_id;

    DELETE FROM schedule_member_functions
    WHERE schedule_member_id IN (
      SELECT sm.id FROM schedule_members sm
      JOIN team_members tm ON tm.id = sm.team_member_id
      WHERE tm.user_id = v_profile_id
    );

    DELETE FROM schedule_members
    WHERE team_member_id IN (SELECT id FROM team_members WHERE user_id = v_profile_id);

    DELETE FROM user_profiles WHERE user_id = v_profile_id;
    DELETE FROM users_profile WHERE id = v_profile_id;

    RAISE NOTICE '✅ Perfil removido';
  END IF;

  IF v_auth_user_id IS NOT NULL THEN
    DELETE FROM auth.identities WHERE user_id = v_auth_user_id;
    DELETE FROM auth.users WHERE id = v_auth_user_id;
    RAISE NOTICE '✅ Auth removido';
  END IF;

  RAISE NOTICE '✅ Usuário % removido!', v_email;
END $$;
