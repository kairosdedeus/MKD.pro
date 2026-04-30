# 📋 Como Executar o Schema SQL - Guia Passo a Passo

Se você teve erro ao executar o schema.sql completo, execute em partes seguindo esta ordem:

## ⚠️ IMPORTANTE: Execute uma parte por vez!

---

## PARTE 1: Tabelas e Estrutura Básica

Execute no SQL Editor:

```sql
-- Habilitar extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de perfis de usuários
CREATE TABLE IF NOT EXISTS users_profile (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    telefone TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_auth_user UNIQUE (auth_user_id)
);

-- Tabela de perfis/roles
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    codigo TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de relacionamento usuário-perfil
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users_profile(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_user_profile UNIQUE (user_id, profile_id)
);

-- Tabela de tipos de equipe
CREATE TABLE IF NOT EXISTS team_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    codigo TEXT UNIQUE NOT NULL,
    permite_multiplas BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de equipes
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    team_type_id UUID REFERENCES team_types(id) ON DELETE RESTRICT,
    leader_id UUID REFERENCES users_profile(id) ON DELETE SET NULL,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de membros das equipes
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users_profile(id) ON DELETE CASCADE,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_team_member UNIQUE (team_id, user_id)
);

-- Tabela de funções por tipo de equipe
CREATE TABLE IF NOT EXISTS team_functions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    team_type_id UUID REFERENCES team_types(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_function_per_type UNIQUE (nome, team_type_id)
);

-- Tabela de funções dos membros
CREATE TABLE IF NOT EXISTS team_member_functions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_member_id UUID REFERENCES team_members(id) ON DELETE CASCADE,
    function_id UUID REFERENCES team_functions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_member_function UNIQUE (team_member_id, function_id)
);

-- Tabela de escalas
CREATE TABLE IF NOT EXISTS schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    title TEXT,
    notes TEXT,
    status TEXT DEFAULT 'draft',
    created_by UUID REFERENCES users_profile(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users_profile(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de membros nas escalas
CREATE TABLE IF NOT EXISTS schedule_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schedule_id UUID REFERENCES schedules(id) ON DELETE CASCADE,
    team_member_id UUID REFERENCES team_members(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_schedule_member UNIQUE (schedule_id, team_member_id)
);

-- Tabela de funções dos membros nas escalas
CREATE TABLE IF NOT EXISTS schedule_member_functions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schedule_member_id UUID REFERENCES schedule_members(id) ON DELETE CASCADE,
    function_id UUID REFERENCES team_functions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_schedule_member_function UNIQUE (schedule_member_id, function_id)
);

-- Tabela de músicas
CREATE TABLE IF NOT EXISTS songs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    artist TEXT,
    original_key TEXT,
    reference_url TEXT,
    audio_path TEXT,
    has_virtual_instruments BOOLEAN DEFAULT false,
    notes TEXT,
    created_by UUID REFERENCES users_profile(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de músicas nas escalas
CREATE TABLE IF NOT EXISTS schedule_songs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schedule_id UUID REFERENCES schedules(id) ON DELETE CASCADE,
    song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
    execution_key TEXT,
    order_index INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_schedule_song_order UNIQUE (schedule_id, order_index)
);

-- Tabela de células
CREATE TABLE IF NOT EXISTS cells (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    leader_id UUID REFERENCES users_profile(id) ON DELETE SET NULL,
    address TEXT,
    weekday TEXT,
    meeting_time TIME,
    notes TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de membros das células
CREATE TABLE IF NOT EXISTS cell_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cell_id UUID REFERENCES cells(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users_profile(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'membro',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_cell_member UNIQUE (cell_id, user_id)
);

-- Tabela de reuniões das células
CREATE TABLE IF NOT EXISTS cell_meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cell_id UUID REFERENCES cells(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de presença nas reuniões
CREATE TABLE IF NOT EXISTS cell_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cell_meeting_id UUID REFERENCES cell_meetings(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users_profile(id) ON DELETE CASCADE,
    present BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_attendance UNIQUE (cell_meeting_id, user_id)
);
```

✅ **Verifique**: Vá em Table Editor e confirme que todas as tabelas foram criadas.

---

## PARTE 2: Dados Iniciais

Execute no SQL Editor:

