import { useState, useRef, useEffect } from "react";
import { Bell, CheckCheck, Info, CheckCircle, AlertTriangle, X } from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";
import { Notification } from "@/types";

const typeIcon = (type: Notification["type"]) => {
  if (type === "success") return <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />;
  if (type === "warning") return <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />;
  return <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />;
};

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const NotificationBell = () => {
  const { notifications, unreadCount, markAllRead, markOneRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        id="notification-bell"
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-full hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-12 z-50 w-80 rounded-xl border border-border bg-background shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/40">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-xs text-primary hover:underline px-1"
                  title="Mark all as read"
                >
                  <CheckCheck className="h-3 w-3" />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Notification list */}
          <ul className="max-h-96 overflow-y-auto divide-y divide-border">
            {notifications.length === 0 ? (
              <li className="py-10 text-center text-sm text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                No notifications yet
              </li>
            ) : (
              notifications.map((n) => (
                <li
                  key={n.id}
                  onClick={() => !n.is_read && markOneRead(n.id)}
                  className={`flex gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                    !n.is_read ? "bg-primary/5 border-l-2 border-l-primary" : ""
                  }`}
                >
                  {typeIcon(n.type)}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium leading-tight ${!n.is_read ? "text-foreground" : "text-muted-foreground"}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                      {n.message}
                    </p>
                    <p className="text-[10px] text-muted-foreground/70 mt-1">
                      {timeAgo(n.created_at)}
                    </p>
                  </div>
                  {!n.is_read && (
                    <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
