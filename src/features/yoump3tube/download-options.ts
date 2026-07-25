const RELEASE_BASE_URL =
  "https://github.com/kairosdedeus/MKD.pro/releases/latest/download";

export interface YouMp3TubeDownloadOption {
  id: "android" | "windows" | "macos";
  name: string;
  extension: `.${string}`;
  description: string;
  href: string;
  available: boolean;
}

export const YOUMP3TUBE_DOWNLOAD_OPTIONS: YouMp3TubeDownloadOption[] = [
  {
    id: "android",
    name: "Android",
    extension: ".apk",
    description: "Celulares e tablets Android",
    href: `${RELEASE_BASE_URL}/YouMp3Tube.apk`,
    available: true,
  },
  {
    id: "windows",
    name: "Windows",
    extension: ".exe",
    description: "Computadores com Windows 10 ou superior",
    href: `${RELEASE_BASE_URL}/YouMp3Tube-win-x64.exe`,
    available: false,
  },
  {
    id: "macos",
    name: "macOS",
    extension: ".dmg",
    description: "Computadores Mac",
    href: `${RELEASE_BASE_URL}/YouMp3Tube-mac-x64.dmg`,
    available: true,
  },
];
