INSERT INTO public.audition_settings (key, enabled)
VALUES ('show_audition_registrations', TRUE)
ON CONFLICT (key) DO NOTHING;