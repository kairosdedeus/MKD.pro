import { createServer } from "http";
import { execFile } from "child_process";
import { promisify } from "util";
import { readFile, unlink, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { randomBytes } from "crypto";

const execFileAsync = promisify(execFile);
const PORT = process.env.PORT || 3000;
const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/$/, "");
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const YTDLP_API_KEY = process.env.YTDLP_API_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Defina SUPABASE_URL e SUPABASE_ANON_KEY.");
  process.exit(1);
}

let cookiesPath = null;
if (process.env.COOKIES_B64) {
  cookiesPath = join(tmpdir(), "yt-cookies.txt");
  const cookiesContent = Buffer.from(
    process.env.COOKIES_B64,
    "base64",
  ).toString("utf-8");
  await writeFile(cookiesPath, cookiesContent);
  console.log("Cookies do YouTube carregados");
}

try {
  const { stdout } = await execFileAsync("yt-dlp", ["--version"]);
  console.log(`yt-dlp disponível: ${stdout.trim()}`);
} catch {
  console.error("yt-dlp não encontrado.");
  process.exit(1);
}

const server = createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "content-type, authorization");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        ok: true,
        cookies: !!cookiesPath,
        auth: "supabase-authenticated-user",
      }),
    );
    return;
  }

  if (req.method !== "POST" || req.url !== "/convert") {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Endpoint não encontrado" }));
    return;
  }

  const hasValidApiKey =
    YTDLP_API_KEY && req.headers["x-api-key"] === YTDLP_API_KEY;
  const user = hasValidApiKey
    ? { id: "supabase-edge-function" }
    : await getAuthenticatedUser(req.headers.authorization);
  if (!user) {
    res.writeHead(401, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Usuário não autenticado" }));
    return;
  }

  let body = "";
  for await (const chunk of req) body += chunk;

  let youtube_url;
  try {
    ({ youtube_url } = JSON.parse(body));
  } catch {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "JSON inválido" }));
    return;
  }

  const ytPattern =
    /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/)|youtu\.be\/)[\w-]+/;
  if (!youtube_url || !ytPattern.test(youtube_url)) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "URL do YouTube inválida" }));
    return;
  }

  const outputPath = join(
    tmpdir(),
    `audio-${randomBytes(8).toString("hex")}.mp3`,
  );

  try {
    console.log(`Baixando áudio para o usuário ${user.id}`);
    const args = [
      "--no-playlist",
      "--extract-audio",
      "--audio-format",
      "mp3",
      "--audio-quality",
      "128K",
      "--no-warnings",
      "--quiet",
      "--print",
      "after_move:%(title)s",
    ];

    if (cookiesPath) args.push("--cookies", cookiesPath);
    args.push("-o", outputPath, youtube_url);

    const { stdout } = await execFileAsync("yt-dlp", args, {
      timeout: 120_000,
      maxBuffer: 1024 * 1024,
    });
    const audioBuffer = await readFile(outputPath);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        audio_base64: audioBuffer.toString("base64"),
        size_bytes: audioBuffer.length,
        format: "mp3",
        bitrate: "128k",
        title: stdout.trim().split(/\r?\n/).at(-1) || undefined,
      }),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Erro na conversão:", message);

    let userError = "Falha ao converter o vídeo";
    if (message.includes("Sign in") || message.includes("login")) {
      userError = "Este vídeo requer login no YouTube.";
    } else if (message.includes("Private video")) {
      userError = "Vídeo privado: não é possível baixar.";
    } else if (message.includes("not available")) {
      userError = "Vídeo não disponível nesta região.";
    } else if (message.includes("timed out")) {
      userError = "Timeout: vídeo muito longo ou conexão lenta.";
    }

    res.writeHead(502, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({ error: userError, detail: message.slice(0, 200) }),
    );
  } finally {
    unlink(outputPath).catch(() => {});
  }
});

server.listen(PORT, () => {
  console.log(`yt-dlp service rodando na porta ${PORT}`);
});

async function getAuthenticatedUser(authorization) {
  if (!authorization?.startsWith("Bearer ")) return null;

  try {
    const userResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: authorization,
      },
      signal: AbortSignal.timeout(10_000),
    });

    return userResponse.ok ? await userResponse.json() : null;
  } catch {
    return null;
  }
}
