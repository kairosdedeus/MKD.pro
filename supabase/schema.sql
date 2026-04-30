-- =====================================================
-- SCHEMA COMPLETO SUPABASE - ESCALAS MINISTERIAIS
-- =====================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABELAS PRINCIPAIS
-- =====================================================

-- Tabela de perfis de usuários
CREATE TABLE users_profile (
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

-- Tabela de perfis/roles do sistema
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    codigo TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de relacionamento usuário-perfil (muitos para muitos)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users_profile(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_user_profile UNIQUE (user_id, profile_id)
);

-- Tabela de tipos de equipe
CREATE TABLE team_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    codigo TEXT UNIQUE NOT NULL,
    permite_multiplas BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de equipes
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    team_type_id UUID REFERENCES team_types(id) ON DELETE RESTRICT,
    leader_id UUID REFERENCES users_profile(id) ON DELETE SET NULL,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de membros das equipes
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users_profile(id) ON DELETE CASCADE,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_team_member UNIQUE (team_id, user_id)
);

-- Tabela de funções por tipo de equipe
CREATE TABLE team_functions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    team_type_id UUID REFERENCES team_types(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_function_per_type UNIQUE (nome, team_type_id)
);

-- Tabela de funções dos membros (muitos para muitos)
CREATE TABLE team_member_functions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_member_id UUID REFERENCES team_members(id) ON DELETE CASCADE,
    function_id UUID REFERENCES team_functions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_member_function UNIQUE (team_member_id, function_id)
);

-- Tabela de escalas
CREATE TABLE schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    title TEXT,
    notes TEXT,
    status TEXT DEFAULT 'draft', -- draft, published, completed
    created_by UUID REFERENCES users_profile(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users_profile(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_team_date UNIQUE (team_id, date)
);

-- Tabela de membros escalados
CREATE TABLE schedule_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schedule_id UUID REFERENCES schedules(id) ON DELETE CASCADE,
    team_member_id UUID REFERENCES team_members(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_schedule_member UNIQUE (schedule_id, team_member_id)
);

-- Tabela de funções dos membros na escala
CREATE TABLE schedule_member_functions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schedule_member_id UUID REFERENCES schedule_members(id) ON DELETE CASCADE,
    function_id UUID REFERENCES team_functions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_schedule_member_function UNIQUE (schedule_member_id, function_id)
);

-- Tabela de músicas
CREATE TABLE songs (
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

-- Tabela de músicas na escala
CREATE TABLE schedule_songs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schedule_id UUID REFERENCES schedules(id) ON DELETE CASCADE,
    song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
    original_key TEXT,
    execution_key TEXT,
    order_index INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_schedule_song UNIQUE (schedule_id, song_id)
);

