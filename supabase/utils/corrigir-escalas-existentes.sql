-- ============================================================================
-- CORREÇÃO: ESCALAS EXISTENTES SEM MEMBROS
-- ============================================================================
-- Este script corrige os relacionamentos das escalas que perderam membros
-- após mudança de nomes dos usuários
--
-- ATENÇÃO: Execute primeiro o script de diagnóstico para entender o problema:
--   supabase/utils/diagnosticar-escalas-sem-membros.sql
-- ============================================================================

-- PASSO 1: Identificar o problema
-- As escalas têm schedule_members com team_member_id que pode estar:
-- a) Apontando para team_member inativo
-- b) Apontando para team_member com user_id inválido
-- c) Apontando para team_member que não existe mais

-- PASSO 2: Estratégia de correção
-- Não podemos "adivinhar" quem eram os membros originais
-- Precisamos que você nos diga qual era a configuração original

-- ============================================================================
-- OPÇÃO 1: LIMPAR ESCALAS ÓRFÃS (se não souber quem eram os membros)
-- ============================================================================
-- Esta opção remove schedule_members que apontam para team_members inválidos
-- USE COM CUIDADO: Isso apaga dados!

-- Descomente as linhas abaixo para executar:
/*
-- Backup antes de deletar
CREATE TABLE IF NOT EXISTS schedule_members_backup_20260506 AS 
SELECT * FROM schedule_members;

-- Deletar schedule_members órfãos
DELETE FROM schedule_member_functions
WHERE schedule_member_id IN (
    SELECT sm.id
    FROM schedule_members sm
    LEFT JOIN team_members tm ON tm.id = sm.team_member_id
    WHERE tm.id IS NULL OR NOT tm.ativo
);

DELETE FROM schedule_members sm
WHERE sm.id IN (
    SELECT sm.id
    FROM schedule_members sm
    LEFT JOIN team_members tm ON tm.id = sm.team_member_id
    WHERE tm.id IS NULL OR NOT tm.ativo
);

SELECT 'Órfãos removidos. Verifique o resultado.' as resultado;
*/

-- ============================================================================
-- OPÇÃO 2: RECRIAR TEAM_MEMBERS BASEADO EM EMAILS
-- ============================================================================
-- Esta opção tenta recriar os team_members que foram perdidos
-- usando os emails como identificador

-- Primeiro, vamos ver quais users existem mas não têm team_member
WITH worship_team AS (
    SELECT t.id as team_id
    FROM teams t
    JOIN team_types tt ON tt.id = t.team_type_id
    WHERE tt.codigo = 'louvor'
      AND t.ativo = true
    ORDER BY t.created_at
    LIMIT 1
),
users_sem_team_member AS (
    SELECT 
        up.id as user_id,
        up.nome,
        up.email,
        wt.team_id
    FROM users_profile up
    CROSS JOIN worship_team wt
    WHERE up.ativo = true
      AND up.email IN (
          'tchucky@mkd.com',
          'madu@mkd.com',
          'jhonata@mkd.com',
          'lais@mkd.com',
          'alicesilva@mkd.com',
          'gabisena@mkd.com',
          'mariadonilson@mkd.com',
          'maralakeuri@mkd.com',
          'joaovitor@mkd.com',
          'lucas@mkd.com',
          'isabel@mkd.com',
          'melhorlider@mkd.com',
          'vinizoiazul@mkd.com',
          'nilsonbateria@mkd.com',
          'danielbaixo@mkd.com',
          'ari@mkd.com',
          'isadorabatera@mkd.com',
          'thiagobatera@mkd.com',
          'thalitadanca@mkd.com'
      )
      AND NOT EXISTS (
          SELECT 1 FROM team_members tm
          WHERE tm.user_id = up.id
            AND tm.team_id = wt.team_id
            AND tm.ativo = true
      )
)
-- Inserir team_members faltantes
INSERT INTO team_members (team_id, user_id, ativo)
SELECT team_id, user_id, true
FROM users_sem_team_member
ON CONFLICT DO NOTHING;

-- Mostrar resultado
SELECT 
    '=== TEAM_MEMBERS CRIADOS ===' as secao,
    up.nome,
    up.email,
    tm.id as team_member_id,
    '✅ Criado' as status
FROM team_members tm
JOIN users_profile up ON up.id = tm.user_id
WHERE tm.team_id IN (
    SELECT t.id FROM teams t
    JOIN team_types tt ON tt.id = t.team_type_id
    WHERE tt.codigo = 'louvor'
)
AND tm.created_at > NOW() - INTERVAL '1 minute'
ORDER BY up.nome;

-- ============================================================================
-- OPÇÃO 3: ATUALIZAR SCHEDULE_MEMBERS ÓRFÃOS PARA NOVOS TEAM_MEMBERS
-- ============================================================================
-- Esta opção tenta mapear schedule_members órfãos para os novos team_members
-- baseado em emails

-- ATENÇÃO: Isso só funciona se você souber qual email corresponde a qual
-- schedule_member órfão. Como não temos essa informação, esta opção
-- requer intervenção manual.

-- Exemplo de como fazer manualmente:
/*
-- 1. Identificar schedule_member órfão
SELECT sm.id, sm.schedule_id, s.date, s.title
FROM schedule_members sm
JOIN schedules s ON s.id = sm.schedule_id
LEFT JOIN team_members tm ON tm.id = sm.team_member_id
WHERE tm.id IS NULL
LIMIT 1;

-- 2. Identificar o novo team_member correto (por email)
SELECT tm.id, up.nome, up.email
FROM team_members tm
JOIN users_profile up ON up.id = tm.user_id
WHERE up.email = 'EMAIL-DO-MEMBRO-CORRETO@mkd.com'
  AND tm.team_id IN (
      SELECT t.id FROM teams t
      JOIN team_types tt ON tt.id = t.team_type_id
      WHERE tt.codigo = 'louvor'
  );

-- 3. Atualizar o schedule_member
UPDATE schedule_members
SET team_member_id = 'NOVO-TEAM-MEMBER-ID'
WHERE id = 'SCHEDULE-MEMBER-ID-ORFAO';
*/

-- ============================================================================
-- VERIFICAÇÃO FINAL
-- ============================================================================
SELECT 
    '=== VERIFICAÇÃO FINAL ===' as secao,
    s.date as data_escala,
    s.title as titulo,
    COUNT(sm.id) as total_membros,
    COUNT(CASE WHEN tm.id IS NOT NULL AND tm.ativo THEN 1 END) as membros_validos,
    COUNT(CASE WHEN tm.id IS NULL OR NOT tm.ativo THEN 1 END) as membros_orfaos
FROM schedules s
LEFT JOIN schedule_members sm ON sm.schedule_id = s.id
LEFT JOIN team_members tm ON tm.id = sm.team_member_id
WHERE s.team_id IN (
    SELECT t.id FROM teams t
    JOIN team_types tt ON tt.id = t.team_type_id
    WHERE tt.codigo = 'louvor'
)
GROUP BY s.id, s.date, s.title
ORDER BY s.date DESC
LIMIT 20;
