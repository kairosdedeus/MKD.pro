import { describe, it, expect } from 'vitest'
import { formatPhone } from '@/hooks/usePhoneMask'

describe('formatPhone', () => {
  it('retorna vazio para entrada vazia', () => {
    expect(formatPhone('')).toBe('')
  })

  it('formata celular completo (67) 9XXXX-XXXX', () => {
    expect(formatPhone('67999991234')).toBe('(67) 99999-1234')
  })

  it('formata telefone fixo (67) XXXX-XXXX', () => {
    expect(formatPhone('6733334444')).toBe('(67) 3333-4444')
  })

  it('remove caracteres não numéricos', () => {
    expect(formatPhone('(67) 99999-1234')).toBe('(67) 99999-1234')
  })

  it('limita a 11 dígitos', () => {
    expect(formatPhone('679999912345678')).toBe('(67) 99999-1234')
  })

  it('formata parcialmente enquanto digita', () => {
    expect(formatPhone('67')).toBe('(67')
    expect(formatPhone('679')).toBe('(67) 9')
    expect(formatPhone('67999')).toBe('(67) 999')
    expect(formatPhone('679999')).toBe('(67) 9999')
    expect(formatPhone('6799991')).toBe('(67) 9999-1')
  })
})
