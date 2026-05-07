-- ============================================================================
-- CRIAR TABELAS DE REGRAS DE RODÍZIO
-- ============================================================================
-- Este script cria as tabelas para armazenar regras de rodízio e preferências
-- dos membros da equipe de louvor, usando apenas IDs.
-- ============================================================================

-- ============================================================================
-- 1. TABELA DE REGRAS DE BAIXISTAS
-- ============================================================================
CREATE TABLE IF NOT EXISTS worship_bassist_rotation_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    is_fixed_team_x BOOLEAN DEFAULT false,
    cannot_play_when_drumming BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(team_member_id)
);

COMMENT ON TABLE worship_bassist_rotation_rules IS 'Regras de rodízio para baixistas';
COMMENT ON COLUMN worship_bassist_rotation_rules.order_index IS 'Ordem no rodízio (1, 2, 3...)';
COMMENT ON COLUMN worship_bassist_rotation_rules.is_fixed_team_x IS 'Se true, sempre toca na Equipe X';
COMMENT ON COLUMN worship_bassist_rotation_rules.cannot_play_when_drumming IS 'Se true, não pode tocar baixo quando está na bateria';

-- ============================================================================
-- 2. TABELA DE REGRAS DE BATERISTAS
-- ============================================================================
CREATE TABLE IF NOT EXISTS worship_drummer_rotation_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    is_fixed_team_x BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(team_member_id)
);

COMMENT ON TABLE worship_drummer_rotation_rules IS 'Regras de rodízio para bateristas';
COMMENT ON COLUMN worship_drummer_rotation_rules.order_index IS 'Ordem no rodízio (1, 2, 3...)';
COMMENT ON COLUMN worship_drummer_rotation_rules.is_fixed_team_x IS 'Se true, sempre toca na Equipe X';

-- ============================================================================
-- 3. TABELA DE REGRAS GERAIS DE MEMBROS
-- ============================================================================
CREATE TABLE IF NOT EXISTS worship_member_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
    can_be_minister BOOLEAN DEFAULT true,
    can_be_backing BOOLEAN DEFAULT true,
    preferred_function_id UUID REFERENCES team_functions(id),
    max_schedules_per_month INTEGER DEFAULT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(team_member_id)
);

COMMENT ON TABLE worship_member_rules IS 'Regras gerais e preferências de membros';
COMMENT ON COLUMN worship_member_rules.can_be_minister IS 'Pode ser ministro/ministra';
COMMENT ON COLUMN worship_member_rules.can_be_backing IS 'Pode ser backing vocal';
COMMENT ON COLUMN worship_member_rules.preferred_function_id IS 'Função preferida do membro';
COMMENT ON COLUMN worship_member_rules.max_schedules_per_month IS 'Máximo de escalas por mês (NULL = sem limite)';

-- ============================================================================
-- 4. ÍNDICES PARA PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_bassist_rotation_order 
ON worship_bassist_rotation_rules(order_index);

CREATE INDEX IF NOT EXISTS idx_bassist_rotation_team_member 
ON worship_bassist_rotation_rules(team_member_id);

CREATE INDEX IF NOT EXISTS idx_drummer_rotation_order 
ON worship_drummer_rotation_rules(order_index);

CREATE INDEX IF NOT EXISTS idx_drummer_rotation_team_member 
ON worship_drummer_rotation_rules(team_member_id);

CREATE INDEX IF NOT EXISTS idx_member_rules_team_member 
ON worship_member_rules(team_member_id);

CREATE INDEX IF NOT EXISTS idx_member_rules_function 
ON worship_member_rules(preferred_function_id);

-- ============================================================================
-- 5. ADICIONAR COLUNA CÓDIGO ÀS EQUIPES FIXAS
-- ============================================================================
ALTER TABLE worship_fixed_teams 
ADD COLUMN IF NOT EXISTS codigo VARCHAR(50);

-- Criar índice único
CREATE UNIQUE INDEX IF NOT EXISTS idx_worship_fixed_teams_codigo 
ON worship_fixed_teams(codigo) 
WHERE codigo IS NOT NULL;

COMMENT ON COLUMN worship_fixed_teams.codigo IS 'Código único e imutável da equipe (ex: equipe-x, equipe-a-1)';

-- ============================================================================
-- 6. TABELA DE MAPEAMENTO DE FUNÇÕES FIXAS (Michael e Vinicius)
-- ============================================================================
CREATE TABLE IF NOT EXISTS worship_fixed_function_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
    function_id UUID NOT NULL REFERENCES team_functions(id) ON DELETE CASCADE,
    is_always_assigned BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(team_member_id, function_id)
);

COMMENT ON TABLE worship_fixed_function_assignments IS 'Membros que sempre tocam a mesma função (ex: Michael sempre no teclado)';
COMMENT ON COLUMN worship_fixed_function_assignments.is_always_assigned IS 'Se true, sempre é escalado nesta função';

CREATE INDEX IF NOT EXISTS idx_fixed_function_team_member 
ON worship_fixed_function_assignments(team_member_id);

CREATE INDEX IF NOT EXISTS idx_fixed_function_function 
ON worship_fixed_function_assignments(function_id);

-- ============================================================================
-- 7. TRIGGERS PARA UPDATED_AT
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop triggers if exist
DROP TRIGGER IF EXISTS update_bassist_rotation_rules_updated_at ON worship_bassist_rotation_rules;
DROP TRIGGER IF EXISTS update_drummer_rotation_rules_updated_at ON worship_drummer_rotation_rules;
DROP TRIGGER IF EXISTS update_member_rules_updated_at ON worship_member_rules;
DROP TRIGGER IF EXISTS update_fixed_function_assignments_updated_at ON worship_fixed_function_assignments;

-- Create triggers
CREATE TRIGGER update_bassist_rotation_rules_updated_at 
BEFORE UPDATE ON worship_bassist_rotation_rules 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drummer_rotation_rules_updated_at 
BEFORE UPDATE ON worship_drummer_rotation_rules 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_member_rules_updated_at 
BEFORE UPDATE ON worship_member_rules 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fixed_function_assignments_updated_at 
BEFORE UPDATE ON worship_fixed_function_assignments 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- RESULTADO
-- ============================================================================
SELECT '✅ Tabelas de regras de rodízio criadas com sucesso!' as status;

