-- ============================================
-- VERIFICAR ESCALAS DE LOUVOR
-- ============================================

-- PASSO 1: Encontrar o ID da equipe de Louvor
SELECT 
  '=== EQUIPE DE LOUVOR ===' as secao,
  id,
  nome,
  team_type_id
FROM teams 
WHERE nome ILIKE '%louvor%'
ORDER BY nome;

-- PASSO 2: Ver TODAS as escalas (qualquer mês)
SELECT 
  '=== TODAS AS ESCALAS ===' as secao,
  s.id,
  s.date as data,
  s.title as titulo,
  t.nome as equipe,
  s.status,
  s.created_at
FROM schedules s
JOIN teams t ON s.team_id = t.id
WHERE t.nome ILIKE '%louvor%'
ORDER BY s.date DESC
LIMIT 20;

-- PASSO 3: Contar escalas por mês
SELECT 
  '=== ESCALAS POR MÊS ===' as secao,
  TO_CHAR(date, 'YYYY-MM') as mes,
  COUNT(*) as total,
  MIN(date) as primeira_data,
  MAX(date) as ultima_data
FROM schedules s
JOIN teams t ON s.team_id = t.id
WHERE t.nome ILIKE '%louvor%'
GROUP BY TO_CHAR(date, 'YYYY-MM')
ORDER BY mes DESC;

-- PASSO 4: Ver escalas de Maio/2026 especificamente
SELECT 
  '=== MAIO 2026 ===' as secao,
  date as data,
  title as titulo,
  EXTRACT(DAY FROM date) as dia,
  status,
  notes as observacoes
FROM schedules s
JOIN teams t ON s.team_id = t.id
WHERE t.nome ILIKE '%louvor%'
  AND date >= '2026-05-01'
  AND date < '2026-06-01'
ORDER BY date;

-- PASSO 5: Ver escalas de Junho/2026 especificamente
SELECT 
  '=== JUNHO 2026 ===' as secao,
  date as data,
  title as titulo,
  EXTRACT(DAY FROM date) as dia,
  status,
  notes as observacoes
FROM schedules s
JOIN teams t ON s.team_id = t.id
WHERE t.nome ILIKE '%louvor%'
  AND date >= '2026-06-01'
  AND date < '2026-07-01'
ORDER BY date;

-- PASSO 6: Identificar qual equipe foi usada em cada escala
SELECT 
  '=== IDENTIFICAÇÃO DAS EQUIPES ===' as secao,
  date as data,
  title as titulo,
  CASE 
    WHEN title ILIKE '%X%' OR title ILIKE '%equipe x%' THEN 'X'
    WHEN title ILIKE '%A-1%' OR title ILIKE '%A1%' THEN 'A-1'
    WHEN title ILIKE '%B-1%' OR title ILIKE '%B1%' THEN 'B-1'
    WHEN title ILIKE '%C-1%' OR title ILIKE '%C1%' THEN 'C-1'
    WHEN title ILIKE '%A-2%' OR title ILIKE '%A2%' THEN 'A-2'
    WHEN title ILIKE '%B-2%' OR title ILIKE '%B2%' THEN 'B-2'
    WHEN title ILIKE '%C-2%' OR title ILIKE '%C2%' THEN 'C-2'
    ELSE 'DESCONHECIDO'
  END as equipe_identificada
FROM schedules s
JOIN teams t ON s.team_id = t.id
WHERE t.nome ILIKE '%louvor%'
  AND date >= '2026-05-01'
  AND date < '2026-07-01'
ORDER BY date;
