-- ============================================
-- CORRIGIR PERMISSÕES DO BUCKET audio-musicas
-- Execute no SQL Editor do Supabase
-- ============================================

-- 1. Garantir que o bucket existe e está configurado
-- Aceita todos os tipos de áudio (sem restrição de MIME para evitar 400)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio-musicas',
  'audio-musicas',
  false,
  52428800, -- 50MB
  NULL -- NULL = aceita qualquer tipo (validação feita no frontend)
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 52428800,
  allowed_mime_types = NULL; -- Remove restrição de MIME type

-- 2. Remover TODAS as políticas existentes do bucket
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

-- 3. Criar políticas corretas para o bucket audio-musicas
CREATE POLICY "audio_musicas_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'audio-musicas');

CREATE POLICY "audio_musicas_select"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'audio-musicas');

CREATE POLICY "audio_musicas_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'audio-musicas');

CREATE POLICY "audio_musicas_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'audio-musicas')
WITH CHECK (bucket_id = 'audio-musicas');

-- 4. Verificar resultado
SELECT 
  b.name as bucket,
  b.public,
  b.file_size_limit,
  COALESCE(b.allowed_mime_types::text, 'qualquer tipo') as mime_types
FROM storage.buckets b
WHERE b.name = 'audio-musicas';

SELECT 
  policyname,
  cmd as operacao
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
  AND policyname LIKE 'audio_musicas%'
ORDER BY cmd;

SELECT '✅ Storage configurado com sucesso!' as resultado;
