CREATE TABLE IF NOT EXISTS public.audition_settings (
  key TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.audition_settings (key, enabled)
VALUES ('show_audition_registrations', TRUE)
ON CONFLICT (key) DO NOTHING;

ALTER TABLE public.audition_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audition_settings_public_select"
  ON public.audition_settings;

CREATE POLICY "audition_settings_public_select"
ON public.audition_settings
FOR SELECT
TO anon, authenticated
USING (key IN ('show_audition_registrations', 'show_approved_results'));

DROP POLICY IF EXISTS "audition_settings_authenticated_manage"
  ON public.audition_settings;

CREATE POLICY "audition_settings_authenticated_manage"
ON public.audition_settings
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);