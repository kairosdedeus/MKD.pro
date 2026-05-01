import { useLocation, Link } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'

const ROUTE_LABELS: Record<string, string> = {
  gerencial:  'Gerencial',
  usuarios:   'Usuários',
  equipes:    'Equipes',
  musicas:    'Músicas',
  louvor:     'Louvor',
}

export function Breadcrumbs() {
  const { pathname } = useLocation()
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length <= 1) return null

  const crumbs = segments.map((seg, i) => ({
    label: ROUTE_LABELS[seg] || seg.charAt(0).toUpperCase() + seg.slice(1),
    href: '/' + segments.slice(0, i + 1).join('/'),
    isLast: i === segments.length - 1,
  }))

  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground px-6 py-2 border-b border-border bg-muted/30">
      <Link to="/gerencial" className="flex items-center hover:text-primary transition-colors">
        <Home className="h-3.5 w-3.5" />
      </Link>
      {crumbs.map(crumb => (
        <span key={crumb.href} className="flex items-center gap-1">
          <ChevronRight className="h-3.5 w-3.5 text-border" />
          {crumb.isLast ? (
            <span className="text-foreground font-medium">{crumb.label}</span>
          ) : (
            <Link to={crumb.href} className="hover:text-primary transition-colors">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  )
}
