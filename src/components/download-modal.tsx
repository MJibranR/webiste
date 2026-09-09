import { Copy, Download, Key } from "lucide-react";
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

  // ✅ Get discord URL from settings with fallback
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

      {/* Show Access Key */}
      {purchase?.credentials && (
        <div className="mt-3 p-3 rounded border border-gold/30 bg-gold/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-gold" />
            <span className="text-[10px] text-muted-foreground">ACCESS KEY:</span>
            <span className="text-xs font-mono text-gold">{purchase.credentials}</span>
          </div>
          <button
            onClick={() => copy(purchase.credentials!)}
            className="rounded border border-border p-1.5 text-muted-foreground hover:text-primary transition"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {files.length === 0 ? (
        <p className="mt-5 rounded border border-border p-6 text-center text-xs text-muted-foreground">
          {purchase?.status === 'pending' 
            ? '⏳ Order pending admin approval. Check back later.' 
            : 'NO LINKS ADDED YET'}
        </p>
      ) : (
        <div className="mt-5 max-h-[45vh] space-y-2 overflow-y-auto pr-1">
          {files.map((f) => (
            <div
              key={f.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded border border-border bg-background/60 p-3 transition hover:border-primary"
            >
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 text-xs font-bold text-foreground">
                  {f.label || 'Download'}
                  {f.tag ? (
                    <span className="rounded border border-primary/50 px-2 py-0.5 text-[9px] text-primary">
                      {f.tag}
                    </span>
                  ) : null}
                </p>
                <p className="mt-1 truncate text-[10px] text-muted-foreground">{f.url}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => void copy(f.url)}
                  aria-label={`Copy link for ${f.label}`}
                  className="rounded border border-border p-2 text-muted-foreground transition hover:text-primary"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <a
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded bg-primary px-3 py-2 text-[10px] font-bold text-primary-foreground hover:opacity-90"
                >
                  DOWNLOAD <Download className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}