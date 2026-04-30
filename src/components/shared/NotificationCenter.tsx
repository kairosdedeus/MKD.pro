import { Bell, Check, CheckCheck, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useNotifications, Notification } from '@/hooks/useNotifications'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'

const TYPE_COLORS: Record<string, string> = {
  new_schedule:     'bg-purple-100 text-purple-700',
  schedule_updated: 'bg-green-100 text-green-700',
  schedule_deleted: 'bg-red-100 text-red-700',
  info:             'bg-blue-100 text-blue-700',
}

export function NotificationCenter() {
  const navigate = useNavigate()
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications()

  const handleClick = (notif: Notification) => {
    markAsRead(notif.id)
    if (notif.link) navigate(notif.link)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-sm">
            Notificações
            {unreadCount > 0 && (
              <span className="ml-2 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                {unreadCount} nova(s)
              </span>
            )}
          </h3>
          <div className="flex gap-1">
            {unreadCount > 0 && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={markAllAsRead} title="Marcar todas como lidas">
                <CheckCheck className="h-4 w-4 text-gray-500" />
              </Button>
            )}
            {notifications.length > 0 && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={clearAll} title="Limpar todas">
                <Trash2 className="h-4 w-4 text-gray-500" />
              </Button>
            )}
          </div>
        </div>

        {/* Lista */}
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-gray-400">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhuma notificação</p>
            </div>
          ) : (
            notifications.map(notif => (
              <button
                key={notif.id}
                onClick={() => handleClick(notif)}
                className={`w-full text-left px-4 py-3 border-b last:border-0 hover:bg-gray-50 transition-colors ${
                  !notif.read ? 'bg-blue-50/50' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`text-xs px-1.5 py-0.5 rounded-full font-medium mt-0.5 flex-shrink-0 ${
                    TYPE_COLORS[notif.type] || TYPE_COLORS.info
                  }`}>
                    {notif.type === 'new_schedule' ? '🎵' :
                     notif.type === 'schedule_updated' ? '✅' :
                     notif.type === 'schedule_deleted' ? '🗑️' : 'ℹ️'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${!notif.read ? 'text-gray-900' : 'text-gray-600'}`}>
                      {notif.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{notif.message}</p>
                    <p className="text-xs text-gray-300 mt-1">
                      {formatDistanceToNow(notif.createdAt, { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                  {!notif.read && (
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
