-- ============================================================================
-- VALIDAR SISTEMA 100% BASEADO EM IDs
-- ============================================================================
-- Execute este script APÓS executar os 4 passos principais
-- Ele mostra um resumo completo do que foi configurado
-- ============================================================================

-- ============================================================================
-- 1. VERIFICAR TABELAS CRIADAS
-- ============================================================================
SELECT '🔍 VERIFICANDO TABELAS' as status;

SELECT 
    table_name as tabela,
    '✅ Existe' as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'worship_bassist_rotation_rules',
    'worship_drummer_rotation_rules',
    'worship_member_rules',
    'worship_fixed_function_assignments'
  )
ORDER BY table_name;

-- ============================================================================
-- 2. VERIFICAR COLUNA CÓDIGO NAS EQUIPES FIXAS
-- ============================================================================
SELECT '🔍 VERIFICANDO COLUNA CÓDIGO' as status;

SELECT 
    column_name as coluna,
    data_type as tipo,
    is_nullable as permite_nulo,
    '✅ Existe' as status
FROM information_schema.columns
WHERE table_name = 'worship_fixed_teams'
  AND column_name = 'codigo';

-- ============================================================================
-- 3. RESUMO DE REGRAS DE BAIXISTAS
-- ============================================================================
SELECT '📊 REGRAS DE BAIXISTAS' as secao;

SELECT 
    brr.order_index as ordem,
    up.nome as membro,
    up.email,
    CASE WHEN brr.is_fixed_team_x THEN '✅ Equipe X Fixa' ELSE '🔄 Rodízio' END as tipo,
    CASE WHEN brr.cannot_play_when_drumming THEN '⚠️ Não toca baixo quando bateria' ELSE '-' END as restricao,
    brr.notes as observacoes
FROM worship_bassist_rotation_rules brr
JOIN team_members tm ON tm.id = brr.team_member_id
JOIN users_profile up ON up.id = tm.user_id
ORDER BY brr.order_index;

-- ============================================================================
-- 4. RESUMO DE REGRAS DE BATERISTAS
-- ============================================================================
SELECT '📊 REGRAS DE BATERISTAS' as secao;

SELECT 
    drr.order_index as ordem,
    up.nome as membro,
    up.email,
    CASE WHEN drr.is_fixed_team_x THEN '✅ Equipe X Fixa' ELSE '🔄 Rodízio' END as tipo,
    drr.notes as observacoes
FROM worship_drummer_rotation_rules drr
JOIN team_members tm ON tm.id = drr.team_member_id
JOIN users_profile up ON up.id = tm.user_id
ORDER BY drr.order_index;

-- ============================================================================
-- 5. RESUMO DE FUNÇÕES FIXAS
-- ============================================================================
SELECT '📊 FUNÇÕES FIXAS' as secao;

SELECT 
    up.nome as membro,
    up.email,
    tf.nome as funcao,
    CASE WHEN ffa.is_always_assigned THEN '✅ Sempre escalado' ELSE '🔄 Opcional' END as status,
    ffa.notes as observacoes
FROM worship_fixed_function_assignments ffa
JOIN team_members tm ON tm.id = ffa.team_member_id
JOIN users_profile up ON up.id = tm.user_id
JOIN team_functions tf ON tf.id = ffa.function_id
ORDER BY up.nome;

-- ============================================================================
-- 6. RESUMO DE CÓDIGOS DAS EQUIPES FIXAS
-- ============================================================================
SELECT '📊 CÓDIGOS DAS EQUIPES FIXAS' as secao;

SELECT 
    nome as equipe,
    codigo,
    CASE WHEN codigo IS NOT NULL THEN '✅ Configurado' ELSE '❌ Faltando' END as status
FROM worship_fixed_teams
ORDER BY 
    CASE nome
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
-- 7. RESUMO DE MEMBROS DAS EQUIPES FIXAS
-- ============================================================================
SELECT '📊 MEMBROS DAS EQUIPES FIXAS' as secao;

