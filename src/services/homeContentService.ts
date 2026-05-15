import { supabase } from "@/lib/supabaseClient";

export type HomeBanner = {
  eyebrow: string;
  title: string;
  subtitle: string;
  image_url: string;
  cta_label: string;
  cta_href: string;
  secondary_cta_label: string;
  secondary_cta_href: string;
};

export type HomeHighlight = {
  title: string;
  description: string;
};

export type HomeMinistry = {
  title: string;
  description: string;
};

export type HomeFixedEvent = {
  title: string;
  weekday: string;
  times: string;
  location: string;
  description: string;
};

export type HomeEvent = {
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  image_url: string;
};

export type HomePhoto = {
  title: string;
  image_url: string;
};

export type HomeGalleryItem = {
  title: string;
  url: string;
  type: "image" | "video";
};

export type HomeGallery = {
  title: string;
  description: string;
  cover_url: string;
  date: string;
  featured: boolean;
  items: HomeGalleryItem[];
};

export type HomeContent = {
  brand_name: string;
  primary_color: string;
  accent_color: string;
  hero: HomeBanner;
  about: {
    eyebrow: string;
    title: string;
    description: string;
    image_url: string;
    mission_title: string;
    mission_description: string;
    vision_title: string;
    vision_description: string;
  };
  visit: {
    eyebrow: string;
    title: string;
    description: string;
    first_time_label: string;
    map_url: string;
  };
  highlights: HomeHighlight[];
  ministries: HomeMinistry[];
  fixed_events: HomeFixedEvent[];
  special_events: HomeEvent[];
  events: HomeEvent[];
  galleries: HomeGallery[];
  photos: HomePhoto[];
  contact: {
    address: string;
    service_times: string;
    whatsapp: string;
    instagram: string;
    email: string;
  };
};

export type HomeContentRecord = {
  id: string;
  content: HomeContent;
  published: boolean;
  updated_at: string | null;
};

const assetBase = import.meta.env.BASE_URL.endsWith("/")
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;

export const defaultHomeContent: HomeContent = {
  brand_name: "MKD",
  primary_color: "#29ABD4",
  accent_color: "#f8c56b",
  hero: {
    eyebrow: "Bem-vindo a nossa casa",
    title: "Uma igreja para adorar, pertencer e servir.",
    subtitle:
      "Um lugar para encontrar Jesus, construir familia e viver proposito com simplicidade, alegria e excelencia.",
    image_url: `${assetBase}images/church-home-hero.png`,
    cta_label: "Planejar visita",
    cta_href: "#visite",
    secondary_cta_label: "Acessar sistema",
    secondary_cta_href: "/login",
  },
  about: {
    eyebrow: "Quem somos",
    title: "Somos uma familia em movimento.",
    description:
      "Caminhamos juntos para amar a Deus, cuidar de pessoas e servir a cidade. Nossa casa existe para acolher, formar discipulos e criar ambientes onde cada pessoa possa crescer em fe.",
    image_url: `${assetBase}images/church-home-hero.png`,
    mission_title: "Nossa missao",
    mission_description:
      "Levar pessoas a conhecer Jesus e viver uma fe pratica, relacional e transformadora.",
    vision_title: "Nossa visao",
    vision_description:
      "Ser uma igreja saudavel, relevante e cheia de pessoas servindo com amor.",
  },
  visit: {
    eyebrow: "Visite-nos",
    title: "Sua primeira vez pode ser simples.",
    description:
      "Chegue alguns minutos antes, procure nossa equipe de recepcao e fique a vontade. Queremos que voce se sinta em casa desde a entrada.",
    first_time_label: "Falar com a recepcao",
    map_url: "",
  },
  highlights: [
    {
      title: "Adoracao viva",
      description: "Cultos preparados com zelo, presenca e participacao.",
    },
    {
      title: "Comunidade real",
      description: "Relacionamentos para caminhar, aprender e servir juntos.",
    },
    {
      title: "Cuidado pastoral",
      description: "Pessoas atentas a pessoas, com escuta, oracao e direcao.",
    },
    {
      title: "Proposito",
      description: "Ministerios organizados para cada dom encontrar lugar.",
    },
  ],
  ministries: [
    {
      title: "Louvor",
      description: "Adoracao, musica e preparo espiritual para os cultos.",
    },
    {
      title: "Danca",
      description: "Expressao, arte e adoracao com excelencia.",
    },
    {
      title: "Midia",
      description: "Comunicacao, transmissao, som, imagem e criatividade.",
    },
    {
      title: "Obreiros",
      description: "Recepcao, apoio, cuidado e organizacao da casa.",
    },
  ],
  fixed_events: [
    {
      title: "Culto de celebracao",
      weekday: "Domingo",
      times: "19h",
      location: "Auditorio principal",
      description: "Adoracao, palavra e comunhao para toda a familia.",
    },
    {
      title: "Manha de oracao",
      weekday: "Segunda a sexta",
      times: "5h, 6h, 7h e 18h",
      location: "Sala de oracao",
      description: "Turnos de intercessao durante o dia.",
    },
  ],
  special_events: [
    {
      title: "Pos culto jovem",
      date: "Sabado",
      time: "21h",
      location: "Espaco jovem",
      description: "Comunhao, conversa e tempo de amizade depois do culto.",
      image_url: "",
    },
    {
      title: "Noite de danca",
      date: "A definir",
      time: "",
      location: "Auditorio principal",
      description: "Uma noite de adoracao com arte, movimento e palavra.",
      image_url: "",
    },
  ],
  galleries: [
    {
      title: "Culto de celebração",
      description: "Momentos especiais da nossa comunidade.",
      cover_url: `${assetBase}images/church-home-hero.png`,
      date: "",
      featured: true,
      items: [
        {
          title: "Adoração",
          url: `${assetBase}images/church-home-hero.png`,
          type: "image",
        },
      ],
    },
  ],
  events: [],
  photos: [],
  contact: {
    address: "Av. Principal, 123",
    service_times: "Domingos as 19h",
    whatsapp: "",
    instagram: "",
    email: "",
  },
};

