import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Music, 
  UsersRound,
  UserPlus,
  Music2
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { 
    name: 'Gerencial', 
    section: true,
    items: [
      { name: 'Dashboard', href: '/gerencial', icon: LayoutDashboard },
      { name: 'Usuários', href: '/gerencial/usuarios', icon: UserPlus },
      { name: 'Equipes', href: '/gerencial/equipes', icon: UsersRound },
      { name: 'Músicas', href: '/gerencial/musicas', icon: Music2 },
    ]
  },
  { 
    name: 'Ministérios', 
    section: true,
    items: [
      { name: 'Louvor', href: '/louvor', icon: Music },
    ]
  },
]

export function Sidebar() {
  return (
    <div className="hidden md:flex md:w-64 md:flex-col">
      <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-white border-r">
        <div className="flex items-center flex-shrink-0 px-4">
          <h1 className="text-xl font-bold text-gray-900">
            Escalas Ministeriais
          </h1>
        </div>
        <div className="mt-8 flex-grow flex flex-col">
          <nav className="flex-1 px-2 space-y-4">
            {navigation.map((section) => (
              <div key={section.name}>
                <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {section.name}
                </h3>
                <div className="mt-2 space-y-1">
                  {section.items.map((item) => (
                    <NavLink
                      key={item.name}
                      to={item.href}
                      className={({ isActive }) =>
                        cn(
                          'group flex items-center px-2 py-2 text-sm font-medium rounded-md',
                          isActive
                            ? 'bg-purple-100 text-purple-900'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        )
                      }
                    >
                      <item.icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </div>
      </div>
    </div>
  )
}
