import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { Logo, MatrixRain, Scanlines, Footer } from "./shell";
import { NotificationBell } from "./notification-bell";

export function AdminShell({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  if (loading || !user || user.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-danger">
        VERIFYING ADMIN CLEARANCE<span className="status-dot ml-2" />
      </div>
    );
  }

  const nav = [
    { to: "/admin", label: "OVERVIEW" },
    { to: "/admin/products", label: "PRODUCTS" },
    { to: "/admin/downloads", label: "DOWNLOADS" },
    { to: "/admin/users", label: "USERS" },
    { to: "/admin/content", label: "SITE CONTENT" },
    { to: "/admin/notifications", label: "NOTIFICATIONS" },
  ] as const;

  return (
    <div className="min-h-screen">
      <Scanlines />
      <MatrixRain />
      <header className="border-b border-gold/30 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <Logo size="text-base" />
            <span className="rounded border border-gold/50 px-2 py-1 text-[10px] text-gold">ADMIN</span>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px]">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                activeOptions={{ exact: n.to === "/admin" }}
                activeProps={{ className: "bg-accent text-primary" }}
                className="rounded border border-border px-3 py-2 text-muted-foreground transition hover:text-primary"
              >
                {n.label}
              </Link>
            ))}
            <NotificationBell />
            <button
              onClick={() => {
                logout();
                navigate({ to: "/" });
              }}
              className="rounded border border-danger/50 px-3 py-2 text-danger transition hover:bg-danger/10"
            >
              LOGOUT
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
      <Footer />
    </div>
  );
}
