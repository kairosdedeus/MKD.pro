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

CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    codigo TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users_profile(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_user_profile UNIQUE (user_id, profile_id)
);

CREATE TABLE team_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    codigo TEXT UNIQUE NOT NULL,
    permite_multiplas BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    team_type_id UUID REFERENCES team_types(id) ON DELETE RESTRICT,
    leader_id UUID REFERENCES users_profile(id) ON DELETE SET NULL,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users_profile(id) ON DELETE CASCADE,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_team_member UNIQUE (team_id, user_id)
);

CREATE TABLE team_functions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    team_type_id UUID REFERENCES team_types(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_function_per_type UNIQUE (nome, team_type_id)
);

CREATE TABLE team_member_functions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_member_id UUID REFERENCES team_members(id) ON DELETE CASCADE,
    function_id UUID REFERENCES team_functions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_member_function UNIQUE (team_member_id, function_id)
);

CREATE TABLE schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    title TEXT,
    notes TEXT,
    status TEXT DEFAULT 'draft',
    created_by UUID REFERENCES users_profile(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users_profile(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_team_date UNIQUE (team_id, date)
);

CREATE TABLE schedule_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schedule_id UUID REFERENCES schedules(id) ON DELETE CASCADE,
    team_member_id UUID REFERENCES team_members(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_schedule_member UNIQUE (schedule_id, team_member_id)
);

CREATE TABLE schedule_member_functions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schedule_member_id UUID REFERENCES schedule_members(id) ON DELETE CASCADE,
    function_id UUID REFERENCES team_functions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_schedule_member_function UNIQUE (schedule_member_id, function_id)
);

CREATE TABLE worship_fixed_teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_worship_fixed_team UNIQUE (team_id, nome)
);

CREATE TABLE worship_fixed_team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    preset_id UUID REFERENCES worship_fixed_teams(id) ON DELETE CASCADE,
    team_member_id UUID REFERENCES team_members(id) ON DELETE CASCADE,
    function_id UUID REFERENCES team_functions(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_worship_fixed_team_member_function UNIQUE (preset_id, team_member_id, function_id)
);

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

CREATE TABLE cell_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cell_id UUID REFERENCES cells(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users_profile(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'membro',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_cell_member UNIQUE (cell_id, user_id)
);

CREATE TABLE cell_meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cell_id UUID REFERENCES cells(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_cell_meeting UNIQUE (cell_id, date)
);

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
CREATE INDEX idx_worship_fixed_teams_team ON worship_fixed_teams(team_id);
CREATE INDEX idx_worship_fixed_team_members_preset ON worship_fixed_team_members(preset_id);
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
CREATE TRIGGER update_worship_fixed_teams_updated_at BEFORE UPDATE ON worship_fixed_teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_songs_updated_at BEFORE UPDATE ON songs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cells_updated_at BEFORE UPDATE ON cells
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
