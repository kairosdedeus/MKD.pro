-- ============================================================================
-- DIAGNÓSTICO RÁPIDO: Por que as escalas não mostram membros?
-- ============================================================================
-- Execute este script PRIMEIRO para entender o problema
-- ============================================================================

-- 1. Quantas escalas existem?
SELECT 
    '1️⃣ TOTAL DE ESCALAS' as passo,
    COUNT(*) as quantidade
FROM schedules s
JOIN teams t ON t.id = s.team_id
JOIN team_types tt ON tt.id = t.team_type_id
WHERE tt.codigo = 'louvor';

-- 2. Quantos schedule_members existem?
SELECT 
    '2️⃣ TOTAL DE SCHEDULE_MEMBERS' as passo,
    COUNT(*) as quantidade
FROM schedule_members sm
JOIN schedules s ON s.id = sm.schedule_id
JOIN teams t ON t.id = s.team_id
JOIN team_types tt ON tt.id = t.team_type_id
WHERE tt.codigo = 'louvor';

-- 3. Quantos schedule_members estão órfãos (team_member não existe)?
SELECT 
    '3️⃣ SCHEDULE_MEMBERS ÓRFÃOS' as passo,
    COUNT(*) as quantidade,
    CASE 
        WHEN COUNT(*) > 0 THEN '❌ PROBLEMA ENCONTRADO!'
        ELSE '✅ OK'
    END as status
FROM schedule_members sm
JOIN schedules s ON s.id = sm.schedule_id
JOIN teams t ON t.id = s.team_id
JOIN team_types tt ON tt.id = t.team_type_id
LEFT JOIN team_members tm ON tm.id = sm.team_member_id
WHERE tt.codigo = 'louvor'
  AND tm.id IS NULL;

-- 4. Quantos team_members estão inativos mas usados em escalas?
SELECT 
    '4️⃣ TEAM_MEMBERS INATIVOS EM USO' as passo,
    COUNT(DISTINCT sm.team_member_id) as quantidade,
    CASE 
        WHEN COUNT(DISTINCT sm.team_member_id) > 0 THEN '⚠️ ATENÇÃO!'
        ELSE '✅ OK'
    END as status
FROM schedule_members sm
JOIN schedules s ON s.id = sm.schedule_id
JOIN teams t ON t.id = s.team_id
JOIN team_types tt ON tt.id = t.team_type_id
JOIN team_members tm ON tm.id = sm.team_member_id
WHERE tt.codigo = 'louvor'
  AND NOT tm.ativo;

-- 5. Quantos users estão inativos mas usados em escalas?
SELECT 
    '5️⃣ USERS INATIVOS EM USO' as passo,
    COUNT(DISTINCT tm.user_id) as quantidade,
    CASE 
        WHEN COUNT(DISTINCT tm.user_id) > 0 THEN '⚠️ ATENÇÃO!'
        ELSE '✅ OK'
    END as status
FROM schedule_members sm
JOIN schedules s ON s.id = sm.schedule_id
JOIN teams t ON t.id = s.team_id
JOIN team_types tt ON tt.id = t.team_type_id
JOIN team_members tm ON tm.id = sm.team_member_id
JOIN users_profile up ON up.id = tm.user_id
WHERE tt.codigo = 'louvor'
  AND NOT up.ativo;

-- 6. DETALHES: Quais escalas têm problemas?
SELECT 
    '6️⃣ ESCALAS COM PROBLEMAS' as passo,
    s.date as data,
    s.title as titulo,
    COUNT(sm.id) as total_membros,
    COUNT(CASE WHEN tm.id IS NULL THEN 1 END) as membros_orfaos,
    COUNT(CASE WHEN tm.id IS NOT NULL AND NOT tm.ativo THEN 1 END) as membros_inativos,
    COUNT(CASE WHEN up.id IS NOT NULL AND NOT up.ativo THEN 1 END) as users_inativos,
    CASE 
        WHEN COUNT(CASE WHEN tm.id IS NULL THEN 1 END) > 0 THEN '❌ Órfãos'
        WHEN COUNT(CASE WHEN tm.id IS NOT NULL AND NOT tm.ativo THEN 1 END) > 0 THEN '⚠️ Inativos'
        WHEN COUNT(CASE WHEN up.id IS NOT NULL AND NOT up.ativo THEN 1 END) > 0 THEN '⚠️ Users inativos'
        ELSE '✅ OK'
    END as status
