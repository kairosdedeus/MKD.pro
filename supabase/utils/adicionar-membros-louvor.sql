-- Script para adicionar os membros existentes do Louvor à equipe
-- Execute este script ANTES de atualizar as equipes fixas
-- Todos os usuários já existem no banco, apenas precisam ser adicionados à equipe

-- Buscar a equipe de Louvor
WITH worship_team AS (
    SELECT t.id
    FROM teams t
    JOIN team_types tt ON tt.id = t.team_type_id
    WHERE tt.codigo = 'louvor'
      AND t.ativo = true
    ORDER BY t.created_at
    LIMIT 1
),
-- Lista de IDs dos usuários que devem estar na equipe de Louvor
required_user_ids AS (
    SELECT id FROM users_profile WHERE id IN (
        '782c9d4c-8dad-40b9-87c4-0abd1a43c927', -- Tchucky Okama
        '7e5689b2-97f6-493b-bcfa-99f62858291b', -- Madu Cantora
        '1209d58c-accc-484b-b349-ad1acb7def5d', -- Jhonata Cantor
        'bb807069-c039-4148-aaa2-559b2985d423', -- Lais Cantora
        '8abac90e-dcbe-41cf-ba1d-b303538790de', -- Alice Cantora
        'e1d1466e-92b8-4381-a7f5-5aaee77d3c81', -- Gabriela Sena
        'e9888f91-92ce-4963-bcb1-098a1212b349', -- Maria Cantora
        '97bb749b-4e6e-4840-bbe0-b11824347b1c', -- Wallesca cantora
        '021d8915-ba0e-45dd-9579-8a3b8da4317b', -- João Cantor
        'e70a1fbe-c0f9-4ef9-9b74-562b3f9bbdfc', -- Lucas Tchucky
        '4d74d178-084d-4619-b6ab-0f2cc9f3a078', -- Isabel Cabrera
        'c770fa1e-9977-486d-a4c9-d21a17da850d', -- Michael Cabrera
        '35dc6cc9-b77d-4c16-bb86-e46fec4b0c1e', -- Vinicius Guitarra
        '6a682261-0f27-4453-b78e-0eaf80d28f4c', -- Daniel Baixo
        '50ad5b03-5c60-450f-9d2e-00636ecd8aa1', -- Ari Baixo
        '5bf78efa-7695-418c-8f8e-c224921f7e98', -- Nilson Batera
        '0f732a08-6da8-4950-9ef2-eca50aa0c0d1', -- Thiago Cabrera
        '06bce6c7-3a3a-4f23-9971-e8063d4b60ac'  -- Isadora Batera
    )
),
-- Adicionar usuários como membros da equipe de Louvor
new_team_members AS (
    INSERT INTO team_members (team_id, user_id, ativo)
    SELECT 
        wt.id,
        ru.id,
        true
    FROM worship_team wt
    CROSS JOIN required_user_ids ru
    WHERE NOT EXISTS (
        SELECT 1 FROM team_members tm
        WHERE tm.team_id = wt.id
          AND tm.user_id = ru.id
    )
    ON CONFLICT DO NOTHING
    RETURNING id, user_id
)
-- Mostrar resultado
SELECT 
    'Membros adicionados à equipe' AS tipo,
    COUNT(*) AS quantidade
FROM new_team_members;

-- Listar todos os membros da equipe de Louvor
SELECT 
    up.nome AS membro,
    up.email,
    CASE WHEN tm.ativo THEN '✅ Ativo' ELSE '❌ Inativo' END AS status
FROM teams t
JOIN team_types tt ON tt.id = t.team_type_id
JOIN team_members tm ON tm.team_id = t.id
JOIN users_profile up ON up.id = tm.user_id
WHERE tt.codigo = 'louvor'
  AND t.ativo = true
ORDER BY up.nome;
