import { app, BrowserWindow, shell } from "electron";
import { existsSync } from "node:fs";
import { join } from "node:path";

const PROTOCOL = "yoump3tube";
const LOCAL_APP_URL = "http://127.0.0.1:43921/app";

let mainWindow;

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  configureRuntimePaths();
  app.setAsDefaultProtocolClient(PROTOCOL);

  app.on("second-instance", (_event, commandLine) => {
    showMainWindow(findProtocolUrl(commandLine));
  });

  app.whenReady().then(async () => {
    const { serverReady } = await import("./server.js");
    await serverReady;
    showMainWindow(findProtocolUrl(process.argv));
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });

  app.on("activate", () => {
    showMainWindow();
  });

  app.on("open-url", (event, url) => {
    event.preventDefault();
    showMainWindow(url);
  });
}

function configureRuntimePaths() {
  const resourcesDirectory = app.isPackaged
    ? process.resourcesPath
    : join(process.cwd(), "resources");
  const binaryName = process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp";
  const ytDlpPath = join(resourcesDirectory, "bin", binaryName);
  const ffmpegName = process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg";
  const ffmpegBinaryPath = app.isPackaged
    ? join(
        process.resourcesPath,
        "app.asar.unpacked",
        "node_modules",
        "ffmpeg-static",
        ffmpegName,
      )
    : undefined;

  if (existsSync(ytDlpPath)) {
    process.env.YOUMP3TUBE_YTDLP_PATH = ytDlpPath;
  }
  if (ffmpegBinaryPath && existsSync(ffmpegBinaryPath)) {
    process.env.YOUMP3TUBE_FFMPEG_PATH = ffmpegBinaryPath;
  }
  process.env.YOUMP3TUBE_NODE_RUNTIME = process.execPath;
}

function showMainWindow(protocolUrl) {
  const targetUrl = buildAppUrl(protocolUrl);

  if (!mainWindow || mainWindow.isDestroyed()) {
    mainWindow = new BrowserWindow({
      width: 560,
      height: 680,
      minWidth: 440,
      minHeight: 560,
      title: "YouMp3Tube",
      backgroundColor: "#0f172a",
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
      },
    });

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url);
      return { action: "deny" };
    });
  }

  mainWindow.loadURL(targetUrl);
  mainWindow.show();
  mainWindow.focus();
}

function buildAppUrl(protocolUrl) {
  if (!protocolUrl) return LOCAL_APP_URL;

  try {
    const url = new URL(protocolUrl);
    const mediaUrl = url.searchParams.get("url");
    return mediaUrl
      ? `${LOCAL_APP_URL}?url=${encodeURIComponent(mediaUrl)}`
      : LOCAL_APP_URL;
  } catch {
    return LOCAL_APP_URL;
  }
}

function findProtocolUrl(values) {
  return values.find((value) => value.startsWith(`${PROTOCOL}://`));
}
