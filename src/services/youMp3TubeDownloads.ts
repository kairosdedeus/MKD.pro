const RELEASE_BASE_URL =
  "https://github.com/kairosdedeus/MKD.pro/releases/latest/download";

export const YOUMP3TUBE_DOWNLOADS = {
  macos: `${RELEASE_BASE_URL}/YouMp3Tube-mac-x64.dmg`,
  windows: `${RELEASE_BASE_URL}/YouMp3Tube-win-x64.exe`,
  android: `${RELEASE_BASE_URL}/YouMp3Tube.apk`,
} as const;
