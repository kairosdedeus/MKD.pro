ALTER TABLE public.audition_responses
  ADD COLUMN IF NOT EXISTS vida_devocional_duvidas TEXT;

NOTIFY pgrst, 'reload schema';