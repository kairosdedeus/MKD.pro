-- ============================================================================
-- DIAGNÓSTICO: Usuário sumiu da escala após mudar nome
-- ============================================================================
-- INSTRUÇÕES: Substitua 'EMAIL-DO-USUARIO@mkd.com' pelo email do usuário
-- ============================================================================

-- PASSO 1: Verificar se o usuário existe e está ativo
SELECT 
    '1️⃣ DADOS DO USUÁRIO' as passo,
    id,
    nome,
    email,
    ativo,
    CASE WHEN ativo THEN '✅ Ativo' ELSE '❌ Inativo' END as status
FROM users_profile
WHERE email = 'EMAIL-DO-USUARIO@mkd.com';  -- ← SUBSTITUA AQUI

-- PASSO 2: Verificar se o usuário tem team_member
SELECT 
    '2️⃣ TEAM_MEMBERS DO USUÁRIO' as passo,
    tm.id as team_member_id,
    tm.team_id,
    t.nome as equipe,
    tm.ativo as team_member_ativo,
    CASE WHEN tm.ativo THEN '✅ Ativo' ELSE '❌ Inativo' END as status
FROM users_profile up
JOIN team_members tm ON tm.user_id = up.id
JOIN teams t ON t.id = tm.team_id
WHERE up.email = 'EMAIL-DO-USUARIO@mkd.com';  -- ← SUBSTITUA AQUI

-- PASSO 3: Verificar se está em alguma escala
SELECT 
    '3️⃣ ESCALAS DO USUÁRIO' as passo,
    s.date as data,
    s.title as titulo,
    sm.id as schedule_member_id,
    tm.id as team_member_id,
    up.nome as nome_atual,
    STRING_AGG(tf.nome, ', ') as funcoes
FROM users_profile up
JOIN team_members tm ON tm.user_id = up.id
JOIN schedule_members sm ON sm.team_member_id = tm.id
JOIN schedules s ON s.id = sm.schedule_id
LEFT JOIN schedule_member_functions smf ON smf.schedule_member_id = sm.id
LEFT JOIN team_functions tf ON tf.id = smf.function_id
WHERE up.email = 'EMAIL-DO-USUARIO@mkd.com'  -- ← SUBSTITUA AQUI
GROUP BY s.date, s.title, sm.id, tm.id, up.nome
ORDER BY s.date DESC
LIMIT 10;

-- PASSO 4: Verificar se há schedule_members órfãos (sem team_member válido)
SELECT 
    '4️⃣ SCHEDULE_MEMBERS ÓRFÃOS' as passo,
    sm.id as schedule_member_id,
    sm.schedule_id,
    s.date as data,
    s.title as titulo,
    sm.team_member_id,
    CASE 
        WHEN tm.id IS NULL THEN '❌ team_member não existe'
        WHEN NOT tm.ativo THEN '⚠️ team_member inativo'
        ELSE '✅ OK'
    END as status
FROM schedule_members sm
JOIN schedules s ON s.id = sm.schedule_id
LEFT JOIN team_members tm ON tm.id = sm.team_member_id
WHERE sm.team_member_id IN (
    SELECT tm.id FROM team_members tm
    JOIN users_profile up ON up.id = tm.user_id
    WHERE up.email = 'EMAIL-DO-USUARIO@mkd.com'  -- ← SUBSTITUA AQUI
)
ORDER BY s.date DESC
LIMIT 10;

-- PASSO 5: Verificar a query exata que o frontend usa
SELECT 
    '5️⃣ QUERY DO FRONTEND (como o sistema vê)' as passo,
    s.date as data,
    s.title as titulo,
    json_agg(
        json_build_object(
            'schedule_member_id', sm.id,
            'team_member_id', tm.id,
            'user_id', up.id,
            'nome', up.nome,
            'email', up.email,
            'team_member_ativo', tm.ativo,
            'user_ativo', up.ativo,
            'funcoes', (
                SELECT json_agg(tf.nome)
                FROM schedule_member_functions smf
                JOIN team_functions tf ON tf.id = smf.function_id
                WHERE smf.schedule_member_id = sm.id
            )
        )
    ) FILTER (WHERE sm.id IS NOT NULL) as membros
