-- Adiciona/garante as funcoes padrao da equipe de Midia.
-- Execute no SQL Editor do Supabase.

INSERT INTO team_functions (nome, team_type_id)
SELECT fn.nome, tt.id
FROM team_types tt
CROSS JOIN (
  VALUES
    ('Projeção'),
    ('Som'),
    ('Transmissão'),
    ('Fotos'),
    ('Videomaker'),
    ('Storymaker')
) AS fn(nome)
WHERE tt.codigo = 'midia'
ON CONFLICT DO NOTHING;

SELECT tf.nome AS funcao
FROM team_functions tf
JOIN team_types tt ON tt.id = tf.team_type_id
WHERE tt.codigo = 'midia'
ORDER BY
  CASE tf.nome
    WHEN 'Projeção' THEN 1
    WHEN 'Som' THEN 2
    WHEN 'Transmissão' THEN 3
    WHEN 'Fotos' THEN 4
    WHEN 'Videomaker' THEN 5
    WHEN 'Storymaker' THEN 6
    ELSE 99
  END,
  tf.nome;
