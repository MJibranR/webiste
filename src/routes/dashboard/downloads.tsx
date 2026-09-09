import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard-shell";
import { SectionTitle } from "@/components/shell";
import { useAuth } from "@/lib/auth";
import { fetchPurchases, purchaseFiles, type Purchase } from "@/lib/spiderhex";

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
        console.log('📦 Downloads loaded:', userPurchases);
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
        <p className="text-sm text-muted-foreground">PLEASE LOGIN TO VIEW DOWNLOADS</p>
      </div>
    );
  }

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex justify-center items-center py-20">
          <p className="text-sm text-muted-foreground">LOADING...</p>
        </div>
      </DashboardShell>
    );
  }

  const mine = purchases;

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
                      onClick={() => setOpenModal(p)}
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
    </>
  );
}