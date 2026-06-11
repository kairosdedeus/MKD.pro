import { supabase } from "@/lib/supabaseClient";

export interface YoutubeConversionResult {
  audio_path: string;
  file_name: string;
  size_bytes: number;
  download_url?: string;
  cobalt_filename?: string;
}

export interface YoutubeApiStatus {
  ok: boolean;
  latency_ms?: number;
  error?: string;
  api_url: string;
}

const SETTINGS_KEY = "youtube_api_url";
// Instância pública com suporte a YouTube, sem turnstile (score 92%)
const DEFAULT_API_URL = "https://cobalt-api.meowing.de";

export const youtubeService = {
  /** Retorna a URL da API configurada (salva no localStorage) */
  getApiUrl(): string {
    return localStorage.getItem(SETTINGS_KEY) || DEFAULT_API_URL;
  },

  /** Salva a URL da API no localStorage */
  setApiUrl(url: string): void {
    const clean = url.trim().replace(/\/$/, "");
    localStorage.setItem(SETTINGS_KEY, clean);
  },

  /** Reseta para a URL padrão */
  resetApiUrl(): void {
    localStorage.removeItem(SETTINGS_KEY);
  },

  getDefaultApiUrl(): string {
    return DEFAULT_API_URL;
  },

  /**
   * Testa se a API cobalt está acessível e suporta YouTube.
   * Usa o endpoint ping_only da Edge Function.
   */
  async testConnection(apiUrl?: string): Promise<YoutubeApiStatus> {
    const url = apiUrl || this.getApiUrl();
    const start = Date.now();

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Sem sessão ativa");

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/youtube-to-audio`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            ping_only: true,
            api_url: url,
          }),
        },
      );

      const latency = Date.now() - start;
      const body = await res.json().catch(() => ({}));

      if (res.status === 404) {
        return {
          ok: false,
          error:
            "Edge Function não encontrada. Faça o deploy primeiro (aba Deploy).",
          api_url: url,
        };
      }

      if (!res.ok) {
        return {
          ok: false,
          error: body.error || `Erro ${res.status}`,
          latency_ms: latency,
          api_url: url,
        };
      }

      return { ok: true, latency_ms: latency, api_url: url };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : "Erro desconhecido",
        api_url: url,
      };
    }
  },

  /**
   * Converte um link do YouTube em áudio e salva no storage.
   * @param youtubeUrl URL do YouTube
   * @param songId ID da música para atualizar audio_path (opcional)
   */
  async convertToAudio(
    youtubeUrl: string,
    songId?: string,
  ): Promise<YoutubeConversionResult> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw new Error("Usuário não autenticado");

    const apiUrl = this.getApiUrl();

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/youtube-to-audio`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          youtube_url: youtubeUrl,
          song_id: songId,
          api_url: apiUrl,
        }),
      },
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || `Erro ${res.status}`);
    }

    return data as YoutubeConversionResult;
  },
};
