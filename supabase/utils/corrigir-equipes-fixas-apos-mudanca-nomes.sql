-- ============================================================================
-- CORREÇÃO DE EQUIPES FIXAS APÓS MUDANÇA DE NOMES
-- ============================================================================
-- Este script corrige os relacionamentos das equipes fixas usando EMAILS
-- como identificador único, já que os nomes foram alterados mas os emails
-- permaneceram os mesmos.
--
-- PROBLEMA: Usuários mudaram seus nomes e o sistema perdeu os relacionamentos
-- SOLUÇÃO: Usar emails para identificar usuários (emails são únicos e imutáveis)
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
-- MAPEAMENTO: Nome Antigo → Email → Nome Novo
-- ============================================================================
-- Usando emails como identificador único e imutável
-- ============================================================================
official_members(preset_name, member_email, function_name, sort_order) AS (
    VALUES
        -- EQUIPE A-1
        ('Equipe A-1', 'tchucky@mkd.com', 'Vocal', 1),           -- Pr. Tchucky Okama
        ('Equipe A-1', 'madu@mkd.com', 'Vocal', 2),              -- Maria Eduarda
        ('Equipe A-1', 'jhonata@mkd.com', 'BackVocal', 3),       -- Jhonata nemmer
        ('Equipe A-1', 'lais@mkd.com', 'BackVocal', 4),          -- Lais do Cris
        
        -- EQUIPE A-2
        ('Equipe A-2', 'jhonata@mkd.com', 'Vocal', 1),           -- Jhonata nemmer
        ('Equipe A-2', 'lais@mkd.com', 'Vocal', 2),              -- Lais do Cris
        ('Equipe A-2', 'tchucky@mkd.com', 'BackVocal', 3),       -- Pr. Tchucky Okama
        ('Equipe A-2', 'madu@mkd.com', 'BackVocal', 4),          -- Maria Eduarda
        
        -- EQUIPE B-1
        ('Equipe B-1', 'alicesilva@mkd.com', 'Vocal', 1),        -- Alice Silva
        ('Equipe B-1', 'jhonata@mkd.com', 'Vocal', 2),           -- Jhonata nemmer
        ('Equipe B-1', 'gabisena@mkd.com', 'BackVocal', 3),      -- Gabriela Sena
        ('Equipe B-1', 'mariadonilson@mkd.com', 'BackVocal', 4), -- Maria do Nilson
        
        -- EQUIPE B-2
        ('Equipe B-2', 'gabisena@mkd.com', 'Vocal', 1),          -- Gabriela Sena
        ('Equipe B-2', 'mariadonilson@mkd.com', 'Vocal', 2),     -- Maria do Nilson
        ('Equipe B-2', 'alicesilva@mkd.com', 'BackVocal', 3),    -- Alice Silva
        ('Equipe B-2', 'jhonata@mkd.com', 'BackVocal', 4),       -- Jhonata nemmer
        
        -- EQUIPE C-1
        ('Equipe C-1', 'maralakeuri@mkd.com', 'Vocal', 1),       -- Wallesca do Bruno
        ('Equipe C-1', 'joaovitor@mkd.com', 'Vocal', 2),         -- João Vitor
        ('Equipe C-1', 'lucas@mkd.com', 'BackVocal', 3),         -- Lucas Tchucky
        ('Equipe C-1', 'isabel@mkd.com', 'BackVocal', 4),        -- Isabel Cabrera
        
        -- EQUIPE C-2
        ('Equipe C-2', 'lucas@mkd.com', 'Vocal', 1),             -- Lucas Tchucky
        ('Equipe C-2', 'isabel@mkd.com', 'Vocal', 2),            -- Isabel Cabrera
        ('Equipe C-2', 'maralakeuri@mkd.com', 'BackVocal', 3),   -- Wallesca do Bruno
        ('Equipe C-2', 'joaovitor@mkd.com', 'BackVocal', 4),     -- João Vitor
        
        -- EQUIPE X (primeira semana do mês)
        ('Equipe X', 'melhorlider@mkd.com', 'Vocal', 1),         -- Michael Cabrera
        ('Equipe X', 'vinizoiazul@mkd.com', 'Vocal', 2),         -- Vinicius Guitarra
        ('Equipe X', 'joaovitor@mkd.com', 'BackVocal', 3),       -- João Vitor
        ('Equipe X', 'maralakeuri@mkd.com', 'BackVocal', 4),     -- Wallesca do Bruno
        ('Equipe X', 'alicesilva@mkd.com', 'BackVocal', 5)       -- Alice Silva
),
-- Fazer o match dos membros usando EMAIL (identificador único e imutável)
matched AS (
    SELECT
        wft.id AS preset_id,
        tm.id AS team_member_id,
        tf.id AS function_id,
        om.sort_order,
        up.nome AS nome_atual,
        up.email AS email
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
-- RESULTADO: Mostrar as equipes fixas atualizadas com nomes atuais
-- ============================================================================
SELECT
    wft.nome AS equipe_fixa,
    up.nome AS nome_atual,
    up.email AS email,
    tf.nome AS funcao,
    wftm.sort_order AS ordem,
    CASE 
        WHEN wftm.id IS NOT NULL THEN '✅ Configurado'
        ELSE '❌ Faltando'
    END AS status
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

-- ============================================================================
-- VERIFICAÇÃO: Mostrar mapeamento de nomes antigos → novos
-- ============================================================================
SELECT
    '=== MAPEAMENTO DE NOMES ===' as info,
    up.email,
    up.nome as nome_atual,
    CASE up.email
        WHEN 'tchucky@mkd.com' THEN 'Tchucky Okama → Pr. Tchucky Okama'
        WHEN 'madu@mkd.com' THEN 'Madu Cantora → Maria Eduarda'
        WHEN 'jhonata@mkd.com' THEN 'Jhonata Cantor → Jhonata nemmer'
        WHEN 'lais@mkd.com' THEN 'Lais Cantora → Lais do Cris'
        WHEN 'alicesilva@mkd.com' THEN 'Alice Cantora → Alice Silva'
        WHEN 'gabisena@mkd.com' THEN 'Gabriela Sena (sem mudança)'
        WHEN 'mariadonilson@mkd.com' THEN 'Maria Cantora → Maria do Nilson'
        WHEN 'maralakeuri@mkd.com' THEN 'Wallesca cantora → Wallesca do Bruno'
        WHEN 'joaovitor@mkd.com' THEN 'João Cantor → João Vitor'
        WHEN 'lucas@mkd.com' THEN 'Lucas Tchucky (sem mudança)'
        WHEN 'isabel@mkd.com' THEN 'Isabel Cabrera (sem mudança)'
        WHEN 'melhorlider@mkd.com' THEN 'Michael Cabrera (sem mudança)'
        WHEN 'vinizoiazul@mkd.com' THEN 'Vinicius Guitarra (sem mudança)'
        ELSE 'Não mapeado'
    END as mudanca
FROM users_profile up
WHERE up.email IN (
    'tchucky@mkd.com',
    'madu@mkd.com',
    'jhonata@mkd.com',
    'lais@mkd.com',
    'alicesilva@mkd.com',
    'gabisena@mkd.com',
    'mariadonilson@mkd.com',
    'maralakeuri@mkd.com',
    'joaovitor@mkd.com',
    'lucas@mkd.com',
    'isabel@mkd.com',
    'melhorlider@mkd.com',
    'vinizoiazul@mkd.com'
)
ORDER BY up.nome;
