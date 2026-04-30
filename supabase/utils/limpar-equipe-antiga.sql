-- Deletar a equipe antiga (7e920fef) que tem só Isabel
-- e manter a nova (f7368cc6) com todos os membros

-- Deletar membros da equipe antiga
DELETE FROM team_members WHERE team_id = '7e920fef-6ae0-4e47-af9b-b3342622147c';

-- Deletar a equipe antiga
DELETE FROM teams WHERE id = '7e920fef-6ae0-4e47-af9b-b3342622147c';

-- Verificar resultado
SELECT 
    t.id,
    t.nome,
    tt.codigo as tipo,
    up.nome as lider,
    COUNT(tm.id) as membros
FROM teams t
JOIN team_types tt ON tt.id = t.team_type_id
LEFT JOIN users_profile up ON up.id = t.leader_id
LEFT JOIN team_members tm ON tm.team_id = t.id
GROUP BY t.id, t.nome, tt.codigo, up.nome;

SELECT '✅ Equipe antiga removida!' as resultado;
