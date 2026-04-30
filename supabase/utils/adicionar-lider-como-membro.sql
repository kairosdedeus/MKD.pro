-- ============================================
-- GARANTIR QUE O LÍDER É MEMBRO DA EQUIPE
-- Corrige equipes existentes onde o líder
-- não foi adicionado como team_member
-- ============================================

INSERT INTO team_members (team_id, user_id)
SELECT t.id, t.leader_id
FROM teams t
WHERE t.leader_id IS NOT NULL
  AND t.ativo = true
  AND NOT EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.team_id = t.id
    AND tm.user_id = t.leader_id
  )
ON CONFLICT (team_id, user_id) DO NOTHING;

-- Verificar resultado
SELECT 
    t.nome as equipe,
    up.nome as lider,
    CASE WHEN tm.id IS NOT NULL THEN '✅ É membro' ELSE '❌ Não é membro' END as status
FROM teams t
JOIN users_profile up ON up.id = t.leader_id
LEFT JOIN team_members tm ON tm.team_id = t.id AND tm.user_id = t.leader_id
WHERE t.ativo = true;

SELECT '✅ Líderes adicionados como membros!' as resultado;
