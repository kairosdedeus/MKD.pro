-- ============================================================================
-- VERIFICAÇÃO: Escalas de Maio/2026
-- ============================================================================
-- Este script verifica se as escalas de maio foram criadas corretamente
-- ============================================================================

-- 1. ESCALAS CRIADAS
SELECT 
    '1️⃣ ESCALAS CRIADAS' as passo,
    s.id,
    s.date as data,
    s.title as titulo,
    s.status,
    t.nome as equipe
FROM schedules s
JOIN teams t ON t.id = s.team_id
JOIN team_types tt ON tt.id = t.team_type_id
WHERE tt.codigo = 'louvor'
  AND s.date >= '2026-05-01' 
  AND s.date < '2026-06-01'
ORDER BY s.date;

-- 2. MEMBROS POR ESCALA
SELECT 
    '2️⃣ MEMBROS POR ESCALA' as passo,
    s.date as data,
    s.title as titulo,
    COUNT(sm.id) as total_membros,
    STRING_AGG(up.nome, ', ' ORDER BY up.nome) as membros
FROM schedules s
LEFT JOIN schedule_members sm ON sm.schedule_id = s.id
LEFT JOIN team_members tm ON tm.id = sm.team_member_id
LEFT JOIN users_profile up ON up.id = tm.user_id
WHERE s.team_id IN (
    SELECT t.id FROM teams t
    JOIN team_types tt ON tt.id = t.team_type_id
    WHERE tt.codigo = 'louvor'
)
AND s.date >= '2026-05-01' 
AND s.date < '2026-06-01'
GROUP BY s.id, s.date, s.title
ORDER BY s.date;

-- 3. FUNÇÕES POR MEMBRO POR ESCALA
SELECT 
    '3️⃣ FUNÇÕES POR MEMBRO' as passo,
    s.date as data,
    up.nome as membro,
    STRING_AGG(tf.nome, ', ' ORDER BY tf.nome) as funcoes
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
AND s.date >= '2026-05-01' 
AND s.date < '2026-06-01'
GROUP BY s.date, up.nome
ORDER BY s.date, up.nome;

-- 4. QUERY EXATA DO FRONTEND (para debug)
SELECT 
    '4️⃣ QUERY DO FRONTEND' as passo,
    s.*,
    json_agg(
        json_build_object(
            'id', sm.id,
            'team_member', json_build_object(
                'id', tm.id,
                'user', json_build_object(
                    'id', up.id,
                    'nome', up.nome,
                    'email', up.email
                )
            ),
            'functions', (
                SELECT json_agg(
                    json_build_object(
                        'id', tf.id,
                        'nome', tf.nome
                    )
                )
                FROM schedule_member_functions smf
                JOIN team_functions tf ON tf.id = smf.function_id
                WHERE smf.schedule_member_id = sm.id
            )
        )
    ) FILTER (WHERE sm.id IS NOT NULL) as members
FROM schedules s
LEFT JOIN schedule_members sm ON sm.schedule_id = s.id
LEFT JOIN team_members tm ON tm.id = sm.team_member_id
LEFT JOIN users_profile up ON up.id = tm.user_id
WHERE s.team_id IN (
    SELECT t.id FROM teams t
    JOIN team_types tt ON tt.id = t.team_type_id
    WHERE tt.codigo = 'louvor'
)
AND s.date >= '2026-05-01' 
AND s.date < '2026-06-01'
GROUP BY s.id
ORDER BY s.date
LIMIT 1;

-- 5. DIAGNÓSTICO DE PROBLEMAS
SELECT 
    '5️⃣ DIAGNÓSTICO' as passo,
    CASE 
        WHEN (SELECT COUNT(*) FROM schedules s
              JOIN teams t ON t.id = s.team_id
              JOIN team_types tt ON tt.id = t.team_type_id
              WHERE tt.codigo = 'louvor'
              AND s.date >= '2026-05-01' 
              AND s.date < '2026-06-01') = 0
        THEN '❌ Nenhuma escala criada'
        
        WHEN (SELECT COUNT(*) FROM schedule_members sm
              JOIN schedules s ON s.id = sm.schedule_id
              JOIN teams t ON t.id = s.team_id
              JOIN team_types tt ON tt.id = t.team_type_id
              WHERE tt.codigo = 'louvor'
              AND s.date >= '2026-05-01' 
              AND s.date < '2026-06-01') = 0
        THEN '❌ Escalas criadas mas SEM MEMBROS'
        
        WHEN (SELECT COUNT(*) FROM schedule_member_functions smf
              JOIN schedule_members sm ON sm.id = smf.schedule_member_id
              JOIN schedules s ON s.id = sm.schedule_id
              JOIN teams t ON t.id = s.team_id
              JOIN team_types tt ON tt.id = t.team_type_id
              WHERE tt.codigo = 'louvor'
              AND s.date >= '2026-05-01' 
              AND s.date < '2026-06-01') = 0
        THEN '⚠️ Membros adicionados mas SEM FUNÇÕES'
        
        ELSE '✅ Tudo OK! Escalas com membros e funções'
    END as resultado;
