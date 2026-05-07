-- ============================================================================
-- POPULAR REGRAS INICIAIS DE RODÍZIO
-- ============================================================================
-- Este script popula as regras iniciais usando APENAS IDs
-- IMPORTANTE: Execute o script de mapeamento ANTES deste
-- ============================================================================

-- ============================================================================
-- 1. POPULAR CÓDIGOS DAS EQUIPES FIXAS
-- ============================================================================
UPDATE worship_fixed_teams SET codigo = 'equipe-x' WHERE nome = 'Equipe X';
UPDATE worship_fixed_teams SET codigo = 'equipe-a-1' WHERE nome = 'Equipe A-1';
UPDATE worship_fixed_teams SET codigo = 'equipe-a-2' WHERE nome = 'Equipe A-2';
UPDATE worship_fixed_teams SET codigo = 'equipe-b-1' WHERE nome = 'Equipe B-1';
UPDATE worship_fixed_teams SET codigo = 'equipe-b-2' WHERE nome = 'Equipe B-2';
UPDATE worship_fixed_teams SET codigo = 'equipe-c-1' WHERE nome = 'Equipe C-1';
UPDATE worship_fixed_teams SET codigo = 'equipe-c-2' WHERE nome = 'Equipe C-2';

-- Tornar obrigatório
ALTER TABLE worship_fixed_teams 
ALTER COLUMN codigo SET NOT NULL;

-- ============================================================================
-- 2. POPULAR REGRAS DE BAIXISTAS
-- ============================================================================
-- NOTA: Você precisa substituir os UUIDs abaixo pelos IDs reais do seu banco
-- Execute: SELECT tm.id, up.nome FROM team_members tm JOIN users_profile up ON up.id = tm.user_id WHERE tm.team_id = 'ID_DA_EQUIPE_LOUVOR'
-- ============================================================================

-- EXEMPLO (SUBSTITUA OS IDs):
/*
INSERT INTO worship_bassist_rotation_rules (team_member_id, order_index, is_fixed_team_x, cannot_play_when_drumming, notes)
VALUES
    ('UUID_DANIEL', 1, true, false, 'Sempre toca na Equipe X (primeira semana)'),
    ('UUID_ARI', 2, false, false, 'Rodízio normal'),
    ('UUID_NILSON', 3, false, true, 'Rodízio, não pode tocar baixo quando está na bateria')
ON CONFLICT (team_member_id) DO UPDATE SET
    order_index = EXCLUDED.order_index,
    is_fixed_team_x = EXCLUDED.is_fixed_team_x,
    cannot_play_when_drumming = EXCLUDED.cannot_play_when_drumming,
    notes = EXCLUDED.notes;
*/

-- ============================================================================
-- 3. POPULAR REGRAS DE BATERISTAS
-- ============================================================================
-- NOTA: Você precisa substituir os UUIDs abaixo pelos IDs reais do seu banco
-- ============================================================================

-- EXEMPLO (SUBSTITUA OS IDs):
/*
INSERT INTO worship_drummer_rotation_rules (team_member_id, order_index, is_fixed_team_x, notes)
VALUES
    ('UUID_NILSON', 1, true, 'Sempre toca na Equipe X (primeira semana)'),
    ('UUID_ISADORA', 2, false, 'Rodízio normal'),
    ('UUID_THIAGO', 3, false, 'Rodízio normal')
ON CONFLICT (team_member_id) DO UPDATE SET
    order_index = EXCLUDED.order_index,
    is_fixed_team_x = EXCLUDED.is_fixed_team_x,
    notes = EXCLUDED.notes;
*/

-- ============================================================================
-- 4. POPULAR FUNÇÕES FIXAS (Michael e Vinicius)
-- ============================================================================
-- NOTA: Você precisa substituir os UUIDs abaixo pelos IDs reais do seu banco
-- ============================================================================

