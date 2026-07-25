import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import ffmpegPath from "ffmpeg-static";

const HOST = "127.0.0.1";
const PORT = Number(process.env.YOUMP3TUBE_PORT || 43921);
const PYTHON_PATH =
  process.env.YOUMP3TUBE_PYTHON ||
  join(process.cwd(), ".venv", "bin", "python");
const YTDLP_PATH = process.env.YOUMP3TUBE_YTDLP_PATH;
const FFMPEG_PATH = process.env.YOUMP3TUBE_FFMPEG_PATH || ffmpegPath;
const MODULE_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const MAX_REQUEST_BYTES = 16 * 1024;
const CONVERSION_TIMEOUT_MS = 5 * 60 * 1000;
const ALLOWED_ORIGINS = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  `http://${HOST}:${PORT}`,
]);

let conversionInProgress = false;

const server = createServer(async (request, response) => {
  const origin = request.headers.origin;

  if (!isAllowedOrigin(origin)) {
    sendJson(response, 403, { error: "Origem não autorizada." });
    return;
  }

  setCorsHeaders(response, origin);

  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  if (request.method === "GET" && request.url === "/health") {
    sendJson(response, 200, {
      ok: true,
      browser: findBrowser(),
      version: "1.0.0",
    });
    return;
  }

  if (request.method === "GET" && request.url === "/app.css") {
    await sendStaticFile(response, "app.css", "text/css; charset=utf-8");
    return;
  }

  if (request.method === "GET" && request.url === "/app.js") {
    await sendStaticFile(
      response,
      "app.js",
      "text/javascript; charset=utf-8",
    );
    return;
  }

  if (request.method === "GET" && request.url?.startsWith("/app")) {
    await sendStaticFile(response, "index.html", "text/html; charset=utf-8");
    return;
  }

  if (request.method !== "POST" || request.url !== "/convert") {
    sendJson(response, 404, { error: "Endpoint não encontrado." });
    return;
  }

  if (conversionInProgress) {
    sendJson(response, 409, {
      error: "Já existe uma conversão em andamento neste computador.",
    });
    return;
  }

  try {
    const body = await readJsonBody(request);
    const youtubeUrl = normalizeYoutubeUrl(body.youtube_url);
    const browser = findBrowser();

    conversionInProgress = true;
    const result = await convertToMp3(youtubeUrl, browser);

    response.writeHead(200, {
      "Content-Type": "audio/mpeg",
      "Content-Length": result.audio.length,
      "Content-Disposition": `attachment; filename="${result.fileName}"`,
      "X-Audio-Title": encodeURIComponent(result.title),
      "Cache-Control": "no-store",
    });
    response.end(result.audio);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[YouMp3Tube] Conversão falhou: ${message}`);
    sendJson(response, 502, { error: toUserMessage(message) });
  } finally {
    conversionInProgress = false;
  }
});

export const serverReady = new Promise((resolve, reject) => {
  server.once("error", reject);
  server.listen(PORT, HOST, () => {
    console.log("");
    console.log("YouMp3Tube está ativo.");
    console.log(`Endereço local: http://${HOST}:${PORT}`);
    console.log(`Navegador detectado: ${findBrowser()}`);
    console.log("Mantenha esta janela aberta durante a conversão.");
    console.log("");
    resolve();
  });
});

function isAllowedOrigin(origin) {
  return origin === undefined || ALLOWED_ORIGINS.has(origin);
}

function setCorsHeaders(response, origin) {
  if (origin) {
    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Vary", "Origin");
  }
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  response.setHeader(
    "Access-Control-Expose-Headers",
    "Content-Disposition, X-Audio-Title",
  );
  response.setHeader("Access-Control-Allow-Private-Network", "true");
}

async function readJsonBody(request) {
  let body = "";

  for await (const chunk of request) {
    body += chunk;
    if (Buffer.byteLength(body) > MAX_REQUEST_BYTES) {
      throw new Error("Requisição muito grande.");
    }
  }

  try {
    return JSON.parse(body);
  } catch {
    throw new Error("Dados da conversão inválidos.");
  }
}

function normalizeYoutubeUrl(value) {
  if (typeof value !== "string") {
    throw new Error("Informe um link do YouTube.");
  }

  let url;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error("Link do YouTube inválido.");
  }

  const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
  if (!["youtube.com", "m.youtube.com", "youtu.be"].includes(hostname)) {
    throw new Error("Link do YouTube inválido.");
  }

  return url.toString();
}

