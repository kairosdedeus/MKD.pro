-- ============================================================================
-- POPULAR REGRAS COM IDs REAIS
-- ============================================================================
-- Este script popula as regras usando os IDs reais obtidos do banco
-- Execute APÓS criar as tabelas (001_criar_tabelas_regras_rodizio.sql)
-- ============================================================================

-- ============================================================================
-- 1. POPULAR REGRAS DE BAIXISTAS
-- ============================================================================
INSERT INTO worship_bassist_rotation_rules (team_member_id, order_index, is_fixed_team_x, cannot_play_when_drumming, notes)
VALUES
    ('c94ab4da-f708-4ddc-a2f7-683e97786846', 1, true, false, 'Daniel - Equipe X fixa'),
    ('0aa9e636-cce8-456e-94b2-9a5536bfe0ec', 2, false, false, 'Ari - Rodízio'),
    ('422e6117-7ee6-4265-a02d-142263054ee7', 3, false, true, 'Nilson - Rodízio, não toca baixo quando está na bateria')
ON CONFLICT (team_member_id) DO UPDATE SET
    order_index = EXCLUDED.order_index,
    is_fixed_team_x = EXCLUDED.is_fixed_team_x,
    cannot_play_when_drumming = EXCLUDED.cannot_play_when_drumming,
    notes = EXCLUDED.notes;

-- ============================================================================
-- 2. POPULAR REGRAS DE BATERISTAS
-- ============================================================================
INSERT INTO worship_drummer_rotation_rules (team_member_id, order_index, is_fixed_team_x, notes)
VALUES
    ('422e6117-7ee6-4265-a02d-142263054ee7', 1, true, 'Nilson - Equipe X fixa'),
    ('aaf72dac-cf1c-4a37-9bd7-05b91d4ff00f', 2, false, 'Isadora - Rodízio'),
    ('9350205d-8941-43f8-8768-abe4868c24a5', 3, false, 'Thiago - Rodízio')
ON CONFLICT (team_member_id) DO UPDATE SET
    order_index = EXCLUDED.order_index,
    is_fixed_team_x = EXCLUDED.is_fixed_team_x,
    notes = EXCLUDED.notes;

-- ============================================================================
-- 3. POPULAR FUNÇÕES FIXAS (Michael e Vinicius)
-- ============================================================================
INSERT INTO worship_fixed_function_assignments (team_member_id, function_id, is_always_assigned, notes)
VALUES
    ('2ca33c51-5c0d-44c7-b564-6a1b44ea99b0', 'da1a9f8e-6533-473e-a7d8-d92b34dc167e', true, 'Michael - Sempre teclado'),
    ('7b21e430-983f-4bc2-afde-ecfc17d98ab6', '88a2c6ef-7226-4886-8289-d8687576b005', true, 'Vinicius - Sempre guitarra')
ON CONFLICT (team_member_id, function_id) DO UPDATE SET
    is_always_assigned = EXCLUDED.is_always_assigned,
    notes = EXCLUDED.notes;

-- ============================================================================
-- 4. POPULAR CÓDIGOS DAS EQUIPES FIXAS
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
-- 5. RESULTADO: Mostrar regras configuradas
-- ============================================================================
SELECT '✅ REGRAS DE BAIXISTAS' as secao;
SELECT 
    up.nome,
    brr.order_index as ordem,
    CASE WHEN brr.is_fixed_team_x THEN '✅ Equipe X Fixa' ELSE '🔄 Rodízio' END as tipo,
    CASE WHEN brr.cannot_play_when_drumming THEN '⚠️ Não toca baixo quando está na bateria' ELSE '' END as restricao,
    brr.notes as observacoes
FROM worship_bassist_rotation_rules brr
JOIN team_members tm ON tm.id = brr.team_member_id
JOIN users_profile up ON up.id = tm.user_id
ORDER BY brr.order_index;

SELECT '✅ REGRAS DE BATERISTAS' as secao;
SELECT 
    up.nome,
    drr.order_index as ordem,
    CASE WHEN drr.is_fixed_team_x THEN '✅ Equipe X Fixa' ELSE '🔄 Rodízio' END as tipo,
    drr.notes as observacoes
FROM worship_drummer_rotation_rules drr
JOIN team_members tm ON tm.id = drr.team_member_id
JOIN users_profile up ON up.id = tm.user_id
ORDER BY drr.order_index;

SELECT '✅ FUNÇÕES FIXAS' as secao;
SELECT 
    up.nome as membro,
    tf.nome as funcao,
    '✅ Sempre escalado' as status
FROM worship_fixed_function_assignments ffa
JOIN team_members tm ON tm.id = ffa.team_member_id
JOIN users_profile up ON up.id = tm.user_id
JOIN team_functions tf ON tf.id = ffa.function_id
WHERE ffa.is_always_assigned = true
ORDER BY up.nome;

SELECT '✅ CÓDIGOS DAS EQUIPES FIXAS' as secao;
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
    END;

SELECT '🎉 REGRAS POPULADAS COM SUCESSO!' as status;
