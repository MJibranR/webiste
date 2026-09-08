import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { SectionTitle } from "@/components/shell";
import { DownloadModal } from "@/components/download-modal";
import { useAuth } from "@/lib/auth";
import { useLive } from "@/lib/use-live";
import { purchaseFiles, type Purchase } from "@/lib/spiderhex";

export const Route = createFileRoute("/dashboard/downloads")({
  component: () => (
    <DashboardShell>
      <Downloads />
    </DashboardShell>
  ),
  head: () => ({
    meta: [
      { title: "Downloads — SPIDER HEX" },
      { name: "description", content: "Download the gaming panels linked to your SPIDER HEX licenses." },
    ],
  }),
});

function Downloads() {
  const { user } = useAuth();
  const { purchases } = useLive();
  const [open, setOpen] = useState<Purchase | null>(null);
  if (!user) return null;
  const mine = purchases.filter((p) => p.userId === user.id);

  return (
    <>
      <SectionTitle sub="// YOUR PANEL BUILDS">DOWNLOADS</SectionTitle>
      {mine.length === 0 ? (
        <div className="panel p-10 text-center text-xs text-muted-foreground">
          NO DOWNLOADS YET —{" "}
          <Link to="/store" className="text-primary hover:underline">
            GO TO STORE
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {mine.map((p) => {
            const count = purchaseFiles(p).length;
            const isPending = p.status === 'pending';
            return (
              <div key={p.id} className={`panel flex flex-wrap items-center justify-between gap-3 p-4 ${isPending ? 'border-gold/50' : ''}`}>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-primary">{p.productName}</p>
                    {isPending && (
                      <span className="rounded border border-gold/50 px-2 py-0.5 text-[9px] text-gold">⏳ PENDING</span>
                    )}
                    {p.isRedeem && (
                      <span className="rounded border border-primary/50 px-2 py-0.5 text-[9px] text-primary">🎁 REDEEMED</span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    ${p.price} • {new Date(p.purchaseDate).toLocaleString()}
                  </p>
                  {p.credentials && (
                    <p className="text-[10px] text-gold font-mono mt-1">🔑 {p.credentials}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded border px-2 py-1 text-[10px] ${
                      p.status === "active" ? "border-primary/60 text-primary" :
                      p.status === "pending" ? "border-gold/60 text-gold" :
                      "border-danger/60 text-danger"
                    }`}
                  >
                    {p.status.toUpperCase()}
                  </span>
                  {count > 0 && p.status === 'active' ? (
                    <button
                      onClick={() => setOpen(p)}
                      className="pulse-glow rounded bg-primary px-4 py-2 text-[11px] font-bold text-primary-foreground hover:opacity-90"
                    >
                      📥 DOWNLOAD ({count})
                    </button>
                  ) : p.status === 'pending' ? (
                    <span className="text-[10px] text-gold">⏳ WAITING FOR ADMIN</span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">⏳ AWAITING ADMIN LINK</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <DownloadModal purchase={open} onClose={() => setOpen(null)} />
    </>
  );
}