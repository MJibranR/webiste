import { createFileRoute, Link } from "@tanstack/react-router";
import { Download, Store, Wallet } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { DownloadModal } from "@/components/download-modal";
import { DashboardShell } from "@/components/dashboard-shell";
import { SectionTitle } from "@/components/shell";
import { useAuth } from "@/lib/auth";
import { fetchPurchases, purchaseFiles, topUpMessage, waLink, type Purchase } from "@/lib/spiderhex";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardPage,
  head: () => ({
    meta: [
      { title: "Dashboard — SPIDER HEX" },
      { name: "description", content: "Your SPIDER HEX dashboard: wallet balance, active licenses and quick downloads." },
      { property: "og:title", content: "Dashboard — SPIDER HEX" },
      { property: "og:description", content: "Wallet, licenses and downloads in one place." },
    ],
  }),
});

function DashboardPage() {
  return (
    <DashboardShell>
      <DashboardInner />
    </DashboardShell>
  );
}

function DashboardInner() {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<Purchase | null>(null);

  if (!user) return null;

  useEffect(() => {
    async function loadPurchases() {
      setLoading(true);
      try {
        // ✅ Load purchases from DATABASE
        const data = await fetchPurchases();
        // Filter for current user
        const userPurchases = data.filter((p) => p.userId === user.id);
        setPurchases(userPurchases);
        console.log('📦 Purchases loaded for user:', userPurchases);
      } catch (error) {
        console.error('Error loading purchases:', error);
        toast.error('Failed to load purchases');
      } finally {
        setLoading(false);
      }
    }
    loadPurchases();
  }, [user.id]);

  const mine = purchases;
  const spent = mine.reduce((s, p) => s + p.price, 0);

  const topUp = (amount: number) => {
    window.open(waLink(topUpMessage(user.fullName, user.email, amount)), "_blank", "noopener");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <p className="text-sm text-muted-foreground">LOADING DASHBOARD...</p>
      </div>
    );
  }

  return (
    <>
      <DownloadModal purchase={open} onClose={() => setOpen(null)} />
      <SectionTitle sub={`// WELCOME BACK, ${user.fullName.toUpperCase()}`}>DASHBOARD</SectionTitle>

      <div className="panel p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] tracking-[0.2em] text-muted-foreground">
              <Wallet className="mr-2 inline h-4 w-4 text-primary" />
              AVAILABLE BALANCE
            </p>
            <p className="glow-gold mt-2 text-4xl font-bold">${user.balance.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] tracking-[0.2em] text-muted-foreground">TOTAL SPENT</p>
            <p className="mt-2 text-2xl font-bold text-primary">${spent.toFixed(2)}</p>
          </div>
        </div>
        <p className="mt-6 text-[11px] tracking-[0.2em] text-muted-foreground">QUICK TOP-UP</p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          {[5, 10, 25, 50].map((a) => (
            <button
              key={a}
              onClick={() => topUp(a)}
              className="rounded border border-border px-4 py-2.5 text-primary transition hover:bg-accent"
            >
              ${a}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <SectionTitle sub="// PANELS LINKED TO YOUR ACCOUNT">ACTIVE LICENSES</SectionTitle>
        {mine.length === 0 ? (
          <div className="panel p-8 text-center text-xs text-muted-foreground">
            NO LICENSES YET —{" "}
            <Link to="/store" className="text-primary hover:underline">
              BROWSE THE STORE
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {mine.map((p) => {
              const files = purchaseFiles(p);
              const hasLinks = files.length > 0;
              return (
                <div key={p.id} className="panel flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="text-sm text-primary">{p.productName}</p>
                    <p className="text-[11px] text-muted-foreground">
                      ${p.price} • {new Date(p.purchaseDate).toLocaleDateString()}
                    </p>
                    {p.plan && (
                      <p className="text-[10px] text-muted-foreground">Plan: {p.plan}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded border px-2 py-1 text-[10px] ${
                        p.status === "active" 
                          ? "border-primary/60 text-primary" 
                          : p.status === "pending" 
                          ? "border-gold/60 text-gold" 
                          : "border-danger/60 text-danger"
                      }`}
                    >
                      {p.status.toUpperCase()}
                    </span>
                    {hasLinks && p.status === "active" ? (
                      <button
                        onClick={() => setOpen(p)}
                        className="rounded bg-primary px-3 py-2 text-[11px] font-bold text-primary-foreground hover:opacity-90"
                      >
                        DOWNLOAD TOOL ({files.length})
                      </button>
                    ) : p.status === "pending" ? (
                      <span className="text-[10px] text-gold">⏳ WAITING FOR ADMIN</span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">LINK PENDING</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link to="/store" className="panel p-6 transition hover:-translate-y-1 hover:border-primary">
          <Store className="h-5 w-5 text-primary" />
          <p className="mt-3 text-sm text-primary">BROWSE STORE</p>
          <p className="mt-1 text-[11px] text-muted-foreground">Find new panels and gift keys.</p>
        </Link>
        <Link to="/dashboard/downloads" className="panel p-6 transition hover:-translate-y-1 hover:border-primary">
          <Download className="h-5 w-5 text-primary" />
          <p className="mt-3 text-sm text-primary">MY DOWNLOADS</p>
          <p className="mt-1 text-[11px] text-muted-foreground">Grab your latest panel builds.</p>
        </Link>
      </div>
    </>
  );
}