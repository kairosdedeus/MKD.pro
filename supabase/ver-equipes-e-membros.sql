-- Query 1: Equipes
SELECT 
    t.id,
    t.nome as equipe,
    tt.nome as tipo,
    up.nome as lider,
    t.ativo,
    (SELECT COUNT(*) FROM team_members tm WHERE tm.team_id = t.id) as total_membros
FROM teams t
LEFT JOIN team_types tt ON tt.id = t.team_type_id
LEFT JOIN users_profile up ON up.id = t.leader_id
ORDER BY t.created_at DESC;

-- Query 2: Membros
SELECT 
    t.nome as equipe,
    up.nome as membro,
    tm.user_id,
    tm.ativo
FROM team_members tm
JOIN teams t ON t.id = tm.team_id
JOIN users_profile up ON up.id = tm.user_id
ORDER BY t.nome;