-- EXEMPLO (SUBSTITUA OS IDs):
/*
WITH worship_team AS (
    SELECT t.id as team_id, t.team_type_id
    FROM teams t
    JOIN team_types tt ON tt.id = t.team_type_id
    WHERE tt.codigo = 'louvor' AND t.ativo = true
    LIMIT 1
)
INSERT INTO worship_fixed_function_assignments (team_member_id, function_id, is_always_assigned, notes)
SELECT 
    'UUID_MICHAEL' as team_member_id,
    tf.id as function_id,
    true as is_always_assigned,
    'Sempre toca teclado' as notes
FROM team_functions tf
CROSS JOIN worship_team wt
WHERE tf.team_type_id = wt.team_type_id
  AND tf.nome = 'Teclado'
UNION ALL
SELECT 
    'UUID_VINICIUS' as team_member_id,
    tf.id as function_id,
    true as is_always_assigned,
    'Sempre toca guitarra' as notes
FROM team_functions tf
CROSS JOIN worship_team wt
WHERE tf.team_type_id = wt.team_type_id
  AND tf.nome = 'Guitarra'
ON CONFLICT (team_member_id, function_id) DO UPDATE SET
    is_always_assigned = EXCLUDED.is_always_assigned,
    notes = EXCLUDED.notes;
*/

-- ============================================================================
-- 5. RESULTADO: Mostrar regras configuradas
-- ============================================================================
SELECT '✅ REGRAS DE BAIXISTAS' as secao, * FROM (
    SELECT 
        up.nome,
        brr.order_index as ordem,
        CASE WHEN brr.is_fixed_team_x THEN '✅ Equipe X Fixa' ELSE '🔄 Rodízio' END as tipo,
        CASE WHEN brr.cannot_play_when_drumming THEN '⚠️ Não toca baixo quando está na bateria' ELSE '' END as restricao,
        brr.notes as observacoes
    FROM worship_bassist_rotation_rules brr
    JOIN team_members tm ON tm.id = brr.team_member_id
    JOIN users_profile up ON up.id = tm.user_id
    ORDER BY brr.order_index
) AS baixistas;

SELECT '✅ REGRAS DE BATERISTAS' as secao, * FROM (
    SELECT 
        up.nome,
        drr.order_index as ordem,
        CASE WHEN drr.is_fixed_team_x THEN '✅ Equipe X Fixa' ELSE '🔄 Rodízio' END as tipo,
        drr.notes as observacoes
    FROM worship_drummer_rotation_rules drr
    JOIN team_members tm ON tm.id = drr.team_member_id
    JOIN users_profile up ON up.id = tm.user_id
    ORDER BY drr.order_index
) AS bateristas;

SELECT '✅ FUNÇÕES FIXAS' as secao, * FROM (
    SELECT 
        up.nome as membro,
        tf.nome as funcao,
        '✅ Sempre escalado' as status
    FROM worship_fixed_function_assignments ffa
    JOIN team_members tm ON tm.id = ffa.team_member_id
    JOIN users_profile up ON up.id = tm.user_id
    JOIN team_functions tf ON tf.id = ffa.function_id
    WHERE ffa.is_always_assigned = true
    ORDER BY up.nome
) AS funcoes_fixas;

SELECT '✅ CÓDIGOS DAS EQUIPES FIXAS' as secao, * FROM (
    SELECT 
        nome,
        codigo,
        '✅ Configurado' as status
    FROM worship_fixed_teams
    ORDER BY 
        CASE nome
            WHEN 'Equipe X' THEN 0
            WHEN 'Equipe A-1' THEN 1
            WHEN 'Equipe A-2' THEN 2
            WHEN 'Equipe B-1' THEN 3
            WHEN 'Equipe B-2' THEN 4
            WHEN 'Equipe C-1' THEN 5
            WHEN 'Equipe C-2' THEN 6
            ELSE 99
        END
) AS equipes;

