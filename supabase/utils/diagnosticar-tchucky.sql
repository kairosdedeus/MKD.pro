-- ============================================================================
-- DIAGNÓSTICO: Pr. Tchucky Okama (tchucky@mkd.com)
-- ============================================================================

-- PASSO 1: Verificar se o usuário existe e está ativo
SELECT 
    '1️⃣ DADOS DO USUÁRIO' as passo,
    id,
    nome,
    email,
    ativo,
    auth_user_id,
    CASE WHEN ativo THEN '✅ Ativo' ELSE '❌ Inativo' END as status
FROM users_profile
WHERE email = 'tchucky@mkd.com';

-- PASSO 2: Verificar se o usuário tem team_member
SELECT 
    '2️⃣ TEAM_MEMBERS DO USUÁRIO' as passo,
    tm.id as team_member_id,
    tm.team_id,
    t.nome as equipe,
    tt.nome as tipo_equipe,
    tm.ativo as team_member_ativo,
    up.ativo as user_ativo,
    CASE 
        WHEN NOT tm.ativo THEN '❌ Team member inativo'
        WHEN NOT up.ativo THEN '❌ User inativo'
        ELSE '✅ Ativo'
    END as status
FROM users_profile up
JOIN team_members tm ON tm.user_id = up.id
JOIN teams t ON t.id = tm.team_id
JOIN team_types tt ON tt.id = t.team_type_id
WHERE up.email = 'tchucky@mkd.com';

-- PASSO 3: Verificar se está em alguma escala
SELECT 
    '3️⃣ ESCALAS DO USUÁRIO' as passo,
    s.date as data,
    s.title as titulo,
    s.status as status_escala,
    sm.id as schedule_member_id,
    tm.id as team_member_id,
    up.nome as nome_atual,
    up.email,
    STRING_AGG(tf.nome, ', ' ORDER BY tf.nome) as funcoes,
    COUNT(smf.id) as total_funcoes
FROM users_profile up
JOIN team_members tm ON tm.user_id = up.id
JOIN schedule_members sm ON sm.team_member_id = tm.id
JOIN schedules s ON s.id = sm.schedule_id
LEFT JOIN schedule_member_functions smf ON smf.schedule_member_id = sm.id
LEFT JOIN team_functions tf ON tf.id = smf.function_id
WHERE up.email = 'tchucky@mkd.com'
GROUP BY s.date, s.title, s.status, sm.id, tm.id, up.nome, up.email
ORDER BY s.date DESC
LIMIT 20;

-- PASSO 4: Verificar schedule_members sem funções
SELECT 
    '4️⃣ ESCALAS SEM FUNÇÕES' as passo,
    s.date as data,
    s.title as titulo,
    sm.id as schedule_member_id,
    '❌ SEM FUNÇÕES' as problema
FROM users_profile up
JOIN team_members tm ON tm.user_id = up.id
JOIN schedule_members sm ON sm.team_member_id = tm.id
JOIN schedules s ON s.id = sm.schedule_id
LEFT JOIN schedule_member_functions smf ON smf.schedule_member_id = sm.id
WHERE up.email = 'tchucky@mkd.com'
  AND smf.id IS NULL
ORDER BY s.date DESC;

