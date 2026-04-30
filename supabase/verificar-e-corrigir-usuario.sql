-- ============================================
-- VERIFICAR E CORRIGIR USUÁRIO EXISTENTE
-- ============================================

-- 1. Ver informações do usuário
SELECT '=== USUÁRIO DE AUTENTICAÇÃO ===' as info;
SELECT 
    id,
    email,
    email_confirmed_at IS NOT NULL as confirmado,
    created_at
FROM auth.users
WHERE email = 'admin@igreja.com';

-- 2. Ver perfil do usuário
SELECT '=== PERFIL DO USUÁRIO ===' as info;
SELECT 
    id,
    auth_user_id,
    nome,
    email,
    ativo
FROM users_profile
WHERE email = 'admin@igreja.com';

-- 3. Ver perfis atribuídos
SELECT '=== PERFIS ATRIBUÍDOS ===' as info;
SELECT 
    u.nome as usuario,
    p.nome as perfil,
    p.codigo
FROM users_profile u
JOIN user_profiles up ON u.id = up.user_id
JOIN profiles p ON up.profile_id = p.id
WHERE u.email = 'admin@igreja.com';

-- 4. Garantir que tem perfil gerencial
INSERT INTO user_profiles (user_id, profile_id)
SELECT 
    u.id,
    p.id
FROM users_profile u
CROSS JOIN profiles p
WHERE u.email = 'admin@igreja.com'
AND p.codigo = 'gerencial'
ON CONFLICT (user_id, profile_id) DO NOTHING;

-- 5. Verificar novamente
SELECT '=== VERIFICAÇÃO FINAL ===' as info;
SELECT 
    u.nome as usuario,
    u.email,
    u.ativo,
    COUNT(up.id) as total_perfis,
    STRING_AGG(p.nome, ', ') as perfis
FROM users_profile u
LEFT JOIN user_profiles up ON u.id = up.user_id
LEFT JOIN profiles p ON up.profile_id = p.id
WHERE u.email = 'admin@igreja.com'
GROUP BY u.id, u.nome, u.email, u.ativo;

SELECT '✅ Usuário verificado e corrigido!' as resultado;
SELECT 'Agora tente fazer login com: admin@igreja.com / Admin@2024' as proxima_acao;
