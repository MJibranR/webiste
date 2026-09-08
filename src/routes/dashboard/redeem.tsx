import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard-shell";
import { SectionTitle } from "@/components/shell";
import { useAuth } from "@/lib/auth";
import { redeemCodeAction } from "@/lib/redeem";
import { supabase } from "@/integrations/supabase/client";

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

  useEffect(() => {
    if (user) {
      loadRedeemed();
    }
  }, [user]);

  const loadRedeemed = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('redeem_codes')
      .select('*')
      .eq('claimed_by', user.id);
    setRedeemed(data || []);
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
    const result = await redeemCodeAction(code.trim().toUpperCase(), user.id);
    setLoading(false);

    if (result.success) {
      toast.success(result.message);
      setCode("");
      loadRedeemed();
    } else {
      toast.error(result.message);
    }
  };

  const getFiles = (c: any) => {
    if (c.files) {
      try {
        return JSON.parse(c.files);
      } catch {
        return [];
      }
    }
    return c.download_link ? [{ id: 'legacy', label: 'DOWNLOAD', tag: 'MAIN', url: c.download_link }] : [];
  };

  return (
    <>
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
        </form>
      </div>

      {redeemed.length > 0 && (
        <div className="mt-6">
          <h3 className="text-[11px] tracking-[0.2em] text-muted-foreground mb-3">
            REDEEMED ITEMS ({redeemed.length})
          </h3>
          <div className="space-y-3">
            {redeemed.map((item) => {
              const files = getFiles(item);
              return (
                <div key={item.id} className="panel p-4 border border-primary/20">
                  <div className="flex flex-wrap justify-between items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">🎁</span>
                        <p className="text-sm font-bold text-primary">{item.product_name}</p>
                        {item.usage_limit > 1 && (
                          <span className="text-[10px] text-gold">× {item.usage_count}/{item.usage_limit === -1 ? '∞' : item.usage_limit}</span>
                        )}
                      </div>
                      {item.access_key && (
                        <div className="mt-2 bg-accent/40 rounded p-2 border border-border/60">
                          <p className="text-[10px] text-muted-foreground">ACCESS KEY</p>
                          <p className="text-xs text-gold font-mono break-all">{item.access_key}</p>
                        </div>
                      )}
                      {files.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <p className="text-[10px] text-muted-foreground">DOWNLOAD LINKS</p>
                          {files.map((f: any) => (
                            <a
                              key={f.id}
                              href={f.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block text-xs text-primary hover:underline mr-3"
                            >
                              📥 {f.label || f.tag || 'Download'}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}