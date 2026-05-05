/**
 * Edge Function: youtube-to-audio
 *
 * Chama o microserviço yt-dlp (ytdlp-service/) para converter YouTube → MP3.
 * O microserviço usa yt-dlp com cookies do YouTube Premium opcionalmente.
 *
 * Variáveis de ambiente (Supabase Dashboard → Edge Functions → Secrets):
 *   YTDLP_SERVICE_URL  — URL do microserviço (ex: https://seu-app.up.railway.app)
 *   YTDLP_API_KEY      — API key configurada no microserviço
 *   SUPABASE_URL       — injetado automaticamente
 *   SUPABASE_SERVICE_ROLE_KEY — injetado automaticamente
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BUCKET = "audio-musicas";
const MAX_SIZE_BYTES = 50 * 1024 * 1024;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    // ── Auth ──────────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Não autorizado" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user) return json({ error: "Token inválido" }, 401);

    // ── Params ────────────────────────────────────────────────────
    const body = await req.json();
    const { youtube_url, song_id, ping_only } = body as {
      youtube_url?: string;
      song_id?: string;
      ping_only?: boolean;
    };

    const serviceUrl = Deno.env.get("YTDLP_SERVICE_URL")?.replace(/\/$/, "");
    const apiKey = Deno.env.get("YTDLP_API_KEY");

    // ── Ping ──────────────────────────────────────────────────────
    if (ping_only) {
      if (!serviceUrl) {
        return json(
          {
            ok: false,
            error:
              "YTDLP_SERVICE_URL não configurado. Faça o deploy do microserviço.",
          },
          400,
        );
      }

      try {
        const start = Date.now();
        const res = await fetch(`${serviceUrl}/health`, {
          signal: AbortSignal.timeout(8000),
        });
        const latency = Date.now() - start;

        if (!res.ok) {
          return json(
            { ok: false, error: `Serviço retornou ${res.status}` },
            502,
          );
        }

        const info = await res.json();
        return json({
          ok: true,
          latency_ms: latency,
          cookies_configured: info.cookies,
          service_url: serviceUrl,
        });
      } catch (e) {
        return json(
          {
            ok: false,
            error: `Serviço inacessível: ${e instanceof Error ? e.message : "timeout"}`,
          },
          502,
        );
      }
    }

    // ── Validar URL ───────────────────────────────────────────────
    if (!youtube_url) return json({ error: "youtube_url é obrigatório" }, 400);

    const ytPattern =
      /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/)|youtu\.be\/)[\w-]+/;
    if (!ytPattern.test(youtube_url)) {
      return json({ error: "URL do YouTube inválida" }, 400);
    }

    if (!serviceUrl) {
      return json(
        {
          error:
            "Serviço yt-dlp não configurado. Configure YTDLP_SERVICE_URL nas secrets da Edge Function.",
        },
        503,
      );
    }

    // ── Chamar microserviço ───────────────────────────────────────
    const serviceRes = await fetch(`${serviceUrl}/convert`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey || "",
      },
      body: JSON.stringify({ youtube_url }),
      signal: AbortSignal.timeout(150_000), // 2.5 min
    });

    const serviceData = await serviceRes.json();

    if (!serviceRes.ok) {
      return json(
        { error: serviceData.error || `Serviço retornou ${serviceRes.status}` },
        502,
      );
    }

    // ── Decodificar base64 e fazer upload ─────────────────────────
    const audioBase64: string = serviceData.audio_base64;
    if (!audioBase64) {
      return json({ error: "Serviço não retornou áudio" }, 502);
    }

    // Converter base64 → Uint8Array
    const binaryStr = atob(audioBase64);
    const audioBuffer = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      audioBuffer[i] = binaryStr.charCodeAt(i);
    }

    if (audioBuffer.byteLength > MAX_SIZE_BYTES) {
      return json({ error: "Arquivo muito grande (máximo 50MB)" }, 413);
    }

    // ── Upload para Storage ───────────────────────────────────────
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const fileName = `${timestamp}-${random}.mp3`;
    const filePath = `${user.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, audioBuffer, {
        contentType: "audio/mpeg",
        upsert: false,
      });

    if (uploadError) {
      return json({ error: `Upload falhou: ${uploadError.message}` }, 500);
    }

    // ── Atualizar song ────────────────────────────────────────────
    if (song_id) {
      await supabase
        .from("songs")
        .update({ audio_path: filePath })
        .eq("id", song_id);
    }

    return json({
      audio_path: filePath,
      file_name: fileName,
      size_bytes: audioBuffer.byteLength,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("timed out") || msg.includes("AbortError")) {
      return json(
        { error: "Timeout — vídeo muito longo ou serviço lento" },
        504,
      );
    }
    return json({ error: `Erro interno: ${msg}` }, 500);
  }
});

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
