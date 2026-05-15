-- ============================================================
-- Migration 008: Secoes profissionais da Home
-- Execute no SQL Editor do Supabase apos a 007
-- ============================================================

UPDATE public.home_content
SET content =
  '{
    "hero": {
      "eyebrow": "Bem-vindo a nossa casa",
      "secondary_cta_label": "Acessar sistema",
      "secondary_cta_href": "/login"
    },
    "about": {
      "mission_title": "Nossa missao",
      "mission_description": "Levar pessoas a conhecer Jesus e viver uma fe pratica, relacional e transformadora.",
      "vision_title": "Nossa visao",
      "vision_description": "Ser uma igreja saudavel, relevante e cheia de pessoas servindo com amor."
    },
    "visit": {
      "eyebrow": "Visite-nos",
      "title": "Sua primeira vez pode ser simples.",
      "description": "Chegue alguns minutos antes, procure nossa equipe de recepcao e fique a vontade. Queremos que voce se sinta em casa desde a entrada.",
      "first_time_label": "Falar com a recepcao",
      "map_url": ""
    },
    "ministries": [
      {
        "title": "Louvor",
        "description": "Adoracao, musica e preparo espiritual para os cultos."
      },
      {
        "title": "Danca",
        "description": "Expressao, arte e adoracao com excelencia."
      },
      {
        "title": "Midia",
        "description": "Comunicacao, transmissao, som, imagem e criatividade."
      },
      {
        "title": "Obreiros",
        "description": "Recepcao, apoio, cuidado e organizacao da casa."
      }
    ],
    "fixed_events": [
      {
        "title": "Culto de celebracao",
        "weekday": "Domingo",
        "times": "19h",
        "location": "Auditorio principal",
        "description": "Adoracao, palavra e comunhao para toda a familia."
      },
      {
        "title": "Manha de oracao",
        "weekday": "Segunda a sexta",
        "times": "5h, 6h, 7h e 18h",
        "location": "Sala de oracao",
        "description": "Turnos de intercessao durante o dia."
      }
    ],
    "special_events": [
      {
        "title": "Pos culto jovem",
        "date": "Sabado",
        "time": "21h",
        "location": "Espaco jovem",
        "description": "Comunhao, conversa e tempo de amizade depois do culto.",
        "image_url": ""
      },
      {
        "title": "Noite de danca",
        "date": "A definir",
        "time": "",
        "location": "Auditorio principal",
        "description": "Uma noite de adoracao com arte, movimento e palavra.",
        "image_url": ""
      }
    ],
    "galleries": [
      {
        "title": "Culto de celebracao",
        "description": "Momentos especiais da nossa comunidade.",
        "cover_url": "/images/church-home-hero.png",
        "date": "",
        "featured": true,
        "items": [
          {
            "title": "Adoracao",
            "url": "/images/church-home-hero.png",
            "type": "image"
          }
        ]
      }
    ],
    "contact": {
      "email": ""
    }
  }'::jsonb || content,
  updated_at = NOW()
WHERE id = 'main';

SELECT 'Migration 008 aplicada: secoes profissionais da Home habilitadas.' AS resultado;
