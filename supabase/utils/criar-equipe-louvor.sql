-- ============================================
-- CRIAR EQUIPE DE LOUVOR COM MEMBROS
-- ============================================

DO $$
DECLARE
  v_team_id UUID;
  v_team_type_id UUID;
  v_leader_id UUID;
BEGIN
  -- Buscar o tipo "louvor"
  SELECT id INTO v_team_type_id FROM team_types WHERE codigo = 'louvor';

  -- Buscar o líder (Isabel Cabrera - usuária logada)
  SELECT id INTO v_leader_id FROM users_profile WHERE email = 'icabrera@mkd.com';

  -- Criar a equipe
  INSERT INTO teams (nome, team_type_id, leader_id, ativo)
  VALUES ('MKD-Music', v_team_type_id, v_leader_id, true)
  RETURNING id INTO v_team_id;

  RAISE NOTICE 'Equipe criada: % (ID: %)', 'MKD-Music', v_team_id;

  -- Adicionar TODOS os usuários como membros
  INSERT INTO team_members (team_id, user_id, ativo)
  SELECT v_team_id, id, true
  FROM users_profile
  WHERE ativo = true
  ON CONFLICT (team_id, user_id) DO NOTHING;

  RAISE NOTICE '✅ Membros adicionados!';
END $$;

-- Verificar resultado
SELECT 
    t.nome as equipe,
    tt.nome as tipo,
    up_lider.nome as lider,
    COUNT(tm.id) as total_membros
FROM teams t
JOIN team_types tt ON tt.id = t.team_type_id
LEFT JOIN users_profile up_lider ON up_lider.id = t.leader_id
LEFT JOIN team_members tm ON tm.team_id = t.id
GROUP BY t.nome, tt.nome, up_lider.nome;

SELECT 
    t.nome as equipe,
    up.nome as membro,
    CASE WHEN t.leader_id = tm.user_id THEN '👑 Líder' ELSE '👤 Membro' END as papel
FROM team_members tm
JOIN teams t ON t.id = tm.team_id
JOIN users_profile up ON up.id = tm.user_id
ORDER BY papel DESC, up.nome;

SELECT '✅ Equipe de Louvor criada com sucesso!' as resultado;
