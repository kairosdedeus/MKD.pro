-- ============================================================================
-- DIAGNÓSTICO: ESCALAS SEM MEMBROS
-- ============================================================================
-- Este script diagnostica por que as escalas não estão mostrando membros
-- ============================================================================

-- 1. VERIFICAR ESCALAS EXISTENTES
SELECT 
    '=== ESCALAS CADASTRADAS ===' as secao,
    s.id,
    s.date as data,
    s.title as titulo,
    s.status,
    t.nome as equipe,
    (SELECT COUNT(*) FROM schedule_members WHERE schedule_id = s.id) as total_membros
FROM schedules s
JOIN teams t ON t.id = s.team_id
JOIN team_types tt ON tt.id = t.team_type_id
WHERE tt.codigo = 'louvor'
ORDER BY s.date DESC
LIMIT 20;

-- 2. VERIFICAR MEMBROS DAS ESCALAS
SELECT 
    '=== MEMBROS DAS ESCALAS ===' as secao,
    s.date as data_escala,
    s.title as titulo_escala,
    sm.id as schedule_member_id,
    sm.team_member_id,
    tm.user_id,
    up.nome as nome_usuario,
    up.email as email_usuario,
    CASE 
        WHEN tm.id IS NULL THEN '❌ team_member não existe'
        WHEN up.id IS NULL THEN '❌ user não existe'
        WHEN NOT tm.ativo THEN '⚠️ team_member inativo'
        WHEN NOT up.ativo THEN '⚠️ user inativo'
        ELSE '✅ OK'
    END as status
FROM schedules s
JOIN schedule_members sm ON sm.schedule_id = s.id
LEFT JOIN team_members tm ON tm.id = sm.team_member_id
LEFT JOIN users_profile up ON up.id = tm.user_id
WHERE s.team_id IN (
    SELECT t.id FROM teams t
    JOIN team_types tt ON tt.id = t.team_type_id
    WHERE tt.codigo = 'louvor'
)
ORDER BY s.date DESC, sm.id
LIMIT 50;

-- 3. VERIFICAR FUNÇÕES DOS MEMBROS NAS ESCALAS
SELECT 
    '=== FUNÇÕES DOS MEMBROS ===' as secao,
    s.date as data_escala,
    up.nome as membro,
    tf.nome as funcao,
    smf.id as schedule_member_function_id,
    CASE 
        WHEN tf.id IS NULL THEN '❌ função não existe'
        ELSE '✅ OK'
    END as status
FROM schedules s
JOIN schedule_members sm ON sm.schedule_id = s.id
JOIN team_members tm ON tm.id = sm.team_member_id
JOIN users_profile up ON up.id = tm.user_id
LEFT JOIN schedule_member_functions smf ON smf.schedule_member_id = sm.id
LEFT JOIN team_functions tf ON tf.id = smf.function_id
WHERE s.team_id IN (
    SELECT t.id FROM teams t
    JOIN team_types tt ON tt.id = t.team_type_id
    WHERE tt.codigo = 'louvor'
)
ORDER BY s.date DESC, up.nome
LIMIT 50;

-- 4. VERIFICAR TEAM_MEMBERS ÓRFÃOS (sem user_id válido)
SELECT 
    '=== TEAM_MEMBERS ÓRFÃOS ===' as secao,
    tm.id as team_member_id,
    tm.user_id,
    tm.team_id,
    t.nome as equipe,
    CASE 
        WHEN up.id IS NULL THEN '❌ Usuário não existe mais'
        WHEN NOT up.ativo THEN '⚠️ Usuário inativo'
        ELSE '✅ OK'
    END as status,
    (SELECT COUNT(*) FROM schedule_members WHERE team_member_id = tm.id) as usado_em_escalas
FROM team_members tm
JOIN teams t ON t.id = tm.team_id
LEFT JOIN users_profile up ON up.id = tm.user_id
WHERE tm.team_id IN (
    SELECT t.id FROM teams t
    JOIN team_types tt ON tt.id = t.team_type_id
    WHERE tt.codigo = 'louvor'
)
AND (up.id IS NULL OR NOT up.ativo)
ORDER BY usado_em_escalas DESC;

-- 5. VERIFICAR SCHEDULE_MEMBERS ÓRFÃOS (sem team_member válido)
SELECT 
    '=== SCHEDULE_MEMBERS ÓRFÃOS ===' as secao,
    sm.id as schedule_member_id,
    sm.schedule_id,
    s.date as data_escala,
    s.title as titulo_escala,
    sm.team_member_id,
    CASE 
        WHEN tm.id IS NULL THEN '❌ team_member não existe'
        WHEN NOT tm.ativo THEN '⚠️ team_member inativo'
        ELSE '✅ OK'
    END as status
FROM schedule_members sm
JOIN schedules s ON s.id = sm.schedule_id
LEFT JOIN team_members tm ON tm.id = sm.team_member_id
WHERE s.team_id IN (
    SELECT t.id FROM teams t
    JOIN team_types tt ON tt.id = t.team_type_id
    WHERE tt.codigo = 'louvor'
)
AND (tm.id IS NULL OR NOT tm.ativo)
ORDER BY s.date DESC;

-- 6. RESUMO GERAL
SELECT 
    '=== RESUMO GERAL ===' as secao,
    (SELECT COUNT(*) FROM schedules s
     JOIN teams t ON t.id = s.team_id
     JOIN team_types tt ON tt.id = t.team_type_id
     WHERE tt.codigo = 'louvor') as total_escalas,
    
    (SELECT COUNT(*) FROM schedule_members sm
     JOIN schedules s ON s.id = sm.schedule_id
     JOIN teams t ON t.id = s.team_id
     JOIN team_types tt ON tt.id = t.team_type_id
     WHERE tt.codigo = 'louvor') as total_schedule_members,
    
    (SELECT COUNT(*) FROM schedule_members sm
     JOIN schedules s ON s.id = sm.schedule_id
     JOIN teams t ON t.id = s.team_id
     JOIN team_types tt ON tt.id = t.team_type_id
     LEFT JOIN team_members tm ON tm.id = sm.team_member_id
     WHERE tt.codigo = 'louvor' AND tm.id IS NULL) as schedule_members_orfaos,
    
    (SELECT COUNT(*) FROM team_members tm
     JOIN teams t ON t.id = tm.team_id
     JOIN team_types tt ON tt.id = t.team_type_id
     LEFT JOIN users_profile up ON up.id = tm.user_id
     WHERE tt.codigo = 'louvor' AND up.id IS NULL) as team_members_orfaos;
