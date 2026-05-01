import { supabase } from '@/lib/supabaseClient'

function removeAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export function generateEmailPrefix(nome: string, sobrenome: string): string {
  const first = removeAccents(nome.trim().charAt(0)).toLowerCase()
  const parts = sobrenome.trim().split(' ').filter(Boolean)
  const last = removeAccents(parts[parts.length - 1] || sobrenome).toLowerCase()
  return `${first}${last}`.replace(/[^a-z0-9]/g, '')
}

export function generateEmail(nome: string, sobrenome: string): string {
  const prefix = generateEmailPrefix(nome, sobrenome)
  return prefix ? `${prefix}@mkd.com` : ''
}

export async function getAvailableGeneratedEmail(
  nome: string,
  sobrenome: string,
  currentUserId?: string,
): Promise<string> {
  const prefix = generateEmailPrefix(nome, sobrenome)
  if (!prefix) return ''

  const { data, error } = await supabase
    .from('users_profile')
    .select('id, email')
    .ilike('email', `${prefix}%@mkd.com`)

  if (error) throw error

  const usedEmails = new Set(
    (data || [])
      .filter((user: any) => user.id !== currentUserId)
      .map((user: any) => String(user.email).toLowerCase()),
  )

  const firstCandidate = `${prefix}@mkd.com`
  if (!usedEmails.has(firstCandidate)) return firstCandidate

  let suffix = 2
  while (usedEmails.has(`${prefix}${suffix}@mkd.com`)) {
    suffix += 1
  }

  return `${prefix}${suffix}@mkd.com`
}

export function isDuplicateGeneratedEmailError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String((error as any)?.message || error)
  return message.includes('users_email_partial_key') ||
    message.toLowerCase().includes('duplicate key value') ||
    message.toLowerCase().includes('already registered')
}
