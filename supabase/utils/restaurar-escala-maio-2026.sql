-- ============================================================================
-- RESTAURAR ESCALA DE MAIO/2026
-- ============================================================================
-- Este script restaura a escala de maio/2026 com os membros corretos
-- usando emails como identificador único
-- ============================================================================

-- PASSO 1: Obter IDs necessários
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
-- ============================================================================
-- DEFINIÇÃO DAS ESCALAS DE MAIO/2026
-- ============================================================================
escalas_maio(data, titulo, membro_email, funcao_nome) AS (
    VALUES
        -- SÁBADO 02 e DOMINGO 03 (Equipe X)
        ('2026-05-02', 'Culto Sábado', 'melhorlider@mkd.com', 'Vocal'),      -- Michael
        ('2026-05-02', 'Culto Sábado', 'vinizoiazul@mkd.com', 'Vocal'),      -- Vinicius
        ('2026-05-02', 'Culto Sábado', 'maralakeuri@mkd.com', 'BackVocal'),  -- Wallesca
        ('2026-05-02', 'Culto Sábado', 'alicesilva@mkd.com', 'BackVocal'),   -- Alice
        ('2026-05-02', 'Culto Sábado', 'joaovitor@mkd.com', 'BackVocal'),    -- João
        ('2026-05-02', 'Culto Sábado', 'melhorlider@mkd.com', 'Teclado'),    -- Michael
        ('2026-05-02', 'Culto Sábado', 'vinizoiazul@mkd.com', 'Guitarra'),   -- Vinicius
        ('2026-05-02', 'Culto Sábado', 'nilsonbateria@mkd.com', 'Bateria'),  -- Nilson
        ('2026-05-02', 'Culto Sábado', 'danielbaixo@mkd.com', 'Baixo'),      -- Daniel
        
        ('2026-05-03', 'Culto Domingo', 'melhorlider@mkd.com', 'Vocal'),
        ('2026-05-03', 'Culto Domingo', 'vinizoiazul@mkd.com', 'Vocal'),
        ('2026-05-03', 'Culto Domingo', 'maralakeuri@mkd.com', 'BackVocal'),
        ('2026-05-03', 'Culto Domingo', 'alicesilva@mkd.com', 'BackVocal'),
        ('2026-05-03', 'Culto Domingo', 'joaovitor@mkd.com', 'BackVocal'),
        ('2026-05-03', 'Culto Domingo', 'melhorlider@mkd.com', 'Teclado'),
        ('2026-05-03', 'Culto Domingo', 'vinizoiazul@mkd.com', 'Guitarra'),
        ('2026-05-03', 'Culto Domingo', 'nilsonbateria@mkd.com', 'Bateria'),
        ('2026-05-03', 'Culto Domingo', 'danielbaixo@mkd.com', 'Baixo'),
        
        -- SÁBADO 09 e DOMINGO 10 (Equipe B-2)
        ('2026-05-09', 'Culto Sábado', 'gabisena@mkd.com', 'Vocal'),         -- Gabriela
        ('2026-05-09', 'Culto Sábado', 'mariadonilson@mkd.com', 'Vocal'),    -- Maria
        ('2026-05-09', 'Culto Sábado', 'alicesilva@mkd.com', 'BackVocal'),   -- Alice
        ('2026-05-09', 'Culto Sábado', 'jhonata@mkd.com', 'BackVocal'),      -- Jhonata
        ('2026-05-09', 'Culto Sábado', 'melhorlider@mkd.com', 'Teclado'),    -- Michael
        ('2026-05-09', 'Culto Sábado', 'vinizoiazul@mkd.com', 'Guitarra'),   -- Vinicius
        ('2026-05-09', 'Culto Sábado', 'isadorabatera@mkd.com', 'Bateria'),  -- Isadora
        ('2026-05-09', 'Culto Sábado', 'ari@mkd.com', 'Baixo'),              -- Ari
        
        ('2026-05-10', 'Culto Domingo', 'gabisena@mkd.com', 'Vocal'),
        ('2026-05-10', 'Culto Domingo', 'mariadonilson@mkd.com', 'Vocal'),
        ('2026-05-10', 'Culto Domingo', 'alicesilva@mkd.com', 'BackVocal'),
        ('2026-05-10', 'Culto Domingo', 'jhonata@mkd.com', 'BackVocal'),
        ('2026-05-10', 'Culto Domingo', 'melhorlider@mkd.com', 'Teclado'),
        ('2026-05-10', 'Culto Domingo', 'vinizoiazul@mkd.com', 'Guitarra'),
        ('2026-05-10', 'Culto Domingo', 'isadorabatera@mkd.com', 'Bateria'),
        ('2026-05-10', 'Culto Domingo', 'ari@mkd.com', 'Baixo'),
        
        -- SÁBADO 16 e DOMINGO 17 (Equipe A-2)
        ('2026-05-16', 'Culto Sábado', 'jhonata@mkd.com', 'Vocal'),          -- Jhonata
        ('2026-05-16', 'Culto Sábado', 'lais@mkd.com', 'Vocal'),             -- Lais
        ('2026-05-16', 'Culto Sábado', 'tchucky@mkd.com', 'BackVocal'),      -- Tchucky
        ('2026-05-16', 'Culto Sábado', 'madu@mkd.com', 'BackVocal'),         -- Madu
        ('2026-05-16', 'Culto Sábado', 'melhorlider@mkd.com', 'Teclado'),    -- Michael
        ('2026-05-16', 'Culto Sábado', 'vinizoiazul@mkd.com', 'Guitarra'),   -- Vinicius
        ('2026-05-16', 'Culto Sábado', 'thiagobatera@mkd.com', 'Bateria'),   -- Thiago
        ('2026-05-16', 'Culto Sábado', 'nilsonbateria@mkd.com', 'Baixo'),    -- Nilson
        
        ('2026-05-17', 'Culto Domingo', 'jhonata@mkd.com', 'Vocal'),
        ('2026-05-17', 'Culto Domingo', 'lais@mkd.com', 'Vocal'),
        ('2026-05-17', 'Culto Domingo', 'tchucky@mkd.com', 'BackVocal'),
        ('2026-05-17', 'Culto Domingo', 'madu@mkd.com', 'BackVocal'),
        ('2026-05-17', 'Culto Domingo', 'melhorlider@mkd.com', 'Teclado'),
        ('2026-05-17', 'Culto Domingo', 'vinizoiazul@mkd.com', 'Guitarra'),
        ('2026-05-17', 'Culto Domingo', 'thiagobatera@mkd.com', 'Bateria'),
        ('2026-05-17', 'Culto Domingo', 'nilsonbateria@mkd.com', 'Baixo'),
        
        -- SÁBADO 23 e DOMINGO 24 (Equipe C-2)
        ('2026-05-23', 'Culto Sábado', 'lucas@mkd.com', 'Vocal'),            -- Lucas
        ('2026-05-23', 'Culto Sábado', 'isabel@mkd.com', 'Vocal'),           -- Isabel
        ('2026-05-23', 'Culto Sábado', 'maralakeuri@mkd.com', 'BackVocal'),  -- Wallesca
        ('2026-05-23', 'Culto Sábado', 'joaovitor@mkd.com', 'BackVocal'),    -- João
        ('2026-05-23', 'Culto Sábado', 'melhorlider@mkd.com', 'Teclado'),    -- Michael
        ('2026-05-23', 'Culto Sábado', 'vinizoiazul@mkd.com', 'Guitarra'),   -- Vinicius
        ('2026-05-23', 'Culto Sábado', 'thiagobatera@mkd.com', 'Bateria'),   -- Thiago
        ('2026-05-23', 'Culto Sábado', 'danielbaixo@mkd.com', 'Baixo'),      -- Daniel
        
        ('2026-05-24', 'Culto Domingo', 'lucas@mkd.com', 'Vocal'),
        ('2026-05-24', 'Culto Domingo', 'isabel@mkd.com', 'Vocal'),
        ('2026-05-24', 'Culto Domingo', 'maralakeuri@mkd.com', 'BackVocal'),
        ('2026-05-24', 'Culto Domingo', 'joaovitor@mkd.com', 'BackVocal'),
        ('2026-05-24', 'Culto Domingo', 'melhorlider@mkd.com', 'Teclado'),
        ('2026-05-24', 'Culto Domingo', 'vinizoiazul@mkd.com', 'Guitarra'),
        ('2026-05-24', 'Culto Domingo', 'thiagobatera@mkd.com', 'Bateria'),
        ('2026-05-24', 'Culto Domingo', 'danielbaixo@mkd.com', 'Baixo'),
        
        -- SÁBADO 30 e DOMINGO 31 (Equipe A-1)
        ('2026-05-30', 'Culto Sábado', 'tchucky@mkd.com', 'Vocal'),          -- Tchucky
        ('2026-05-30', 'Culto Sábado', 'madu@mkd.com', 'Vocal'),             -- Madu
        ('2026-05-30', 'Culto Sábado', 'jhonata@mkd.com', 'BackVocal'),      -- Jhonata
        ('2026-05-30', 'Culto Sábado', 'lais@mkd.com', 'BackVocal'),         -- Lais
        ('2026-05-30', 'Culto Sábado', 'melhorlider@mkd.com', 'Teclado'),    -- Michael
        ('2026-05-30', 'Culto Sábado', 'vinizoiazul@mkd.com', 'Guitarra'),   -- Vinicius
        ('2026-05-30', 'Culto Sábado', 'isadorabatera@mkd.com', 'Bateria'),  -- Isadora
        ('2026-05-30', 'Culto Sábado', 'ari@mkd.com', 'Baixo'),              -- Ari
        
        ('2026-05-31', 'Culto Domingo', 'tchucky@mkd.com', 'Vocal'),
        ('2026-05-31', 'Culto Domingo', 'madu@mkd.com', 'Vocal'),
        ('2026-05-31', 'Culto Domingo', 'jhonata@mkd.com', 'BackVocal'),
        ('2026-05-31', 'Culto Domingo', 'lais@mkd.com', 'BackVocal'),
        ('2026-05-31', 'Culto Domingo', 'melhorlider@mkd.com', 'Teclado'),
        ('2026-05-31', 'Culto Domingo', 'vinizoiazul@mkd.com', 'Guitarra'),
        ('2026-05-31', 'Culto Domingo', 'isadorabatera@mkd.com', 'Bateria'),
        ('2026-05-31', 'Culto Domingo', 'ari@mkd.com', 'Baixo')
),
-- ============================================================================
-- LIMPAR ESCALAS ANTIGAS DE MAIO/2026
-- ============================================================================
cleanup_old AS (
    DELETE FROM schedule_member_functions
    WHERE schedule_member_id IN (
        SELECT sm.id
        FROM schedule_members sm
        JOIN schedules s ON s.id = sm.schedule_id
        WHERE s.date >= '2026-05-01' AND s.date < '2026-06-01'
          AND s.team_id IN (SELECT team_id FROM worship_team)
    )
    RETURNING schedule_member_id
),
cleanup_members AS (
    DELETE FROM schedule_members
    WHERE schedule_id IN (
        SELECT id FROM schedules
        WHERE date >= '2026-05-01' AND date < '2026-06-01'
          AND team_id IN (SELECT team_id FROM worship_team)
    )
    RETURNING schedule_id
),
cleanup_songs AS (
    DELETE FROM schedule_songs
    WHERE schedule_id IN (
        SELECT id FROM schedules
        WHERE date >= '2026-05-01' AND date < '2026-06-01'
          AND team_id IN (SELECT team_id FROM worship_team)
    )
    RETURNING schedule_id
),
cleanup_schedules AS (
    DELETE FROM schedules
    WHERE date >= '2026-05-01' AND date < '2026-06-01'
      AND team_id IN (SELECT team_id FROM worship_team)
    RETURNING id
),
-- ============================================================================
-- CRIAR ESCALAS
-- ============================================================================
new_schedules AS (
    INSERT INTO schedules (team_id, date, title, status, created_by)
    SELECT DISTINCT
        wt.team_id,
        em.data::date,
        em.titulo,
        'published',
        (SELECT id FROM users_profile WHERE email = 'melhorlider@mkd.com' LIMIT 1)
    FROM escalas_maio em
    CROSS JOIN worship_team wt
    ON CONFLICT DO NOTHING
    RETURNING id, date, title
),
-- ============================================================================
-- ADICIONAR MEMBROS ÀS ESCALAS
-- ============================================================================
new_schedule_members AS (
    INSERT INTO schedule_members (schedule_id, team_member_id)
    SELECT DISTINCT
        ns.id as schedule_id,
        mm.team_member_id
    FROM new_schedules ns
    JOIN escalas_maio em ON em.data::date = ns.date AND em.titulo = ns.title
    JOIN member_map mm ON mm.email = em.membro_email
    ON CONFLICT DO NOTHING
    RETURNING id, schedule_id, team_member_id
),
-- ============================================================================
-- ADICIONAR FUNÇÕES DOS MEMBROS
-- ============================================================================
INSERT INTO schedule_member_functions (schedule_member_id, function_id)
SELECT DISTINCT
    sm.id as schedule_member_id,
    fm.function_id