SELECT 
    wft.nome as equipe,
    COUNT(DISTINCT wftm.team_member_id) as total_membros,
    STRING_AGG(DISTINCT up.nome, ', ' ORDER BY up.nome) as membros
FROM worship_fixed_teams wft
LEFT JOIN worship_fixed_team_members wftm ON wftm.preset_id = wft.id
LEFT JOIN team_members tm ON tm.id = wftm.team_member_id
LEFT JOIN users_profile up ON up.id = tm.user_id
GROUP BY wft.id, wft.nome
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
-- 8. ESTATÍSTICAS GERAIS
-- ============================================================================
SELECT '📊 ESTATÍSTICAS GERAIS' as secao;

SELECT 
    'Regras de Baixistas' as item,
    COUNT(*)::text as quantidade,
    '✅' as status
FROM worship_bassist_rotation_rules
UNION ALL
SELECT 
    'Regras de Bateristas' as item,
    COUNT(*)::text as quantidade,
    '✅' as status
FROM worship_drummer_rotation_rules
UNION ALL
SELECT 
    'Funções Fixas' as item,
    COUNT(*)::text as quantidade,
    '✅' as status
FROM worship_fixed_function_assignments
UNION ALL
SELECT 
    'Equipes com Código' as item,
    COUNT(*)::text as quantidade,
    '✅' as status
FROM worship_fixed_teams
WHERE codigo IS NOT NULL
UNION ALL
SELECT 
    'Total de Equipes Fixas' as item,
    COUNT(*)::text as quantidade,
    '✅' as status
FROM worship_fixed_teams;

-- ============================================================================
-- 9. VERIFICAR SE HÁ PROBLEMAS
-- ============================================================================
SELECT '⚠️ VERIFICANDO PROBLEMAS' as secao;

-- Equipes sem código
SELECT 
    '❌ Equipes sem código' as problema,
    COUNT(*)::text as quantidade,
    STRING_AGG(nome, ', ') as detalhes
FROM worship_fixed_teams
WHERE codigo IS NULL
HAVING COUNT(*) > 0

UNION ALL

-- Equipes sem membros
SELECT 
    '❌ Equipes sem membros' as problema,
    COUNT(*)::text as quantidade,
    STRING_AGG(wft.nome, ', ') as detalhes
FROM worship_fixed_teams wft
LEFT JOIN worship_fixed_team_members wftm ON wftm.preset_id = wft.id
WHERE wftm.id IS NULL
HAVING COUNT(*) > 0

UNION ALL

-- Verificar se não há problemas
SELECT 
    '✅ Nenhum problema encontrado' as problema,
    '0' as quantidade,
    'Sistema configurado corretamente!' as detalhes
WHERE NOT EXISTS (
    SELECT 1 FROM worship_fixed_teams WHERE codigo IS NULL
)
AND NOT EXISTS (
    SELECT 1 
    FROM worship_fixed_teams wft
    LEFT JOIN worship_fixed_team_members wftm ON wftm.preset_id = wft.id
    WHERE wftm.id IS NULL
);

-- ============================================================================
-- 10. RESULTADO FINAL
-- ============================================================================
SELECT '🎉 VALIDAÇÃO CONCLUÍDA!' as status;

SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM worship_bassist_rotation_rules) >= 3
         AND (SELECT COUNT(*) FROM worship_drummer_rotation_rules) >= 3
         AND (SELECT COUNT(*) FROM worship_fixed_function_assignments) >= 2
         AND (SELECT COUNT(*) FROM worship_fixed_teams WHERE codigo IS NOT NULL) = 7
        THEN '✅ SISTEMA 100% CONFIGURADO E PRONTO PARA USO!'
        ELSE '⚠️ SISTEMA PARCIALMENTE CONFIGURADO - VERIFIQUE OS PROBLEMAS ACIMA'
    END as resultado_final;
