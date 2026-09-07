import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { LayoutDashboard, Download, History, Store, MessageCircle, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Logo, MatrixRain, Scanlines, Footer } from "./shell";

export function DashboardShell({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-primary glow-text">
        LOADING SECURE SESSION<span className="status-dot ml-2" />
      </div>
    );
  }

  const nav = [
    { to: "/dashboard", label: "DASHBOARD", icon: LayoutDashboard },
    { to: "/dashboard/downloads", label: "DOWNLOADS", icon: Download },
    { to: "/dashboard/purchases", label: "HISTORY", icon: History },
    { to: "/store", label: "STORE", icon: Store },
  ] as const;

  return (
    <div className="min-h-screen">
      <Scanlines />
      <MatrixRain />
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 lg:flex-row">
        <aside className="panel h-fit w-full shrink-0 p-4 lg:sticky lg:top-6 lg:w-64">
          <Logo size="text-base" />
          <div className="mt-5 flex items-center gap-3 border-t border-border pt-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-primary/60 bg-accent text-xl pulse-glow">
              🕷️
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm text-primary">{user.username}</p>
              <p className="text-[11px] text-muted-foreground">LVL {user.level} • XP {user.xp}</p>
            </div>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded bg-accent">
            <div className="h-full bg-primary" style={{ width: `${Math.min(100, user.xp % 100)}%` }} />
          </div>

          <nav className="mt-6 space-y-1 text-xs">
            {nav.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                activeOptions={{ exact: to === "/dashboard" }}
                activeProps={{ className: "bg-accent text-primary" }}
                className="flex items-center gap-3 rounded border border-transparent px-3 py-2.5 text-muted-foreground transition hover:border-border hover:text-primary"
              >
                <Icon className="h-4 w-4" /> {label}
              </Link>
            ))}
            <a
              href="https://wa.me/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded border border-transparent px-3 py-2.5 text-muted-foreground transition hover:border-border hover:text-primary"
            >
              <MessageCircle className="h-4 w-4" /> WHATSAPP
            </a>
            {user.role === "admin" ? (
              <Link
                to="/admin"
                className="flex items-center gap-3 rounded border border-gold/40 px-3 py-2.5 text-gold transition hover:bg-gold/10"
              >
                ⚙ ADMIN PANEL
              </Link>
            ) : null}
            <button
              onClick={() => {
                logout();
                navigate({ to: "/" });
              }}
              className="flex w-full items-center gap-3 rounded border border-transparent px-3 py-2.5 text-danger transition hover:border-danger/50"
            >
              <LogOut className="h-4 w-4" /> LOGOUT
            </button>
          </nav>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
      <Footer />
    </div>
  );
}
