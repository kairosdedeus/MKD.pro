import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Music, UsersRound, UserPlus, Music2, Menu, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const navigation = [
  {
    name: 'Gerencial',
    items: [
      { name: 'Dashboard', href: '/gerencial', icon: LayoutDashboard },
      { name: 'Usuários', href: '/gerencial/usuarios', icon: UserPlus },
      { name: 'Equipes', href: '/gerencial/equipes', icon: UsersRound },
      { name: 'Músicas', href: '/gerencial/musicas', icon: Music2 },
    ],
  },
  {
    name: 'Ministérios',
    items: [
      { name: 'Louvor', href: '/louvor', icon: Music },
    ],
  },
]

function SidebarContent({ onClose }: { onClose?: () => void }) {
  return (
    <div className="flex flex-col h-full sidebar-bg border-r">
      {/* Logo */}
      <div className="flex items-center justify-between px-4 pt-5 pb-4 flex-shrink-0">
        <div>
          <h1 className="text-lg font-bold text-foreground">Escalas</h1>
          <p className="text-xs font-medium" style={{ color: `hsl(var(--primary))` }}>Ministeriais</p>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="md:hidden">
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 pb-4 space-y-4 overflow-y-auto">
        {navigation.map(section => (
          <div key={section.name}>
            <h3 className="px-2 text-[10px] font-semibold uppercase tracking-widest mb-1"
              style={{ color: 'hsl(var(--sidebar-text))' }}>
              {section.name}
            </h3>
            <div className="space-y-0.5">
              {section.items.map(item => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  end={item.href === '/gerencial'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all',
                      isActive
                        ? 'bg-[hsl(var(--sidebar-active-bg))] text-[hsl(var(--sidebar-active-text))] font-semibold'
                        : 'text-[hsl(var(--sidebar-text))] hover:bg-accent hover:text-foreground'
                    )
                  }
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {item.name}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-[hsl(var(--sidebar-border))] flex-shrink-0">
        <p className="text-[11px]" style={{ color: 'hsl(var(--sidebar-text))' }}>MKD.pro © 2026</p>
      </div>
    </div>
  )
}

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-56 md:flex-col md:flex-shrink-0">
        <SidebarContent />
      </div>

      {/* Mobile: botão hamburguer no header */}
      <div className="md:hidden fixed top-3 left-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(true)}
          className="bg-background shadow-sm border border-border"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Mobile: overlay + drawer */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-64 md:hidden">
            <SidebarContent onClose={() => setMobileOpen(false)} />
          </div>
        </>
      )}
    </>
  )
}
