-- ============================================
-- INSERIR DADOS INICIAIS
-- ============================================

-- 1. Inserir perfis do sistema
INSERT INTO profiles (nome, codigo) VALUES
    ('Gerencial', 'gerencial'),
    ('Líder de Louvor', 'lider_louvor'),
    ('Líder de Dança', 'lider_danca'),
    ('Líder de Obreiros', 'lider_obreiros'),
    ('Líder de Mídia', 'lider_midia'),
    ('Líder de Célula', 'lider_celula'),
    ('Auxiliar de Célula', 'auxiliar_celula'),
    ('Membro de Louvor', 'membro_louvor'),
    ('Membro de Dança', 'membro_danca'),
    ('Membro de Obreiros', 'membro_obreiro'),
    ('Membro de Mídia', 'membro_midia'),
    ('Membro de Célula', 'membro_celula')
ON CONFLICT (codigo) DO NOTHING;

-- 2. Inserir tipos de equipe
INSERT INTO team_types (nome, codigo, permite_multiplas) VALUES
    ('Louvor', 'louvor', true),
    ('Dança', 'danca', true),
    ('Obreiros', 'obreiros', true),
    ('Mídia', 'midia', true),
    ('Célula', 'celula', true)
ON CONFLICT (codigo) DO NOTHING;

-- 3. Inserir funções para Louvor
INSERT INTO team_functions (nome, team_type_id)
SELECT 'Vocal', id FROM team_types WHERE codigo = 'louvor'
ON CONFLICT DO NOTHING;

INSERT INTO team_functions (nome, team_type_id)
SELECT 'Guitarra', id FROM team_types WHERE codigo = 'louvor'
ON CONFLICT DO NOTHING;

INSERT INTO team_functions (nome, team_type_id)
SELECT 'Baixo', id FROM team_types WHERE codigo = 'louvor'
ON CONFLICT DO NOTHING;

INSERT INTO team_functions (nome, team_type_id)
SELECT 'Bateria', id FROM team_types WHERE codigo = 'louvor'
ON CONFLICT DO NOTHING;

INSERT INTO team_functions (nome, team_type_id)
SELECT 'Teclado', id FROM team_types WHERE codigo = 'louvor'
ON CONFLICT DO NOTHING;

-- 4. Inserir funções para Mídia
INSERT INTO team_functions (nome, team_type_id)
SELECT 'Projeção', id FROM team_types WHERE codigo = 'midia'
ON CONFLICT DO NOTHING;

INSERT INTO team_functions (nome, team_type_id)
SELECT 'Som', id FROM team_types WHERE codigo = 'midia'
ON CONFLICT DO NOTHING;

INSERT INTO team_functions (nome, team_type_id)
SELECT 'Transmissão', id FROM team_types WHERE codigo = 'midia'
ON CONFLICT DO NOTHING;

-- 5. Inserir funções para Obreiros
INSERT INTO team_functions (nome, team_type_id)
SELECT 'Recepção', id FROM team_types WHERE codigo = 'obreiros'
ON CONFLICT DO NOTHING;

INSERT INTO team_functions (nome, team_type_id)
SELECT 'Estacionamento', id FROM team_types WHERE codigo = 'obreiros'
ON CONFLICT DO NOTHING;

INSERT INTO team_functions (nome, team_type_id)
SELECT 'Segurança', id FROM team_types WHERE codigo = 'obreiros'
ON CONFLICT DO NOTHING;

-- 6. Criar bucket de storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio-musicas', 'audio-musicas', false)
ON CONFLICT DO NOTHING;

-- 7. Garantir que o usuário admin tem perfil gerencial
INSERT INTO user_profiles (user_id, profile_id)
SELECT 
    u.id,
    p.id
FROM users_profile u
CROSS JOIN profiles p
WHERE u.email = 'admin@igreja.com'
AND p.codigo = 'gerencial'
ON CONFLICT (user_id, profile_id) DO NOTHING;

-- Verificar resultados
SELECT '=== VERIFICAÇÃO ===' as info;
SELECT 'Perfis' as item, COUNT(*) as total FROM profiles
UNION ALL
SELECT 'Tipos de Equipe', COUNT(*) FROM team_types
UNION ALL
SELECT 'Funções', COUNT(*) FROM team_functions
UNION ALL
SELECT 'Storage Buckets', COUNT(*) FROM storage.buckets WHERE name = 'audio-musicas';

SELECT '✅ Dados iniciais inseridos com sucesso!' as resultado;
