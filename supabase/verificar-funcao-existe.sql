-- ============================================
-- VERIFICAR SE A FUNÇÃO EXISTE
-- ============================================

-- Verificar se a função create_user_with_auth existe
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'create_user_with_auth';

-- Se não retornar nada, a função não existe
-- Execute o arquivo: supabase/funcao-criar-usuario.sql
