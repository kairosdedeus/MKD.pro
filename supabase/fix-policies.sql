-- =====================================================
-- CORREÇÃO DE POLÍTICAS - Execute este arquivo
-- se você teve erro de "column reference is ambiguous"
-- =====================================================

-- Remover políticas antigas que podem ter erro
DROP POLICY IF EXISTS "Membros podem ver suas células" ON cells;
DROP POLICY IF EXISTS "Gerencial e líderes podem atualizar células" ON cells;

-- Recriar políticas corrigidas
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

CREATE POLICY "Gerencial e líderes podem atualizar células"
    ON cells FOR UPDATE
    USING (is_gerencial() OR is_cell_leader(cells.id));