-- Tabela de células
CREATE TABLE cells (
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

-- Tabela de membros de células
CREATE TABLE cell_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cell_id UUID REFERENCES cells(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users_profile(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'membro', -- lider, auxiliar, membro
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_cell_member UNIQUE (cell_id, user_id)
);

-- Tabela de reuniões de células
CREATE TABLE cell_meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cell_id UUID REFERENCES cells(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_cell_meeting UNIQUE (cell_id, date)
);

-- Tabela de presença nas reuniões
CREATE TABLE cell_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cell_meeting_id UUID REFERENCES cell_meetings(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users_profile(id) ON DELETE CASCADE,
    present BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_attendance UNIQUE (cell_meeting_id, user_id)
);

-- =====================================================
-- ÍNDICES
-- =====================================================

CREATE INDEX idx_users_profile_auth_user ON users_profile(auth_user_id);
CREATE INDEX idx_users_profile_email ON users_profile(email);
CREATE INDEX idx_user_profiles_user ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_profile ON user_profiles(profile_id);
CREATE INDEX idx_teams_type ON teams(team_type_id);
CREATE INDEX idx_teams_leader ON teams(leader_id);
CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);
CREATE INDEX idx_team_functions_type ON team_functions(team_type_id);
CREATE INDEX idx_schedules_team ON schedules(team_id);
CREATE INDEX idx_schedules_date ON schedules(date);
CREATE INDEX idx_schedule_members_schedule ON schedule_members(schedule_id);
CREATE INDEX idx_schedule_songs_schedule ON schedule_songs(schedule_id);
CREATE INDEX idx_schedule_songs_song ON schedule_songs(song_id);
CREATE INDEX idx_songs_name ON songs(name);
CREATE INDEX idx_cells_leader ON cells(leader_id);
CREATE INDEX idx_cell_members_cell ON cell_members(cell_id);
CREATE INDEX idx_cell_members_user ON cell_members(user_id);
CREATE INDEX idx_cell_meetings_cell ON cell_meetings(cell_id);
CREATE INDEX idx_cell_meetings_date ON cell_meetings(date);

-- =====================================================
-- TRIGGERS PARA UPDATED_AT
-- =====================================================

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

-- =====================================================
-- DADOS INICIAIS
-- =====================================================

-- Inserir perfis do sistema
INSERT INTO profiles (nome, codigo) VALUES
    ('Gerencial', 'gerencial'),
    ('Líder Louvor', 'lider_louvor'),
    ('Líder Dança', 'lider_danca'),
    ('Líder Obreiros', 'lider_obreiros'),
    ('Líder Mídia', 'lider_midia'),
    ('Líder Célula', 'lider_celula'),
    ('Auxiliar de Célula', 'auxiliar_celula'),
    ('Membro Louvor', 'membro_louvor'),
    ('Membro Dança', 'membro_danca'),
    ('Membro Obreiro', 'membro_obreiro'),
    ('Membro Mídia', 'membro_midia'),
    ('Membro Célula', 'membro_celula');

-- Inserir tipos de equipe
INSERT INTO team_types (nome, codigo, permite_multiplas) VALUES
    ('Louvor', 'louvor', true),
    ('Dança', 'danca', true),
    ('Obreiros', 'obreiros', false),
    ('Mídia', 'midia', true),
    ('Célula', 'celula', true);

-- Inserir funções de Louvor
INSERT INTO team_functions (nome, team_type_id) 
SELECT 'Ministro', id FROM team_types WHERE codigo = 'louvor'
UNION ALL
SELECT 'Back Vocal', id FROM team_types WHERE codigo = 'louvor'
UNION ALL
SELECT 'Tecladista', id FROM team_types WHERE codigo = 'louvor'
UNION ALL
SELECT 'Guitarrista', id FROM team_types WHERE codigo = 'louvor'
UNION ALL
SELECT 'Violonista', id FROM team_types WHERE codigo = 'louvor'
UNION ALL
SELECT 'Baixista', id FROM team_types WHERE codigo = 'louvor'
UNION ALL
SELECT 'Baterista', id FROM team_types WHERE codigo = 'louvor';

-- Inserir funções de Dança
INSERT INTO team_functions (nome, team_type_id) 
SELECT 'Dança lenta', id FROM team_types WHERE codigo = 'danca'
UNION ALL
SELECT 'Dança agitada', id FROM team_types WHERE codigo = 'danca'
UNION ALL
SELECT 'Coreografia', id FROM team_types WHERE codigo = 'danca'
UNION ALL
SELECT 'Apoio', id FROM team_types WHERE codigo = 'danca';

-- Inserir funções de Mídia
INSERT INTO team_functions (nome, team_type_id) 
SELECT 'Projeção', id FROM team_types WHERE codigo = 'midia'
UNION ALL
SELECT 'Câmera', id FROM team_types WHERE codigo = 'midia'
UNION ALL
SELECT 'Fotografia', id FROM team_types WHERE codigo = 'midia'
UNION ALL
SELECT 'Transmissão', id FROM team_types WHERE codigo = 'midia'
UNION ALL
SELECT 'Mesa de som', id FROM team_types WHERE codigo = 'midia'
UNION ALL
SELECT 'Iluminação', id FROM team_types WHERE codigo = 'midia';

-- Inserir funções de Obreiros
INSERT INTO team_functions (nome, team_type_id) 
SELECT 'Recepção', id FROM team_types WHERE codigo = 'obreiros'
UNION ALL
SELECT 'Apoio', id FROM team_types WHERE codigo = 'obreiros'
UNION ALL
SELECT 'Organização', id FROM team_types WHERE codigo = 'obreiros'
UNION ALL
SELECT 'Segurança', id FROM team_types WHERE codigo = 'obreiros'
UNION ALL
SELECT 'Ceia', id FROM team_types WHERE codigo = 'obreiros'
UNION ALL
SELECT 'Oferta', id FROM team_types WHERE codigo = 'obreiros';

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

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

-- =====================================================
-- FUNÇÕES AUXILIARES PARA RLS
-- =====================================================

-- Função para verificar se usuário é gerencial
CREATE OR REPLACE FUNCTION is_gerencial()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_profiles up
        JOIN profiles p ON up.profile_id = p.id
        JOIN users_profile u ON up.user_id = u.id
        WHERE u.auth_user_id = auth.uid()
        AND p.codigo = 'gerencial'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se usuário é líder de uma equipe
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

-- Função para verificar se usuário é membro de uma equipe
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

-- Função para verificar se usuário é líder de célula
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

-- =====================================================
-- POLICIES - USERS_PROFILE
-- =====================================================

CREATE POLICY "Usuários podem ver seu próprio perfil"
    ON users_profile FOR SELECT
    USING (auth_user_id = auth.uid() OR is_gerencial());

CREATE POLICY "Gerencial pode inserir usuários"
    ON users_profile FOR INSERT
    WITH CHECK (is_gerencial());

CREATE POLICY "Gerencial pode atualizar usuários"
    ON users_profile FOR UPDATE
    USING (is_gerencial());

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
    ON users_profile FOR UPDATE
    USING (auth_user_id = auth.uid());

-- =====================================================
-- POLICIES - PROFILES
-- =====================================================

CREATE POLICY "Todos podem ver perfis"
    ON profiles FOR SELECT
    USING (true);

-- =====================================================
-- POLICIES - USER_PROFILES
-- =====================================================

CREATE POLICY "Usuários podem ver seus próprios perfis"
    ON user_profiles FOR SELECT
    USING (
        user_id IN (
            SELECT id FROM users_profile WHERE auth_user_id = auth.uid()
        ) OR is_gerencial()
    );

CREATE POLICY "Gerencial pode gerenciar perfis de usuários"
    ON user_profiles FOR ALL
    USING (is_gerencial());

-- =====================================================
-- POLICIES - TEAM_TYPES
-- =====================================================

CREATE POLICY "Todos podem ver tipos de equipe"
    ON team_types FOR SELECT
    USING (true);

-- =====================================================
-- POLICIES - TEAMS
-- =====================================================

CREATE POLICY "Membros podem ver suas equipes"
    ON teams FOR SELECT
    USING (
        is_gerencial() OR 
        is_team_leader(id) OR 
        is_team_member(id)
    );

CREATE POLICY "Gerencial pode criar equipes"
    ON teams FOR INSERT
    WITH CHECK (is_gerencial());

CREATE POLICY "Gerencial e líderes podem atualizar suas equipes"
    ON teams FOR UPDATE
    USING (is_gerencial() OR is_team_leader(id));

CREATE POLICY "Gerencial pode deletar equipes"
    ON teams FOR DELETE
    USING (is_gerencial());

-- =====================================================
-- POLICIES - TEAM_MEMBERS
-- =====================================================

CREATE POLICY "Membros podem ver membros de suas equipes"
    ON team_members FOR SELECT
    USING (
        is_gerencial() OR 
        is_team_leader(team_id) OR 
        is_team_member(team_id)
    );

CREATE POLICY "Gerencial e líderes podem adicionar membros"
    ON team_members FOR INSERT
    WITH CHECK (is_gerencial() OR is_team_leader(team_id));

CREATE POLICY "Gerencial e líderes podem atualizar membros"
    ON team_members FOR UPDATE
    USING (is_gerencial() OR is_team_leader(team_id));

CREATE POLICY "Gerencial e líderes podem remover membros"
    ON team_members FOR DELETE
    USING (is_gerencial() OR is_team_leader(team_id));

-- =====================================================
-- POLICIES - TEAM_FUNCTIONS
-- =====================================================

CREATE POLICY "Todos podem ver funções"
    ON team_functions FOR SELECT
    USING (true);

CREATE POLICY "Gerencial pode gerenciar funções"
    ON team_functions FOR ALL
    USING (is_gerencial());

-- =====================================================
-- POLICIES - TEAM_MEMBER_FUNCTIONS
-- =====================================================

CREATE POLICY "Membros podem ver funções de suas equipes"
    ON team_member_functions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM team_members tm
            WHERE tm.id = team_member_id
            AND (is_gerencial() OR is_team_leader(tm.team_id) OR is_team_member(tm.team_id))
        )
    );

