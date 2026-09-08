import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Copy, Gift } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard-shell";
import { SectionTitle } from "@/components/shell";
import { useAuth } from "@/lib/auth";
import { logActivity } from "@/lib/spiderhex";
import { claimCode, listMyCodes, type RedeemCode } from "@/lib/redeem";

export const Route = createFileRoute("/dashboard/redeem")({
  component: () => (
    <DashboardShell>
      <RedeemPage />
    </DashboardShell>
  ),
  head: () => ({
    meta: [
      { title: "Redeem Code — SPIDER HEX" },
      { name: "description", content: "Enter your SPIDER HEX redeem code to unlock your panel download and access key." },
      { property: "og:title", content: "Redeem Code — SPIDER HEX" },
      { property: "og:description", content: "Unlock your panel download link and key with a redeem code." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function RedeemPage() {
  const { user } = useAuth();
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [mine, setMine] = useState<RedeemCode[]>([]);

  const load = useCallback(() => {
    void listMyCodes().then(setMine);
  }, []);
  useEffect(load, [load]);

  const submit = async () => {
    if (!value.trim()) {
      toast.error("ENTER A CODE FIRST");
      return;
    }
    setBusy(true);
    const { row, error } = await claimCode(value.trim());
    setBusy(false);
    if (error || !row) {
      toast.error(error ?? "COULD NOT REDEEM THIS CODE");
      return;
    }
    toast.success(`UNLOCKED — ${row.product_name.toUpperCase()}`);
    logActivity("download", user?.email ?? "member", `Redeemed code ${row.code} (${row.product_name})`);
    setValue("");
    load();
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("COPIED");
    } catch {
      toast.error("COPY BLOCKED BY BROWSER");
    }
  };

  return (
    <>
      <SectionTitle sub="// UNLOCK A PANEL WITH YOUR CODE">REDEEM</SectionTitle>

      <div className="panel p-6">
        <p className="text-[11px] tracking-[0.2em] text-muted-foreground">
          <Gift className="mr-2 inline h-4 w-4 text-primary" />
          ENTER REDEEM CODE
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <input
            className="min-w-[220px] flex-1 rounded border border-border bg-background/60 px-3 py-2.5 text-sm tracking-[0.2em] text-foreground outline-none focus:border-primary"
            placeholder="SPX-XXXX-XXXX"
            aria-label="Redeem code"
            value={value}
            onChange={(e) => setValue(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === "Enter") void submit();
            }}
          />
          <button
            onClick={() => void submit()}
            disabled={busy}
            className="rounded bg-primary px-5 py-2.5 text-[11px] font-bold text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            {busy ? "CHECKING…" : "REDEEM"}
          </button>
        </div>
      </div>

      <div className="mt-6">
        <SectionTitle sub="// PANELS YOU UNLOCKED WITH CODES">CLAIMED CODES</SectionTitle>
        {mine.length === 0 ? (
          <div className="panel p-8 text-center text-xs text-muted-foreground">NO CODES REDEEMED YET</div>
        ) : (
          <div className="space-y-3">
            {mine.map((c) => (
              <div key={c.id} className="panel p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-primary">{c.product_name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      CODE {c.code}
                      {c.claimed_at ? ` • ${new Date(c.claimed_at).toLocaleDateString()}` : ""}
                    </p>
                  </div>
                  {c.download_link ? (
                    <a
                      href={c.download_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded bg-primary px-3 py-2 text-[11px] font-bold text-primary-foreground hover:opacity-90"
                    >
                      DOWNLOAD TOOL
                    </a>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">LINK PENDING</span>
                  )}
                </div>
                {c.access_key ? (
                  <div className="mt-3 flex items-center justify-between gap-3 rounded border border-border bg-accent/40 p-3">
                    <div className="min-w-0">
                      <p className="text-[10px] tracking-[0.2em] text-muted-foreground">ACCESS KEY</p>
                      <p className="truncate text-xs text-primary">{c.access_key}</p>
                    </div>
                    <button
                      onClick={() => void copy(c.access_key)}
                      className="rounded border border-border p-2 text-muted-foreground hover:border-primary hover:text-primary"
                      aria-label="Copy access key"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : null}
                {c.note ? <p className="mt-2 text-[11px] text-muted-foreground">{c.note}</p> : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
