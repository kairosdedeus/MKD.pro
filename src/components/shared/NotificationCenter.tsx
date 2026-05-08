import {
  Bell,
  CalendarCheck,
  CalendarClock,
  CheckCheck,
  ExternalLink,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export function NotificationCenter() {
  const navigate = useNavigate();
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    clearAll,
  } = useNotifications();

  const handleClick = (notif: Notification) => {
    markAsRead(notif.recipientId);
    setSelectedNotification({ ...notif, read: true });
  };

  const getIcon = (type: Notification["type"]) => {
    if (type === "schedule_created") return CalendarClock;
    if (type === "schedule_published") return CalendarCheck;
    if (type === "schedule_updated") return CheckCheck;
    if (type === "schedule_deleted") return Trash2;
    return Bell;
  };

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9 rounded-full"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-bold">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent align="end" className="w-80 p-0 shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="font-semibold text-sm text-foreground">
              Notificações
              {unreadCount > 0 && (
                <span className="ml-2 text-xs bg-destructive/10 text-destructive px-1.5 py-0.5 rounded-full">
                  {unreadCount} nova(s)
                </span>
              )}
            </h3>
            <div className="flex gap-1">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={markAllAsRead}
                >
                  <CheckCheck className="h-4 w-4 text-muted-foreground" />
                </Button>
              )}
              {notifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={clearAll}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              )}
            </div>
          </div>

          {/* Lista */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="space-y-2 p-4">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
                      <div className="h-2.5 w-1/2 animate-pulse rounded bg-muted" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhuma notificação</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => handleClick(notif)}
                  className={`w-full text-left px-4 py-3 border-b border-border last:border-0 hover:bg-accent transition-colors ${
                    !notif.read ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      {(() => {
                        const Icon = getIcon(notif.type);
                        return <Icon className="h-4 w-4" />;
                      })()}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium ${!notif.read ? "text-foreground" : "text-muted-foreground"}`}
                      >
                        {notif.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {notif.message}
                      </p>
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        {formatDistanceToNow(notif.createdAt, {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                    {!notif.read && (
                      <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>

      <Dialog
        open={!!selectedNotification}
        onOpenChange={(open) => !open && setSelectedNotification(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedNotification?.title}</DialogTitle>
          </DialogHeader>

          {selectedNotification && (
            <div data-dialog-body="" className="space-y-4 px-4 py-4 sm:px-5">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {selectedNotification.message}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(selectedNotification.createdAt, {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedNotification(null)}
              className="w-full sm:w-auto"
            >
              Fechar
            </Button>
            {selectedNotification?.link && (
              <Button
                onClick={() => {
                  const link = selectedNotification.link;
                  setSelectedNotification(null);
                  if (link) navigate(link);
                }}
                className="w-full gap-2 sm:w-auto"
              >
                <ExternalLink className="h-4 w-4" />
                Abrir escala
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
