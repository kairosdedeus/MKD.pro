-- ============================================
-- VALIDAR SEQUÊNCIA DE RODÍZIO
-- ============================================
-- Este script valida se a sequência de rodízio
-- está correta e respeitando o histórico
-- ============================================

-- PASSO 1: Ver últimas escalas de Maio
SELECT 
  '=== ESCALAS DE MAIO ===' as secao,
  date as data,
  title as titulo,
  EXTRACT(DAY FROM date) as dia,
  CASE 
    WHEN title LIKE '%Equipe X%' THEN 'X'
    WHEN title LIKE '%Equipe A-1%' THEN 'A-1'
    WHEN title LIKE '%Equipe B-1%' THEN 'B-1'
    WHEN title LIKE '%Equipe C-1%' THEN 'C-1'
    WHEN title LIKE '%Equipe A-2%' THEN 'A-2'
    WHEN title LIKE '%Equipe B-2%' THEN 'B-2'
    WHEN title LIKE '%Equipe C-2%' THEN 'C-2'
    ELSE 'DESCONHECIDO'
  END as equipe
FROM schedules
WHERE team_id IN (
  SELECT id FROM teams WHERE nome LIKE '%Louvor%' LIMIT 1
)
  AND date >= '2026-05-01'
  AND date < '2026-06-01'
ORDER BY date;

-- PASSO 2: Ver escalas de Junho
SELECT 
  '=== ESCALAS DE JUNHO ===' as secao,
  date as data,
  title as titulo,
  EXTRACT(DAY FROM date) as dia,
  CASE 
    WHEN title LIKE '%Equipe X%' THEN 'X'
    WHEN title LIKE '%Equipe A-1%' THEN 'A-1'
    WHEN title LIKE '%Equipe B-1%' THEN 'B-1'
    WHEN title LIKE '%Equipe C-1%' THEN 'C-1'
    WHEN title LIKE '%Equipe A-2%' THEN 'A-2'
    WHEN title LIKE '%Equipe B-2%' THEN 'B-2'
    WHEN title LIKE '%Equipe C-2%' THEN 'C-2'
    ELSE 'DESCONHECIDO'
  END as equipe
FROM schedules
WHERE team_id IN (
  SELECT id FROM teams WHERE nome LIKE '%Louvor%' LIMIT 1
)
  AND date >= '2026-06-01'
  AND date < '2026-07-01'
ORDER BY date;

-- PASSO 3: Validar sequência completa (Maio + Junho)
WITH escalas_ordenadas AS (
  SELECT 
    date,
    title,
    EXTRACT(MONTH FROM date) as mes,
    EXTRACT(DAY FROM date) as dia,
    CASE 
      WHEN title LIKE '%Equipe X%' THEN 'X'
      WHEN title LIKE '%Equipe A-1%' THEN 'A-1'
      WHEN title LIKE '%Equipe B-1%' THEN 'B-1'
      WHEN title LIKE '%Equipe C-1%' THEN 'C-1'
      WHEN title LIKE '%Equipe A-2%' THEN 'A-2'
      WHEN title LIKE '%Equipe B-2%' THEN 'B-2'
      WHEN title LIKE '%Equipe C-2%' THEN 'C-2'
      ELSE 'DESCONHECIDO'
    END as equipe,
    LAG(
      CASE 
        WHEN title LIKE '%Equipe X%' THEN 'X'
        WHEN title LIKE '%Equipe A-1%' THEN 'A-1'
        WHEN title LIKE '%Equipe B-1%' THEN 'B-1'
        WHEN title LIKE '%Equipe C-1%' THEN 'C-1'
        WHEN title LIKE '%Equipe A-2%' THEN 'A-2'
        WHEN title LIKE '%Equipe B-2%' THEN 'B-2'
        WHEN title LIKE '%Equipe C-2%' THEN 'C-2'
        ELSE 'DESCONHECIDO'
      END
    ) OVER (ORDER BY date) as equipe_anterior
  FROM schedules
  WHERE team_id IN (
    SELECT id FROM teams WHERE nome LIKE '%Louvor%' LIMIT 1
  )
    AND date >= '2026-05-01'
    AND date < '2026-07-01'
  ORDER BY date
)
SELECT 
  '=== VALIDAÇÃO DA SEQUÊNCIA ===' as secao,
  date as data,
  CASE mes WHEN 5 THEN 'Maio' WHEN 6 THEN 'Junho' END as mes,
  dia,
  equipe,
  equipe_anterior,
  CASE 
    -- Validações para 1º final de semana
    WHEN dia <= 7 AND equipe != 'X' THEN '❌ Deveria ser X (1º final de semana)'
    WHEN dia <= 7 AND equipe = 'X' THEN '✅ OK - Equipe X no 1º final de semana'
    
    -- Validações para demais finais de semana
    WHEN dia > 7 AND equipe = 'X' THEN '❌ Equipe X fora do 1º final de semana'
    WHEN dia > 7 AND equipe = equipe_anterior AND equipe_anterior != 'X' THEN '❌ Equipe repetida consecutivamente'
    
    -- Validação de continuidade entre meses
    WHEN mes = 6 AND dia > 7 AND dia <= 14 AND equipe_anterior = 'X' THEN 
      CASE
        -- Se a última de maio foi A-1, a primeira de junho (após X) deve ser B-1
        WHEN (SELECT CASE 
                WHEN title LIKE '%Equipe A-1%' THEN 'A-1'
                WHEN title LIKE '%Equipe B-1%' THEN 'B-1'
                WHEN title LIKE '%Equipe C-1%' THEN 'C-1'
                WHEN title LIKE '%Equipe A-2%' THEN 'A-2'
                WHEN title LIKE '%Equipe B-2%' THEN 'B-2'
                WHEN title LIKE '%Equipe C-2%' THEN 'C-2'
              END
              FROM schedules 
              WHERE team_id IN (SELECT id FROM teams WHERE nome LIKE '%Louvor%' LIMIT 1)
                AND date >= '2026-05-01' 
                AND date < '2026-06-01'
              ORDER BY date DESC 
              LIMIT 1) = 'A-1' AND equipe = 'B-1' THEN '✅ OK - Continuou de A-1 (maio)'
        WHEN (SELECT CASE 
                WHEN title LIKE '%Equipe B-1%' THEN 'B-1'
                WHEN title LIKE '%Equipe C-1%' THEN 'C-1'
                WHEN title LIKE '%Equipe A-2%' THEN 'A-2'
                WHEN title LIKE '%Equipe B-2%' THEN 'B-2'
                WHEN title LIKE '%Equipe C-2%' THEN 'C-2'
                WHEN title LIKE '%Equipe A-1%' THEN 'A-1'
              END
              FROM schedules 
              WHERE team_id IN (SELECT id FROM teams WHERE nome LIKE '%Louvor%' LIMIT 1)
                AND date >= '2026-05-01' 
                AND date < '2026-06-01'
              ORDER BY date DESC 
              LIMIT 1) = 'B-1' AND equipe = 'C-1' THEN '✅ OK - Continuou de B-1 (maio)'
        ELSE '⚠️ Verificar continuidade do histórico'
      END
    
    ELSE '✅ OK - Sequência normal'
  END as validacao