FROM schedule_members sm
JOIN schedules s ON s.id = sm.schedule_id
JOIN team_members tm ON tm.id = sm.team_member_id
JOIN users_profile up ON up.id = tm.user_id
JOIN member_map mm ON mm.team_member_id = tm.id
JOIN escalas_maio em 
    ON em.data::date = s.date 
    AND em.titulo = s.title
    AND em.membro_email = mm.email
JOIN function_map fm ON lower(fm.function_name) = lower(em.funcao_nome)
WHERE s.date >= '2026-05-01' AND s.date < '2026-06-01'
  AND s.team_id IN (SELECT team_id FROM worship_team)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- RESULTADO: Mostrar escalas criadas
-- ============================================================================
SELECT 
    '✅ ESCALAS DE MAIO/2026 RESTAURADAS' as resultado,
    s.date as data,
    s.title as titulo,
    COUNT(DISTINCT sm.id) as total_membros,
    STRING_AGG(DISTINCT up.nome, ', ' ORDER BY up.nome) as membros
FROM schedules s
LEFT JOIN schedule_members sm ON sm.schedule_id = s.id
LEFT JOIN team_members tm ON tm.id = sm.team_member_id
LEFT JOIN users_profile up ON up.id = tm.user_id
WHERE s.date >= '2026-05-01' AND s.date < '2026-06-01'
  AND s.team_id IN (
      SELECT t.id FROM teams t
      JOIN team_types tt ON tt.id = t.team_type_id
      WHERE tt.codigo = 'louvor'
  )
GROUP BY s.id, s.date, s.title
ORDER BY s.date;
