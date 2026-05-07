-- ============================================================================
-- ADICIONAR MEMBROS FALTANTES À EQUIPE DE LOUVOR
-- ============================================================================
-- Este script adiciona os membros que estão faltando na equipe de louvor
-- ============================================================================

WITH worship_team AS (
    SELECT t.id as team_id
    FROM teams t
    JOIN team_types tt ON tt.id = t.team_type_id
    WHERE tt.codigo = 'louvor'
      AND t.ativo = true
    ORDER BY t.created_at
    LIMIT 1
),
-- Usuários que precisam ser adicionados
users_to_add(email, nome_esperado) AS (
    VALUES
        ('madu@mkd.com', 'Madu'),
        ('lais@mkd.com', 'Laís'),
        ('mariadonilson@mkd.com', 'Maria'),
        ('isabel@mkd.com', 'Isabel')
)
-- Adicionar os usuários como membros da equipe
INSERT INTO team_members (team_id, user_id, ativo)
SELECT 
    wt.team_id,
    up.id as user_id,
    true as ativo
FROM users_to_add uta
JOIN users_profile up ON lower(up.email) = lower(uta.email)
CROSS JOIN worship_team wt
WHERE up.ativo = true
  AND NOT EXISTS (
      -- Não adicionar se já for membro
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = wt.team_id
        AND tm.user_id = up.id
  )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- RESULTADO: Mostrar membros adicionados
-- ============================================================================
SELECT
    '✅ MEMBROS ADICIONADOS À EQUIPE DE LOUVOR' as status,
    up.nome,
    up.email,
    tm.ativo as membro_ativo,
    CASE WHEN tm.id IS NOT NULL THEN '✅ Adicionado' ELSE '❌ Não encontrado' END as resultado
FROM users_profile up
LEFT JOIN team_members tm ON tm.user_id = up.id
    AND tm.team_id = (
        SELECT t.id FROM teams t 
        JOIN team_types tt ON tt.id = t.team_type_id 
        WHERE tt.codigo = 'louvor' AND t.ativo = true 
        LIMIT 1
    )
WHERE up.email IN ('madu@mkd.com', 'lais@mkd.com', 'mariadonilson@mkd.com', 'isabel@mkd.com')
ORDER BY up.nome;

-- ============================================================================
-- VERIFICAÇÃO: Usuários não encontrados
-- ============================================================================
SELECT
    '⚠️ USUÁRIOS NÃO ENCONTRADOS NO SISTEMA' as alerta,
    uta.email,
    uta.nome_esperado
FROM (VALUES
    ('madu@mkd.com', 'Madu'),
    ('lais@mkd.com', 'Laís'),
    ('mariadonilson@mkd.com', 'Maria'),
    ('isabel@mkd.com', 'Isabel')
) AS uta(email, nome_esperado)
WHERE NOT EXISTS (
    SELECT 1 FROM users_profile up
    WHERE lower(up.email) = lower(uta.email)
      AND up.ativo = true
);

-- ============================================================================
-- RESUMO FINAL
-- ============================================================================
SELECT
    '📊 RESUMO' as info,
    COUNT(*) as total_membros_louvor,
    COUNT(*) FILTER (WHERE tm.ativo) as membros_ativos
FROM team_members tm
WHERE tm.team_id = (
    SELECT t.id FROM teams t 
    JOIN team_types tt ON tt.id = t.team_type_id 
    WHERE tt.codigo = 'louvor' AND t.ativo = true 
    LIMIT 1
);

