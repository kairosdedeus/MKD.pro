-- Limpar usuários inativos que bloqueiam criação de novos
-- Remove completamente usuários com ativo = false

DO $$
DECLARE
  v_user RECORD;
BEGIN
  FOR v_user IN 
    SELECT id, auth_user_id, email FROM users_profile WHERE ativo = false
  LOOP
    RAISE NOTICE 'Removendo: %', v_user.email;

    -- Remover funções de membros de equipe
    DELETE FROM team_member_functions
    WHERE team_member_id IN (SELECT id FROM team_members WHERE user_id = v_user.id);

    -- Remover de escalas
    DELETE FROM schedule_member_functions
    WHERE schedule_member_id IN (
      SELECT sm.id FROM schedule_members sm
      JOIN team_members tm ON tm.id = sm.team_member_id
      WHERE tm.user_id = v_user.id
    );
    DELETE FROM schedule_members
    WHERE team_member_id IN (SELECT id FROM team_members WHERE user_id = v_user.id);

    -- Remover de equipes
    DELETE FROM team_members WHERE user_id = v_user.id;

    -- Remover perfis
    DELETE FROM user_profiles WHERE user_id = v_user.id;

    -- Remover perfil
    DELETE FROM users_profile WHERE id = v_user.id;

    -- Remover do auth
    IF v_user.auth_user_id IS NOT NULL THEN
      DELETE FROM auth.identities WHERE user_id = v_user.auth_user_id;
      DELETE FROM auth.users WHERE id = v_user.auth_user_id;
    END IF;

    RAISE NOTICE '✅ % removido!', v_user.email;
  END LOOP;
END $$;

SELECT '✅ Usuários inativos removidos!' as resultado;
