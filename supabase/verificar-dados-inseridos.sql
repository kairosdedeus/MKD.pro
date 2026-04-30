-- ============================================
-- VERIFICAR SE OS DADOS FORAM INSERIDOS
-- ============================================

-- 1. Verificar perfis
SELECT 'PERFIS' as tabela, COUNT(*) as total FROM profiles;
SELECT * FROM profiles ORDER BY codigo;

-- 2. Verificar tipos de equipe
SELECT 'TIPOS DE EQUIPE' as tabela, COUNT(*) as total FROM team_types;
SELECT * FROM team_types ORDER BY codigo;

-- 3. Verificar funções
SELECT 'FUNÇÕES' as tabela, COUNT(*) as total FROM team_functions;
SELECT 
    tf.nome as funcao,
    tt.nome as tipo_equipe
FROM team_functions tf
JOIN team_types tt ON tt.id = tf.team_type_id
ORDER BY tt.nome, tf.nome;

-- 4. Verificar storage
SELECT 'STORAGE' as tabela, COUNT(*) as total 
FROM storage.buckets 
WHERE name = 'audio-musicas';

SELECT * FROM storage.buckets WHERE name = 'audio-musicas';

-- 5. Verificar usuário admin
SELECT 
    'USUÁRIO ADMIN' as info,
    u.email,
    up.nome,
    up.ativo,
    (SELECT COUNT(*) FROM user_profiles WHERE user_id = up.id) as perfis_atribuidos
FROM auth.users u
LEFT JOIN users_profile up ON up.auth_user_id = u.id
WHERE u.email = 'admin@igreja.com';

-- 6. Verificar perfis do usuário admin
SELECT 
    up.nome as usuario,
    p.nome as perfil,
    p.codigo
FROM users_profile up
JOIN user_profiles upr ON upr.user_id = up.id
JOIN profiles p ON p.id = upr.profile_id
WHERE up.email = 'admin@igreja.com';
