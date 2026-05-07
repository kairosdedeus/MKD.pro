-- ============================================================================
-- SCRIPT AUXILIAR: OBTER IDs PARA CONFIGURAÇÃO DE EQUIPES FIXAS
-- ============================================================================
-- Execute este script para obter todos os IDs necessários para configurar
-- as equipes fixas do louvor usando IDs em vez de nomes
-- ============================================================================

-- ============================================================================
-- 1. OBTER ID DA EQUIPE DE LOUVOR
-- ============================================================================
SELECT 
    '=== EQUIPE DE LOUVOR ===' as secao,
    t.id as team_id,
    t.nome as team_nome,
    tt.nome as tipo
FROM teams t
JOIN team_types tt ON tt.id = t.team_type_id
WHERE tt.codigo = 'louvor'
  AND t.ativo = true
ORDER BY t.created_at
LIMIT 1;

-- ============================================================================
-- 2. OBTER IDs DOS MEMBROS DA EQUIPE (team_members)
-- ============================================================================
SELECT 
    '=== MEMBROS DA EQUIPE ===' as secao,
    tm.id as team_member_id,
    up.id as user_id,
    up.nome as nome_usuario,
    up.email as email_usuario,
    CASE WHEN tm.ativo THEN '✅ Ativo' ELSE '❌ Inativo' END as status
FROM team_members tm
JOIN users_profile up ON up.id = tm.user_id
WHERE tm.team_id = (
    SELECT t.id
    FROM teams t
    JOIN team_types tt ON tt.id = t.team_type_id
    WHERE tt.codigo = 'louvor'
      AND t.ativo = true
    ORDER BY t.created_at
    LIMIT 1
)
ORDER BY up.nome;

-- ============================================================================
-- 3. OBTER IDs DAS FUNÇÕES (team_functions)
-- ============================================================================
SELECT 
    '=== FUNÇÕES DISPONÍVEIS ===' as secao,
    tf.id as function_id,
    tf.nome as funcao_nome,
    tt.nome as tipo_equipe
FROM team_functions tf
JOIN team_types tt ON tt.id = tf.team_type_id
WHERE tt.codigo = 'louvor'
ORDER BY tf.nome;

-- ============================================================================
-- 4. OBTER IDs DAS EQUIPES FIXAS (worship_fixed_teams)
-- ============================================================================
SELECT 
    '=== EQUIPES FIXAS ===' as secao,
    wft.id as preset_id,
    wft.nome as preset_nome,
    CASE WHEN wft.ativo THEN '✅ Ativo' ELSE '❌ Inativo' END as status,
    COUNT(wftm.id) as total_membros
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
)
GROUP BY wft.id, wft.nome, wft.ativo
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
    END;

-- ============================================================================
-- 5. TEMPLATE PARA COPIAR E COLAR (substitua os IDs)
-- ============================================================================
-- Copie este template e substitua os valores pelos IDs obtidos acima:
/*

VALUES
    -- EQUIPE A-1
    ('Equipe A-1', 'COLE-AQUI-O-team_member_id-DO-TCHUCKY', 'COLE-AQUI-O-function_id-DO-VOCAL', 1),
    ('Equipe A-1', 'COLE-AQUI-O-team_member_id-DA-MADU', 'COLE-AQUI-O-function_id-DO-VOCAL', 2),
    ('Equipe A-1', 'COLE-AQUI-O-team_member_id-DO-JHONATA', 'COLE-AQUI-O-function_id-DO-BACKVOCAL', 3),
    ('Equipe A-1', 'COLE-AQUI-O-team_member_id-DA-LAIS', 'COLE-AQUI-O-function_id-DO-BACKVOCAL', 4),
    
    -- EQUIPE A-2
    ('Equipe A-2', 'COLE-AQUI-O-team_member_id-DO-JHONATA', 'COLE-AQUI-O-function_id-DO-VOCAL', 1),
    ('Equipe A-2', 'COLE-AQUI-O-team_member_id-DA-LAIS', 'COLE-AQUI-O-function_id-DO-VOCAL', 2),
    ('Equipe A-2', 'COLE-AQUI-O-team_member_id-DO-TCHUCKY', 'COLE-AQUI-O-function_id-DO-BACKVOCAL', 3),
    ('Equipe A-2', 'COLE-AQUI-O-team_member_id-DA-MADU', 'COLE-AQUI-O-function_id-DO-BACKVOCAL', 4),
    
    -- Continue para as demais equipes...

*/

-- ============================================================================
-- 6. VERIFICAR MEMBROS ATUAIS DAS EQUIPES FIXAS
-- ============================================================================
SELECT 
    '=== CONFIGURAÇÃO ATUAL ===' as secao,
    wft.nome AS equipe_fixa,
    up.nome AS membro,
    up.email AS email,
    tf.nome AS funcao,
    wftm.sort_order AS ordem,
    tm.id AS team_member_id,
    tf.id AS function_id
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
