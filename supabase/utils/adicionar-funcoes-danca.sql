-- ============================================
-- Adicionar funções da equipe de Dança
-- Execute no SQL Editor do Supabase
-- ============================================

INSERT INTO team_functions (nome, team_type_id)
SELECT unnest(ARRAY['Ministerial', 'Ballet']), id
FROM team_types WHERE codigo = 'danca'
ON CONFLICT (nome, team_type_id) DO NOTHING;

-- Verificar
SELECT tf.nome, tt.codigo as tipo
FROM team_functions tf
JOIN team_types tt ON tt.id = tf.team_type_id
WHERE tt.codigo = 'danca'
ORDER BY tf.nome;

SELECT '✅ Funções de Dança adicionadas!' as resultado;
