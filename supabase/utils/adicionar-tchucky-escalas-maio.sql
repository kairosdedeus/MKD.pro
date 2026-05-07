-- ============================================================================
-- ADICIONAR PR. TCHUCKY OKAMA NAS ESCALAS DE MAIO
-- ============================================================================
-- Este script adiciona o Pr. Tchucky nas escalas onde ele deveria estar
-- ============================================================================

WITH worship_team AS (
    SELECT t.id as team_id, t.team_type_id
    FROM teams t
    JOIN team_types tt ON tt.id = t.team_type_id
    WHERE tt.codigo = 'louvor'
      AND t.ativo = true
    ORDER BY t.created_at
    LIMIT 1
),
-- Obter team_member_id do Tchucky
tchucky_member AS (
    SELECT tm.id as team_member_id
    FROM users_profile up
    JOIN team_members tm ON tm.user_id = up.id
    JOIN worship_team wt ON tm.team_id = wt.team_id
    WHERE up.email = 'tchucky@mkd.com'
      AND up.ativo = true
      AND tm.ativo = true
    LIMIT 1
),
-- Obter IDs das funções
function_ids AS (
    SELECT 
        tf.id as function_id,
        tf.nome as function_name
    FROM team_functions tf
    JOIN worship_team wt ON tf.team_type_id = wt.team_type_id
    WHERE tf.nome IN ('Vocal', 'BackVocal')
),
-- Escalas onde Tchucky deveria estar
escalas_tchucky(data, titulo, funcao) AS (
    VALUES
        ('2026-05-16', 'Culto Sábado', 'BackVocal'),
        ('2026-05-17', 'Culto Domingo', 'BackVocal'),
        ('2026-05-30', 'Culto Sábado', 'Vocal'),
        ('2026-05-31', 'Culto Domingo', 'Vocal')
),
-- Adicionar schedule_members
new_schedule_members AS (
    INSERT INTO schedule_members (schedule_id, team_member_id)
    SELECT DISTINCT
        s.id as schedule_id,
        tm.team_member_id
    FROM escalas_tchucky et
    JOIN schedules s 
        ON s.date = et.data::date 
        AND s.title = et.titulo
    JOIN worship_team wt ON s.team_id = wt.team_id
    CROSS JOIN tchucky_member tm
    WHERE NOT EXISTS (
        -- Não adicionar se já existe
        SELECT 1 FROM schedule_members sm2
        WHERE sm2.schedule_id = s.id
          AND sm2.team_member_id = tm.team_member_id
    )
    RETURNING id, schedule_id
)
-- Adicionar funções
INSERT INTO schedule_member_functions (schedule_member_id, function_id)
SELECT DISTINCT
    nsm.id as schedule_member_id,
    fi.function_id
FROM new_schedule_members nsm
JOIN schedules s ON s.id = nsm.schedule_id
JOIN escalas_tchucky et 
    ON s.date = et.data::date 
    AND s.title = et.titulo
JOIN function_ids fi ON fi.function_name = et.funcao
ON CONFLICT DO NOTHING;

-- Mostrar resultado
SELECT 
    '✅ TCHUCKY ADICIONADO' as resultado,
    s.date as data,
    s.title as titulo,
    STRING_AGG(tf.nome, ', ' ORDER BY tf.nome) as funcoes
FROM schedules s
JOIN schedule_members sm ON sm.schedule_id = s.id
JOIN team_members tm ON tm.id = sm.team_member_id
JOIN users_profile up ON up.id = tm.user_id
LEFT JOIN schedule_member_functions smf ON smf.schedule_member_id = sm.id
LEFT JOIN team_functions tf ON tf.id = smf.function_id
WHERE up.email = 'tchucky@mkd.com'
  AND s.date >= '2026-05-01' 
  AND s.date < '2026-06-01'
GROUP BY s.date, s.title
ORDER BY s.date;
