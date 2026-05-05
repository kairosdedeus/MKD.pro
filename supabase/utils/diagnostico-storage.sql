-- ============================================
-- SOLUÇÃO: Políticas baseadas em auth.uid()
-- Execute no SQL Editor do Supabase
-- ============================================

-- Remover todas as políticas existentes do storage.objects
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

-- Criar políticas usando auth.uid() IS NOT NULL
-- (funciona para qualquer usuário com sessão válida, independente do role JWT)
CREATE POLICY "storage_insert"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'audio-musicas'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "storage_select"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'audio-musicas'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "storage_update"
ON storage.objects FOR UPDATE
USING (bucket_id = 'audio-musicas' AND auth.uid() IS NOT NULL)
WITH CHECK (bucket_id = 'audio-musicas' AND auth.uid() IS NOT NULL);

CREATE POLICY "storage_delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'audio-musicas' AND auth.uid() IS NOT NULL);

-- Confirmar políticas
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY cmd;

-- Verificar se auth.uid() funciona nesta sessão
SELECT auth.uid() as uid_atual, auth.role() as role_atual;

SELECT '✅ Políticas com auth.uid() criadas!' as resultado;
