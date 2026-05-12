import { useState, useEffect } from "react";

// ── Modo base: claro ou escuro ────────────────────────────────
export type ModeId = "light" | "dark";

// ── Paleta de cor de destaque ─────────────────────────────────
export type PaletteId = "violet" | "blue" | "emerald" | "rose" | "amber";

// ── Tamanho de fonte ──────────────────────────────────────────
export type FontSizeId = "sm" | "md" | "lg" | "xl";

export interface FontSizeOption {
  id: FontSizeId;
  label: string;
  description: string;
  scale: number; // multiplicador aplicado ao font-size do <html>
}

export const FONT_SIZES: FontSizeOption[] = [
  { id: "sm", label: "P", description: "Pequena", scale: 0.875 },
  { id: "md", label: "M", description: "Normal", scale: 1 },
  { id: "lg", label: "G", description: "Grande", scale: 1.125 },
  { id: "xl", label: "GG", description: "Muito grande", scale: 1.25 },
];

export interface Palette {
  id: PaletteId;
  name: string;
  color: string;
  hsl: string;
}

export const PALETTES: Palette[] = [
  { id: "blue", name: "Azul", color: "#3b82f6", hsl: "217 91% 60%" },
  { id: "violet", name: "Violeta", color: "#8b5cf6", hsl: "263 70% 58%" },
  { id: "emerald", name: "Verde", color: "#10b981", hsl: "160 84% 39%" },
  { id: "rose", name: "Rosa", color: "#f43f5e", hsl: "350 89% 60%" },
  { id: "amber", name: "Âmbar", color: "#f59e0b", hsl: "38 92% 50%" },
];

export interface ThemeConfig {
  mode: ModeId;
  palette: PaletteId;
}

export function useTheme() {
  const [mode, setModeState] = useState<ModeId>(
    () => (localStorage.getItem("theme-mode") as ModeId) || "light",
  );
  const [palette, setPaletteState] = useState<PaletteId>(
    () => (localStorage.getItem("theme-palette") as PaletteId) || "blue",
  );
  const [fontSize, setFontSizeState] = useState<FontSizeId>(
    () => (localStorage.getItem("theme-font-size") as FontSizeId) || "md",
  );

  useEffect(() => {
    applyTheme(mode, palette);
  }, [mode, palette]);

  useEffect(() => {
    applyFontSize(fontSize);
  }, [fontSize]);

  const setMode = (m: ModeId) => {
    setModeState(m);
    localStorage.setItem("theme-mode", m);
  };

  const setPalette = (p: PaletteId) => {
    setPaletteState(p);
    localStorage.setItem("theme-palette", p);
  };

  const setFontSize = (f: FontSizeId) => {
    setFontSizeState(f);
    localStorage.setItem("theme-font-size", f);
  };

  return {
    mode,
    palette,
    fontSize,
    setMode,
    setPalette,
    setFontSize,
    palettes: PALETTES,
    fontSizes: FONT_SIZES,
  };
}

export function applyFontSize(fontSize: FontSizeId) {
  const option = FONT_SIZES.find((f) => f.id === fontSize) || FONT_SIZES[1];
  // Aplica como font-size no <html> — todos os rem/em herdam automaticamente
  document.documentElement.style.fontSize = `${option.scale * 16}px`;
}

export function applyTheme(mode: ModeId, palette: PaletteId) {
  const root = document.documentElement;

  if (mode === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }

  const p = PALETTES.find((p) => p.id === palette) || PALETTES[0];
  root.style.setProperty("--primary", p.hsl);

  const primaryFg = palette === "amber" ? "20 14% 10%" : "0 0% 100%";
  root.style.setProperty("--primary-foreground", primaryFg);
  root.style.setProperty("--ring", p.hsl);
}

// Inicializar ao carregar
const savedMode = (localStorage.getItem("theme-mode") as ModeId) || "light";
const savedPalette =
  (localStorage.getItem("theme-palette") as PaletteId) || "blue";
const savedFontSize =
  (localStorage.getItem("theme-font-size") as FontSizeId) || "md";
applyTheme(savedMode, savedPalette);
applyFontSize(savedFontSize);
