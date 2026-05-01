/**
 * Classes semânticas de tema — use estas em vez de cores hardcoded.
 * Todas respondem automaticamente ao modo claro/escuro e à paleta escolhida.
 */

// Avatares com inicial
export const avatarClass = 'bg-primary/15 text-primary font-semibold'

// Badges de status
export const statusBadge = {
  active:    'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  inactive:  'bg-muted text-muted-foreground',
  draft:     'bg-muted text-muted-foreground',
  published: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  completed: 'bg-primary/15 text-primary',
}

// Badges de função/instrumento
export const functionBadge = 'bg-primary/10 text-primary text-xs px-1.5 py-0.5 rounded font-medium'

// Cards de stats
export const statsIconBg = 'bg-primary/10 rounded-lg p-2'
export const statsIconColor = 'text-primary'
export const statsValue = 'text-2xl font-bold text-foreground'
export const statsLabel = 'text-xs text-muted-foreground'

// Itens de lista
export const listItem = 'flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent transition-colors'

// Texto de apoio
export const mutedText = 'text-muted-foreground'
export const smallMuted = 'text-xs text-muted-foreground'

// Calendário
export const calDaySelected = 'bg-primary text-primary-foreground'
export const calDayToday = 'border-2 border-primary font-bold'
export const calDayHover = 'hover:bg-accent'
export const calDot = 'w-1.5 h-1.5 rounded-full bg-primary'
export const calDotSelected = 'w-1.5 h-1.5 rounded-full bg-primary-foreground'

// Botão primário inline
export const btnPrimary = 'bg-primary hover:bg-primary/90 text-primary-foreground'
export const btnOutlinePrimary = 'border-primary/30 text-primary hover:bg-primary/10'
