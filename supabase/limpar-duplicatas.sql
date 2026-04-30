-- ============================================
-- LIMPAR EQUIPES DUPLICADAS
-- Mantém apenas a equipe mais recente
-- ============================================

-- Ver quantas equipes existem
SELECT id, nome, created_at FROM teams ORDER BY created_at;

-- Deletar membros das equipes duplicadas (manter só a mais recente)
DELETE FROM team_members
WHERE team_id IN (
    SELECT id FROM teams
    WHERE nome = 'MKD-Music'
    ORDER BY created_at DESC
    OFFSET 1  -- pula a mais recente, deleta as antigas
);

-- Deletar equipes duplicadas (manter só a mais recente)
DELETE FROM teams
WHERE nome = 'MKD-Music'
AND id NOT IN (
    SELECT id FROM teams
    WHERE nome = 'MKD-Music'
    ORDER BY created_at DESC
    LIMIT 1
);

-- Verificar resultado
SELECT 
    t.id,
    t.nome,
    tt.nome as tipo,
    up.nome as lider,
    (SELECT COUNT(*) FROM team_members tm WHERE tm.team_id = t.id) as membros
FROM teams t
LEFT JOIN team_types tt ON tt.id = t.team_type_id
LEFT JOIN users_profile up ON up.id = t.leader_id;

SELECT '✅ Limpeza concluída!' as resultado;
