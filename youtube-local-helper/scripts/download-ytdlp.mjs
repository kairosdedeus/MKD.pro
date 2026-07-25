import { chmod, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const asset =
  process.platform === "win32"
    ? "yt-dlp.exe"
    : process.platform === "darwin"
      ? "yt-dlp_macos"
      : "yt-dlp_linux";
const outputName = process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp";
const outputDirectory = join(process.cwd(), "resources", "bin");
const outputPath = join(outputDirectory, outputName);
const downloadUrl = `https://github.com/yt-dlp/yt-dlp/releases/latest/download/${asset}`;

console.log(`Baixando ${asset}...`);
const response = await fetch(downloadUrl, { redirect: "follow" });
if (!response.ok) {
  throw new Error(`Download do yt-dlp falhou com HTTP ${response.status}.`);
}

await mkdir(outputDirectory, { recursive: true });
await writeFile(outputPath, Buffer.from(await response.arrayBuffer()));
if (process.platform !== "win32") await chmod(outputPath, 0o755);

console.log(`yt-dlp salvo em ${outputPath}`);
