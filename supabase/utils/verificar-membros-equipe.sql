-- Verificar equipes e membros
SELECT 
    t.id as team_id,
    t.nome as equipe,
    tt.codigo as tipo,
    t.ativo,
    up_lider.nome as lider,
    COUNT(tm.id) as total_membros
FROM teams t
LEFT JOIN team_types tt ON tt.id = t.team_type_id
LEFT JOIN users_profile up_lider ON up_lider.id = t.leader_id
LEFT JOIN team_members tm ON tm.team_id = t.id
GROUP BY t.id, t.nome, tt.codigo, t.ativo, up_lider.nome
ORDER BY t.created_at DESC;

-- Membros de cada equipe
SELECT 
    t.nome as equipe,
    up.nome as membro,
    tm.ativo,
    tm.id as team_member_id
FROM team_members tm
JOIN teams t ON t.id = tm.team_id
JOIN users_profile up ON up.id = tm.user_id
ORDER BY t.nome, up.nome;
