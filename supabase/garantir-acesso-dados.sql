-- ============================================
-- GARANTIR ACESSO AOS DADOS
-- Desabilitar RLS e dar permissões
-- ============================================

-- 1. Desabilitar RLS em todas as tabelas principais
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_functions DISABLE ROW LEVEL SECURITY;
ALTER TABLE users_profile DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE songs DISABLE ROW LEVEL SECURITY;
ALTER TABLE cells DISABLE ROW LEVEL SECURITY;

-- 2. Dar permissões de leitura para anon (usuário não autenticado)
GRANT SELECT ON profiles TO anon;
GRANT SELECT ON team_types TO anon;
GRANT SELECT ON team_functions TO anon;
GRANT SELECT ON users_profile TO anon;
GRANT SELECT ON user_profiles TO anon;
GRANT SELECT ON teams TO anon;
GRANT SELECT ON team_members TO anon;
GRANT SELECT ON schedules TO anon;
GRANT SELECT ON songs TO anon;
GRANT SELECT ON cells TO anon;

-- 3. Dar permissões completas para authenticated (usuário autenticado)
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON team_types TO authenticated;
GRANT ALL ON team_functions TO authenticated;
GRANT ALL ON users_profile TO authenticated;
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON teams TO authenticated;
GRANT ALL ON team_members TO authenticated;
GRANT ALL ON schedules TO authenticated;
GRANT ALL ON songs TO authenticated;
GRANT ALL ON cells TO authenticated;

-- 4. Verificar se funcionou
SELECT 'RLS Status' as info;
SELECT 
    tablename,
    CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'team_types', 'team_functions')
ORDER BY tablename;

-- 5. Contar dados
SELECT 'Contagem de Dados' as info;
SELECT 'profiles' as tabela, COUNT(*) as total FROM profiles
UNION ALL
SELECT 'team_types', COUNT(*) FROM team_types
UNION ALL
SELECT 'team_functions', COUNT(*) FROM team_functions;

-- 6. Mostrar alguns dados
SELECT 'Perfis Existentes' as info;
SELECT codigo, nome FROM profiles ORDER BY codigo LIMIT 5;

SELECT 'Tipos de Equipe Existentes' as info;
SELECT codigo, nome FROM team_types ORDER BY codigo;

SELECT '✅ Permissões configuradas!' as resultado;
