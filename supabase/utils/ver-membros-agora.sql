-- Ver exatamente o que está na team_members
SELECT 
    tm.id,
    tm.team_id,
    tm.user_id,
    tm.ativo,
    up.nome,
    up.email,
    up.ativo as user_ativo
FROM team_members tm
JOIN users_profile up ON up.id = tm.user_id
ORDER BY up.nome;
