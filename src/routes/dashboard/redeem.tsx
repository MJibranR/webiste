import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard-shell";
import { SectionTitle } from "@/components/shell";
import { useAuth } from "@/lib/auth";
import { redeemCodeAction } from "@/lib/redeem";
import { supabase } from "@/integrations/supabase/client";
import { DownloadModal } from "@/components/download-modal";
import type { Purchase } from "@/lib/spiderhex";

export const Route = createFileRoute("/dashboard/redeem")({
  component: () => (
    <DashboardShell>
      <RedeemPage />
    </DashboardShell>
  ),
  head: () => ({
    meta: [
      { title: "Redeem — SPIDER HEX" },
      { name: "description", content: "Redeem your SPIDER HEX panel codes." },
    ],
  }),
});

function RedeemPage() {
  const { user } = useAuth();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [redeemed, setRedeemed] = useState<any[]>([]);
  const [loadingRedeemed, setLoadingRedeemed] = useState(false);
  const [redeemPopup, setRedeemPopup] = useState<Purchase | null>(null);

  useEffect(() => {
    if (user) {
      loadRedeemed();
    }
  }, [user]);

  const loadRedeemed = async () => {
    if (!user) return;
    setLoadingRedeemed(true);
    try {
      // ✅ FIX: Query purchases table instead of redeem_codes
      // This shows ALL products the user has redeemed
      const { data, error } = await supabase
        .from('purchases')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_redeem', true)
        .order('purchase_date', { ascending: false });
      
      if (error) {
        console.error('Error loading redeemed codes:', error);
        // Fallback: Try loading from redeem_codes
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('redeem_codes')
          .select('*')
          .eq('claimed_by', user.id)
          .order('claimed_at', { ascending: false });
        
        if (!fallbackError) {
          setRedeemed(fallbackData || []);
        }
      } else {
        console.log('📦 Redeemed purchases:', data);
        setRedeemed(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoadingRedeemed(false);
    }
  };

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("PLEASE LOGIN FIRST");
      return;
    }
    if (!code.trim()) {
      toast.error("ENTER A REDEEM CODE");
      return;
    }

    setLoading(true);
    try {
      const result = await redeemCodeAction(code.trim().toUpperCase(), user.id);
      console.log('Redeem result:', result);
      
      if (result.success && result.data) {
        const purchase: Purchase = {
          id: `redeem-${Date.now()}`,
          userId: user.id,
          productId: 'redeem',
          productName: result.data.productName || 'Redeemed Panel',
          plan: 'REDEEM',
          price: 0,
          purchaseDate: new Date().toISOString(),
          status: 'active',
          downloadLink: result.data.downloadLink || '',
          files: result.data.files || [],
          isRedeem: true,
          credentials: result.data.accessKey || '',
        };
        
        setRedeemPopup(purchase);
        toast.success(result.message);
        setCode("");
        // ✅ Refresh the list immediately
        await loadRedeemed();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Redeem error:', error);
      toast.error('Failed to redeem code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getFiles = (item: any) => {
    // ✅ Handle both purchases and redeem_codes format
    let filesData = item.files;
    if (typeof filesData === 'string') {
      try {
        filesData = JSON.parse(filesData);
      } catch {
        filesData = [];
      }
    }
    if (Array.isArray(filesData) && filesData.length > 0) {
      return filesData;
    }
    if (item.download_link) {
      return [{ id: 'legacy', label: 'DOWNLOAD', tag: 'MAIN', url: item.download_link }];
    }
    return [];
  };

  const getProductName = (item: any) => {
    return item.product_name || item.productName || 'Unknown Panel';
  };

  const getAccessKey = (item: any) => {
    return item.access_key || item.credentials || '';
  };

  const getRedeemedDate = (item: any) => {
    return item.claimed_at || item.purchase_date || item.created_at || new Date().toISOString();
  };

  const getCodeValue = (item: any) => {
    return item.code || 'N/A';
  };

  return (
    <>
      <DownloadModal purchase={redeemPopup} onClose={() => setRedeemPopup(null)} />

      <SectionTitle sub="// REDEEM YOUR PANEL ACCESS">REDEEM CODE</SectionTitle>

      <div className="panel p-6">
        <form onSubmit={handleRedeem} className="space-y-4">
          <div>
            <label className="block text-[11px] tracking-[0.2em] text-muted-foreground">
              ENTER YOUR REDEEM CODE
            </label>
            <div className="mt-2 flex gap-3">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="SPX-XXXX-XXXX"
                className="flex-1 rounded border border-border bg-background/60 px-4 py-3 text-sm text-primary outline-none focus:border-primary font-mono"
              />
              <button
                type="submit"
                disabled={loading}
                className="pulse-glow rounded bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-60"
              >
                {loading ? "REDEEMING..." : "REDEEM"}
              </button>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground">
            💡 Each code can only be used once. You can redeem multiple different codes.
          </p>
        </form>
      </div>

      {loadingRedeemed ? (
        <div className="mt-6 panel p-8 text-center">
          <p className="text-xs text-muted-foreground">LOADING YOUR REDEEMED CODES...</p>
        </div>
      ) : redeemed.length > 0 ? (
        <div className="mt-6">
          <h3 className="text-[11px] tracking-[0.2em] text-muted-foreground mb-3">
            YOUR REDEEMED CODES ({redeemed.length})
          </h3>
          <div className="space-y-3">
            {redeemed.map((item, index) => {
              const files = getFiles(item);
              const productName = getProductName(item);
              const accessKey = getAccessKey(item);
              const redeemedDate = getRedeemedDate(item);
              const codeValue = getCodeValue(item);
              
              return (
                <div key={item.id || index} className="panel p-4 border border-primary/20">
                  <div className="flex flex-wrap justify-between items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-lg">✅</span>
                        <p className="text-sm font-bold text-primary">{productName}</p>
                        {codeValue && codeValue !== 'N/A' && (
                          <span className="text-[10px] text-muted-foreground font-mono">({codeValue})</span>
                        )}
                        {item.usage_limit && item.usage_limit > 1 && (
                          <span className="text-[10px] text-gold">× {item.usage_count}/{item.usage_limit === -1 ? '∞' : item.usage_limit}</span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Redeemed: {new Date(redeemedDate).toLocaleString()}
                      </p>
                      {accessKey && (
                        <div className="mt-2 bg-accent/40 rounded p-2 border border-border/60">
                          <p className="text-[10px] text-muted-foreground">ACCESS KEY</p>
                          <p className="text-xs text-gold font-mono break-all">{accessKey}</p>
                        </div>
                      )}
                      {files.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <p className="text-[10px] text-muted-foreground">DOWNLOAD LINKS</p>
                          <div className="flex flex-wrap gap-2">
                            {files.map((f: any, idx: number) => (
                              <a
                                key={f.id || idx}
                                href={f.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block text-xs text-primary hover:underline bg-accent/20 px-3 py-1 rounded-full"
                              >
                                📥 {f.label || f.tag || 'Download'}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="mt-6 panel p-8 text-center">
          <p className="text-xs text-muted-foreground">
            NO REDEEMED CODES YET —{" "}
            <Link to="/store" className="text-primary hover:underline">
              BROWSE THE STORE
            </Link>
          </p>
        </div>
      )}
    </>
  );
}