-- ============================================================================
-- GERAR SCRIPT PARA POPULAR REGRAS (SEM USAR EMAILS)
-- ============================================================================
-- Este script gera o SQL necessário para popular as regras usando apenas IDs
-- Execute este script e copie o resultado para popular as regras
-- ============================================================================

WITH worship_team AS (
    SELECT t.id as team_id, t.team_type_id
    FROM teams t
    JOIN team_types tt ON tt.id = t.team_type_id
    WHERE tt.codigo = 'louvor' AND t.ativo = true
    LIMIT 1
),
-- Listar todos os membros com seus IDs
membros AS (
    SELECT 
        tm.id as team_member_id,
        up.id as user_id,
        up.nome,
        up.email
    FROM worship_team wt
    JOIN team_members tm ON tm.team_id = wt.team_id
    JOIN users_profile up ON up.id = tm.user_id
    WHERE up.ativo = true AND tm.ativo = true
    ORDER BY up.nome
),
-- Listar funções
funcoes AS (
    SELECT 
        tf.id as function_id,
        tf.nome as function_name
    FROM worship_team wt
    JOIN team_functions tf ON tf.team_type_id = wt.team_type_id
    WHERE tf.nome IN ('Bateria', 'Baixo', 'Teclado', 'Guitarra')
)
-- ============================================================================
-- RESULTADO: GERAR SCRIPTS PARA COPIAR E EXECUTAR
-- ============================================================================
(
    -- PARTE 1: MOSTRAR IDs DOS MEMBROS
    SELECT '=== IDs DOS MEMBROS ===' as secao, nome, email, team_member_id::text
    FROM membros
)
UNION ALL
(
    -- PARTE 2: MOSTRAR IDs DAS FUNÇÕES
    SELECT '=== IDs DAS FUNÇÕES ===' as secao, function_name as nome, '' as email, function_id::text as team_member_id
    FROM funcoes
)
UNION ALL
(
    -- PARTE 3: GERAR SCRIPT DE BAIXISTAS
    SELECT 
        '=== SCRIPT BAIXISTAS ===' as secao,
        'COPIE E EXECUTE' as nome,
        '' as email,
        '' as team_member_id
)
UNION ALL
(
    SELECT 
        'INSERT' as secao,
        'INTO worship_bassist_rotation_rules' as nome,
        '(team_member_id, order_index, is_fixed_team_x, cannot_play_when_drumming, notes)' as email,
        'VALUES' as team_member_id
)
UNION ALL
(
    SELECT 
        'BAIXISTA' as secao,
        CASE 
            WHEN m.nome ILIKE '%daniel%' THEN format('(''%s'', 1, true, false, ''Equipe X fixa''),', m.team_member_id)
            WHEN m.nome ILIKE '%ari%' THEN format('(''%s'', 2, false, false, ''Rodízio''),', m.team_member_id)
            WHEN m.nome ILIKE '%nilson%' THEN format('(''%s'', 3, false, true, ''Rodízio, não toca baixo quando bateria'');', m.team_member_id)
        END as nome,
        m.nome as email,
        m.team_member_id::text
    FROM membros m
    WHERE m.nome ILIKE '%daniel%' OR m.nome ILIKE '%ari%' OR m.nome ILIKE '%nilson%'
)
UNION ALL
(
    -- PARTE 4: GERAR SCRIPT DE BATERISTAS
    SELECT 
        '=== SCRIPT BATERISTAS ===' as secao,
        'COPIE E EXECUTE' as nome,
        '' as email,
        '' as team_member_id
)
UNION ALL
(
    SELECT 
        'INSERT' as secao,
        'INTO worship_drummer_rotation_rules' as nome,
        '(team_member_id, order_index, is_fixed_team_x, notes)' as email,
        'VALUES' as team_member_id
)
UNION ALL
(
    SELECT 
        'BATERISTA' as secao,
        CASE 
            WHEN m.nome ILIKE '%nilson%' THEN format('(''%s'', 1, true, ''Equipe X fixa''),', m.team_member_id)
            WHEN m.nome ILIKE '%isadora%' THEN format('(''%s'', 2, false, ''Rodízio''),', m.team_member_id)
            WHEN m.nome ILIKE '%thiago%' THEN format('(''%s'', 3, false, ''Rodízio'');', m.team_member_id)
        END as nome,
        m.nome as email,
        m.team_member_id::text
    FROM membros m
    WHERE m.nome ILIKE '%nilson%' OR m.nome ILIKE '%isadora%' OR m.nome ILIKE '%thiago%'
)
UNION ALL
(
    -- PARTE 5: GERAR SCRIPT DE FUNÇÕES FIXAS (Michael e Vinicius)
    SELECT 
        '=== SCRIPT FUNÇÕES FIXAS ===' as secao,
        'COPIE E EXECUTE' as nome,
        '' as email,
        '' as team_member_id
)
UNION ALL
(
    SELECT 
        'INSERT' as secao,
        'INTO worship_fixed_function_assignments' as nome,
        '(team_member_id, function_id, is_always_assigned, notes)' as email,
        'VALUES' as team_member_id
)
UNION ALL
(
    SELECT 
        'FIXO' as secao,
        CASE 
            WHEN m.nome ILIKE '%michael%' THEN 
                format('(''%s'', ''%s'', true, ''Sempre teclado''),', m.team_member_id, f.function_id)
            WHEN m.nome ILIKE '%vinicius%' THEN 
                format('(''%s'', ''%s'', true, ''Sempre guitarra'');', m.team_member_id, f.function_id)
        END as nome,
        m.nome || ' - ' || f.function_name as email,
        m.team_member_id::text
    FROM membros m
    CROSS JOIN funcoes f
    WHERE (m.nome ILIKE '%michael%' AND f.function_name = 'Teclado')
       OR (m.nome ILIKE '%vinicius%' AND f.function_name = 'Guitarra')
)
ORDER BY secao, nome;

