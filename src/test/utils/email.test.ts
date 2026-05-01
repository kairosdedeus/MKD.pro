import { describe, it, expect } from 'vitest'

// Replicar a função de geração de email para teste
function removeAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function generateEmail(nome: string, sobrenome: string): string {
  const first = removeAccents(nome.trim().charAt(0)).toLowerCase()
  const parts = sobrenome.trim().split(' ').filter(s => s.length > 0)
  const last = removeAccents(parts[parts.length - 1] || sobrenome).toLowerCase()
  return `${first}${last}@mkd.com`
}

describe('generateEmail', () => {
  it('gera email com inicial + último sobrenome', () => {
    expect(generateEmail('Michael', 'Felipe Cabrera')).toBe('mcabrera@mkd.com')
  })

  it('gera email com sobrenome único', () => {
    expect(generateEmail('João', 'Silva')).toBe('jsilva@mkd.com')
  })

  it('remove acentos do nome', () => {
    expect(generateEmail('Ângela', 'Souza')).toBe('asouza@mkd.com')
  })

  it('remove acentos do sobrenome', () => {
    expect(generateEmail('Maria', 'Gonçalves')).toBe('mgoncalves@mkd.com')
  })

  it('converte para minúsculas', () => {
    expect(generateEmail('PEDRO', 'SANTOS')).toBe('psantos@mkd.com')
  })

  it('usa último sobrenome quando há múltiplos', () => {
    expect(generateEmail('Ana', 'Paula Souza Costa')).toBe('acosta@mkd.com')
  })

  it('ignora espaços extras', () => {
    expect(generateEmail('  Lucas  ', '  Ferreira  ')).toBe('lferreira@mkd.com')
  })
})
