-- Adiciona o perfil e o tipo de equipe da Rede de Crianças
-- para que o hook useTeamTypes carregue esse tipo no modal de criação de equipe.

INSERT INTO profiles (nome, codigo)
VALUES
    ('Líder de Rede de Crianças', 'lider_rede_criancas'),
    ('Membro de Rede de Crianças', 'membro_rede_criancas')
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO team_types (nome, codigo, permite_multiplas)
VALUES
    ('Rede de Crianças', 'rede_criancas', true)
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO team_functions (nome, team_type_id)
SELECT unnest(ARRAY['Recepção','Sala','Apoio','Ensino','Adoração']), id
FROM team_types
WHERE codigo = 'rede_criancas'
ON CONFLICT DO NOTHING;

SELECT 'Rede de Crianças configurada no sistema.' AS status;
