-- Adiciona a funcao BackVocal ao tipo de equipe Louvor.
-- Pode executar mais de uma vez sem duplicar.

INSERT INTO team_functions (nome, team_type_id)
SELECT 'BackVocal', id
FROM team_types
WHERE codigo = 'louvor'
ON CONFLICT (nome, team_type_id) DO NOTHING;

SELECT tf.nome, tt.nome AS tipo_equipe
FROM team_functions tf
JOIN team_types tt ON tt.id = tf.team_type_id
WHERE tt.codigo = 'louvor'
ORDER BY tf.nome;
