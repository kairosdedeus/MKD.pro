-- ============================================================================
-- LISTAR TODOS OS USUÁRIOS DA EQUIPE DE LOUVOR
-- ============================================================================
-- Este script lista todos os usuários ativos da equipe de louvor
-- com seus emails, para facilitar a configuração das equipes fixas.
-- ============================================================================

WITH worship_team AS (
    SELECT t.id, t.nome as team_name
    FROM teams t
    JOIN team_types tt ON tt.id = t.team_type_id
    WHERE tt.codigo = 'louvor'
      AND t.ativo = true
    ORDER BY t.created_at
    LIMIT 1
)
SELECT
    '👥 MEMBROS DA EQUIPE DE LOUVOR' as info,
    up.nome AS nome,
    up.email AS email,
    tm.id AS team_member_id,
    up.id AS user_id,
    CASE WHEN up.ativo AND tm.ativo THEN '✅ Ativo' ELSE '❌ Inativo' END as status
FROM worship_team wt
JOIN team_members tm ON tm.team_id = wt.id
JOIN users_profile up ON up.id = tm.user_id
WHERE up.ativo = true
  AND tm.ativo = true
ORDER BY up.nome;

-- ============================================================================
-- TEMPLATE PARA COPIAR E COLAR
-- ============================================================================
-- Use este template para configurar as equipes fixas
-- ============================================================================

SELECT '
-- ========================================
-- TEMPLATE PARA EQUIPES FIXAS
-- ========================================
-- Copie e cole no script atualizar-equipes-fixas-nomes-atuais.sql
-- ========================================

official_members(preset_name, member_email, function_name, sort_order) AS (
    VALUES
        -- EQUIPE A-1
        (''Equipe A-1'', ''email@mkd.com'', ''Vocal'', 1),
        (''Equipe A-1'', ''email@mkd.com'', ''Vocal'', 2),
        (''Equipe A-1'', ''email@mkd.com'', ''BackVocal'', 3),
        (''Equipe A-1'', ''email@mkd.com'', ''BackVocal'', 4),
        
        -- EQUIPE A-2
        (''Equipe A-2'', ''email@mkd.com'', ''Vocal'', 1),
        (''Equipe A-2'', ''email@mkd.com'', ''Vocal'', 2),
        (''Equipe A-2'', ''email@mkd.com'', ''BackVocal'', 3),
        (''Equipe A-2'', ''email@mkd.com'', ''BackVocal'', 4)
        -- ... continue para outras equipes
)
' as template;

-- ============================================================================
-- FUNÇÕES DISPONÍVEIS
-- ============================================================================
SELECT
    '🎵 FUNÇÕES DISPONÍVEIS' as info,
    tf.nome AS funcao,
    tf.id AS function_id
FROM team_functions tf
JOIN team_types tt ON tt.id = tf.team_type_id
WHERE tt.codigo = 'louvor'
ORDER BY tf.nome;

-- ============================================================================
-- EQUIPES FIXAS ATUAIS
-- ============================================================================
SELECT
    '📋 CONFIGURAÇÃO ATUAL DAS EQUIPES FIXAS' as info,
    wft.nome AS equipe_fixa,
    up.nome AS membro,
    up.email AS email,
    tf.nome AS funcao,
    wftm.sort_order AS ordem
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
    wftm.sort_order NULLS LAST;

-- ============================================================================
-- RESUMO
-- ============================================================================
SELECT
    '📊 RESUMO' as info,
    (SELECT COUNT(*) FROM worship_fixed_teams WHERE team_id = (
        SELECT t.id FROM teams t JOIN team_types tt ON tt.id = t.team_type_id 
        WHERE tt.codigo = 'louvor' AND t.ativo = true LIMIT 1
    )) as total_equipes_fixas,
    (SELECT COUNT(*) FROM worship_fixed_team_members WHERE preset_id IN (
        SELECT wft.id FROM worship_fixed_teams wft WHERE wft.team_id = (
            SELECT t.id FROM teams t JOIN team_types tt ON tt.id = t.team_type_id 
            WHERE tt.codigo = 'louvor' AND t.ativo = true LIMIT 1
        )
    )) as total_configuracoes,
    (SELECT COUNT(DISTINCT tm.user_id) FROM team_members tm 
     WHERE tm.team_id = (
        SELECT t.id FROM teams t JOIN team_types tt ON tt.id = t.team_type_id 
        WHERE tt.codigo = 'louvor' AND t.ativo = true LIMIT 1
     ) AND tm.ativo = true) as total_membros_ativos;