-- PASSO 5: Verificar a query exata que o frontend usa (últimas 3 escalas)
SELECT 
    '5️⃣ QUERY DO FRONTEND' as passo,
    s.date as data,
    s.title as titulo,
    json_build_object(
        'schedule_member_id', sm.id,
        'team_member_id', tm.id,
        'team_member_ativo', tm.ativo,
        'user_id', up.id,
        'user_nome', up.nome,
        'user_email', up.email,
        'user_ativo', up.ativo,
        'funcoes', (
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
    ) as dados_completos
FROM schedules s
JOIN schedule_members sm ON sm.schedule_id = s.id
JOIN team_members tm ON tm.id = sm.team_member_id
JOIN users_profile up ON up.id = tm.user_id
WHERE up.email = 'tchucky@mkd.com'
ORDER BY s.date DESC
LIMIT 3;

-- PASSO 6: DIAGNÓSTICO FINAL
SELECT 
    '6️⃣ DIAGNÓSTICO FINAL' as passo,
    CASE 
        WHEN NOT EXISTS (
            SELECT 1 FROM users_profile WHERE email = 'tchucky@mkd.com'
        ) THEN '❌ USUÁRIO NÃO EXISTE'
        
        WHEN EXISTS (
            SELECT 1 FROM users_profile 
            WHERE email = 'tchucky@mkd.com' AND NOT ativo
        ) THEN '❌ USUÁRIO INATIVO'
        
        WHEN NOT EXISTS (
            SELECT 1 FROM users_profile up
            JOIN team_members tm ON tm.user_id = up.id
            WHERE up.email = 'tchucky@mkd.com'
        ) THEN '❌ SEM TEAM_MEMBER'
        
        WHEN EXISTS (
            SELECT 1 FROM users_profile up
            JOIN team_members tm ON tm.user_id = up.id
            WHERE up.email = 'tchucky@mkd.com' AND NOT tm.ativo
        ) THEN '❌ TEAM_MEMBER INATIVO'
        
        WHEN NOT EXISTS (
            SELECT 1 FROM users_profile up
            JOIN team_members tm ON tm.user_id = up.id
            JOIN schedule_members sm ON sm.team_member_id = tm.id
            WHERE up.email = 'tchucky@mkd.com'
        ) THEN '⚠️ NÃO ESTÁ EM NENHUMA ESCALA'
        
        WHEN EXISTS (
            SELECT 1 FROM users_profile up
            JOIN team_members tm ON tm.user_id = up.id
            JOIN schedule_members sm ON sm.team_member_id = tm.id
            LEFT JOIN schedule_member_functions smf ON smf.schedule_member_id = sm.id
            WHERE up.email = 'tchucky@mkd.com' AND smf.id IS NULL
        ) THEN '⚠️ EM ESCALAS MAS SEM FUNÇÕES (por isso não aparece)'
        
        ELSE '✅ TUDO OK'
    END as resultado,
    
    (SELECT nome FROM users_profile WHERE email = 'tchucky@mkd.com') as nome_atual,
    (SELECT ativo FROM users_profile WHERE email = 'tchucky@mkd.com') as user_ativo,
    (SELECT COUNT(*) FROM team_members tm 
     JOIN users_profile up ON up.id = tm.user_id 
     WHERE up.email = 'tchucky@mkd.com') as total_team_members,
    (SELECT COUNT(*) FROM schedule_members sm
     JOIN team_members tm ON tm.id = sm.team_member_id
     JOIN users_profile up ON up.id = tm.user_id
     WHERE up.email = 'tchucky@mkd.com') as total_escalas,
    (SELECT COUNT(*) FROM schedule_member_functions smf
     JOIN schedule_members sm ON sm.id = smf.schedule_member_id
     JOIN team_members tm ON tm.id = sm.team_member_id
     JOIN users_profile up ON up.id = tm.user_id
     WHERE up.email = 'tchucky@mkd.com') as total_funcoes;

-- PASSO 7: Escalas de Maio onde Tchucky deveria estar
SELECT 
    '7️⃣ ESCALAS DE MAIO ESPERADAS' as passo,
    data,
    titulo,
    funcoes_esperadas,
    CASE 
        WHEN esta_na_escala THEN '✅ Está na escala'
        ELSE '❌ NÃO está na escala'
    END as status
FROM (
    VALUES
        ('2026-05-16', 'Culto Sábado', 'BackVocal'),
        ('2026-05-17', 'Culto Domingo', 'BackVocal'),
        ('2026-05-30', 'Culto Sábado', 'Vocal'),
        ('2026-05-31', 'Culto Domingo', 'Vocal')
) AS esperado(data, titulo, funcoes_esperadas)
LEFT JOIN LATERAL (
    SELECT true as esta_na_escala
    FROM schedules s
    JOIN schedule_members sm ON sm.schedule_id = s.id
    JOIN team_members tm ON tm.id = sm.team_member_id
    JOIN users_profile up ON up.id = tm.user_id
    WHERE s.date = esperado.data::date
      AND s.title = esperado.titulo
      AND up.email = 'tchucky@mkd.com'
    LIMIT 1
) AS check_escala ON true;
