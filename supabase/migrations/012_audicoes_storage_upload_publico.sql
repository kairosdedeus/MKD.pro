INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('audio-musicas', 'audio-musicas', FALSE, 52428800, NULL)
ON CONFLICT (id) DO UPDATE SET
  public = FALSE,
  file_size_limit = 52428800,
  allowed_mime_types = NULL;

DROP POLICY IF EXISTS "audio_musicas_public_insert" ON storage.objects;
CREATE POLICY "audio_musicas_public_insert"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'audio-musicas');

DROP POLICY IF EXISTS "audio_musicas_public_select" ON storage.objects;
CREATE POLICY "audio_musicas_public_select"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'audio-musicas');