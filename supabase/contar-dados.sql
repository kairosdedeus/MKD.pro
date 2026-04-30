-- ============================================
-- CONTAR DADOS NAS TABELAS
-- Execute este script para ver quantos registros existem
-- ============================================

-- Contar registros em cada tabela
SELECT 'profiles' as tabela, COUNT(*) as total FROM profiles
UNION ALL
SELECT 'team_types', COUNT(*) FROM team_types
UNION ALL
SELECT 'team_functions', COUNT(*) FROM team_functions
UNION ALL
SELECT 'teams', COUNT(*) FROM teams
UNION ALL
SELECT 'users_profile', COUNT(*) FROM users_profile
UNION ALL
SELECT 'user_profiles', COUNT(*) FROM user_profiles
UNION ALL
SELECT 'schedules', COUNT(*) FROM schedules
UNION ALL
SELECT 'songs', COUNT(*) FROM songs
UNION ALL
SELECT 'cells', COUNT(*) FROM cells;

-- Mostrar todos os perfis (se houver)
SELECT '=== PERFIS EXISTENTES ===' as info;
SELECT * FROM profiles ORDER BY codigo;

-- Mostrar todos os tipos de equipe (se houver)
SELECT '=== TIPOS DE EQUIPE EXISTENTES ===' as info;
SELECT * FROM team_types ORDER BY codigo;

-- Mostrar todas as funções (se houver)
SELECT '=== FUNÇÕES EXISTENTES ===' as info;
SELECT 
    tf.id,
    tf.nome as funcao,
    tt.nome as tipo_equipe
FROM team_functions tf
LEFT JOIN team_types tt ON tt.id = tf.team_type_id
ORDER BY tt.nome, tf.nome;

-- Verificar storage
SELECT '=== STORAGE BUCKETS ===' as info;
SELECT * FROM storage.buckets;
