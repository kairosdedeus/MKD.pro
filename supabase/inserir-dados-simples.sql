-- ============================================
-- INSERIR DADOS INICIAIS - VERSÃO SIMPLES
-- Execute este script completo
-- ============================================

-- 1. INSERIR PERFIS (12 perfis)
INSERT INTO profiles (nome, codigo) VALUES ('Gerencial', 'gerencial');
INSERT INTO profiles (nome, codigo) VALUES ('Líder de Louvor', 'lider_louvor');
INSERT INTO profiles (nome, codigo) VALUES ('Líder de Dança', 'lider_danca');
INSERT INTO profiles (nome, codigo) VALUES ('Líder de Obreiros', 'lider_obreiros');
INSERT INTO profiles (nome, codigo) VALUES ('Líder de Mídia', 'lider_midia');
INSERT INTO profiles (nome, codigo) VALUES ('Líder de Célula', 'lider_celula');
INSERT INTO profiles (nome, codigo) VALUES ('Auxiliar de Célula', 'auxiliar_celula');
INSERT INTO profiles (nome, codigo) VALUES ('Membro de Louvor', 'membro_louvor');
INSERT INTO profiles (nome, codigo) VALUES ('Membro de Dança', 'membro_danca');
INSERT INTO profiles (nome, codigo) VALUES ('Membro de Obreiros', 'membro_obreiro');
INSERT INTO profiles (nome, codigo) VALUES ('Membro de Mídia', 'membro_midia');
INSERT INTO profiles (nome, codigo) VALUES ('Membro de Célula', 'membro_celula');

-- 2. INSERIR TIPOS DE EQUIPE (5 tipos)
INSERT INTO team_types (nome, codigo, permite_multiplas) VALUES ('Louvor', 'louvor', true);
INSERT INTO team_types (nome, codigo, permite_multiplas) VALUES ('Dança', 'danca', true);
INSERT INTO team_types (nome, codigo, permite_multiplas) VALUES ('Obreiros', 'obreiros', true);
INSERT INTO team_types (nome, codigo, permite_multiplas) VALUES ('Mídia', 'midia', true);
INSERT INTO team_types (nome, codigo, permite_multiplas) VALUES ('Célula', 'celula', true);

-- 3. INSERIR FUNÇÕES DE LOUVOR (5 funções)
INSERT INTO team_functions (nome, team_type_id) 
SELECT 'Vocal', id FROM team_types WHERE codigo = 'louvor';

INSERT INTO team_functions (nome, team_type_id) 
SELECT 'Guitarra', id FROM team_types WHERE codigo = 'louvor';

INSERT INTO team_functions (nome, team_type_id) 
SELECT 'Baixo', id FROM team_types WHERE codigo = 'louvor';

INSERT INTO team_functions (nome, team_type_id) 
SELECT 'Bateria', id FROM team_types WHERE codigo = 'louvor';

INSERT INTO team_functions (nome, team_type_id) 
SELECT 'Teclado', id FROM team_types WHERE codigo = 'louvor';

-- 4. INSERIR FUNÇÕES DE MÍDIA (3 funções)
INSERT INTO team_functions (nome, team_type_id) 
SELECT 'Projeção', id FROM team_types WHERE codigo = 'midia';

INSERT INTO team_functions (nome, team_type_id) 
SELECT 'Som', id FROM team_types WHERE codigo = 'midia';

INSERT INTO team_functions (nome, team_type_id) 
SELECT 'Transmissão', id FROM team_types WHERE codigo = 'midia';

-- 5. INSERIR FUNÇÕES DE OBREIROS (3 funções)
INSERT INTO team_functions (nome, team_type_id) 
SELECT 'Recepção', id FROM team_types WHERE codigo = 'obreiros';

INSERT INTO team_functions (nome, team_type_id) 
SELECT 'Estacionamento', id FROM team_types WHERE codigo = 'obreiros';

INSERT INTO team_functions (nome, team_type_id) 
SELECT 'Segurança', id FROM team_types WHERE codigo = 'obreiros';

-- 6. CRIAR BUCKET DE STORAGE
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio-musicas', 'audio-musicas', false)
ON CONFLICT (id) DO NOTHING;

-- 7. ATRIBUIR PERFIL GERENCIAL AO ADMIN
INSERT INTO user_profiles (user_id, profile_id)
SELECT 
    u.id,
    p.id
FROM users_profile u
CROSS JOIN profiles p
WHERE u.email = 'admin@igreja.com'
AND p.codigo = 'gerencial'
ON CONFLICT (user_id, profile_id) DO NOTHING;

-- VERIFICAR RESULTADOS
SELECT 'Perfis inseridos:' as info, COUNT(*) as total FROM profiles;
SELECT 'Tipos de equipe inseridos:' as info, COUNT(*) as total FROM team_types;
SELECT 'Funções inseridas:' as info, COUNT(*) as total FROM team_functions;
SELECT 'Buckets criados:' as info, COUNT(*) as total FROM storage.buckets WHERE name = 'audio-musicas';

-- MOSTRAR OS DADOS
SELECT '=== PERFIS ===' as secao;
SELECT codigo, nome FROM profiles ORDER BY codigo;

SELECT '=== TIPOS DE EQUIPE ===' as secao;
SELECT codigo, nome FROM team_types ORDER BY codigo;

SELECT '=== FUNÇÕES ===' as secao;
SELECT 
    tt.nome as tipo_equipe,
    tf.nome as funcao
FROM team_functions tf
JOIN team_types tt ON tt.id = tf.team_type_id
ORDER BY tt.nome, tf.nome;
