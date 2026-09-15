import { supabase } from "@/lib/supabaseClient";

export interface AudicaoSubmissionInput {
  nome?: string;
  sobrenome?: string;
  nome_completo?: string;
  email: string;
  telefone?: string;
  data_nascimento?: string;
  ministerio?: string;
  instrumentos?: string[] | string;
  outro_instrumento?: string;
  encontro_deus?: string;
  data_encontro?: string;
  escola_lideres?: string;
  data_escola?: string;
  celula?: string;
  celula_info?: string;
  tempo_igreja?: string;
  discipulado?: string;
  discipulador?: string;
  endereco?: string;
  mensagem?: string;
  chamado?: string;
  tempo_experiencia?: string;
  nivel?: string;
  leitura?: string;
  experiencia_anterior?: string;
  experiencia_detalhes?: string;
  disponibilidade?: string[] | string;
  compromisso_cultos?: string;
  compromisso_obs?: string;
  vida_devocional?: string;
  vida_devocional_duvidas?: string;
  video_metodo?: "upload" | "whatsapp";
  video_link?: string;
  video_file?: File | null;
  musica_escolhida?: string;
  observacoes_video?: string;
  declaracao?: boolean;
  assinatura?: string;
  data_envio?: string;
  status?: "pendente" | "aprovado" | "reprovado" | "analisado";
  analise?: string;
  [key: string]: any;
}

export interface AudicaoSubmission extends AudicaoSubmissionInput {
  id: string;
  created_at: string;
  updated_at?: string;
}

export type AudicaoStatus = "pendente" | "aprovado" | "reprovado";

export interface AudicaoApprovedParticipant {
  nome: string;
  sobrenome: string;
  telefone?: string | null;
  discipulador?: string | null;
}

const normalizeText = (value?: string) =>
  (value ?? "").trim().replace(/\s+/g, " ");

const audicaoAllowedFields = [
  "id",
  "nome",
  "sobrenome",
  "email",
  "telefone",
  "data_nascimento",
  "ministerio",
  "instrumentos",
  "outro_instrumento",
  "encontro_deus",
  "data_encontro",
  "escola_lideres",
  "data_escola",
  "celula",
  "celula_info",
  "tempo_igreja",
  "discipulado",
  "discipulador",
  "endereco",
  "mensagem",
  "chamado",
  "tempo_experiencia",
  "nivel",
  "leitura",
  "experiencia_anterior",
  "experiencia_detalhes",
  "disponibilidade",
  "compromisso_cultos",
  "compromisso_obs",
  "vida_devocional",
  "vida_devocional_duvidas",
  "video_metodo",
  "video_link",
  "musica_escolhida",
  "observacoes_video",
  "declaracao",
  "assinatura",
  "data_envio",
  "status",
  "analise",
  "created_at",
  "updated_at",
] as const;

export function normalizeAudicaoPayload(
  payload: Partial<AudicaoSubmissionInput>,
): Record<string, any> {
  const normalized: Record<string, any> = {};

  const nomeCompleto = normalizeText(
    payload.nome_completo ?? payload.nome ?? "",
  );
  const partesNome = nomeCompleto.split(/\s+/).filter(Boolean);
  const nome = partesNome[0] ?? "";
  const sobrenome = partesNome.slice(1).join(" ");

  for (const key of audicaoAllowedFields) {
    const value = payload[key as keyof AudicaoSubmissionInput];
    if (value === undefined) continue;

    const nextValue =
      typeof value === "string"
        ? normalizeText(value)
        : Array.isArray(value)
          ? value.map((item) => normalizeText(String(item)))
          : value;

    normalized[key] = nextValue;
  }

  normalized.nome = normalizeText(nome || payload.nome || "");
  normalized.sobrenome = normalizeText(sobrenome || payload.sobrenome || "");
  normalized.email = normalizeText(payload.email ?? "").toLowerCase();
  normalized.telefone = normalizeText(payload.telefone ?? "");
  normalized.ministerio = normalizeText(payload.ministerio ?? "");
  normalized.assinatura = normalizeText(
    payload.assinatura ?? payload.nome_completo ?? "",
  );

  if (normalized.video_metodo === "whatsapp") {
    normalized.video_link = "https://w.app/audicaomkd";
  }

  if (normalized.declaracao === undefined) {
    normalized.declaracao = false;
  }

  if (normalized.data_envio === undefined) {
    normalized.data_envio = new Date().toISOString();
  }

  return normalized;
}

