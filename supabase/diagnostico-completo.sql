-- ============================================
-- DIAGNÓSTICO COMPLETO DO SUPABASE
-- ============================================
-- Execute este script no SQL Editor para verificar
-- se tudo está configurado corretamente
-- ============================================

-- 1. Verificar tabelas existentes
SELECT '=== TABELAS EXISTENTES ===' as info;
SELECT table_name, table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Verificar dados iniciais
SELECT '=== DADOS INICIAIS ===' as info;
SELECT 'profiles' as tabela, COUNT(*) as total FROM profiles
UNION ALL
SELECT 'team_types', COUNT(*) FROM team_types
UNION ALL
SELECT 'team_functions', COUNT(*) FROM team_functions
UNION ALL
SELECT 'users_profile', COUNT(*) FROM users_profile
UNION ALL
SELECT 'teams', COUNT(*) FROM teams;

-- 3. Verificar RLS (Row Level Security)
SELECT '=== ROW LEVEL SECURITY ===' as info;
SELECT 
    tablename,
    CASE WHEN rowsecurity THEN '🔒 ATIVO' ELSE '🔓 DESATIVADO' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 4. Verificar políticas RLS
SELECT '=== POLÍTICAS RLS ===' as info;
SELECT 
    tablename,
    COUNT(*) as total_policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- 5. Verificar usuários de autenticação
SELECT '=== USUÁRIOS DE AUTENTICAÇÃO ===' as info;
SELECT 
    id,
    email,
    email_confirmed_at IS NOT NULL as email_confirmado,
    created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- 6. Verificar perfis de usuários
SELECT '=== PERFIS DE USUÁRIOS ===' as info;
SELECT 
    u.nome,
    u.email,
    u.ativo,
    COUNT(up.id) as total_perfis
FROM users_profile u
LEFT JOIN user_profiles up ON u.id = up.user_id
GROUP BY u.id, u.nome, u.email, u.ativo
ORDER BY u.created_at DESC;

-- 7. Verificar funções auxiliares
SELECT '=== FUNÇÕES AUXILIARES ===' as info;
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('is_gerencial', 'is_team_leader', 'is_team_member', 'is_cell_leader')
ORDER BY routine_name;

-- 8. Verificar triggers
SELECT '=== TRIGGERS ===' as info;
SELECT 
    trigger_name,
    event_object_table as tabela,
    action_timing,
    event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- 9. Verificar storage buckets
SELECT '=== STORAGE BUCKETS ===' as info;
SELECT 
    id,
    name,
    public,
    created_at
FROM storage.buckets
ORDER BY name;

-- 10. Verificar extensões
SELECT '=== EXTENSÕES ===' as info;
SELECT 
    extname as extensao,
    extversion as versao
FROM pg_extension
WHERE extname IN ('uuid-ossp', 'pgcrypto')
ORDER BY extname;

-- ============================================
-- RESUMO DO DIAGNÓSTICO
-- ============================================
SELECT '=== RESUMO ===' as info;

SELECT 
    'Tabelas criadas' as item,
    COUNT(*) as valor
FROM information_schema.tables 
WHERE table_schema = 'public'
UNION ALL
SELECT 
    'Perfis cadastrados',
    COUNT(*) 
FROM profiles
UNION ALL
SELECT 
    'Tipos de equipe',
    COUNT(*) 
FROM team_types
UNION ALL
SELECT 
    'Funções de equipe',
    COUNT(*) 
FROM team_functions
UNION ALL
SELECT 
    'Usuários criados',
    COUNT(*) 
FROM auth.users
UNION ALL
SELECT 
    'Perfis de usuários',
    COUNT(*) 
FROM users_profile
UNION ALL
SELECT 
    'Políticas RLS',
    COUNT(*) 
FROM pg_policies
WHERE schemaname = 'public'
UNION ALL
SELECT 
    'Funções auxiliares',
    COUNT(*) 
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('is_gerencial', 'is_team_leader', 'is_team_member', 'is_cell_leader')
UNION ALL
SELECT 
    'Storage buckets',
    COUNT(*) 
FROM storage.buckets;

-- ============================================
-- VERIFICAÇÕES DE INTEGRIDADE
-- ============================================
SELECT '=== VERIFICAÇÕES ===' as info;

-- Verificar se há usuários sem perfil
SELECT 
    '⚠️ Usuários sem perfil' as alerta,
    COUNT(*) as quantidade
FROM users_profile u
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE up.id IS NULL;

-- Verificar se há perfis órfãos
SELECT 
    '⚠️ Perfis órfãos' as alerta,
    COUNT(*) as quantidade
FROM user_profiles up
LEFT JOIN users_profile u ON up.user_id = u.id
WHERE u.id IS NULL;

-- Verificar se há equipes sem líder
SELECT 
    '⚠️ Equipes sem líder' as alerta,
    COUNT(*) as quantidade
FROM teams
WHERE leader_id IS NULL;

-- ============================================
-- RECOMENDAÇÕES
-- ============================================
SELECT '=== RECOMENDAÇÕES ===' as info;

-- Verificar valores esperados
SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM profiles) < 12 
        THEN '❌ Execute os dados iniciais (profiles)'
        ELSE '✅ Profiles OK'
    END as recomendacao
UNION ALL
SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM team_types) < 5 
        THEN '❌ Execute os dados iniciais (team_types)'
        ELSE '✅ Team Types OK'
    END
UNION ALL
SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM team_functions) < 10 
        THEN '⚠️ Poucas funções cadastradas'
        ELSE '✅ Team Functions OK'
    END
UNION ALL
SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM auth.users) = 0 
        THEN '❌ Crie o primeiro usuário'
        ELSE '✅ Usuários OK'
    END
UNION ALL
SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') < 20 
        THEN '❌ Execute as políticas RLS'
        ELSE '✅ Políticas RLS OK'
    END
UNION ALL
SELECT 
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'audio-musicas')
        THEN '⚠️ Crie o bucket de storage'
        ELSE '✅ Storage OK'
    END;

-- ============================================
-- FIM DO DIAGNÓSTICO
-- ============================================
SELECT '=== DIAGNÓSTICO CONCLUÍDO ===' as info;
SELECT 'Verifique os resultados acima para identificar problemas' as mensagem;
