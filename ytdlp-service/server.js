/**
 * yt-dlp Audio Service
 *
 * Microserviço Node.js que converte YouTube → MP3 usando yt-dlp.
 * Suporta cookies do YouTube Premium para evitar bloqueios.
 *
 * Deploy: Railway, Render, Fly.io (qualquer plataforma com Node.js)
 *
 * Variáveis de ambiente:
 *   API_KEY        — chave secreta para autenticar chamadas (obrigatório)
 *   PORT           — porta do servidor (padrão: 3000)
 *   COOKIES_B64    — conteúdo do cookies.txt em base64 (opcional, YouTube Premium)
 */

import { createServer } from "http";
import { execFile } from "child_process";
import { promisify } from "util";
import { writeFile, unlink, readFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { randomBytes } from "crypto";

const execFileAsync = promisify(execFile);
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error(
    "❌ API_KEY não configurada. Defina a variável de ambiente API_KEY.",
  );
  process.exit(1);
}

// Salvar cookies em arquivo temporário se fornecidos
let cookiesPath = null;
if (process.env.COOKIES_B64) {
  cookiesPath = join(tmpdir(), "yt-cookies.txt");
  const cookiesContent = Buffer.from(
    process.env.COOKIES_B64,
    "base64",
  ).toString("utf-8");
  await writeFile(cookiesPath, cookiesContent);
  console.log("✅ Cookies do YouTube carregados");
}

// Verificar se yt-dlp está instalado
try {
  await execFileAsync("yt-dlp", ["--version"]);
  console.log("✅ yt-dlp disponível");
} catch {
  console.error("❌ yt-dlp não encontrado. Instale com: pip install yt-dlp");
  process.exit(1);
}

const server = createServer(async (req, res) => {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "content-type, x-api-key");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  // Health check
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, cookies: !!cookiesPath }));
    return;
  }

  // Autenticação
  const apiKey = req.headers["x-api-key"];
  if (apiKey !== API_KEY) {
    res.writeHead(401, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "API key inválida" }));
    return;
  }

  if (req.method !== "POST" || req.url !== "/convert") {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Endpoint não encontrado" }));
    return;
  }

  // Ler body
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

  if (!youtube_url) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "youtube_url é obrigatório" }));
    return;
  }

  // Validar URL
  const ytPattern =
    /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/)|youtu\.be\/)[\w-]+/;
  if (!ytPattern.test(youtube_url)) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "URL do YouTube inválida" }));
    return;
  }

  // Arquivo de saída temporário
  const tmpId = randomBytes(8).toString("hex");
  const outputPath = join(tmpdir(), `audio-${tmpId}.mp3`);

  try {
    console.log(`⬇️  Baixando: ${youtube_url}`);

    const args = [
      "--no-playlist",
      "--extract-audio",
      "--audio-format mp3",
      "--audio-quality 128K",
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

    // Ler arquivo gerado
    const audioBuffer = await readFile(outputPath);
    const sizeBytes = audioBuffer.length;

    console.log(`✅ Convertido: ${(sizeBytes / 1024 / 1024).toFixed(1)} MB`);

    // Retornar áudio como base64
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        audio_base64: audioBuffer.toString("base64"),
        size_bytes: sizeBytes,
        format: "mp3",
        bitrate: "128k",
        title: stdout.trim().split(/\r?\n/).at(-1) || undefined,
      }),
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("❌ Erro:", msg);

    // Mensagens de erro amigáveis
    let userError = "Falha ao converter o vídeo";
    if (msg.includes("Sign in") || msg.includes("login")) {
      userError =
        "Este vídeo requer login. Configure os cookies do YouTube Premium.";
    } else if (msg.includes("Private video")) {
      userError = "Vídeo privado — não é possível baixar.";
    } else if (msg.includes("not available")) {
      userError = "Vídeo não disponível nesta região.";
    } else if (msg.includes("timed out")) {
      userError = "Timeout — vídeo muito longo ou conexão lenta.";
    }

    res.writeHead(502, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: userError, detail: msg.slice(0, 200) }));
  } finally {
    // Limpar arquivo temporário
    unlink(outputPath).catch(() => {});
  }
});

server.listen(PORT, () => {
  console.log(`🎵 yt-dlp service rodando na porta ${PORT}`);
  console.log(
    `   Cookies: ${cookiesPath ? "✅ configurados" : "❌ não configurados (pode falhar em vídeos restritos)"}`,
  );
});
