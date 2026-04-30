-- ============================================
-- VERIFICAR E CONTAR DADOS EXISTENTES
-- ============================================

-- Contar com SELECT direto (sem filtros)
SELECT 'profiles' as tabela, COUNT(*) as total FROM profiles;
SELECT 'team_types' as tabela, COUNT(*) as total FROM team_types;
SELECT 'team_functions' as tabela, COUNT(*) as total FROM team_functions;

-- Mostrar todos os perfis
SELECT * FROM profiles ORDER BY codigo;

-- Mostrar todos os tipos de equipe
SELECT * FROM team_types ORDER BY codigo;

-- Mostrar todas as funções
SELECT 
    tf.nome as funcao,
    tt.nome as tipo_equipe
FROM team_functions tf
JOIN team_types tt ON tt.id = tf.team_type_id
ORDER BY tt.nome, tf.nome;

-- Verificar RLS nas tabelas
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'team_types', 'team_functions')
ORDER BY tablename;
