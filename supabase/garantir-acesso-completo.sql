-- ============================================
-- GARANTIR ACESSO COMPLETO A TODAS AS TABELAS
-- Desabilitar RLS e dar permissões completas
-- ============================================

-- Desabilitar RLS em TODAS as tabelas
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE users_profile DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_functions DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_member_functions DISABLE ROW LEVEL SECURITY;
ALTER TABLE schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_member_functions DISABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_songs DISABLE ROW LEVEL SECURITY;
ALTER TABLE songs DISABLE ROW LEVEL SECURITY;
ALTER TABLE cells DISABLE ROW LEVEL SECURITY;
ALTER TABLE cell_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE cell_meetings DISABLE ROW LEVEL SECURITY;
ALTER TABLE cell_attendance DISABLE ROW LEVEL SECURITY;

-- Dar permissões completas para anon e authenticated
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Verificar status do RLS
SELECT 
    tablename,
    CASE WHEN rowsecurity THEN '🔒 ENABLED' ELSE '✅ DISABLED' END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

SELECT '✅ Permissões configuradas com sucesso!' as resultado;