CREATE POLICY "Gerencial e líderes podem gerenciar funções de membros"
    ON team_member_functions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM team_members tm
            WHERE tm.id = team_member_id
            AND (is_gerencial() OR is_team_leader(tm.team_id))
        )
    );

-- =====================================================
-- POLICIES - SCHEDULES
-- =====================================================

CREATE POLICY "Membros podem ver escalas de suas equipes"
    ON schedules FOR SELECT
    USING (
        is_gerencial() OR 
        is_team_leader(team_id) OR 
        is_team_member(team_id)
    );

CREATE POLICY "Gerencial e líderes podem criar escalas"
    ON schedules FOR INSERT
    WITH CHECK (is_gerencial() OR is_team_leader(team_id));

CREATE POLICY "Gerencial e líderes podem atualizar escalas"
    ON schedules FOR UPDATE
    USING (is_gerencial() OR is_team_leader(team_id));

CREATE POLICY "Gerencial pode deletar escalas"
    ON schedules FOR DELETE
    USING (is_gerencial());

-- =====================================================
-- POLICIES - SCHEDULE_MEMBERS
-- =====================================================

CREATE POLICY "Membros podem ver escalados"
    ON schedule_members FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM schedules s
            WHERE s.id = schedule_id
            AND (is_gerencial() OR is_team_leader(s.team_id) OR is_team_member(s.team_id))
        )
    );

