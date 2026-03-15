import { useState } from "react";
import { Bell } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { useNavigate } from "react-router-dom";

const formatTimeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const NotificationDropdown = () => {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();

  return (
    <div className="relative">
      <button
        className="relative text-muted-foreground hover:text-foreground"
        onClick={() => setOpen(!open)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs w-4 h-4 rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 max-h-96 rounded-xl border border-border bg-card shadow-elegant z-50 overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b border-border">
              <p className="text-sm font-semibold text-foreground">Notifications</p>
              {unreadCount > 0 && (
                <button className="text-xs text-accent hover:underline" onClick={() => markAllAsRead()}>
                  Mark all read
                </button>
              )}
            </div>
            <div className="overflow-auto max-h-72">
              {notifications.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground text-center">No notifications</p>
              ) : notifications.slice(0, 10).map((n) => (
                <div
                  key={n.id}
                  className={`p-3 border-b border-border text-sm hover:bg-muted/30 cursor-pointer ${!n.read ? "bg-accent/5" : ""}`}
                  onClick={() => { markAsRead(n.id); if (n.link) navigate(n.link); setOpen(false); }}
                >
                  <p className="font-medium text-foreground">{n.title}</p>
                  <p className="text-xs text-muted-foreground">{n.message}</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">{formatTimeAgo(n.created_at)}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationDropdown;
