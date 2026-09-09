import { Bell } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { fetchNotifications, markAllRead, type AppNotification } from "@/lib/spiderhex";

export function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const boxRef = useRef<HTMLDivElement>(null);

  const sync = useCallback(async () => {
    if (!user) return;
    const data = await fetchNotifications();
    // Filter for this user
    const userItems = data.filter((n) => n.userId === user.id || n.userId === "*");
    setItems(userItems);
  }, [user]);

  useEffect(() => {
    if (user) {
      sync();
    }
  }, [user, sync]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  if (!user) return null;

  const unread = items.filter((n) => !n.readBy.includes(user.id)).length;

  return (
    <div className="relative" ref={boxRef}>
      <button
        aria-label="Notifications"
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next && unread > 0) {
            markAllRead(user.id);
            sync();
          }
        }}
        className="relative rounded border border-border px-3 py-2 text-muted-foreground transition hover:text-primary"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-1.5 -top-1.5 min-w-4 rounded-full bg-primary px-1 text-[9px] font-bold leading-4 text-primary-foreground">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="panel absolute right-0 z-50 mt-2 w-72 overflow-hidden text-left">
          <p className="border-b border-border px-3 py-2 text-[10px] tracking-[0.2em] text-muted-foreground">
            NOTIFICATIONS
          </p>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-3 py-6 text-center text-[11px] text-muted-foreground">NO NOTIFICATIONS YET</p>
            ) : (
              items.map((n) => (
                <div key={n.id} className="border-b border-border/60 px-3 py-3 last:border-0">
                  <p className="text-[11px] font-bold text-primary">{n.title}</p>
                  <p className="mt-1 text-[11px] text-foreground">{n.message}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {new Date(n.date).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}