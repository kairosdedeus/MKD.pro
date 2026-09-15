ALTER TABLE public.audition_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audition_responses_public_insert" ON public.audition_responses;

CREATE POLICY "audition_responses_public_insert"
ON public.audition_responses
FOR INSERT
TO public
WITH CHECK (true)