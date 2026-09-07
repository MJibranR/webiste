import { Link, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { useSettings } from "@/lib/use-settings";
import logoAsset from "@/assets/spiderhex-logo.webp.asset.json";
import { NotificationBell } from "./notification-bell";

export function Scanlines() {
  return <div className="scanline-overlay" aria-hidden />;
}

export function MatrixRain() {
  const cols = Array.from({ length: 22 });
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden opacity-10" aria-hidden>
      {cols.map((_, i) => (
        <span
          key={i}
          className="matrix-rain absolute top-0 text-[10px] leading-4 text-primary"
          style={{
            left: `${(i / cols.length) * 100}%`,
            animationDuration: `${6 + (i % 7) * 2}s`,
            animationDelay: `${-i * 0.7}s`,
          }}
        >
          {Array.from({ length: 30 })
            .map((_, j) => ((i * 7 + j * 13) % 3 === 0 ? "1" : "0"))
            .join(" ")}
        </span>
      ))}
    </div>
  );
}

export function Logo({ size = "text-xl" }: { size?: string }) {
  const { brandName, logoImageUrl } = useSettings();
  const src = logoImageUrl || logoAsset.url;
  return (
    <Link to="/" className={`${size} flex items-center gap-2 font-bold tracking-[0.25em] text-primary`}>
      <img
        src={src}
        alt={`${brandName} logo`}
        className="h-9 w-9 rounded-md object-cover ring-1 ring-border"
      />
      <span className="sr-only sm:not-sr-only">{brandName}</span>
    </Link>
  );
}

export function TopNav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Logo />
        <div className="flex items-center gap-2 text-xs">
          <Link to="/store" className="hidden rounded border border-border px-3 py-2 text-muted-foreground transition hover:text-primary sm:inline-block">
            STORE
          </Link>
          {user ? (
            <>
              <NotificationBell />
              <Link
                to={user.role === "admin" ? "/admin" : "/dashboard"}
                className="rounded border border-border px-3 py-2 text-primary transition hover:bg-accent"
              >
                {user.role === "admin" ? "ADMIN" : "DASHBOARD"}
              </Link>
              <button
                onClick={() => {
                  logout();
                  navigate({ to: "/" });
                }}
                className="rounded border border-danger/50 px-3 py-2 text-danger transition hover:bg-danger/10"
              >
                LOGOUT
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="rounded border border-border px-3 py-2 text-muted-foreground transition hover:text-primary">
                LOGIN
              </Link>
              <Link
                to="/signup"
                className="pulse-glow rounded bg-primary px-3 py-2 font-bold text-primary-foreground transition hover:opacity-90"
              >
                SIGNUP
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

export function Footer() {
  const { footerText, footerStatus, logoEmoji } = useSettings();
  return (
    <footer className="mt-16 border-t border-border py-8 text-center text-xs text-muted-foreground">
      <p>
        {logoEmoji} {footerText}
      </p>
      {footerStatus ? (
        <p className="mt-2 opacity-60">
          {footerStatus} <span className="status-dot ml-1 align-middle" />
        </p>
      ) : null}
    </footer>
  );
}

export function Page({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <Scanlines />
      <MatrixRain />
      <TopNav />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      <Footer />
    </div>
  );
}

export function SectionTitle({ children, sub }: { children: ReactNode; sub?: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-lg font-bold tracking-[0.2em] text-primary glow-text">{children}</h2>
      {sub ? <p className="mt-1 text-xs text-muted-foreground">{sub}</p> : null}
    </div>
  );
}