```sql
-- Inserir perfis do sistema
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

-- Inserir tipos de equipe
INSERT INTO team_types (nome, codigo, permite_multiplas) VALUES
    ('Louvor', 'louvor', true),
    ('Dança', 'danca', true),
    ('Obreiros', 'obreiros', true),
    ('Mídia', 'midia', true),
    ('Célula', 'celula', true)
ON CONFLICT (codigo) DO NOTHING;

-- Inserir funções para Louvor
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

-- Inserir funções para Mídia
INSERT INTO team_functions (nome, team_type_id)
SELECT 'Projeção', id FROM team_types WHERE codigo = 'midia'
ON CONFLICT DO NOTHING;

INSERT INTO team_functions (nome, team_type_id)
SELECT 'Som', id FROM team_types WHERE codigo = 'midia'
ON CONFLICT DO NOTHING;

INSERT INTO team_functions (nome, team_type_id)
SELECT 'Transmissão', id FROM team_types WHERE codigo = 'midia'
ON CONFLICT DO NOTHING;

-- Inserir funções para Obreiros
INSERT INTO team_functions (nome, team_type_id)
SELECT 'Recepção', id FROM team_types WHERE codigo = 'obreiros'
ON CONFLICT DO NOTHING;

INSERT INTO team_functions (nome, team_type_id)
SELECT 'Estacionamento', id FROM team_types WHERE codigo = 'obreiros'
ON CONFLICT DO NOTHING;

INSERT INTO team_functions (nome, team_type_id)
SELECT 'Segurança', id FROM team_types WHERE codigo = 'obreiros'
ON CONFLICT DO NOTHING;
```

✅ **Verifique**: Vá em Table Editor → profiles e confirme que há 12 perfis.

---

## PARTE 3: Funções Auxiliares

Execute no SQL Editor:

```sql
-- Função para verificar se é gerencial
CREATE OR REPLACE FUNCTION is_gerencial()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_profiles up
        JOIN users_profile u ON up.user_id = u.id
        JOIN profiles p ON up.profile_id = p.id
        WHERE u.auth_user_id = auth.uid()
        AND p.codigo = 'gerencial'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se é líder de equipe
CREATE OR REPLACE FUNCTION is_team_leader(team_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM teams t
        JOIN users_profile u ON t.leader_id = u.id
        WHERE t.id = team_uuid
        AND u.auth_user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se é membro de equipe
CREATE OR REPLACE FUNCTION is_team_member(team_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM team_members tm
        JOIN users_profile u ON tm.user_id = u.id
        WHERE tm.team_id = team_uuid
        AND u.auth_user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se é líder de célula
CREATE OR REPLACE FUNCTION is_cell_leader(cell_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM cells c
        JOIN users_profile u ON c.leader_id = u.id
        WHERE c.id = cell_uuid
        AND u.auth_user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

✅ **Verifique**: Não há erro na execução.

---

## PARTE 4: Triggers

Execute no SQL Editor:

```sql
-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_profile_updated_at BEFORE UPDATE ON users_profile
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_songs_updated_at BEFORE UPDATE ON songs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cells_updated_at BEFORE UPDATE ON cells
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

✅ **Verifique**: Não há erro na execução.

---

## PARTE 5: Row Level Security (RLS)

Execute no SQL Editor:

```sql
-- Habilitar RLS em todas as tabelas
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_functions ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_member_functions ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_member_functions ENABLE ROW LEVEL SECURITY;
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cells ENABLE ROW LEVEL SECURITY;
ALTER TABLE cell_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE cell_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE cell_attendance ENABLE ROW LEVEL SECURITY;
```

✅ **Verifique**: Não há erro na execução.

---

## PARTE 6: Storage

Execute no SQL Editor:

```sql
-- Criar bucket para áudios
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio-musicas', 'audio-musicas', false)
ON CONFLICT DO NOTHING;

-- Políticas de storage
CREATE POLICY "Usuários autenticados podem fazer upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'audio-musicas');

CREATE POLICY "Usuários autenticados podem ler arquivos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'audio-musicas');
```

✅ **Verifique**: Vá em Storage e confirme que o bucket "audio-musicas" existe.

---

## ✅ PRONTO!

Agora você pode:
1. Criar o primeiro usuário (veja `create-first-user.sql`)
2. Rodar o projeto (`npm run dev`)
3. Fazer login

---

## 🐛 Se Ainda Tiver Erros

Execute o arquivo `supabase/schema.sql` completo novamente. Ele agora está corrigido!