function findBrowser() {
  const configuredBrowser = process.env.YOUMP3TUBE_BROWSER?.trim();
  if (configuredBrowser) return configuredBrowser;

  const browserProfiles = [
    ["chrome", join(homedir(), "Library/Application Support/Google/Chrome")],
    [
      "edge",
      join(homedir(), "Library/Application Support/Microsoft Edge"),
    ],
    ["firefox", join(homedir(), "Library/Application Support/Firefox")],
  ];

  return (
    browserProfiles.find(([, profilePath]) => existsSync(profilePath))?.[0] ||
    "chrome"
  );
}

async function convertToMp3(youtubeUrl, browser) {
  if (!YTDLP_PATH && !existsSync(PYTHON_PATH)) {
    throw new Error("O yt-dlp não está instalado. Execute o instalador novamente.");
  }
  if (!FFMPEG_PATH) {
    throw new Error("O FFmpeg local não foi encontrado.");
  }

  const workDirectory = await mkdtemp(join(tmpdir(), "yoump3tube-"));
  const outputTemplate = join(workDirectory, "audio.%(ext)s");

  try {
    const ytDlpPrefix = YTDLP_PATH ? [] : ["-m", "yt_dlp"];
    const nodeRuntime = process.env.YOUMP3TUBE_NODE_RUNTIME || process.execPath;
    const args = [
      ...ytDlpPrefix,
      "--cookies-from-browser",
      browser,
      "--js-runtimes",
      `node:${nodeRuntime}`,
      "--remote-components",
      "ejs:github",
      "--no-playlist",
      "--extract-audio",
      "--audio-format",
      "mp3",
      "--audio-quality",
      "128K",
      "--ffmpeg-location",
      FFMPEG_PATH,
      "--no-warnings",
      "--print",
      "after_move:%(title)s",
      "--output",
      outputTemplate,
      youtubeUrl,
    ];
    const { stdout } = await runProcess(YTDLP_PATH || PYTHON_PATH, args);
    const title = stdout.trim().split(/\r?\n/).at(-1) || "audio-youtube";
    const audio = await readFile(join(workDirectory, "audio.mp3"));

    return {
      audio,
      title,
      fileName: `${sanitizeFileName(title)}.mp3`,
    };
  } finally {
    await rm(workDirectory, { recursive: true, force: true });
  }
}

function runProcess(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        PYTHONUNBUFFERED: "1",
        ELECTRON_RUN_AS_NODE: "1",
      },
    });
    let stdout = "";
    let stderr = "";

    const timeout = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error("A conversão excedeu cinco minutos."));
    }, CONVERSION_TIMEOUT_MS);

    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
      process.stderr.write(chunk);
    });
    child.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.on("close", (exitCode) => {
      clearTimeout(timeout);
      if (exitCode === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(stderr.trim() || `yt-dlp encerrou com código ${exitCode}`));
      }
    });
  });
}

function sanitizeFileName(value) {
  const sanitized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 100);

  return sanitized || "audio-youtube";
}

function toUserMessage(message) {
  if (/could not copy.*cookie|database is locked|cookie/i.test(message)) {
    return "Não foi possível ler a sessão do navegador. Feche e abra novamente o navegador e tente outra vez.";
  }
  if (/sign in|login|not a bot/i.test(message)) {
    return "Abra o YouTube no navegador detectado, confirme que está conectado e tente novamente.";
  }
  if (/private video/i.test(message)) {
    return "O vídeo é privado ou sua conta não tem acesso.";
  }
  if (/video unavailable|not available/i.test(message)) {
    return "O vídeo não está disponível.";
  }
  if (/excedeu cinco minutos/i.test(message)) {
    return message;
  }
  return "Não foi possível converter este vídeo. Verifique o link e a sessão do YouTube.";
}

function sendJson(response, status, data) {
  if (response.headersSent) return;
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(data));
}

async function sendStaticFile(response, fileName, contentType) {
  try {
    const content = await readFile(join(MODULE_DIRECTORY, "ui", fileName));
    response.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": "no-store",
    });
    response.end(content);
  } catch {
    sendJson(response, 404, { error: "Interface não encontrada." });
  }
}
