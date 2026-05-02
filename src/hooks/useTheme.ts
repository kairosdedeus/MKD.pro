import { useState, useEffect } from 'react'

// ── Modo base: claro ou escuro ────────────────────────────────
export type ModeId = 'light' | 'dark'

// ── Paleta de cor de destaque ─────────────────────────────────
export type PaletteId = 'violet' | 'blue' | 'emerald' | 'rose' | 'amber'

export interface Palette {
  id: PaletteId
  name: string
  color: string      // hex para preview
  hsl: string        // valor HSL para CSS var
}

export const PALETTES: Palette[] = [
  { id: 'blue',    name: 'Azul',     color: '#3b82f6', hsl: '217 91% 60%' },
  { id: 'violet',  name: 'Violeta',  color: '#8b5cf6', hsl: '263 70% 58%' },
  { id: 'emerald', name: 'Verde',    color: '#10b981', hsl: '160 84% 39%' },
  { id: 'rose',    name: 'Rosa',     color: '#f43f5e', hsl: '350 89% 60%' },
  { id: 'amber',   name: 'Âmbar',   color: '#f59e0b', hsl: '38 92% 50%'  },
]

export interface ThemeConfig {
  mode: ModeId
  palette: PaletteId
}

export function useTheme() {
  const [mode, setModeState] = useState<ModeId>(() =>
    (localStorage.getItem('theme-mode') as ModeId) || 'light'
  )
  const [palette, setPaletteState] = useState<PaletteId>(() =>
    (localStorage.getItem('theme-palette') as PaletteId) || 'blue'
  )

  useEffect(() => {
    applyTheme(mode, palette)
  }, [mode, palette])

  const setMode = (m: ModeId) => {
    setModeState(m)
    localStorage.setItem('theme-mode', m)
  }

  const setPalette = (p: PaletteId) => {
    setPaletteState(p)
    localStorage.setItem('theme-palette', p)
  }

  return { mode, palette, setMode, setPalette, palettes: PALETTES }
}

export function applyTheme(mode: ModeId, palette: PaletteId) {
  const root = document.documentElement

  // ── Modo ──────────────────────────────────────────────────
  if (mode === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }

  // ── Paleta de cor primária ────────────────────────────────
  const p = PALETTES.find(p => p.id === palette) || PALETTES[0]
  root.style.setProperty('--primary', p.hsl)

  // Foreground do primary sempre branco (exceto âmbar)
  const primaryFg = palette === 'amber' ? '20 14% 10%' : '0 0% 100%'
  root.style.setProperty('--primary-foreground', primaryFg)

  // Ring = primary
  root.style.setProperty('--ring', p.hsl)
}

// Inicializar ao carregar
const savedMode    = (localStorage.getItem('theme-mode')    as ModeId)    || 'light'
const savedPalette = (localStorage.getItem('theme-palette') as PaletteId) || 'blue'
applyTheme(savedMode, savedPalette)