FROM schedules s
LEFT JOIN schedule_members sm ON sm.schedule_id = s.id
LEFT JOIN team_members tm ON tm.id = sm.team_member_id
LEFT JOIN users_profile up ON up.id = tm.user_id
WHERE s.team_id IN (
    SELECT t.id FROM teams t
    JOIN team_types tt ON tt.id = t.team_type_id
    WHERE tt.codigo = 'louvor'
)
GROUP BY s.id, s.date, s.title
HAVING COUNT(CASE WHEN tm.id IS NULL THEN 1 END) > 0
    OR COUNT(CASE WHEN tm.id IS NOT NULL AND NOT tm.ativo THEN 1 END) > 0
    OR COUNT(CASE WHEN up.id IS NOT NULL AND NOT up.ativo THEN 1 END) > 0
ORDER BY s.date DESC;

-- 7. DETALHES: Quais membros estão órfãos?
SELECT 
    '7️⃣ MEMBROS ÓRFÃOS DETALHADOS' as passo,
    s.date as data_escala,
    s.title as titulo_escala,
    sm.id as schedule_member_id,
    sm.team_member_id as team_member_id_invalido,
    '❌ Este team_member não existe mais' as problema
FROM schedule_members sm
JOIN schedules s ON s.id = sm.schedule_id
JOIN teams t ON t.id = s.team_id
JOIN team_types tt ON tt.id = t.team_type_id
LEFT JOIN team_members tm ON tm.id = sm.team_member_id
WHERE tt.codigo = 'louvor'
  AND tm.id IS NULL
ORDER BY s.date DESC
LIMIT 20;

-- 8. RESUMO FINAL
SELECT 
    '8️⃣ RESUMO E PRÓXIMOS PASSOS' as passo,
    CASE 
        WHEN (SELECT COUNT(*) FROM schedule_members sm
              JOIN schedules s ON s.id = sm.schedule_id
              JOIN teams t ON t.id = s.team_id
              JOIN team_types tt ON tt.id = t.team_type_id
              LEFT JOIN team_members tm ON tm.id = sm.team_member_id
              WHERE tt.codigo = 'louvor' AND tm.id IS NULL) > 0
        THEN '❌ PROBLEMA: Existem schedule_members órfãos. Execute: corrigir-escalas-existentes.sql OPÇÃO 1'
        
        WHEN (SELECT COUNT(DISTINCT sm.team_member_id) FROM schedule_members sm
              JOIN schedules s ON s.id = sm.schedule_id
              JOIN teams t ON t.id = s.team_id
              JOIN team_types tt ON tt.id = t.team_type_id
              JOIN team_members tm ON tm.id = sm.team_member_id
              WHERE tt.codigo = 'louvor' AND NOT tm.ativo) > 0
        THEN '⚠️ ATENÇÃO: Existem team_members inativos em uso. Reative-os ou remova das escalas.'
        
        WHEN (SELECT COUNT(DISTINCT tm.user_id) FROM schedule_members sm
              JOIN schedules s ON s.id = sm.schedule_id
              JOIN teams t ON t.id = s.team_id
              JOIN team_types tt ON tt.id = t.team_type_id
              JOIN team_members tm ON tm.id = sm.team_member_id
              JOIN users_profile up ON up.id = tm.user_id
              WHERE tt.codigo = 'louvor' AND NOT up.ativo) > 0
        THEN '⚠️ ATENÇÃO: Existem users inativos em uso. Reative-os.'
        
        ELSE '✅ TUDO OK! As escalas devem estar mostrando os membros corretamente.'
    END as diagnostico;
