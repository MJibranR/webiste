import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin-shell";
import { SectionTitle } from "@/components/shell";
import { useLive } from "@/lib/use-live";
import {
  deleteNotification,
  getNotifications,
  pushNotification,
  type AppNotification,
} from "@/lib/spiderhex";

export const Route = createFileRoute("/admin/notifications")({
  component: () => (
    <AdminShell>
      <NotificationsAdmin />
    </AdminShell>
  ),
  head: () => ({
    meta: [
      { title: "Notifications — SPIDER HEX Admin" },
      {
        name: "description",
        content: "Send announcements and order updates to SPIDER HEX members from the admin console.",
      },
      { property: "og:title", content: "Notifications — SPIDER HEX Admin" },
      { property: "og:description", content: "Broadcast announcements to all members or message one member." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function NotificationsAdmin() {
  const { users } = useLive();
  const [target, setTarget] = useState("*");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState<AppNotification[]>([]);

  const sync = useCallback(() => {
    setSent([...getNotifications()].sort((a, b) => b.date.localeCompare(a.date)));
  }, []);

  useEffect(() => {
    sync();
    const handler = () => sync();
    window.addEventListener("sh:update", handler);
    return () => window.removeEventListener("sh:update", handler);
  }, [sync]);

  const send = () => {
    if (!title.trim() || !message.trim()) {
      toast.error("TITLE AND MESSAGE REQUIRED");
      return;
    }
    pushNotification(target, title.trim(), message.trim());
    setTitle("");
    setMessage("");
    toast.success("NOTIFICATION SENT");
    sync();
  };

  const nameFor = (id: string) =>
    id === "*" ? "ALL MEMBERS" : users.find((u) => u.id === id)?.fullName ?? "UNKNOWN";

  const field = "w-full rounded border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:border-primary";

  return (
    <>
      <SectionTitle sub="// BROADCAST TO MEMBERS">NOTIFICATIONS</SectionTitle>

      <div className="panel grid gap-3 p-5">
        <label className="text-[10px] tracking-[0.2em] text-muted-foreground">SEND TO</label>
        <select className={field} value={target} onChange={(e) => setTarget(e.target.value)}>
          <option value="*">ALL MEMBERS</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.fullName} ({u.email})
            </option>
          ))}
        </select>

        <label className="text-[10px] tracking-[0.2em] text-muted-foreground">TITLE</label>
        <input className={field} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="NEW PANEL DROP" />

        <label className="text-[10px] tracking-[0.2em] text-muted-foreground">MESSAGE</label>
        <textarea
          className={`${field} min-h-24`}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write your announcement..."
        />

        <button
          onClick={send}
          className="rounded bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground transition hover:opacity-90"
        >
          SEND NOTIFICATION
        </button>
      </div>

      <div className="mt-8">
        <SectionTitle sub="// HISTORY">SENT</SectionTitle>
        {sent.length === 0 ? (
          <p className="panel p-6 text-center text-xs text-muted-foreground">NOTHING SENT YET</p>
        ) : (
          <div className="grid gap-3">
            {sent.map((n) => (
              <div key={n.id} className="panel flex items-start justify-between gap-4 p-4">
                <div>
                  <p className="text-xs font-bold text-primary">{n.title}</p>
                  <p className="mt-1 text-[11px] text-foreground">{n.message}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {nameFor(n.userId)} • {new Date(n.date).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => {
                    deleteNotification(n.id);
                    sync();
                  }}
                  className="rounded border border-danger/50 px-3 py-1.5 text-[10px] text-danger transition hover:bg-danger/10"
                >
                  DELETE
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
