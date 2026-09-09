import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Clock, Download, Store, Wallet } from "lucide-react";
import { toast } from "sonner";
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
  const [openModal, setOpenModal] = useState<Purchase | null>(null);

  useEffect(() => {
    async function loadPurchases() {
      // ✅ Check if user exists before making the API call
      if (!user) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const data = await fetchPurchases();
        const userPurchases = data.filter((p) => p.userId === user.id);
        setPurchases(userPurchases);
        console.log('📦 Purchases loaded:', userPurchases);
      } catch (error) {
        console.error('Error loading purchases:', error);
        toast.error('Failed to load purchases');
      } finally {
        setLoading(false);
      }
    }
    loadPurchases();
  }, [user]); // ✅ user is the dependency, but we check inside

  // ✅ If user is null, show login message
  if (!user) {
    return (
      <div className="flex justify-center items-center py-20">
        <p className="text-sm text-muted-foreground">PLEASE LOGIN TO VIEW DASHBOARD</p>
      </div>
    );
  }

  const mine = purchases;
  const spent = mine.reduce((s, p) => s + p.price, 0);

  const topUp = (amount: number) => {
    // ✅ user is guaranteed to exist here because of the early return
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
      {/* Download Modal */}
      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-[#0d0d14] rounded-2xl border border-[#00ff41]/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-primary font-mono">{openModal.productName}</h2>
              <button
                onClick={() => setOpenModal(null)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground mb-4">DOWNLOAD LINKS</p>
            <div className="space-y-3">
              {purchaseFiles(openModal).length === 0 ? (
                <div className="panel p-6 text-center text-muted-foreground">
                  NO LINKS ADDED YET
                </div>
              ) : (
                purchaseFiles(openModal).map((file) => (
                  <div key={file.id} className="panel p-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-primary">{file.label}</p>
                      {file.tag && (
                        <span className="text-[10px] text-gold border border-gold/30 px-2 py-0.5 rounded-full">
                          {file.tag}
                        </span>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-1 truncate max-w-xs">{file.url}</p>
                    </div>
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-primary text-black px-4 py-2 rounded-full text-[11px] font-bold hover:opacity-90 transition"
                    >
                      DOWNLOAD
                    </a>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-[10px] text-muted-foreground text-center">
                {openModal.status === 'pending' ? '⏳ Waiting for admin approval' : '✅ License Active'}
              </p>
            </div>
          </div>
        </div>
      )}

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
              const isPending = p.status === 'pending';
              
              return (
                <div key={p.id} className={`panel flex flex-wrap items-center justify-between gap-3 p-4 ${isPending ? 'border-gold/50' : ''}`}>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm text-primary">{p.productName}</p>
                      {isPending && (
                        <span className="rounded border border-gold/50 px-2 py-0.5 text-[9px] text-gold">⏳ PENDING</span>
                      )}
                      {p.isRedeem && (
                        <span className="rounded border border-primary/50 px-2 py-0.5 text-[9px] text-primary">🎁 REDEEMED</span>
                      )}
                      {p.plan && (
                        <span className="text-[10px] text-muted-foreground">• {p.plan}</span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      ${p.price} • {new Date(p.purchaseDate).toLocaleDateString()}
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
                    {hasLinks && p.status === "active" ? (
                    <button
                      onClick={() => setOpenModal(p)}
                      className="pulse-glow rounded-lg bg-primary px-4 py-2 text-[11px] font-bold text-primary-foreground hover:opacity-90 transition flex items-center gap-2 shadow-lg shadow-primary/20"
                    >
                      <Download className="h-4 w-4" /> DOWNLOAD TOOL
                    </button>
                  ) : p.status === "pending" ? (
                    <span className="text-[10px] text-gold flex items-center gap-1.5 bg-gold/5 px-3 py-1.5 rounded-full border border-gold/20">
                      <Clock className="h-3.5 w-3.5" /> WAITING FOR ADMIN
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1.5 bg-background/30 px-3 py-1.5 rounded-full border border-border">
                      <Clock className="h-3.5 w-3.5" /> LINK PENDING
                    </span>
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