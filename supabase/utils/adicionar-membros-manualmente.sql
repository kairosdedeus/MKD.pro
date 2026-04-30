-- ============================================
-- ADICIONAR MEMBROS À EQUIPE MANUALMENTE
-- ============================================

-- Ver equipes disponíveis
SELECT id, nome FROM teams WHERE ativo = true;

-- Ver usuários disponíveis  
SELECT id, nome, email FROM users_profile WHERE ativo = true;

-- Adicionar TODOS os usuários à equipe de louvor
-- (substitua o team_id pelo ID correto da equipe)
INSERT INTO team_members (team_id, user_id, ativo)
SELECT 
    t.id,
    up.id,
    true
FROM teams t
CROSS JOIN users_profile up
WHERE t.nome = 'MKD-Music'  -- ← nome da equipe
  AND up.ativo = true
ON CONFLICT (team_id, user_id) DO UPDATE SET ativo = true;

-- Verificar resultado
SELECT 
    t.nome as equipe,
    up.nome as membro,
    tm.ativo,
    CASE WHEN t.leader_id = tm.user_id THEN '👑 Líder' ELSE '👤 Membro' END as papel
FROM team_members tm
JOIN teams t ON t.id = tm.team_id
JOIN users_profile up ON up.id = tm.user_id
ORDER BY t.nome, papel DESC, up.nome;

SELECT '✅ Membros adicionados!' as resultado;