function mergeHomeContent(content?: Partial<HomeContent> | null): HomeContent {
  const legacyEvents = content?.events || [];
  const specialEvents =
    content?.special_events && content.special_events.length > 0
      ? content.special_events
      : legacyEvents.length > 0
        ? legacyEvents
        : defaultHomeContent.special_events;

  return {
    ...defaultHomeContent,
    ...(content || {}),
    hero: { ...defaultHomeContent.hero, ...(content?.hero || {}) },
    about: { ...defaultHomeContent.about, ...(content?.about || {}) },
    visit: { ...defaultHomeContent.visit, ...(content?.visit || {}) },
    contact: { ...defaultHomeContent.contact, ...(content?.contact || {}) },
    highlights:
      content?.highlights && content.highlights.length > 0
        ? content.highlights
        : defaultHomeContent.highlights,
    ministries:
      content?.ministries && content.ministries.length > 0
        ? content.ministries
        : defaultHomeContent.ministries,
    fixed_events:
      content?.fixed_events && content.fixed_events.length > 0
        ? content.fixed_events
        : defaultHomeContent.fixed_events,
    special_events: specialEvents,
    events: legacyEvents,
    galleries:
      content?.galleries !== undefined
        ? content.galleries
        : content?.photos && content.photos.length > 0
          ? [
              {
                title: "Galeria",
                description: "Momentos especiais da nossa comunidade.",
                cover_url: content.photos[0]?.image_url || "",
                date: "",
                featured: true,
                items: content.photos.map((photo) => ({
                  title: photo.title,
                  url: photo.image_url,
                  type: "image" as const,
                })),
              },
            ]
          : defaultHomeContent.galleries,
    photos: content?.photos || defaultHomeContent.photos,
  };
}

export const homeContentService = {
  async getPublished(): Promise<HomeContentRecord> {
    const { data, error } = await (supabase as any)
      .from("home_content")
      .select("*")
      .eq("id", "main")
      .eq("published", true)
      .maybeSingle();

    if (error) {
      console.warn("Home content unavailable, using fallback.", error.message);
      return {
        id: "main",
        content: defaultHomeContent,
        published: true,
        updated_at: null,
      };
    }

    return {
      id: data?.id || "main",
      content: mergeHomeContent(data?.content),
      published: data?.published ?? true,
      updated_at: data?.updated_at || null,
    };
  },

  async getDraft(): Promise<HomeContentRecord> {
    const { data, error } = await (supabase as any)
      .from("home_content")
      .select("*")
      .eq("id", "main")
      .maybeSingle();

    if (error) throw error;

    return {
      id: data?.id || "main",
      content: mergeHomeContent(data?.content),
      published: data?.published ?? true,
      updated_at: data?.updated_at || null,
    };
  },

  async save(content: HomeContent, published = true) {
    const { data: authData } = await supabase.auth.getUser();
    const { data: userProfile } = await supabase
      .from("users_profile")
      .select("id")
      .eq("auth_user_id", authData.user?.id || "")
      .maybeSingle();

    const normalizedContent = {
      ...content,
      events: content.special_events,
    };

    const { data, error } = await (supabase as any)
      .from("home_content")
      .upsert({
        id: "main",
        content: normalizedContent,
        published,
        updated_by: userProfile?.id || null,
        updated_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (error) throw error;
    return data as HomeContentRecord;
  },

  async uploadImage(file: File) {
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const safeName = file.name
      .replace(/\.[^/.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const path = `home/${Date.now()}-${safeName || "imagem"}.${ext}`;

    const { error } = await supabase.storage
      .from("site-media")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || "image/jpeg",
      });

    if (error) throw error;

    const { data } = supabase.storage.from("site-media").getPublicUrl(path);
    return data.publicUrl;
  },
};
