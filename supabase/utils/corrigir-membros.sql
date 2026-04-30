-- ============================================
-- CORRIGIR MEMBROS DAS EQUIPES
-- 1. Adicionar líder como membro se não estiver
-- 2. Garantir que todos os membros estão ativos
-- ============================================

-- 1. Adicionar líder como membro onde falta
INSERT INTO team_members (team_id, user_id, ativo)
SELECT t.id, t.leader_id, true
FROM teams t
WHERE t.leader_id IS NOT NULL
  AND t.ativo = true
  AND NOT EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.team_id = t.id AND tm.user_id = t.leader_id
  )
ON CONFLICT (team_id, user_id) DO NOTHING;

-- 2. Reativar membros inativos
UPDATE team_members SET ativo = true WHERE ativo = false;

-- 3. Verificar resultado
SELECT 
    t.nome as equipe,
    up.nome as membro,
    tm.ativo,
    CASE WHEN t.leader_id = tm.user_id THEN '👑 Líder' ELSE '👤 Membro' END as papel
FROM team_members tm
JOIN teams t ON t.id = tm.team_id
JOIN users_profile up ON up.id = tm.user_id
ORDER BY t.nome, papel DESC, up.nome;

SELECT '✅ Membros corrigidos!' as resultado;
