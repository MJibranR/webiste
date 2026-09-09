import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin-shell";
import { SectionTitle } from "@/components/shell";
import { fetchUsers, pushNotification, fetchNotifications, deleteNotification, type AppNotification } from "@/lib/spiderhex";

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
    ],
  }),
});

function NotificationsAdmin() {
  const [users, setUsers] = useState<any[]>([]);
  const [target, setTarget] = useState("*");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const sync = useCallback(async () => {
    try {
      const data = await fetchNotifications();
      setSent(data.sort((a, b) => b.date.localeCompare(a.date)));
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }, []);

  useEffect(() => {
    async function loadUsers() {
      setLoading(true);
      try {
        const usersData = await fetchUsers();
        setUsers(usersData);
        await sync();
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    }
    loadUsers();
  }, [sync]);

  const send = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error("TITLE AND MESSAGE REQUIRED");
      return;
    }
    await pushNotification(target, title.trim(), message.trim());
    setTitle("");
    setMessage("");
    toast.success("NOTIFICATION SENT");
    await sync();
  };

  const nameFor = (id: string) =>
    id === "*" ? "ALL MEMBERS" : users.find((u) => u.id === id)?.fullName ?? "UNKNOWN";

  const handleDelete = async (id: string) => {
    await deleteNotification(id);
    await sync();
    toast.success("NOTIFICATION DELETED");
  };

  const field = "w-full rounded border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:border-primary";

  if (loading) {
    return (
      <AdminShell>
        <SectionTitle sub="// BROADCAST TO MEMBERS">NOTIFICATIONS</SectionTitle>
        <div className="flex justify-center items-center py-20">
          <p className="text-sm text-muted-foreground">LOADING...</p>
        </div>
      </AdminShell>
    );
  }

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
                  onClick={() => handleDelete(n.id)}
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