const AUDICOES_APPROVED_RESULTS_KEY = "mkd.audicoes.approved-results.enabled";
const AUDICOES_REGISTRATION_SETTING = "show_audition_registrations";
const AUDICOES_APPROVED_RESULTS_SETTING = "show_approved_results";
export const AUDICOES_REGISTRATION_CHANGED_EVENT =
  "mkd:audicoes-registration-changed";

const getStoragePathFromUrl = (videoLink?: string | null) => {
  if (!videoLink || videoLink.includes("wa.me")) return null;

  try {
    const parsed = new URL(videoLink);
    const pathname = decodeURIComponent(parsed.pathname);
    const marker = "/storage/v1/object/";
    const index = pathname.indexOf(marker);

    if (index === -1) return null;

    const rest = pathname.slice(index + marker.length);
    const segments = rest.split("/").filter(Boolean);

    if (segments.length < 2) return null;

    const first = segments[0];
    const bucket = first === "public" || first === "sign" ? segments[1] : first;
    const fileParts =
      first === "public" || first === "sign"
        ? segments.slice(2)
        : segments.slice(1);

    if (!bucket || bucket !== "audio-musicas" || fileParts.length === 0) {
      return null;
    }

    return fileParts.join("/");
  } catch {
    return null;
  }
};

export const audicaoService = {
  async getRegistrationStatus() {
    const { data, error } = await supabase
      .from("audition_settings")
      .select("enabled")
      .eq("key", AUDICOES_REGISTRATION_SETTING)
      .maybeSingle();

    if (!error && data) return Boolean(data.enabled);
    if (error) {
      console.error(
        "Não foi possível consultar o status das inscrições:",
        error,
      );
    }
    return false;
  },

  async setRegistrationStatus(enabled: boolean) {
    const normalizedEnabled = Boolean(enabled);
    const { error } = await supabase.from("audition_settings").upsert(
      {
        key: AUDICOES_REGISTRATION_SETTING,
        enabled: normalizedEnabled,
      },
      { onConflict: "key" },
    );

    if (error) throw error;

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent(AUDICOES_REGISTRATION_CHANGED_EVENT, {
          detail: { enabled: normalizedEnabled },
        }),
      );
    }
  },

  async areApprovedResultsVisible() {
    const { data, error } = await supabase
      .from("audition_settings")
      .select("enabled")
      .eq("key", AUDICOES_APPROVED_RESULTS_SETTING)
      .maybeSingle();

    if (!error && data) return Boolean(data.enabled);
    if (typeof window === "undefined") return false;
    return (
      window.localStorage.getItem(AUDICOES_APPROVED_RESULTS_KEY) === "true"
    );
  },

  async setApprovedResultsVisible(enabled: boolean) {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        AUDICOES_APPROVED_RESULTS_KEY,
        String(Boolean(enabled)),
      );
    }

    const { error } = await supabase.from("audition_settings").upsert(
      {
        key: AUDICOES_APPROVED_RESULTS_SETTING,
        enabled: Boolean(enabled),
      },
      { onConflict: "key" },
    );

    if (error) throw error;
  },

  async getPlayableVideoUrl(videoLink?: string | null) {
    if (!videoLink) return null;
    if (videoLink.includes("wa.me")) return videoLink;

    const storagePath = getStoragePathFromUrl(videoLink);
    if (!storagePath) return videoLink;

    const { data, error } = await supabase.storage
      .from("audio-musicas")
      .createSignedUrl(storagePath, 60 * 60 * 24);

    if (error) {
      console.warn("Não foi possível gerar nova URL do vídeo:", error);
      return videoLink;
    }

    return data?.signedUrl || videoLink;
  },

  async deleteSubmission(id: string, videoLink?: string | null) {
    const filePath = getStoragePathFromUrl(videoLink);

    if (filePath) {
      const { error: storageError } = await supabase.storage
        .from("audio-musicas")
        .remove([filePath]);

      if (storageError) {
        console.warn(
          "Não foi possível remover o vídeo do storage:",
          storageError,
        );
      }
    }

    const { error } = await supabase
      .from("audition_responses")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return true;
  },

  async getSubmissions() {
    const { data, error } = await supabase
      .from("audition_responses")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as AudicaoSubmission[];
  },

  async getApprovedParticipants() {
    const { data, error } = await supabase
      .from("approved_audition_results")
      .select("nome, sobrenome, telefone, discipulador")
      .order("nome", { ascending: true });

    if (error) throw error;
    return (data ?? []) as AudicaoApprovedParticipant[];
  },

  async updateStatus(id: string, status: AudicaoStatus, analise?: string) {
    const payload = {
      status,
      analise: analise ?? "",
    };

    let { data, error } = await supabase
      .from("audition_responses")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error && error.message.toLowerCase().includes("analise")) {
      const fallback = await supabase
        .from("audition_responses")
        .update({ status })
        .eq("id", id)
        .select()
        .single();

      data = fallback.data;
      error = fallback.error;
    }

    if (error) throw error;
    return data as AudicaoSubmission;
  },

  async hasSubmitted(email: string) {
    const normalizedEmail = normalizeText(email).toLowerCase();

    const { data, error } = await supabase
      .from("audition_responses")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (error && error.code !== "PGRST116") throw error;
    return Boolean(data);
  },

  async submit(payload: Partial<AudicaoSubmissionInput>) {
    if (!(await this.getRegistrationStatus())) {
      throw new Error(
        "As inscrições para audições estão encerradas no momento.",
      );
    }

    const normalized = normalizeAudicaoPayload(payload);
    const email = normalized.email;

    if (!email) {
      throw new Error("E-mail é obrigatório.");
    }

    const alreadySubmitted = await this.hasSubmitted(email);
    if (alreadySubmitted) {
      throw new Error(
        "Essa pessoa já enviou uma inscrição. Cada participante pode enviar apenas uma vez.",
      );
    }

    if (payload.video_file instanceof File) {
      const folder = `audicoes-louvor/${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const fileName = `${folder}/${payload.video_file.name.replace(/\s+/g, "-")}`;

      const { error: uploadError } = await supabase.storage
        .from("audio-musicas")
        .upload(fileName, payload.video_file, {
          cacheControl: "3600",
          upsert: false,
          contentType: payload.video_file.type || "video/mp4",
        });

      if (uploadError) {
        throw new Error(
          `Não foi possível enviar o vídeo: ${uploadError.message || "verifique as permissões do storage e o tamanho do arquivo."}`,
        );
      }

      const { data: publicUrlData } = supabase.storage
        .from("audio-musicas")
        .getPublicUrl(fileName);

      let finalVideoUrl = publicUrlData.publicUrl || normalized.video_link;

      const { data: signedData, error: signedError } = await supabase.storage
        .from("audio-musicas")
        .createSignedUrl(fileName, 60 * 60 * 24);

      if (!signedError && signedData?.signedUrl) {
        finalVideoUrl = signedData.signedUrl;
      }

      normalized.video_link = finalVideoUrl || normalized.video_link;
      normalized.video_metodo = "upload";
    }

    const insertPayload = {
      ...normalized,
      nome: normalized.nome || "",
      sobrenome: normalized.sobrenome || "",
      email: normalized.email,
      telefone: normalized.telefone || null,
      status: "pendente",
      analise: normalized.analise || "",
    };

    let result = await supabase
      .from("audition_responses")
      .insert([insertPayload]);

    if (
      result.error &&
      result.error.message.toLowerCase().includes("analise")
    ) {
      const fallbackPayload = {
        ...insertPayload,
      };
      delete fallbackPayload.analise;

      result = await supabase
        .from("audition_responses")
        .insert([fallbackPayload]);
    }

    if (result.error) {
      if (
        result.error.code === "23505" ||
        result.error.message.toLowerCase().includes("duplicate")
      ) {
        throw new Error(
          "Essa pessoa já enviou uma inscrição. Cada participante pode enviar apenas uma vez.",
        );
      }
      throw result.error;
    }

    return {
      ...insertPayload,
      id: "",
      created_at: normalized.data_envio || new Date().toISOString(),
    } as AudicaoSubmission;
  },
};
