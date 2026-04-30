import { useState, useEffect } from 'react'

export type ThemeId = 'light' | 'dark' | 'midnight' | 'sepia'

export interface Theme {
  id: ThemeId
  name: string
  description: string
  preview: string[]  // cores de preview [bg, accent, text]
}

export const THEMES: Theme[] = [
  {
    id: 'light',
    name: 'Luz',
    description: 'Claro e limpo',
    preview: ['#ffffff', '#9333ea', '#1a1a2e'],
  },
  {
    id: 'dark',
    name: 'Escuro',
    description: 'Profissional',
    preview: ['#0f172a', '#a855f7', '#e2e8f0'],
  },
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Azul elegante',
    preview: ['#0d1b2a', '#3b82f6', '#bfdbfe'],
  },
  {
    id: 'sepia',
    name: 'Sepia',
    description: 'Tom quente',
    preview: ['#fdf6e3', '#b45309', '#3d2b1f'],
  },
]

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    return (localStorage.getItem('theme') as ThemeId) || 'light'
  })

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const setTheme = (id: ThemeId) => {
    setThemeState(id)
    localStorage.setItem('theme', id)
  }

  return { theme, setTheme, themes: THEMES }
}

export function applyTheme(theme: ThemeId) {
  const root = document.documentElement
  // Remove todos os temas
  root.classList.remove('dark', 'theme-midnight', 'theme-sepia')

  switch (theme) {
    case 'dark':
      root.classList.add('dark')
      break
    case 'midnight':
      root.classList.add('dark', 'theme-midnight')
      break
    case 'sepia':
      root.classList.add('theme-sepia')
      break
    // 'light' é o padrão, sem classes
  }
}

// Inicializar tema ao carregar
const savedTheme = (localStorage.getItem('theme') as ThemeId) || 'light'
applyTheme(savedTheme)
