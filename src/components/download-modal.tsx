import { Copy, ExternalLink, Key } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "./modal";
import { purchaseFiles, type Purchase } from "@/lib/spiderhex";
import { useSettings } from "@/lib/use-settings";

export function DownloadModal({
  purchase,
  onClose,
}: {
  purchase: Purchase | null;
  onClose: () => void;
}) {
  const { settings } = useSettings();
  const files = purchase ? purchaseFiles(purchase) : [];

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("COPIED");
    } catch {
      toast.error("COPY BLOCKED BY BROWSER");
    }
  };

  const discordUrl = settings?.discordUrl || "https://discord.com/app";

  return (
    <Modal
      open={!!purchase}
      onClose={onClose}
      sub={`${purchase?.productName ?? ""} • ${purchase?.isRedeem ? 'REDEEMED' : 'PURCHASED'}`}
      title={purchase?.productName ?? ""}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3 rounded border border-border bg-accent/40 p-3">
          <div>
            <p className="text-[11px] font-bold text-primary">💬 NEED HELP?</p>
            <p className="text-[10px] text-muted-foreground">
              Join our Discord for support, error fixes and updates.
            </p>
          </div>
          <a
            href={discordUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded bg-primary px-3 py-2 text-[10px] font-bold text-primary-foreground hover:opacity-90"
          >
            JOIN DISCORD
          </a>
        </div>
      }
    >
      <p className="text-center text-[11px] text-muted-foreground">
        {files.length > 0 ? 'Official and verified download links' : 'No links available yet'}
      </p>

      {/* ACCESS KEY */}
      {purchase?.credentials && purchase.credentials.trim() !== '' ? (
        <div className="mt-4 p-4 rounded-lg border border-gold/30 bg-gold/5">
          <div className="flex items-center gap-2 mb-2">
            <Key className="h-4 w-4 text-gold" />
            <span className="text-[10px] tracking-[0.2em] text-muted-foreground">🔑 ACCESS KEY / CREDENTIALS</span>
          </div>
          <div className="flex items-center justify-between gap-3 bg-background/60 rounded-md p-3 border border-gold/20">
            <code className="text-xs font-mono text-gold break-all">{purchase.credentials}</code>
            <button
              onClick={() => copy(purchase.credentials!)}
              className="flex-shrink-0 rounded border border-gold/30 px-3 py-1.5 text-[10px] text-gold hover:bg-gold/10 transition flex items-center gap-1"
            >
              <Copy className="h-3.5 w-3.5" /> COPY
            </button>
          </div>
        </div>
      ) : null}

      {/* Download Links */}
      {files.length === 0 ? (
        <p className="mt-5 rounded border border-border p-6 text-center text-xs text-muted-foreground">
          {purchase?.status === 'pending' 
            ? '⏳ Order pending admin approval. Check back later.' 
            : 'NO LINKS ADDED YET'}
        </p>
      ) : (
        <div className="mt-5 max-h-[45vh] space-y-3 overflow-y-auto pr-1">
          {files.map((f, index) => (
            <div
              key={f.id}
              className="rounded-lg border border-border bg-background/40 p-4 transition hover:border-primary/30"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground tracking-[0.15em]">FILE {index + 1}</span>
                  {f.tag && (
                    <span className="rounded-full border border-primary/40 px-2 py-0.5 text-[9px] text-primary">
                      {f.tag}
                    </span>
                  )}
                </div>
              </div>
              <p className="text-sm font-bold text-primary">{f.label || 'Download'}</p>
              <p className="mt-1 truncate text-[10px] text-muted-foreground font-mono">{f.url}</p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => void copy(f.url)}
                  className="rounded border border-border px-3 py-1.5 text-[10px] text-muted-foreground hover:text-primary hover:border-primary transition flex items-center gap-1"
                >
                  <Copy className="h-3.5 w-3.5" /> COPY LINK
                </button>
                <a
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded border border-primary/50 px-3 py-1.5 text-[10px] text-primary hover:bg-accent transition flex items-center gap-1"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> OPEN
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Status */}
      <div className="mt-4 pt-4 border-t border-border/60">
        <p className="text-[10px] text-center text-muted-foreground">
          {purchase?.status === 'pending' 
            ? '⏳ Waiting for admin approval' 
            : purchase?.status === 'active' 
            ? '✅ License Active' 
            : '⛔ License Expired'}
        </p>
      </div>
    </Modal>
  );
}