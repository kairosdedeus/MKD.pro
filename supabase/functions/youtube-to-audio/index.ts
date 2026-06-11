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

    const body = await req.json();
    const { youtube_url, song_id, ping_only } = body as {
      youtube_url?: string;
      song_id?: string;
      ping_only?: boolean;
    };

    const serviceUrl = Deno.env.get("YTDLP_SERVICE_URL")?.replace(/\/$/, "");

    if (song_id && !(await isManagementUser(supabase, user.id))) {
      return json(
        { error: "Apenas usuários gerenciais podem vincular áudio a músicas" },
        403,
      );
    }

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
          signal: AbortSignal.timeout(90_000),
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
      } catch (error) {
        return json(
          {
            ok: false,
            error: `Serviço inacessível: ${
              error instanceof Error ? error.message : "timeout"
            }`,
          },
          502,
        );
      }
    }

    if (!youtube_url) {
      return json({ error: "youtube_url é obrigatório" }, 400);
    }

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

    const serviceRes = await fetch(`${serviceUrl}/convert`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({ youtube_url }),
      signal: AbortSignal.timeout(150_000),
    });

    const serviceData = await serviceRes.json();
    if (!serviceRes.ok) {
      return json(
        { error: serviceData.error || `Serviço retornou ${serviceRes.status}` },
        502,
      );
    }

    const audioBase64: string = serviceData.audio_base64;
    if (!audioBase64) {
      return json({ error: "Serviço não retornou áudio" }, 502);
    }

    const binaryStr = atob(audioBase64);
    const audioBuffer = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      audioBuffer[i] = binaryStr.charCodeAt(i);
    }

    if (audioBuffer.byteLength > MAX_SIZE_BYTES) {
      return json({ error: "Arquivo muito grande (máximo 50MB)" }, 413);
    }

    const fileName = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.mp3`;
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

    if (song_id) {
      const { data: song, error: songError } = await supabase
        .from("songs")
        .select("id")
        .eq("id", song_id)
        .maybeSingle();

      if (songError || !song) {
        await supabase.storage.from(BUCKET).remove([filePath]);
        return json({ error: "Música não encontrada" }, 404);
      }

      const { error: updateError } = await supabase
        .from("songs")
        .update({ audio_path: filePath })
        .eq("id", song_id);

      if (updateError) {
        await supabase.storage.from(BUCKET).remove([filePath]);
        return json(
          { error: `Não foi possível vincular o áudio: ${updateError.message}` },
          500,
        );
      }
    }

    const { data: signedUrlData } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(filePath, 10 * 60, {
        download: serviceData.title
          ? `${sanitizeFileName(serviceData.title)}.mp3`
          : fileName,
      });

    return json({
      audio_path: filePath,
      file_name: fileName,
      size_bytes: audioBuffer.byteLength,
      download_url: signedUrlData?.signedUrl,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("timed out") || message.includes("AbortError")) {
      return json(
        { error: "Timeout: vídeo muito longo ou serviço lento" },
        504,
      );
    }
    return json({ error: `Erro interno: ${message}` }, 500);
  }
});

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function sanitizeFileName(value: string): string {
  return (
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 100) || "audio"
  );
}

async function isManagementUser(
  supabase: ReturnType<typeof createClient>,
  authUserId: string,
): Promise<boolean> {
  const { data: internalUser } = await supabase
    .from("users_profile")
    .select("id")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (!internalUser) return false;

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("profiles!inner(codigo)")
    .eq("user_id", internalUser.id)
    .eq("profiles.codigo", "gerencial")
    .limit(1)
    .maybeSingle();

  return !!profile;
}
