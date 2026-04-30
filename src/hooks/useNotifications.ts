import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuthStore } from '@/stores/authStore'

export interface Notification {
  id: string
  type: 'new_schedule' | 'schedule_updated' | 'schedule_deleted' | 'info'
  title: string
  message: string
  read: boolean
  createdAt: Date
  link?: string
}

let notificationId = 0
const generateId = () => `notif-${++notificationId}-${Date.now()}`

export function useNotifications() {
  const { user } = useAuthStore()
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = useCallback((notif: Omit<Notification, 'id' | 'read' | 'createdAt'>) => {
    setNotifications(prev => [{
      ...notif,
      id: generateId(),
      read: false,
      createdAt: new Date(),
    }, ...prev].slice(0, 50)) // máximo 50 notificações
  }, [])

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }, [])

  const clearAll = useCallback(() => setNotifications([]), [])

  const unreadCount = notifications.filter(n => !n.read).length

  // Supabase Realtime — escutar novas escalas
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('schedules-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'schedules' },
        (payload) => {
          const schedule = payload.new as any
          addNotification({
            type: 'new_schedule',
            title: '🎵 Nova escala criada',
            message: schedule.title
              ? `"${schedule.title}" para ${schedule.date}`
              : `Nova escala para ${schedule.date}`,
            link: '/louvor',
          })
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'schedules' },
        (payload) => {
          const schedule = payload.new as any
          // Só notificar se mudou para publicada
          if (schedule.status === 'published' && payload.old?.status !== 'published') {
            addNotification({
              type: 'schedule_updated',
              title: '✅ Escala publicada',
              message: schedule.title
                ? `"${schedule.title}" foi publicada`
                : `Escala de ${schedule.date} foi publicada`,
              link: '/louvor',
            })
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'schedules' },
        () => {
          addNotification({
            type: 'schedule_deleted',
            title: '🗑️ Escala removida',
            message: 'Uma escala foi excluída',
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, addNotification])

  return { notifications, unreadCount, addNotification, markAsRead, markAllAsRead, clearAll }
}
