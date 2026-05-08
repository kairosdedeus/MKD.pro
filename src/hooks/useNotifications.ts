import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuthStore } from "@/stores/authStore";
import {
  AppNotification,
  notificationService,
} from "@/services/notificationService";

export type Notification = AppNotification;

export function useNotifications() {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!user?.id) {
      setNotifications([]);
      return;
    }

    try {
      setLoading(true);
      const data = await notificationService.listForCurrentUser();
      setNotifications(data);
    } catch (error) {
      console.warn("Não foi possível carregar notificações:", error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "app_notification_recipients",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          loadNotifications();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, loadNotifications]);

  const markAsRead = useCallback(async (recipientId: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.recipientId === recipientId
          ? { ...notification, read: true }
          : notification,
      ),
    );
    await notificationService.markAsRead(recipientId);
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, read: true })),
    );
    await notificationService.markAllAsRead();
  }, []);

  const clearAll = useCallback(async () => {
    setNotifications([]);
    await notificationService.dismissAll();
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    loading,
    refetch: loadNotifications,
    markAsRead,
    markAllAsRead,
    clearAll,
  };
}
