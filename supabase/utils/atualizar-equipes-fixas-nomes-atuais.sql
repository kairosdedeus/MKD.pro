-- ============================================================================
-- ATUALIZAR EQUIPES FIXAS COM NOMES ATUAIS
-- ============================================================================
-- Este script atualiza as equipes fixas do louvor com os nomes ATUAIS dos usuários.
-- Usa EMAILS como identificador único (imutável).
--
-- IMPORTANTE: Execute este script sempre que precisar ajustar as equipes padrão.
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
-- CONFIGURAÇÃO DAS EQUIPES FIXAS
-- ============================================================================
-- Ajuste os emails abaixo conforme necessário
-- ============================================================================
official_members(preset_name, member_email, function_name, sort_order) AS (
    VALUES
        -- ========================================
        -- EQUIPE A-1
        -- ========================================
        ('Equipe A-1', 'tchucky@mkd.com', 'Vocal', 1),           -- Pr. Tchucky
        ('Equipe A-1', 'madu@mkd.com', 'Vocal', 2),              -- Madu
        ('Equipe A-1', 'jhonata@mkd.com', 'BackVocal', 3),       -- Jhonata
        ('Equipe A-1', 'lais@mkd.com', 'BackVocal', 4),          -- Laís
        
        -- ========================================
        -- EQUIPE A-2
        -- ========================================
        ('Equipe A-2', 'jhonata@mkd.com', 'Vocal', 1),           -- Jhonata
        ('Equipe A-2', 'lais@mkd.com', 'Vocal', 2),              -- Laís
        ('Equipe A-2', 'tchucky@mkd.com', 'BackVocal', 3),       -- Pr. Tchucky
        ('Equipe A-2', 'madu@mkd.com', 'BackVocal', 4),          -- Madu
        
        -- ========================================
        -- EQUIPE B-1
        -- ========================================
        ('Equipe B-1', 'alicesilva@mkd.com', 'Vocal', 1),        -- Alice
        ('Equipe B-1', 'jhonata@mkd.com', 'Vocal', 2),           -- Jhonata
        ('Equipe B-1', 'gabisena@mkd.com', 'BackVocal', 3),      -- Senna
        ('Equipe B-1', 'mariadonilson@mkd.com', 'BackVocal', 4), -- Maria
        
        -- ========================================
        -- EQUIPE B-2
        -- ========================================
        ('Equipe B-2', 'gabisena@mkd.com', 'Vocal', 1),          -- Senna
        ('Equipe B-2', 'mariadonilson@mkd.com', 'Vocal', 2),     -- Maria
        ('Equipe B-2', 'alicesilva@mkd.com', 'BackVocal', 3),    -- Alice
        ('Equipe B-2', 'jhonata@mkd.com', 'BackVocal', 4),       -- Jhonata
        
        -- ========================================
        -- EQUIPE C-1
        -- ========================================
        ('Equipe C-1', 'maraiakeuri@mkd.com', 'Vocal', 1),       -- Wallesca
        ('Equipe C-1', 'joaovitor@mkd.com', 'Vocal', 2),         -- João
        ('Equipe C-1', 'lucas@mkd.com', 'BackVocal', 3),         -- Lucas
        ('Equipe C-1', 'isabel@mkd.com', 'BackVocal', 4),        -- Isabel
        
        -- ========================================
        -- EQUIPE C-2
        -- ========================================
        ('Equipe C-2', 'lucas@mkd.com', 'Vocal', 1),             -- Lucas
        ('Equipe C-2', 'isabel@mkd.com', 'Vocal', 2),            -- Isabel
        ('Equipe C-2', 'maraiakeuri@mkd.com', 'BackVocal', 3),   -- Wallesca
        ('Equipe C-2', 'joaovitor@mkd.com', 'BackVocal', 4),     -- João
        
        -- ========================================
        -- EQUIPE X (primeira semana do mês)
        -- ========================================
        ('Equipe X', 'melhorlider@mkd.com', 'Vocal', 1),         -- Michael
        ('Equipe X', 'vinizoiazul@mkd.com', 'Vocal', 2),         -- Vinicius
        ('Equipe X', 'joaovitor@mkd.com', 'BackVocal', 3),       -- João
        ('Equipe X', 'maraiakeuri@mkd.com', 'BackVocal', 4),     -- Wallesca
        ('Equipe X', 'alicesilva@mkd.com', 'BackVocal', 5)       -- Alice
),
-- Fazer o match dos membros usando EMAIL (identificador único e imutável)
matched AS (
    SELECT
        wft.id AS preset_id,
        tm.id AS team_member_id,
        tf.id AS function_id,
        om.sort_order,
        up.nome AS nome_atual,
        up.email AS email,
        om.preset_name AS equipe,
        om.function_name AS funcao
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
     AND lower(up.email) = lower(om.member_email)  -- ✅ MATCH POR EMAIL (IMUTÁVEL)
     AND up.ativo = true
    JOIN team_functions tf
      ON tf.team_type_id = wt.team_type_id
     AND lower(unaccent(tf.nome)) = lower(unaccent(om.function_name))
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
    '✅ EQUIPES FIXAS ATUALIZADAS' as status,
    wft.nome AS equipe_fixa,
    up.nome AS membro,
    up.email AS email,
    tf.nome AS funcao,
    wftm.sort_order AS ordem
FROM worship_fixed_teams wft
JOIN worship_fixed_team_members wftm ON wftm.preset_id = wft.id
JOIN team_members tm ON tm.id = wftm.team_member_id
JOIN users_profile up ON up.id = tm.user_id
JOIN team_functions tf ON tf.id = wftm.function_id
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

-- ============================================================================
-- ESTATÍSTICAS
-- ============================================================================
SELECT
    '📊 ESTATÍSTICAS' as info,
    COUNT(DISTINCT wft.id) as total_equipes,
    COUNT(DISTINCT wftm.team_member_id) as total_membros_unicos,
    COUNT(*) as total_configuracoes
FROM worship_fixed_teams wft
LEFT JOIN worship_fixed_team_members wftm ON wftm.preset_id = wft.id
WHERE wft.team_id = (
    SELECT t.id
    FROM teams t
    JOIN team_types tt ON tt.id = t.team_type_id
    WHERE tt.codigo = 'louvor'
      AND t.ativo = true
    ORDER BY t.created_at
    LIMIT 1
);

-- ============================================================================
-- VERIFICAÇÃO: Usuários não encontrados
-- ============================================================================
WITH expected_emails AS (
    SELECT DISTINCT unnest(ARRAY[
        'tchucky@mkd.com',
        'madu@mkd.com',
        'jhonata@mkd.com',
        'lais@mkd.com',
        'alicesilva@mkd.com',
        'gabisena@mkd.com',
        'mariadonilson@mkd.com',
        'maraiakeuri@mkd.com',
        'joaovitor@mkd.com',
        'lucas@mkd.com',
        'isabel@mkd.com',
        'melhorlider@mkd.com',
        'vinizoiazul@mkd.com'
    ]) as email
)
SELECT
    '⚠️ USUÁRIOS NÃO ENCONTRADOS' as alerta,
    ee.email,
    CASE 
        WHEN up.id IS NULL THEN '❌ Usuário não existe'
        WHEN NOT up.ativo THEN '❌ Usuário inativo'
        WHEN tm.id IS NULL THEN '❌ Não é membro da equipe de louvor'
        WHEN NOT tm.ativo THEN '❌ Membro inativo na equipe'
        ELSE '✅ OK'
    END as status
FROM expected_emails ee
LEFT JOIN users_profile up ON lower(up.email) = lower(ee.email)
LEFT JOIN team_members tm ON tm.user_id = up.id
    AND tm.team_id = (
        SELECT t.id
        FROM teams t
        JOIN team_types tt ON tt.id = t.team_type_id
        WHERE tt.codigo = 'louvor'
          AND t.ativo = true
        ORDER BY t.created_at
        LIMIT 1
    )
WHERE up.id IS NULL 
   OR NOT up.ativo 
   OR tm.id IS NULL 
   OR NOT tm.ativo
ORDER BY ee.email;

