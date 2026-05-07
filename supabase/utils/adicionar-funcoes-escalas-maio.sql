-- ============================================================================
-- ADICIONAR FUNÇÕES ÀS ESCALAS DE MAIO/2026
-- ============================================================================
-- Este script adiciona as funções que estão faltando nas escalas de maio
-- Execute este script se os membros foram adicionados mas sem funções
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
-- Mapeamento de emails para team_member_id
member_map AS (
    SELECT 
        up.email,
        up.nome,
        tm.id as team_member_id
    FROM users_profile up
    JOIN team_members tm ON tm.user_id = up.id
    JOIN worship_team wt ON tm.team_id = wt.team_id
    WHERE up.ativo = true
      AND tm.ativo = true
),
-- Mapeamento de funções
function_map AS (
    SELECT 
        tf.nome as function_name,
        tf.id as function_id
    FROM team_functions tf
    JOIN worship_team wt ON tf.team_type_id = wt.team_type_id
),
-- Definição das escalas com membros e funções
escalas_maio(data, titulo, membro_email, funcao_nome) AS (
    VALUES
        -- SÁBADO 02 e DOMINGO 03 (Equipe X)
        ('2026-05-02', 'Culto Sábado', 'melhorlider@mkd.com', 'Vocal'),
        ('2026-05-02', 'Culto Sábado', 'vinizoiazul@mkd.com', 'Vocal'),
        ('2026-05-02', 'Culto Sábado', 'maraiakeuri@mkd.com', 'BackVocal'),
        ('2026-05-02', 'Culto Sábado', 'alicesilva@mkd.com', 'BackVocal'),
        ('2026-05-02', 'Culto Sábado', 'joaovitor@mkd.com', 'BackVocal'),
        ('2026-05-02', 'Culto Sábado', 'melhorlider@mkd.com', 'Teclado'),
        ('2026-05-02', 'Culto Sábado', 'vinizoiazul@mkd.com', 'Guitarra'),
        ('2026-05-02', 'Culto Sábado', 'nilsonbateria@mkd.com', 'Bateria'),
        ('2026-05-02', 'Culto Sábado', 'danielbaixo@mkd.com', 'Baixo'),
        
        ('2026-05-03', 'Culto Domingo', 'melhorlider@mkd.com', 'Vocal'),
        ('2026-05-03', 'Culto Domingo', 'vinizoiazul@mkd.com', 'Vocal'),
        ('2026-05-03', 'Culto Domingo', 'maraiakeuri@mkd.com', 'BackVocal'),
        ('2026-05-03', 'Culto Domingo', 'alicesilva@mkd.com', 'BackVocal'),
        ('2026-05-03', 'Culto Domingo', 'joaovitor@mkd.com', 'BackVocal'),
        ('2026-05-03', 'Culto Domingo', 'melhorlider@mkd.com', 'Teclado'),
        ('2026-05-03', 'Culto Domingo', 'vinizoiazul@mkd.com', 'Guitarra'),
        ('2026-05-03', 'Culto Domingo', 'nilsonbateria@mkd.com', 'Bateria'),
        ('2026-05-03', 'Culto Domingo', 'danielbaixo@mkd.com', 'Baixo'),
        
        -- SÁBADO 09 e DOMINGO 10 (Equipe B-2)
        ('2026-05-09', 'Culto Sábado', 'gabisena@mkd.com', 'Vocal'),
        ('2026-05-09', 'Culto Sábado', 'mariadonilson@mkd.com', 'Vocal'),
        ('2026-05-09', 'Culto Sábado', 'alicesilva@mkd.com', 'BackVocal'),
        ('2026-05-09', 'Culto Sábado', 'jhonata@mkd.com', 'BackVocal'),
        ('2026-05-09', 'Culto Sábado', 'melhorlider@mkd.com', 'Teclado'),
        ('2026-05-09', 'Culto Sábado', 'vinizoiazul@mkd.com', 'Guitarra'),
        ('2026-05-09', 'Culto Sábado', 'isadorabatera@mkd.com', 'Bateria'),
        ('2026-05-09', 'Culto Sábado', 'ari@mkd.com', 'Baixo'),
        
        ('2026-05-10', 'Culto Domingo', 'gabisena@mkd.com', 'Vocal'),
        ('2026-05-10', 'Culto Domingo', 'mariadonilson@mkd.com', 'Vocal'),
        ('2026-05-10', 'Culto Domingo', 'alicesilva@mkd.com', 'BackVocal'),
        ('2026-05-10', 'Culto Domingo', 'jhonata@mkd.com', 'BackVocal'),
        ('2026-05-10', 'Culto Domingo', 'melhorlider@mkd.com', 'Teclado'),
        ('2026-05-10', 'Culto Domingo', 'vinizoiazul@mkd.com', 'Guitarra'),
        ('2026-05-10', 'Culto Domingo', 'isadorabatera@mkd.com', 'Bateria'),
        ('2026-05-10', 'Culto Domingo', 'ari@mkd.com', 'Baixo'),
        
        -- SÁBADO 16 e DOMINGO 17 (Equipe A-2)
        ('2026-05-16', 'Culto Sábado', 'jhonata@mkd.com', 'Vocal'),
        ('2026-05-16', 'Culto Sábado', 'lais@mkd.com', 'Vocal'),
        ('2026-05-16', 'Culto Sábado', 'tchucky@mkd.com', 'BackVocal'),
        ('2026-05-16', 'Culto Sábado', 'madu@mkd.com', 'BackVocal'),
        ('2026-05-16', 'Culto Sábado', 'melhorlider@mkd.com', 'Teclado'),
        ('2026-05-16', 'Culto Sábado', 'vinizoiazul@mkd.com', 'Guitarra'),
        ('2026-05-16', 'Culto Sábado', 'thiagobatera@mkd.com', 'Bateria'),
        ('2026-05-16', 'Culto Sábado', 'nilsonbateria@mkd.com', 'Baixo'),
        
        ('2026-05-17', 'Culto Domingo', 'jhonata@mkd.com', 'Vocal'),
        ('2026-05-17', 'Culto Domingo', 'lais@mkd.com', 'Vocal'),
        ('2026-05-17', 'Culto Domingo', 'tchucky@mkd.com', 'BackVocal'),
        ('2026-05-17', 'Culto Domingo', 'madu@mkd.com', 'BackVocal'),
        ('2026-05-17', 'Culto Domingo', 'melhorlider@mkd.com', 'Teclado'),
        ('2026-05-17', 'Culto Domingo', 'vinizoiazul@mkd.com', 'Guitarra'),
        ('2026-05-17', 'Culto Domingo', 'thiagobatera@mkd.com', 'Bateria'),
        ('2026-05-17', 'Culto Domingo', 'nilsonbateria@mkd.com', 'Baixo'),
        
        -- SÁBADO 23 e DOMINGO 24 (Equipe C-2)
        ('2026-05-23', 'Culto Sábado', 'lucas@mkd.com', 'Vocal'),
        ('2026-05-23', 'Culto Sábado', 'isabel@mkd.com', 'Vocal'),
        ('2026-05-23', 'Culto Sábado', 'maraiakeuri@mkd.com', 'BackVocal'),
        ('2026-05-23', 'Culto Sábado', 'joaovitor@mkd.com', 'BackVocal'),
        ('2026-05-23', 'Culto Sábado', 'melhorlider@mkd.com', 'Teclado'),
        ('2026-05-23', 'Culto Sábado', 'vinizoiazul@mkd.com', 'Guitarra'),
        ('2026-05-23', 'Culto Sábado', 'thiagobatera@mkd.com', 'Bateria'),
        ('2026-05-23', 'Culto Sábado', 'danielbaixo@mkd.com', 'Baixo'),
        
        ('2026-05-24', 'Culto Domingo', 'lucas@mkd.com', 'Vocal'),
        ('2026-05-24', 'Culto Domingo', 'isabel@mkd.com', 'Vocal'),
        ('2026-05-24', 'Culto Domingo', 'maraiakeuri@mkd.com', 'BackVocal'),
        ('2026-05-24', 'Culto Domingo', 'joaovitor@mkd.com', 'BackVocal'),
        ('2026-05-24', 'Culto Domingo', 'melhorlider@mkd.com', 'Teclado'),
        ('2026-05-24', 'Culto Domingo', 'vinizoiazul@mkd.com', 'Guitarra'),
        ('2026-05-24', 'Culto Domingo', 'thiagobatera@mkd.com', 'Bateria'),
        ('2026-05-24', 'Culto Domingo', 'danielbaixo@mkd.com', 'Baixo'),
        
        -- SÁBADO 30 e DOMINGO 31 (Equipe A-1)
        ('2026-05-30', 'Culto Sábado', 'tchucky@mkd.com', 'Vocal'),
        ('2026-05-30', 'Culto Sábado', 'madu@mkd.com', 'Vocal'),
        ('2026-05-30', 'Culto Sábado', 'jhonata@mkd.com', 'BackVocal'),
        ('2026-05-30', 'Culto Sábado', 'lais@mkd.com', 'BackVocal'),
        ('2026-05-30', 'Culto Sábado', 'melhorlider@mkd.com', 'Teclado'),
        ('2026-05-30', 'Culto Sábado', 'vinizoiazul@mkd.com', 'Guitarra'),
        ('2026-05-30', 'Culto Sábado', 'isadorabatera@mkd.com', 'Bateria'),
        ('2026-05-30', 'Culto Sábado', 'ari@mkd.com', 'Baixo'),
        
        ('2026-05-31', 'Culto Domingo', 'tchucky@mkd.com', 'Vocal'),
        ('2026-05-31', 'Culto Domingo', 'madu@mkd.com', 'Vocal'),
        ('2026-05-31', 'Culto Domingo', 'jhonata@mkd.com', 'BackVocal'),
        ('2026-05-31', 'Culto Domingo', 'lais@mkd.com', 'BackVocal'),
        ('2026-05-31', 'Culto Domingo', 'melhorlider@mkd.com', 'Teclado'),
        ('2026-05-31', 'Culto Domingo', 'vinizoiazul@mkd.com', 'Guitarra'),
        ('2026-05-31', 'Culto Domingo', 'isadorabatera@mkd.com', 'Bateria'),
        ('2026-05-31', 'Culto Domingo', 'ari@mkd.com', 'Baixo')
),
-- Preparar dados para inserção
functions_to_insert AS (
    SELECT DISTINCT
        sm.id as schedule_member_id,
        fm.function_id
    FROM schedule_members sm
    JOIN schedules s ON s.id = sm.schedule_id
    JOIN team_members tm ON tm.id = sm.team_member_id
    JOIN users_profile up ON up.id = tm.user_id
    JOIN member_map mm ON mm.team_member_id = tm.id AND mm.email = up.email
    JOIN escalas_maio em 
        ON em.data::date = s.date 
        AND em.titulo = s.title
        AND em.membro_email = mm.email
    JOIN function_map fm ON lower(fm.function_name) = lower(em.funcao_nome)
    WHERE s.date >= '2026-05-01' AND s.date < '2026-06-01'
      AND s.team_id IN (SELECT team_id FROM worship_team)
)
-- Inserir funções
INSERT INTO schedule_member_functions (schedule_member_id, function_id)
SELECT schedule_member_id, function_id
FROM functions_to_insert
ON CONFLICT DO NOTHING;

-- Mostrar resultado
SELECT 
    '✅ FUNÇÕES ADICIONADAS' as resultado,
    s.date as data,
    up.nome as membro,
    STRING_AGG(tf.nome, ', ' ORDER BY tf.nome) as funcoes
FROM schedules s
JOIN schedule_members sm ON sm.schedule_id = s.id
JOIN team_members tm ON tm.id = sm.team_member_id
JOIN users_profile up ON up.id = tm.user_id
LEFT JOIN schedule_member_functions smf ON smf.schedule_member_id = sm.id
LEFT JOIN team_functions tf ON tf.id = smf.function_id
WHERE s.team_id IN (
    SELECT t.id FROM teams t
    JOIN team_types tt ON tt.id = t.team_type_id
    WHERE tt.codigo = 'louvor'
)
AND s.date >= '2026-05-01' 
AND s.date < '2026-06-01'
GROUP BY s.date, up.nome
ORDER BY s.date, up.nome;
