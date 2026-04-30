-- ============================================
-- DESABILITAR RLS TEMPORARIAMENTE
-- ============================================
-- Use apenas para desenvolvimento/testes
-- NUNCA em produção!
-- ============================================

-- Desabilitar RLS em todas as tabelas
ALTER TABLE users_profile DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_functions DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_member_functions DISABLE ROW LEVEL SECURITY;
ALTER TABLE schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_member_functions DISABLE ROW LEVEL SECURITY;
ALTER TABLE songs DISABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_songs DISABLE ROW LEVEL SECURITY;
ALTER TABLE cells DISABLE ROW LEVEL SECURITY;
ALTER TABLE cell_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE cell_meetings DISABLE ROW LEVEL SECURITY;
ALTER TABLE cell_attendance DISABLE ROW LEVEL SECURITY;

-- Verificar status
SELECT 
    tablename,
    CASE WHEN rowsecurity THEN '🔒 ATIVO' ELSE '🔓 DESATIVADO' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

SELECT 'RLS desabilitado em todas as tabelas!' as resultado;
SELECT 'Agora tente fazer login novamente' as proxima_acao;
