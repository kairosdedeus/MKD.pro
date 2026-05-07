-- ============================================================================
-- ATUALIZAÇÃO DE EQUIPES FIXAS DO LOUVOR - VERSÃO POR ID
-- ============================================================================
-- Este script usa IDs em vez de nomes para garantir relacionamentos imutáveis
-- Execute este script após ter criado os usuários no sistema
--
-- IMPORTANTE: Você precisa substituir os IDs de exemplo pelos IDs reais
-- dos seus usuários. Para obter os IDs, execute primeiro:
--
--   SELECT id, nome, email FROM users_profile WHERE ativo = true ORDER BY nome;
--
-- ============================================================================

WITH worship_team AS (
    SELECT t.id, t.team_type_id
    FROM teams t
    JOIN team_types tt ON tt.id = t.team_type_id
    WHERE tt.codigo = 'louvor'
      AND t.ativo = true
    ORDER BY t.created_at
    LIMIT 1
),
-- Limpar membros antigos das equipes fixas
cleanup AS (
    DELETE FROM worship_fixed_team_members
    WHERE preset_id IN (
        SELECT wft.id
        FROM worship_fixed_teams wft
        JOIN worship_team wt ON wft.team_id = wt.id
    )
    RETURNING preset_id
),
-- ============================================================================
-- PASSO 1: OBTER OS IDs DOS USUÁRIOS
-- Execute esta query primeiro para obter os IDs:
-- ============================================================================
user_ids AS (
    SELECT 
        up.id,
        up.nome,
        up.email,
        tm.id as team_member_id
    FROM users_profile up
    JOIN team_members tm ON tm.user_id = up.id
    JOIN worship_team wt ON tm.team_id = wt.id
    WHERE up.ativo = true
      AND tm.ativo = true
),
-- ============================================================================
-- PASSO 2: OBTER OS IDs DAS FUNÇÕES
-- ============================================================================
function_ids AS (
    SELECT 
        tf.id,
        tf.nome
    FROM team_functions tf
    JOIN worship_team wt ON tf.team_type_id = wt.team_type_id
),
-- ============================================================================
-- PASSO 3: DEFINIR OS MEMBROS POR ID (SUBSTITUA OS IDs PELOS REAIS)
-- ============================================================================
-- INSTRUÇÕES:
-- 1. Execute: SELECT * FROM user_ids ORDER BY nome;
-- 2. Copie os team_member_id de cada usuário
-- 3. Execute: SELECT * FROM function_ids;
-- 4. Copie os id de cada função
-- 5. Substitua os valores abaixo pelos IDs reais
-- ============================================================================
official_members(preset_name, team_member_id, function_id, sort_order) AS (
    VALUES
        -- ====================================================================
        -- EXEMPLO: Substitua os UUIDs abaixo pelos IDs reais
        -- ====================================================================
        -- EQUIPE A-1
        -- ('Equipe A-1', 'UUID-DO-TCHUCKY-TEAM-MEMBER', 'UUID-DA-FUNCAO-VOCAL', 1),
        -- ('Equipe A-1', 'UUID-DA-MADU-TEAM-MEMBER', 'UUID-DA-FUNCAO-VOCAL', 2),
        -- ('Equipe A-1', 'UUID-DO-JHONATA-TEAM-MEMBER', 'UUID-DA-FUNCAO-BACKVOCAL', 3),
        -- ('Equipe A-1', 'UUID-DA-LAIS-TEAM-MEMBER', 'UUID-DA-FUNCAO-BACKVOCAL', 4),
        
        -- ====================================================================
        -- COLE AQUI OS VALORES REAIS APÓS OBTER OS IDs
        -- ====================================================================
        ('Equipe A-1', '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 1)
        
        -- Descomente e adicione os demais membros após obter os IDs reais
        -- EQUIPE A-2
        -- ('Equipe A-2', 'UUID-DO-JHONATA-TEAM-MEMBER', 'UUID-DA-FUNCAO-VOCAL', 1),
        -- ...
),
-- Fazer o match dos membros com as equipes fixas
matched AS (
    SELECT
        wft.id AS preset_id,
        om.team_member_id::uuid AS team_member_id,
        om.function_id::uuid AS function_id,
        om.sort_order
    FROM official_members om
    JOIN worship_team wt ON true
    JOIN worship_fixed_teams wft
      ON wft.team_id = wt.id
     AND wft.nome = om.preset_name
    WHERE om.team_member_id != '00000000-0000-0000-0000-000000000000'
)
-- Inserir os membros nas equipes fixas
INSERT INTO worship_fixed_team_members (preset_id, team_member_id, function_id, sort_order)
SELECT preset_id, team_member_id, function_id, sort_order
FROM matched
ON CONFLICT (preset_id, team_member_id, function_id) DO NOTHING;

-- ============================================================================
-- RESULTADO: Mostrar as equipes fixas atualizadas
-- ============================================================================
SELECT
    wft.nome AS equipe_fixa,
    up.nome AS membro,
    up.email AS email,
    tf.nome AS funcao,
    wftm.sort_order AS ordem,
    '✅ ID: ' || tm.id AS team_member_id_info
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
ORDER BY 
    CASE wft.nome
        WHEN 'Equipe X' THEN 0
        WHEN 'Equipe A-1' THEN 1
        WHEN 'Equipe A-2' THEN 2
        WHEN 'Equipe B-1' THEN 3
        WHEN 'Equipe B-2' THEN 4
        WHEN 'Equipe C-1' THEN 5
        WHEN 'Equipe C-2' THEN 6
        ELSE 99
    END,
    wftm.sort_order;
