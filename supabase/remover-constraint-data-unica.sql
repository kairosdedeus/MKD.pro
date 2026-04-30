-- ============================================
-- REMOVER CONSTRAINT DE DATA ÚNICA NAS ESCALAS
-- Permite múltiplas escalas por equipe no mesmo dia
-- Ex: Culto manhã e culto noite no mesmo dia
-- ============================================

ALTER TABLE schedules DROP CONSTRAINT IF EXISTS unique_team_date;

-- Verificar que foi removida
SELECT 
    conname as constraint_name,
    contype as type
FROM pg_constraint
WHERE conrelid = 'schedules'::regclass;

SELECT '✅ Constraint removida! Agora é possível criar múltiplas escalas no mesmo dia.' as resultado;
