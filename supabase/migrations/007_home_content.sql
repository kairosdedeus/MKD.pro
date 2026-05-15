-- ============================================================
-- Migration 007: Conteudo editavel da Home publica
-- Execute no SQL Editor do Supabase
-- ============================================================

CREATE TABLE IF NOT EXISTS public.home_content (
  id TEXT PRIMARY KEY DEFAULT 'main',
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  published BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES public.users_profile(id) ON DELETE SET NULL,
  CONSTRAINT home_content_singleton CHECK (id = 'main')
);

INSERT INTO public.home_content (id, content, published)
VALUES (
  'main',
  '{
    "brand_name": "MKD",
    "primary_color": "#29ABD4",
    "accent_color": "#f8c56b",
    "hero": {
      "title": "Uma casa para adorar, servir e caminhar juntos.",
      "subtitle": "Uma comunidade viva, simples e acolhedora para quem quer conhecer Jesus e crescer em familia.",
      "image_url": "/images/church-home-hero.png",
      "cta_label": "Acessar sistema",
      "cta_href": "/login"
    },
    "about": {
      "eyebrow": "Sobre nos",
      "title": "Gente cuidando de gente, com fe e excelencia.",
      "description": "Somos uma igreja em movimento, formada por pessoas que adoram, servem e constroem comunhao no dia a dia.",
      "image_url": "/images/church-home-hero.png"
    },
    "highlights": [
      {
        "title": "Adoracao viva",
        "description": "Cultos preparados com zelo, presenca e participacao."
      },
      {
        "title": "Comunidade",
        "description": "Relacionamentos reais para caminhar, aprender e servir."
      },
      {
        "title": "Proposito",
        "description": "Ministerios organizados para cuidar melhor de pessoas."
      }
    ],
    "events": [
      {
        "title": "Culto de celebracao",
        "date": "Domingo",
        "time": "19h",
        "location": "Auditorio principal",
        "description": "Um tempo de adoracao, palavra e comunhao para toda familia.",
        "image_url": ""
      }
    ],
    "photos": [],
    "contact": {
      "address": "Av. Principal, 123",
      "service_times": "Domingos as 19h",
      "whatsapp": "",
      "instagram": ""
    }
  }'::jsonb,
  true
)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.home_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "home_content_public_select" ON public.home_content;
CREATE POLICY "home_content_public_select" ON public.home_content
  FOR SELECT TO anon, authenticated
  USING (published = true OR auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "home_content_media_manage" ON public.home_content;
CREATE POLICY "home_content_media_manage" ON public.home_content
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.users_profile up
      JOIN public.user_profiles upr ON upr.user_id = up.id
      JOIN public.profiles p ON p.id = upr.profile_id
      WHERE up.auth_user_id = auth.uid()
        AND p.codigo IN ('gerencial', 'lider_midia', 'membro_midia')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.users_profile up
      JOIN public.user_profiles upr ON upr.user_id = up.id
      JOIN public.profiles p ON p.id = upr.profile_id
      WHERE up.auth_user_id = auth.uid()
        AND p.codigo IN ('gerencial', 'lider_midia', 'membro_midia')
    )
  );

INSERT INTO storage.buckets (id, name, public)
VALUES ('site-media', 'site-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "site_media_public_select" ON storage.objects;
CREATE POLICY "site_media_public_select"
ON storage.objects FOR SELECT
USING (bucket_id = 'site-media');

DROP POLICY IF EXISTS "site_media_media_insert" ON storage.objects;
CREATE POLICY "site_media_media_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'site-media'
  AND EXISTS (
    SELECT 1
    FROM public.users_profile up
    JOIN public.user_profiles upr ON upr.user_id = up.id
    JOIN public.profiles p ON p.id = upr.profile_id
    WHERE up.auth_user_id = auth.uid()
      AND p.codigo IN ('gerencial', 'lider_midia', 'membro_midia')
  )
);

DROP POLICY IF EXISTS "site_media_media_update" ON storage.objects;
CREATE POLICY "site_media_media_update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'site-media'
  AND EXISTS (
    SELECT 1
    FROM public.users_profile up
    JOIN public.user_profiles upr ON upr.user_id = up.id
    JOIN public.profiles p ON p.id = upr.profile_id
    WHERE up.auth_user_id = auth.uid()
      AND p.codigo IN ('gerencial', 'lider_midia', 'membro_midia')
  )
)
WITH CHECK (bucket_id = 'site-media');

DROP POLICY IF EXISTS "site_media_media_delete" ON storage.objects;
CREATE POLICY "site_media_media_delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'site-media'
  AND EXISTS (
    SELECT 1
    FROM public.users_profile up
    JOIN public.user_profiles upr ON upr.user_id = up.id
    JOIN public.profiles p ON p.id = upr.profile_id
    WHERE up.auth_user_id = auth.uid()
      AND p.codigo IN ('gerencial', 'lider_midia', 'membro_midia')
  )
);

SELECT 'Migration 007 aplicada: Home editavel habilitada.' AS resultado;
