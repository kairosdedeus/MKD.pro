-- ============================================================================
-- ⚠️ ATENÇÃO: ESTE SCRIPT ESTÁ DEPRECADO
-- ============================================================================
-- Este script usa matching por NOME em vez de IDs, o que causa problemas
-- quando usuários mudam seus nomes. O relacionamento é perdido e os membros
-- não aparecem mais nas escalas.
--
-- 🔴 PROBLEMA: Linhas 87-93 usam LIKE e unaccent() para match por nome
-- ✅ SOLUÇÃO: Use o novo script que trabalha com IDs
--
-- NOVO SCRIPT: supabase/utils/atualizar-equipes-fixas-louvor-por-id.sql
-- DOCUMENTAÇÃO: docs/PROBLEMA_RELACIONAMENTO_POR_NOME.md
-- SCRIPT AUXILIAR: supabase/utils/obter-ids-para-equipes-fixas.sql
--
-- ============================================================================
-- Atualiza as equipes fixas do Louvor com os membros corretos
-- Execute este script após ter criado os usuários no sistema

WITH worship_team AS (
    SELECT t.id
    FROM teams t
    JOIN team_types tt ON tt.id = t.team_type_id
    WHERE tt.codigo = 'louvor'
      AND t.ativo = true
    ORDER BY t.created_at
    LIMIT 1
),
-- Limpar membros antigos das equipes fixas
cleanup AS (
    DELETE FROM worship_fixed_team_members
    WHERE preset_id IN (
        SELECT wft.id
        FROM worship_fixed_teams wft
        JOIN worship_team wt ON wft.team_id = wt.id
    )
    RETURNING preset_id
),
-- Definir os membros corretos de cada equipe
official_members(preset_name, member_name, function_name, sort_order) AS (
    VALUES
        -- EQUIPE A-1
        ('Equipe A-1', 'Tchucky Okama', 'Vocal', 1),
        ('Equipe A-1', 'Madu Cantora', 'Vocal', 2),
        ('Equipe A-1', 'Jhonata Cantor', 'BackVocal', 3),
        ('Equipe A-1', 'Lais Cantora', 'BackVocal', 4),
        
        -- EQUIPE A-2
        ('Equipe A-2', 'Jhonata Cantor', 'Vocal', 1),
        ('Equipe A-2', 'Lais Cantora', 'Vocal', 2),
        ('Equipe A-2', 'Tchucky Okama', 'BackVocal', 3),
        ('Equipe A-2', 'Madu Cantora', 'BackVocal', 4),
        
        -- EQUIPE B-1
        ('Equipe B-1', 'Alice Cantora', 'Vocal', 1),
        ('Equipe B-1', 'Jhonata Cantor', 'Vocal', 2),
        ('Equipe B-1', 'Gabriela Sena', 'BackVocal', 3),
        ('Equipe B-1', 'Maria Cantora', 'BackVocal', 4),
        
        -- EQUIPE B-2
        ('Equipe B-2', 'Gabriela Sena', 'Vocal', 1),
        ('Equipe B-2', 'Maria Cantora', 'Vocal', 2),
        ('Equipe B-2', 'Alice Cantora', 'BackVocal', 3),
        ('Equipe B-2', 'Jhonata Cantor', 'BackVocal', 4),
        
        -- EQUIPE C-1
        ('Equipe C-1', 'Wallesca cantora', 'Vocal', 1),
        ('Equipe C-1', 'João Cantor', 'Vocal', 2),
        ('Equipe C-1', 'Lucas Tchucky', 'BackVocal', 3),
        ('Equipe C-1', 'Isabel Cabrera', 'BackVocal', 4),
        
        -- EQUIPE C-2
        ('Equipe C-2', 'Lucas Tchucky', 'Vocal', 1),
        ('Equipe C-2', 'Isabel Cabrera', 'Vocal', 2),
        ('Equipe C-2', 'Wallesca cantora', 'BackVocal', 3),
        ('Equipe C-2', 'João Cantor', 'BackVocal', 4),
        
        -- EQUIPE X (primeira semana do mês)
        ('Equipe X', 'Michael Cabrera', 'Vocal', 1),
        ('Equipe X', 'Vinicius Guitarra', 'Vocal', 2),
        ('Equipe X', 'João Cantor', 'BackVocal', 3),
        ('Equipe X', 'Wallesca cantora', 'BackVocal', 4),
        ('Equipe X', 'Alice Cantora', 'BackVocal', 5)
),
-- Fazer o match dos membros com os usuários cadastrados
matched AS (
    SELECT
        wft.id AS preset_id,
        tm.id AS team_member_id,
        tf.id AS function_id,
        om.sort_order
    FROM official_members om
    JOIN worship_team wt ON true
    JOIN worship_fixed_teams wft
      ON wft.team_id = wt.id
     AND wft.nome = om.preset_name
    JOIN team_members tm
      ON tm.team_id = wt.id
     AND tm.ativo = true
    JOIN users_profile up
      ON up.id = tm.user_id
     AND (
        lower(unaccent(up.nome)) = lower(unaccent(om.member_name))
        OR lower(unaccent(up.nome)) LIKE '%' || lower(unaccent(om.member_name)) || '%'
        OR lower(unaccent(om.member_name)) LIKE '%' || lower(unaccent(up.nome)) || '%'
     )
    JOIN team_functions tf
      ON tf.team_type_id = (SELECT team_type_id FROM teams WHERE id = wt.id)
     AND lower(unaccent(tf.nome)) = lower(unaccent(om.function_name))
)
-- Inserir os membros nas equipes fixas
INSERT INTO worship_fixed_team_members (preset_id, team_member_id, function_id, sort_order)
SELECT preset_id, team_member_id, function_id, sort_order
FROM matched
ON CONFLICT (preset_id, team_member_id, function_id) DO NOTHING;

-- Mostrar o resultado final
SELECT
    wft.nome AS equipe_fixa,
    up.nome AS membro,
    tf.nome AS funcao,
    wftm.sort_order AS ordem
FROM worship_fixed_teams wft
LEFT JOIN worship_fixed_team_members wftm ON wftm.preset_id = wft.id
LEFT JOIN team_members tm ON tm.id = wftm.team_member_id
LEFT JOIN users_profile up ON up.id = tm.user_id
LEFT JOIN team_functions tf ON tf.id = wftm.function_id
WHERE wft.team_id = (
    SELECT t.id
    FROM teams t
    JOIN team_types tt ON tt.id = t.team_type_id
    WHERE tt.codigo = 'louvor'
      AND t.ativo = true
    ORDER BY t.created_at
    LIMIT 1
)
ORDER BY 
    CASE wft.nome
        WHEN 'Equipe X' THEN 0
        WHEN 'Equipe A-1' THEN 1
        WHEN 'Equipe A-2' THEN 2
        WHEN 'Equipe B-1' THEN 3
        WHEN 'Equipe B-2' THEN 4
        WHEN 'Equipe C-1' THEN 5
        WHEN 'Equipe C-2' THEN 6
        ELSE 99
    END,
    wftm.sort_order;
