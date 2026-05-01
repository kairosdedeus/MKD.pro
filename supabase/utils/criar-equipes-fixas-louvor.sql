-- Cria a estrutura de equipes fixas do Louvor e cadastra as equipes oficiais.
-- Pode executar mais de uma vez sem duplicar.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS worship_fixed_teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_worship_fixed_team UNIQUE (team_id, nome)
);

CREATE TABLE IF NOT EXISTS worship_fixed_team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    preset_id UUID REFERENCES worship_fixed_teams(id) ON DELETE CASCADE,
    team_member_id UUID REFERENCES team_members(id) ON DELETE CASCADE,
    function_id UUID REFERENCES team_functions(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_worship_fixed_team_member_function UNIQUE (preset_id, team_member_id, function_id)
);

CREATE INDEX IF NOT EXISTS idx_worship_fixed_teams_team
    ON worship_fixed_teams(team_id);

CREATE INDEX IF NOT EXISTS idx_worship_fixed_team_members_preset
    ON worship_fixed_team_members(preset_id);

DROP TRIGGER IF EXISTS update_worship_fixed_teams_updated_at ON worship_fixed_teams;
CREATE TRIGGER update_worship_fixed_teams_updated_at
    BEFORE UPDATE ON worship_fixed_teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE worship_fixed_teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE worship_fixed_team_members DISABLE ROW LEVEL SECURITY;

GRANT ALL ON worship_fixed_teams TO anon, authenticated;
GRANT ALL ON worship_fixed_team_members TO anon, authenticated;

INSERT INTO team_functions (nome, team_type_id)
SELECT fn.nome, tt.id
FROM team_types tt
CROSS JOIN (VALUES ('Vocal'), ('BackVocal')) AS fn(nome)
WHERE tt.codigo = 'louvor'
ON CONFLICT (nome, team_type_id) DO NOTHING;

WITH worship_team AS (
    SELECT t.id
    FROM teams t
    JOIN team_types tt ON tt.id = t.team_type_id
    WHERE tt.codigo = 'louvor'
      AND t.ativo = true
    ORDER BY t.created_at
    LIMIT 1
),
official_presets(nome) AS (
    VALUES
        ('Equipe A-1'),
        ('Equipe A-2'),
        ('Equipe B-1'),
        ('Equipe B-2'),
        ('Equipe C-1'),
        ('Equipe C-2'),
        ('Equipe X')
)
INSERT INTO worship_fixed_teams (team_id, nome)
SELECT wt.id, op.nome
FROM worship_team wt
CROSS JOIN official_presets op
ON CONFLICT (team_id, nome) DO NOTHING;

WITH worship_team AS (
    SELECT t.id
    FROM teams t
    JOIN team_types tt ON tt.id = t.team_type_id
    WHERE tt.codigo = 'louvor'
      AND t.ativo = true
    ORDER BY t.created_at
    LIMIT 1
),
official_members(preset_name, member_name, function_name, sort_order) AS (
    VALUES
        ('Equipe A-1', 'Pr Tchucky', 'Vocal', 1),
        ('Equipe A-1', 'Madu', 'Vocal', 2),
        ('Equipe A-1', 'Jhonata', 'BackVocal', 3),
        ('Equipe A-1', 'Lais', 'BackVocal', 4),
        ('Equipe A-2', 'Jhonata', 'Vocal', 1),
        ('Equipe A-2', 'Lais', 'Vocal', 2),
        ('Equipe A-2', 'Pr Tchucky', 'BackVocal', 3),
        ('Equipe A-2', 'Madu', 'BackVocal', 4),
        ('Equipe B-1', 'Alice', 'Vocal', 1),
        ('Equipe B-1', 'Jhonata', 'Vocal', 2),
        ('Equipe B-1', 'Senna', 'BackVocal', 3),
        ('Equipe B-1', 'Maria', 'BackVocal', 4),
        ('Equipe B-2', 'Senna', 'Vocal', 1),
        ('Equipe B-2', 'Maria', 'Vocal', 2),
        ('Equipe B-2', 'Alice', 'BackVocal', 3),
        ('Equipe B-2', 'Jhonata', 'BackVocal', 4),
        ('Equipe C-1', 'Wallesca', 'Vocal', 1),
        ('Equipe C-1', 'Joao', 'Vocal', 2),
        ('Equipe C-1', 'Lucas', 'BackVocal', 3),
        ('Equipe C-1', 'Isabel', 'BackVocal', 4),
        ('Equipe C-2', 'Lucas', 'Vocal', 1),
        ('Equipe C-2', 'Isabel', 'Vocal', 2),
        ('Equipe C-2', 'Wallesca', 'BackVocal', 3),
        ('Equipe C-2', 'Joao', 'BackVocal', 4),
        ('Equipe X', 'Michael', 'Vocal', 1),
        ('Equipe X', 'Vinicius', 'Vocal', 2),
        ('Equipe X', 'Joao', 'BackVocal', 3),
        ('Equipe X', 'Wallesca', 'BackVocal', 4),
        ('Equipe X', 'Alice', 'BackVocal', 5)
),
matched AS (
    SELECT
        wft.id AS preset_id,
        tm.id AS team_member_id,
        tf.id AS function_id,
        om.sort_order
    FROM official_members om
    JOIN worship_team wt ON true
    JOIN worship_fixed_teams wft
      ON wft.team_id = wt.id
     AND wft.nome = om.preset_name
    JOIN team_members tm
      ON tm.team_id = wt.id
     AND tm.ativo = true
    JOIN users_profile up
      ON up.id = tm.user_id
     AND (
        lower(unaccent(up.nome)) = lower(unaccent(om.member_name))
        OR lower(unaccent(up.nome)) LIKE '%' || lower(unaccent(om.member_name)) || '%'
        OR lower(unaccent(om.member_name)) LIKE '%' || lower(unaccent(up.nome)) || '%'
     )
    JOIN team_functions tf
      ON tf.team_type_id = (SELECT team_type_id FROM teams WHERE id = wt.id)
     AND lower(unaccent(tf.nome)) = lower(unaccent(om.function_name))
)
INSERT INTO worship_fixed_team_members (preset_id, team_member_id, function_id, sort_order)
SELECT preset_id, team_member_id, function_id, sort_order
FROM matched
ON CONFLICT (preset_id, team_member_id, function_id) DO NOTHING;

SELECT
    wft.nome AS equipe_fixa,
    up.nome AS membro,
    tf.nome AS funcao
FROM worship_fixed_teams wft
LEFT JOIN worship_fixed_team_members wftm ON wftm.preset_id = wft.id
LEFT JOIN team_members tm ON tm.id = wftm.team_member_id
LEFT JOIN users_profile up ON up.id = tm.user_id
LEFT JOIN team_functions tf ON tf.id = wftm.function_id
WHERE wft.team_id = (
    SELECT t.id
    FROM teams t
    JOIN team_types tt ON tt.id = t.team_type_id
    WHERE tt.codigo = 'louvor'
      AND t.ativo = true
    ORDER BY t.created_at
    LIMIT 1
)
ORDER BY wft.nome, wftm.sort_order;