FROM schedules s
LEFT JOIN schedule_members sm ON sm.schedule_id = s.id
LEFT JOIN team_members tm ON tm.id = sm.team_member_id
LEFT JOIN users_profile up ON up.id = tm.user_id
WHERE s.id IN (
    SELECT DISTINCT s2.id
    FROM schedules s2
    JOIN schedule_members sm2 ON sm2.schedule_id = s2.id
    JOIN team_members tm2 ON tm2.id = sm2.team_member_id
    JOIN users_profile up2 ON up2.id = tm2.user_id
    WHERE up2.email = 'EMAIL-DO-USUARIO@mkd.com'  -- ← SUBSTITUA AQUI
    LIMIT 3
)
GROUP BY s.id, s.date, s.title
ORDER BY s.date DESC;

-- PASSO 6: DIAGNÓSTICO FINAL
SELECT 
    '6️⃣ DIAGNÓSTICO' as passo,
    CASE 
        -- Usuário não existe
        WHEN NOT EXISTS (
            SELECT 1 FROM users_profile 
            WHERE email = 'EMAIL-DO-USUARIO@mkd.com'  -- ← SUBSTITUA AQUI
        ) THEN '❌ USUÁRIO NÃO EXISTE NO BANCO'
        
        -- Usuário inativo
        WHEN EXISTS (
            SELECT 1 FROM users_profile 
            WHERE email = 'EMAIL-DO-USUARIO@mkd.com'  -- ← SUBSTITUA AQUI
            AND NOT ativo
        ) THEN '❌ USUÁRIO ESTÁ INATIVO'
        
        -- Não tem team_member
        WHEN NOT EXISTS (
            SELECT 1 FROM users_profile up
            JOIN team_members tm ON tm.user_id = up.id
            WHERE up.email = 'EMAIL-DO-USUARIO@mkd.com'  -- ← SUBSTITUA AQUI
        ) THEN '❌ USUÁRIO NÃO TEM TEAM_MEMBER (não está em nenhuma equipe)'
        
        -- Team_member inativo
        WHEN EXISTS (
            SELECT 1 FROM users_profile up
            JOIN team_members tm ON tm.user_id = up.id
            WHERE up.email = 'EMAIL-DO-USUARIO@mkd.com'  -- ← SUBSTITUA AQUI
            AND NOT tm.ativo
        ) THEN '⚠️ TEAM_MEMBER ESTÁ INATIVO'
        
        -- Não está em nenhuma escala
        WHEN NOT EXISTS (
            SELECT 1 FROM users_profile up
            JOIN team_members tm ON tm.user_id = up.id
            JOIN schedule_members sm ON sm.team_member_id = tm.id
            WHERE up.email = 'EMAIL-DO-USUARIO@mkd.com'  -- ← SUBSTITUA AQUI
        ) THEN '⚠️ USUÁRIO NÃO ESTÁ EM NENHUMA ESCALA'
        
        -- Está em escalas mas sem funções
        WHEN EXISTS (
            SELECT 1 FROM users_profile up
            JOIN team_members tm ON tm.user_id = up.id
            JOIN schedule_members sm ON sm.team_member_id = tm.id
            LEFT JOIN schedule_member_functions smf ON smf.schedule_member_id = sm.id
            WHERE up.email = 'EMAIL-DO-USUARIO@mkd.com'  -- ← SUBSTITUA AQUI
            AND smf.id IS NULL
        ) THEN '⚠️ USUÁRIO ESTÁ EM ESCALAS MAS SEM FUNÇÕES'
        
        ELSE '✅ TUDO OK - Usuário deveria aparecer nas escalas'
    END as resultado,
    
    -- Informações adicionais
    (SELECT COUNT(*) FROM users_profile WHERE email = 'EMAIL-DO-USUARIO@mkd.com') as usuario_existe,
    (SELECT COUNT(*) FROM team_members tm 
     JOIN users_profile up ON up.id = tm.user_id 
     WHERE up.email = 'EMAIL-DO-USUARIO@mkd.com') as total_team_members,
    (SELECT COUNT(*) FROM schedule_members sm
     JOIN team_members tm ON tm.id = sm.team_member_id
     JOIN users_profile up ON up.id = tm.user_id
     WHERE up.email = 'EMAIL-DO-USUARIO@mkd.com') as total_escalas;
