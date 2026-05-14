-- ============================================
-- INSERIR DADOS INICIAIS
-- Execute após o schema.sql
-- ============================================

-- 1. Perfis do sistema
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

-- 2. Tipos de equipe
INSERT INTO team_types (nome, codigo, permite_multiplas) VALUES
    ('Louvor', 'louvor', true),
    ('Dança', 'danca', true),
    ('Obreiros', 'obreiros', true),
    ('Mídia', 'midia', true),
    ('Célula', 'celula', true)
ON CONFLICT (codigo) DO NOTHING;

-- 3. Funções de Louvor
INSERT INTO team_functions (nome, team_type_id)
SELECT unnest(ARRAY['Vocal','BackVocal','Guitarra','Baixo','Bateria','Teclado']), id
FROM team_types WHERE codigo = 'louvor'
ON CONFLICT DO NOTHING;

-- 4. Funções de Dança
INSERT INTO team_functions (nome, team_type_id)
SELECT unnest(ARRAY['Ministerial', 'Ballet']), id
FROM team_types WHERE codigo = 'danca'
ON CONFLICT DO NOTHING;

-- 5. Funções de Mídia
INSERT INTO team_functions (nome, team_type_id)
SELECT unnest(ARRAY['Proje��o','Som','Transmiss�o','Fotos','Videomaker','Storymaker']), id
FROM team_types WHERE codigo = 'midia'
ON CONFLICT DO NOTHING;

-- 5. Funções de Obreiros
INSERT INTO team_functions (nome, team_type_id)
SELECT unnest(ARRAY['Recepção','Estacionamento','Segurança']), id
FROM team_types WHERE codigo = 'obreiros'
ON CONFLICT DO NOTHING;

-- 6. Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio-musicas', 'audio-musicas', false)
ON CONFLICT DO NOTHING;

-- Verificar
SELECT 'Perfis' as item, COUNT(*) as total FROM profiles
UNION ALL SELECT 'Tipos de Equipe', COUNT(*) FROM team_types
UNION ALL SELECT 'Funções', COUNT(*) FROM team_functions;

SELECT '✅ Dados iniciais inseridos!' as resultado;
