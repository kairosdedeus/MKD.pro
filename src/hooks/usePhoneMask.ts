/**
 * Hook para máscara de telefone no padrão Campo Grande/MS
 * DDD padrão: 67
 * Formato: (67) 9XXXX-XXXX (celular) ou (67) XXXX-XXXX (fixo)
 */

export function formatPhone(value: string): string {
  // Remove tudo que não é número
  const digits = value.replace(/\D/g, '')

  // Limita a 11 dígitos (DDD + 9 dígitos celular)
  const limited = digits.slice(0, 11)

  if (limited.length === 0) return ''

  // Aplica DDD 67 automaticamente se o usuário não digitou DDD
  // (se começar com 9 ou outro dígito que não seja DDD)
  let normalized = limited

  // Se digitou só os números sem DDD (começa com 9 e tem até 9 dígitos)
  // mantém como está — o usuário pode digitar o DDD também

  if (normalized.length <= 2) {
    return `(${normalized}`
  }
  if (normalized.length <= 6) {
    return `(${normalized.slice(0, 2)}) ${normalized.slice(2)}`
  }
  if (normalized.length <= 10) {
    // Fixo: (67) XXXX-XXXX
    return `(${normalized.slice(0, 2)}) ${normalized.slice(2, 6)}-${normalized.slice(6)}`
  }
  // Celular: (67) 9XXXX-XXXX
  return `(${normalized.slice(0, 2)}) ${normalized.slice(2, 7)}-${normalized.slice(7)}`
}

export function usePhoneMask(
  value: string,
  onChange: (value: string) => void
) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value)
    onChange(formatted)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Permite: backspace, delete, tab, escape, enter, setas
    const allowed = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']
    if (allowed.includes(e.key)) return

    // Bloqueia qualquer tecla que não seja número
    if (!/^\d$/.test(e.key)) {
      e.preventDefault()
    }
  }

  return { handleChange, handleKeyDown }
}
