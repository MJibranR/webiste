import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin-shell";
import { SectionTitle } from "@/components/shell";
import { fetchActivity, clearActivity, type ActivityLog, type ActivityType } from "@/lib/spiderhex";

export const Route = createFileRoute("/admin/activity")({
  component: () => (
    <AdminShell>
      <ActivityAdmin />
    </AdminShell>
  ),
  head: () => ({
    meta: [
      { title: "Activity Log — SPIDER HEX Admin" },
      { name: "description", content: "Live log of logins, signups, orders, panel edits and wallet changes." },
    ],
  }),
});

const FILTERS: (ActivityType | "all")[] = [
  "all",
  "login",
  "logout",
  "signup",
  "purchase",
  "download",
  "product",
  "wallet",
  "user",
  "notification",
];

const color: Record<string, string> = {
  login: "text-primary",
  logout: "text-muted-foreground",
  signup: "text-gold",
  purchase: "text-primary",
  download: "text-primary",
  product: "text-gold",
  wallet: "text-gold",
  user: "text-danger",
  notification: "text-muted-foreground",
  content: "text-muted-foreground",
};

function ActivityAdmin() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [filter, setFilter] = useState<ActivityType | "all">("all");
  const [loading, setLoading] = useState(true);

  const sync = useCallback(async () => {
    try {
      const data = await fetchActivity();
      setLogs(data);
    } catch (error) {
      console.error('Error loading activity:', error);
      toast.error('Failed to load activity');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    sync();
  }, [sync]);

  const handleClear = async () => {
    if (window.confirm("Clear the whole activity log?")) {
      await clearActivity();
      await sync();
      toast.success("LOG CLEARED");
    }
  };

  const list = filter === "all" ? logs : logs.filter((l) => l.type === filter);

  if (loading) {
    return (
      <AdminShell>
        <SectionTitle sub="// SYSTEM TIMELINE">ACTIVITY LOG</SectionTitle>
        <div className="flex justify-center items-center py-20">
          <p className="text-sm text-muted-foreground">LOADING...</p>
        </div>
      </AdminShell>
    );
  }

  return (
    <>
      <SectionTitle sub="// SYSTEM TIMELINE">ACTIVITY LOG</SectionTitle>

      <div className="flex flex-wrap items-center gap-2 text-[10px]">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded border px-3 py-2 ${
              filter === f
                ? "border-primary bg-accent text-primary"
                : "border-border text-muted-foreground hover:text-primary"
            }`}
          >
            {f.toUpperCase()}
          </button>
        ))}
        <button
          onClick={handleClear}
          className="ml-auto rounded border border-danger/50 px-3 py-2 text-danger hover:bg-danger/10"
        >
          CLEAR LOG
        </button>
      </div>

      <div className="panel mt-6 divide-y divide-border/60">
        {list.length === 0 ? (
          <p className="p-10 text-center text-xs text-muted-foreground">NO ACTIVITY RECORDED</p>
        ) : (
          list.map((l) => (
            <div key={l.id} className="flex flex-wrap items-start justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="text-xs text-foreground">{l.message}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">{l.actor}</p>
              </div>
              <div className="text-right">
                <span className={`text-[10px] tracking-[0.15em] ${color[l.type] ?? "text-muted-foreground"}`}>
                  {l.type.toUpperCase()}
                </span>
                <p className="text-[10px] text-muted-foreground">{new Date(l.date).toLocaleString()}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}