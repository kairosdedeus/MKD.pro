import { describe, it, expect, beforeEach } from 'vitest'
import { THEMES } from '@/hooks/useTheme'

describe('THEMES', () => {
  it('tem exatamente 4 temas', () => {
    expect(THEMES).toHaveLength(4)
  })

  it('contém os temas esperados', () => {
    const ids = THEMES.map(t => t.id)
    expect(ids).toContain('light')
    expect(ids).toContain('dark')
    expect(ids).toContain('midnight')
    expect(ids).toContain('sepia')
  })

  it('cada tema tem nome, descrição e preview', () => {
    THEMES.forEach(theme => {
      expect(theme.name).toBeTruthy()
      expect(theme.description).toBeTruthy()
      expect(theme.preview).toHaveLength(3)
    })
  })

  it('previews são cores hex válidas', () => {
    const hexRegex = /^#[0-9a-fA-F]{6}$/
    THEMES.forEach(theme => {
      theme.preview.forEach(color => {
        expect(color).toMatch(hexRegex)
      })
    })
  })
})
