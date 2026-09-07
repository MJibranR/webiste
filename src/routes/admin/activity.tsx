import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { SectionTitle } from "@/components/shell";
import { clearActivity, getActivity, type ActivityLog, type ActivityType } from "@/lib/spiderhex";

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
      { property: "og:title", content: "Activity Log — SPIDER HEX Admin" },
      { property: "og:description", content: "Every action on SPIDER HEX in one timeline." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const FILTERS: (ActivityType | "all")[] = [
  "all",
  "login",
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

  const sync = useCallback(() => setLogs(getActivity()), []);

  useEffect(() => {
    sync();
    const handler = () => sync();
    window.addEventListener("sh:update", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("sh:update", handler);
      window.removeEventListener("storage", handler);
    };
  }, [sync]);

  const list = filter === "all" ? logs : logs.filter((l) => l.type === filter);

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
          onClick={() => {
            if (window.confirm("Clear the whole activity log?")) {
              clearActivity();
              sync();
            }
          }}
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