CREATE POLICY "Gerencial e líderes podem gerenciar escalados"
    ON schedule_members FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM schedules s
            WHERE s.id = schedule_id
            AND (is_gerencial() OR is_team_leader(s.team_id))
        )
    );

-- =====================================================
-- POLICIES - SCHEDULE_MEMBER_FUNCTIONS
-- =====================================================

CREATE POLICY "Membros podem ver funções na escala"
    ON schedule_member_functions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM schedule_members sm
            JOIN schedules s ON sm.schedule_id = s.id
            WHERE sm.id = schedule_member_id
            AND (is_gerencial() OR is_team_leader(s.team_id) OR is_team_member(s.team_id))
        )
    );

CREATE POLICY "Gerencial e líderes podem gerenciar funções na escala"
    ON schedule_member_functions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM schedule_members sm
            JOIN schedules s ON sm.schedule_id = s.id
            WHERE sm.id = schedule_member_id
            AND (is_gerencial() OR is_team_leader(s.team_id))
        )
    );

-- =====================================================
-- POLICIES - SONGS
-- =====================================================

CREATE POLICY "Todos autenticados podem ver músicas"
    ON songs FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Membros de louvor podem criar músicas"
    ON songs FOR INSERT
    WITH CHECK (
        is_gerencial() OR
        EXISTS (
            SELECT 1 FROM team_members tm
            JOIN teams t ON tm.team_id = t.id
            JOIN team_types tt ON t.team_type_id = tt.id
            JOIN users_profile u ON tm.user_id = u.id
            WHERE tt.codigo = 'louvor'
            AND u.auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Criadores e gerencial podem atualizar músicas"
    ON songs FOR UPDATE
    USING (
        is_gerencial() OR
        created_by IN (SELECT id FROM users_profile WHERE auth_user_id = auth.uid())
    );

-- =====================================================
-- POLICIES - SCHEDULE_SONGS
-- =====================================================

CREATE POLICY "Membros podem ver músicas da escala"
    ON schedule_songs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM schedules s
            WHERE s.id = schedule_id
            AND (is_gerencial() OR is_team_leader(s.team_id) OR is_team_member(s.team_id))
        )
    );

