DROP POLICY IF EXISTS "audition_settings_public_select" ON public.audition_settings;

CREATE POLICY "audition_settings_public_select"
ON public.audition_settings
FOR SELECT
TO anon, authenticated
USING (key IN ('show_audition_registrations', 'show_approved_results'));