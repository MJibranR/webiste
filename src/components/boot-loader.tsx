import { useEffect, useState } from "react";
import logoAsset from "@/assets/spiderhex-logo.webp.asset.json";

const STATUS_LINES = [
  "ENABLING REAL-TIME ANTI-DETECTION SHIELD...",
  "INJECTING HEX MODULES...",
  "SYNCING PANEL DATABASE...",
  "FINALIZING SECURE CHANNEL...",
];

export function BootLoader({ ready, onDone }: { ready: boolean; onDone: () => void }) {
  const [progress, setProgress] = useState(0);
  const [fading, setFading] = useState(false);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => Math.min(ready ? 100 : 92, p + Math.floor(Math.random() * 4) + 1));
    }, 90);
    return () => clearInterval(interval);
  }, [ready]);

  useEffect(() => {
    if (ready) setProgress(100);
  }, [ready]);

  useEffect(() => {
    if (progress < 100) return;
    const t1 = setTimeout(() => setFading(true), 500);
    const t2 = setTimeout(onDone, 1100);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [progress, onDone]);

  const lineIndex = Math.min(
    STATUS_LINES.length - 1,
    Math.floor(progress / (100 / STATUS_LINES.length)),
  );

  return (
    <div
      className={`fixed inset-0 z-[999] flex flex-col items-center justify-center bg-background transition-opacity duration-500 ${
        fading ? "opacity-0" : "opacity-100"
      }`}
      role="status"
      aria-label="Loading SPIDER HEX"
    >
      {/* Radar ring logo */}
    <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl border border-primary/60 bg-surface">
      <img 
        src="/favicon.png" 
        alt="SPIDER HEX logo" 
        className="h-full w-full object-cover"
        onError={(e) => {
          // Fallback if image fails to load
          (e.target as HTMLImageElement).style.display = 'none';
          // Show emoji fallback
          const parent = (e.target as HTMLImageElement).parentElement;
          if (parent) {
            const fallback = document.createElement('span');
            fallback.className = 'text-5xl';
            fallback.textContent = '🕷️';
            parent.appendChild(fallback);
          }
        }}
      />
      <br />
    </div>
        

      <br />
      {/* Badge */}
      <div className="mb-5 flex items-center gap-2 rounded-full border border-primary/50 bg-surface px-4 py-1.5 shadow-[0_0_20px_2px_hsl(var(--primary)/0.25)]">
        <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
        <span className="text-[11px] tracking-widest text-foreground">
          SECURE KERNEL LOAD • V3.0 PRO BYPASS
        </span>
      </div>

      {/* Title */}
      <h1 className="text-4xl font-bold tracking-[0.15em] text-primary drop-shadow-[0_0_14px_hsl(var(--primary)/0.6)]">
        SPIDER HEX
      </h1>
      <p className="mt-2 text-[11px] tracking-[0.35em] text-muted-foreground">
        NEXT-GEN UNDETECTED GAMING PORTAL
      </p>

      {/* Progress box */}
      <div className="mt-8 w-72 rounded-lg border border-primary/40 bg-surface p-4">
        <div className="mb-2 flex items-center justify-between text-[11px]">
          <span className="text-foreground">&gt;_ CORE_INITIALIZATION</span>
          <span className="text-primary">{progress}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-primary shadow-[0_0_10px_2px_hsl(var(--primary)/0.6)] transition-all duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-3 text-[10px] tracking-wider text-muted-foreground">
          &gt; {STATUS_LINES[lineIndex]}
        </p>
      </div>

      {/* Chips */}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {["🛡 UNDETECTED", "🔒 AES-256", "⚡ 5MS LATENCY", "☁ CLOUD SYNC"].map(
          (chip) => (
            <span
              key={chip}
              className="rounded-full border border-primary/40 bg-surface px-3 py-1 text-[10px] tracking-widest text-foreground"
            >
              {chip}
            </span>
          ),
        )}
      </div>
    </div>
  );
}

export function useBootLoader() {
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const waitForMedia = async () => {
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

      const media = Array.from(document.querySelectorAll<HTMLImageElement | HTMLVideoElement | HTMLIFrameElement>("img, video, iframe"));
      const waits = media.map((element) => {
        if (element instanceof HTMLImageElement && element.complete) return Promise.resolve();
        if (element instanceof HTMLVideoElement && element.readyState >= 2) return Promise.resolve();

        return new Promise<void>((resolve) => {
          const done = () => resolve();
          element.addEventListener("load", done, { once: true });
          element.addEventListener("loadeddata", done, { once: true });
          element.addEventListener("error", done, { once: true });
        });
      });

      const fonts = document.fonts?.ready ?? Promise.resolve();
      const timeout = new Promise<void>((resolve) => setTimeout(resolve, 12000));
      await Promise.race([Promise.all([fonts, ...waits]).then(() => undefined), timeout]);
      if (!cancelled) setReady(true);
    };

    void waitForMedia();
    return () => {
      cancelled = true;
    };
  }, []);

  return { loading, ready, finish: () => setLoading(false) };
}