CREATE POLICY "Gerencial e líderes podem gerenciar músicas da escala"
    ON schedule_songs FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM schedules s
            WHERE s.id = schedule_id
            AND (is_gerencial() OR is_team_leader(s.team_id))
        )
    );

-- =====================================================
-- POLICIES - CELLS
-- =====================================================

CREATE POLICY "Membros podem ver suas células"
    ON cells FOR SELECT
    USING (
        is_gerencial() OR 
        is_cell_leader(cells.id) OR
        EXISTS (
            SELECT 1 FROM cell_members cm
            JOIN users_profile u ON cm.user_id = u.id
            WHERE cm.cell_id = cells.id
            AND u.auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Gerencial pode criar células"
    ON cells FOR INSERT
    WITH CHECK (is_gerencial());

CREATE POLICY "Gerencial e líderes podem atualizar células"
    ON cells FOR UPDATE
    USING (is_gerencial() OR is_cell_leader(cells.id));

-- =====================================================
-- POLICIES - CELL_MEMBERS
-- =====================================================

CREATE POLICY "Membros podem ver membros de suas células"
    ON cell_members FOR SELECT
    USING (
        is_gerencial() OR 
        is_cell_leader(cell_id) OR
        EXISTS (
            SELECT 1 FROM cell_members cm
            JOIN users_profile u ON cm.user_id = u.id
            WHERE cm.cell_id = cell_id
            AND u.auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Gerencial e líderes podem gerenciar membros de células"
    ON cell_members FOR ALL
    USING (is_gerencial() OR is_cell_leader(cell_id));

-- =====================================================
-- POLICIES - CELL_MEETINGS
-- =====================================================

CREATE POLICY "Membros podem ver reuniões de suas células"
    ON cell_meetings FOR SELECT
    USING (
        is_gerencial() OR 
        is_cell_leader(cell_id) OR
        EXISTS (
            SELECT 1 FROM cell_members cm
            JOIN users_profile u ON cm.user_id = u.id
            WHERE cm.cell_id = cell_id
            AND u.auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Gerencial e líderes podem gerenciar reuniões"
    ON cell_meetings FOR ALL
    USING (is_gerencial() OR is_cell_leader(cell_id));

-- =====================================================
-- POLICIES - CELL_ATTENDANCE
-- =====================================================

CREATE POLICY "Membros podem ver presenças de suas células"
    ON cell_attendance FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM cell_meetings cm
            WHERE cm.id = cell_meeting_id
            AND (
                is_gerencial() OR 
                is_cell_leader(cm.cell_id) OR
                EXISTS (
                    SELECT 1 FROM cell_members cmem
                    JOIN users_profile u ON cmem.user_id = u.id
                    WHERE cmem.cell_id = cm.cell_id
                    AND u.auth_user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Gerencial e líderes podem gerenciar presenças"
    ON cell_attendance FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM cell_meetings cm
            WHERE cm.id = cell_meeting_id
            AND (is_gerencial() OR is_cell_leader(cm.cell_id))
        )
    );

-- =====================================================
-- STORAGE BUCKET PARA ÁUDIOS
-- =====================================================

-- Criar bucket para músicas (executar no dashboard do Supabase)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('audio-musicas', 'audio-musicas', false);

-- Policies para o bucket (executar no dashboard do Supabase)
-- CREATE POLICY "Usuários autenticados podem fazer upload"
--     ON storage.objects FOR INSERT
--     WITH CHECK (bucket_id = 'audio-musicas' AND auth.uid() IS NOT NULL);

-- CREATE POLICY "Usuários autenticados podem visualizar"
--     ON storage.objects FOR SELECT
--     USING (bucket_id = 'audio-musicas' AND auth.uid() IS NOT NULL);

-- CREATE POLICY "Criadores podem deletar seus arquivos"
--     ON storage.objects FOR DELETE
--     USING (bucket_id = 'audio-musicas' AND auth.uid() = owner);
