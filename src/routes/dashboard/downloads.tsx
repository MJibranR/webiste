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
      { property: "og:title", content: "Downloads — SPIDER HEX" },
      { property: "og:description", content: "All your purchased panel downloads in one place." },
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
            return (
              <div key={p.id} className="panel flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="text-sm text-primary">{p.productName}</p>
                  <p className="text-[11px] text-muted-foreground">
                    ${p.price} • {new Date(p.purchaseDate).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded border px-2 py-1 text-[10px] ${
                      p.status === "active" ? "border-primary/60 text-primary" : "border-danger/60 text-danger"
                    }`}
                  >
                    {p.status.toUpperCase()}
                  </span>
                  {count > 0 ? (
                    <button
                      onClick={() => setOpen(p)}
                      className="pulse-glow rounded bg-primary px-4 py-2 text-[11px] font-bold text-primary-foreground hover:opacity-90"
                    >
                      DOWNLOAD TOOL
                    </button>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">AWAITING ADMIN LINK</span>
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
