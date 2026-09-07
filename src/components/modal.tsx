import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect } from "react";

export function Modal({
  open,
  onClose,
  title,
  sub,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  sub?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-foreground/40 p-4 backdrop-blur-sm">
      <div className="panel relative my-8 w-full max-w-2xl border-primary/40 p-6 shadow-xl">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 rounded border border-border p-1.5 text-muted-foreground transition hover:border-danger/60 hover:text-danger"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="text-center">
          {sub ? (
            <span className="inline-block rounded-full border border-primary/50 px-3 py-1 text-[10px] tracking-[0.2em] text-primary">
              {sub}
            </span>
          ) : null}
          <h2 className="glow-text mt-3 text-lg font-bold tracking-[0.15em] text-primary">{title}</h2>
        </div>
        <div className="mt-5">{children}</div>
        {footer ? <div className="mt-5 border-t border-border pt-4">{footer}</div> : null}
      </div>
    </div>
  );
}