FROM escalas_ordenadas
ORDER BY date;

-- PASSO 4: Resumo da validação
SELECT 
  '=== RESUMO ===' as secao,
  COUNT(*) as total_escalas,
  COUNT(CASE WHEN EXTRACT(MONTH FROM date) = 5 THEN 1 END) as escalas_maio,
  COUNT(CASE WHEN EXTRACT(MONTH FROM date) = 6 THEN 1 END) as escalas_junho,
  COUNT(CASE WHEN title LIKE '%Equipe X%' THEN 1 END) as vezes_equipe_x,
  (SELECT CASE 
    WHEN title LIKE '%Equipe X%' THEN 'X'
    WHEN title LIKE '%Equipe A-1%' THEN 'A-1'
    WHEN title LIKE '%Equipe B-1%' THEN 'B-1'
    WHEN title LIKE '%Equipe C-1%' THEN 'C-1'
    WHEN title LIKE '%Equipe A-2%' THEN 'A-2'
    WHEN title LIKE '%Equipe B-2%' THEN 'B-2'
    WHEN title LIKE '%Equipe C-2%' THEN 'C-2'
  END
  FROM schedules 
  WHERE team_id IN (SELECT id FROM teams WHERE nome LIKE '%Louvor%' LIMIT 1)
    AND date >= '2026-05-01' 
    AND date < '2026-06-01'
  ORDER BY date DESC 
  LIMIT 1) as ultima_equipe_maio,
  (SELECT CASE 
    WHEN title LIKE '%Equipe X%' THEN 'X'
    WHEN title LIKE '%Equipe A-1%' THEN 'A-1'
    WHEN title LIKE '%Equipe B-1%' THEN 'B-1'
    WHEN title LIKE '%Equipe C-1%' THEN 'C-1'
    WHEN title LIKE '%Equipe A-2%' THEN 'A-2'
    WHEN title LIKE '%Equipe B-2%' THEN 'B-2'
    WHEN title LIKE '%Equipe C-2%' THEN 'C-2'
  END
  FROM schedules 
  WHERE team_id IN (SELECT id FROM teams WHERE nome LIKE '%Louvor%' LIMIT 1)
    AND date >= '2026-06-01' 
    AND date < '2026-07-01'
    AND EXTRACT(DAY FROM date) > 7
  ORDER BY date 
  LIMIT 1) as primeira_equipe_junho_apos_x
FROM schedules
WHERE team_id IN (
  SELECT id FROM teams WHERE nome LIKE '%Louvor%' LIMIT 1
)
  AND date >= '2026-05-01'
  AND date < '2026-07-01';
