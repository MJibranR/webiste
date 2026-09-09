import { Copy, ExternalLink, Key, File, Download, CheckCircle, Clock, XCircle } from "lucide-react";
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

  const getStatusIcon = () => {
    if (purchase?.status === 'pending') return <Clock className="h-4 w-4 text-gold" />;
    if (purchase?.status === 'active') return <CheckCircle className="h-4 w-4 text-primary" />;
    return <XCircle className="h-4 w-4 text-danger" />;
  };

  const getStatusText = () => {
    if (purchase?.status === 'pending') return '⏳ Waiting for admin approval';
    if (purchase?.status === 'active') return '✅ License Active';
    return '⛔ License Expired';
  };

  const getStatusColor = () => {
    if (purchase?.status === 'pending') return 'border-gold/30 bg-gold/5 text-gold';
    if (purchase?.status === 'active') return 'border-primary/30 bg-primary/5 text-primary';
    return 'border-danger/30 bg-danger/5 text-danger';
  };

  return (
    <Modal
      open={!!purchase}
      onClose={onClose}
      sub={`${purchase?.productName ?? ""} • ${purchase?.isRedeem ? '🎁 REDEEMED' : '🛒 PURCHASED'}`}
      title={purchase?.productName ?? ""}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-accent/30 p-4">
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
            className="rounded-lg bg-primary px-4 py-2 text-[10px] font-bold text-primary-foreground hover:opacity-90 transition flex items-center gap-2"
          >
            <span>🎮</span> JOIN DISCORD
          </a>
        </div>
      }
    >
      {/* Status Badge */}
      <div className={`flex items-center justify-center gap-2 rounded-full border px-4 py-1.5 text-[10px] font-medium w-fit mx-auto ${getStatusColor()}`}>
        {getStatusIcon()}
        {getStatusText()}
      </div>

      <p className="text-center text-[11px] text-muted-foreground mt-3">
        {files.length > 0 ? '📥 Official and verified download links' : 'No links available yet'}
      </p>

      {/* ACCESS KEY */}
      {purchase?.credentials && purchase.credentials.trim() !== '' ? (
        <div className="mt-4 p-4 rounded-xl border border-gold/30 bg-gold/5">
          <div className="flex items-center gap-2 mb-2">
            <Key className="h-4 w-4 text-gold" />
            <span className="text-[10px] tracking-[0.2em] text-muted-foreground uppercase font-bold">Access Key / Credentials</span>
          </div>
          <div className="flex items-center justify-between gap-3 bg-background/60 rounded-lg p-3 border border-gold/20">
            <code className="text-xs font-mono text-gold break-all font-bold">{purchase.credentials}</code>
            <button
              onClick={() => copy(purchase.credentials!)}
              className="flex-shrink-0 rounded-lg border border-gold/30 px-3 py-1.5 text-[10px] text-gold hover:bg-gold/10 hover:border-gold/60 transition flex items-center gap-1.5 font-medium"
            >
              <Copy className="h-3.5 w-3.5" /> COPY
            </button>
          </div>
        </div>
      ) : null}

      {/* Download Links */}
      {files.length === 0 ? (
        <div className="mt-5 rounded-xl border border-border bg-background/30 p-8 text-center">
          <File className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
          <p className="text-xs text-muted-foreground">
            {purchase?.status === 'pending' 
              ? '⏳ Order pending admin approval. Check back later.' 
              : '📎 No download links added yet'}
          </p>
        </div>
      ) : (
        <div className="mt-5 max-h-[45vh] space-y-3 overflow-y-auto pr-1 custom-scroll">
          {files.map((f, index) => (
            <div
              key={f.id}
              className="group rounded-xl border border-border bg-background/40 p-4 transition-all hover:border-primary/30 hover:bg-background/60 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground tracking-[0.15em] font-mono bg-accent/30 px-2 py-0.5 rounded-full">
                    #{index + 1}
                  </span>
                  {f.tag && (
                    <span className="rounded-full border border-primary/40 px-2.5 py-0.5 text-[9px] text-primary uppercase font-bold tracking-wider">
                      {f.tag}
                    </span>
                  )}
                </div>
              </div>
              <p className="text-sm font-bold text-primary group-hover:glow-text transition">{f.label || 'Download'}</p>
              <p className="mt-1 truncate text-[10px] text-muted-foreground font-mono bg-accent/20 px-2 py-1 rounded-md">
                {f.url}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => void copy(f.url)}
                  className="rounded-lg border border-border px-3 py-1.5 text-[10px] text-muted-foreground hover:text-primary hover:border-primary transition flex items-center gap-1.5 font-medium bg-background/50"
                >
                  <Copy className="h-3.5 w-3.5" /> COPY LINK
                </button>
                <a
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-primary px-4 py-1.5 text-[10px] font-bold text-primary-foreground hover:opacity-90 transition flex items-center gap-1.5 shadow-lg shadow-primary/20"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> OPEN
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}