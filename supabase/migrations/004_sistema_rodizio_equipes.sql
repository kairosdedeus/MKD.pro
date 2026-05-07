-- ============================================================================
-- SISTEMA DE RODÍZIO DE EQUIPES FIXAS
-- ============================================================================
-- Este script cria a estrutura para gerenciar o rodízio automático de equipes
-- Regra: Equipe X sempre no 1º final de semana, demais em sequência configurável
-- ============================================================================

-- ============================================================================
-- 1. ADICIONAR COLUNAS ÀS EQUIPES FIXAS
-- ============================================================================

-- Ordem no rodízio (0 = Equipe X fixa, 1+ = sequência de rodízio)
ALTER TABLE worship_fixed_teams 
ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- Se é a equipe fixa do primeiro final de semana
ALTER TABLE worship_fixed_teams 
ADD COLUMN IF NOT EXISTS is_first_weekend BOOLEAN DEFAULT false;

-- Se participa do rodízio
ALTER TABLE worship_fixed_teams 
ADD COLUMN IF NOT EXISTS is_active_rotation BOOLEAN DEFAULT true;

-- Comentários
COMMENT ON COLUMN worship_fixed_teams.order_index IS 'Ordem no rodízio (0 = primeira, 1+ = sequência)';
COMMENT ON COLUMN worship_fixed_teams.is_first_weekend IS 'Se true, sempre escala no 1º final de semana do mês';
COMMENT ON COLUMN worship_fixed_teams.is_active_rotation IS 'Se true, participa do rodízio automático';

-- ============================================================================
-- 2. CRIAR ÍNDICES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_worship_fixed_teams_order 
ON worship_fixed_teams(order_index) 
WHERE is_active_rotation = true;

CREATE INDEX IF NOT EXISTS idx_worship_fixed_teams_first_weekend 
ON worship_fixed_teams(is_first_weekend) 
WHERE is_first_weekend = true;

-- ============================================================================
-- 3. CONFIGURAR EQUIPES EXISTENTES
-- ============================================================================

-- Equipe X: sempre no 1º final de semana
UPDATE worship_fixed_teams 
SET 
    order_index = 0,
    is_first_weekend = true,
    is_active_rotation = true
WHERE codigo = 'equipe-x';

-- Sequência de rodízio: A1, B1, C1, A2, B2, C2
UPDATE worship_fixed_teams 
SET 
    order_index = 1,
    is_first_weekend = false,
    is_active_rotation = true
WHERE codigo = 'equipe-a-1';

UPDATE worship_fixed_teams 
SET 
    order_index = 2,
    is_first_weekend = false,
    is_active_rotation = true
WHERE codigo = 'equipe-b-1';

UPDATE worship_fixed_teams 
SET 
    order_index = 3,
    is_first_weekend = false,
    is_active_rotation = true
WHERE codigo = 'equipe-c-1';

UPDATE worship_fixed_teams 
SET 
    order_index = 4,
    is_first_weekend = false,
    is_active_rotation = true
WHERE codigo = 'equipe-a-2';

UPDATE worship_fixed_teams 
SET 
    order_index = 5,
    is_first_weekend = false,
    is_active_rotation = true
WHERE codigo = 'equipe-b-2';

UPDATE worship_fixed_teams 
SET 
    order_index = 6,
    is_first_weekend = false,
    is_active_rotation = true
WHERE codigo = 'equipe-c-2';

-- ============================================================================
-- 4. FUNÇÃO: OBTER PRÓXIMA EQUIPE NO RODÍZIO
-- ============================================================================

CREATE OR REPLACE FUNCTION get_next_rotation_team(
    p_team_id UUID,
    p_date DATE
) RETURNS UUID AS $$
DECLARE
    v_is_first_weekend BOOLEAN;
    v_last_team_order INTEGER;
    v_next_team_id UUID;
    v_rotation_teams INTEGER;
BEGIN
    -- Verificar se é o primeiro final de semana do mês
    v_is_first_weekend := EXTRACT(DAY FROM p_date) <= 7;
    
    -- Se for primeiro final de semana, retornar equipe X
    IF v_is_first_weekend THEN
        SELECT id INTO v_next_team_id
        FROM worship_fixed_teams
        WHERE is_first_weekend = true
          AND is_active_rotation = true
        LIMIT 1;
        
        RETURN v_next_team_id;
    END IF;
    
    -- Buscar última equipe escalada no mês anterior
    SELECT wft.order_index INTO v_last_team_order
    FROM schedules s
    JOIN worship_fixed_teams wft ON wft.id = s.fixed_team_id
    WHERE s.team_id = p_team_id
      AND s.date < DATE_TRUNC('month', p_date)
      AND wft.is_active_rotation = true
      AND wft.is_first_weekend = false
    ORDER BY s.date DESC
    LIMIT 1;
    
    -- Se não encontrou histórico, começar do primeiro
    IF v_last_team_order IS NULL THEN
        v_last_team_order := 0;
    END IF;
    
    -- Contar quantas equipes estão no rodízio (exceto equipe X)
    SELECT COUNT(*) INTO v_rotation_teams
    FROM worship_fixed_teams
    WHERE is_active_rotation = true
      AND is_first_weekend = false;
    
    -- Calcular próxima equipe (circular)
    SELECT id INTO v_next_team_id
    FROM worship_fixed_teams
    WHERE is_active_rotation = true
      AND is_first_weekend = false
      AND order_index = (v_last_team_order % v_rotation_teams) + 1
    LIMIT 1;
    
    -- Se não encontrou, pegar a primeira do rodízio
    IF v_next_team_id IS NULL THEN
        SELECT id INTO v_next_team_id
        FROM worship_fixed_teams
        WHERE is_active_rotation = true
          AND is_first_weekend = false
        ORDER BY order_index
        LIMIT 1;
    END IF;
    
    RETURN v_next_team_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_next_rotation_team IS 'Retorna a próxima equipe no rodízio baseado no histórico';

-- ============================================================================
-- 5. FUNÇÃO: OBTER SEQUÊNCIA DE RODÍZIO
-- ============================================================================

CREATE OR REPLACE FUNCTION get_rotation_sequence(p_team_id UUID)
RETURNS TABLE(
    team_id UUID,
    team_name TEXT,
    team_code TEXT,
    order_index INTEGER,
    is_first_weekend BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        wft.id,
        wft.nome,
        wft.codigo,
        wft.order_index,
        wft.is_first_weekend
    FROM worship_fixed_teams wft
    WHERE wft.is_active_rotation = true
    ORDER BY 
        CASE WHEN wft.is_first_weekend THEN 0 ELSE 1 END,
        wft.order_index;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_rotation_sequence IS 'Retorna a sequência completa de rodízio';

-- ============================================================================
-- 6. RESULTADO
-- ============================================================================

SELECT '✅ SISTEMA DE RODÍZIO CONFIGURADO' as status;

-- Mostrar configuração atual
SELECT 
    '📊 CONFIGURAÇÃO ATUAL' as secao,
    nome as equipe,
    codigo,
    order_index as ordem,
    CASE 
        WHEN is_first_weekend THEN '✅ 1º Final de Semana'
        ELSE '🔄 Rodízio'
    END as tipo,
    CASE 
        WHEN is_active_rotation THEN '✅ Ativa'
        ELSE '❌ Inativa'
    END as status
FROM worship_fixed_teams
ORDER BY 
    CASE WHEN is_first_weekend THEN 0 ELSE 1 END,
    order_index;

SELECT '🎉 SISTEMA PRONTO PARA USO!' as resultado;
