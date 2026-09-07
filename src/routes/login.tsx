import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { Logo, MatrixRain, Scanlines } from "@/components/shell";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "Login — SPIDER HEX" },
      { name: "description", content: "Sign in to your SPIDER HEX account to access licenses, wallet and downloads." },
      { property: "og:title", content: "Login — SPIDER HEX" },
      { property: "og:description", content: "Secure access to your SPIDER HEX panel licenses." },
    ],
  }),
});

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!identifier || !password) return setError("ALL FIELDS REQUIRED");
    if (!verified) return setError("COMPLETE HUMAN VERIFICATION");
    setLoading(true);
    window.setTimeout(() => {
      const res = login(identifier, password);
      setLoading(false);
      if (!res.ok) {
        setError(res.error ?? "LOGIN FAILED");
        return;
      }
      toast.success("ACCESS GRANTED");
      navigate({ to: identifier.trim().toLowerCase() === "admin@spiderhex.com" ? "/admin" : "/dashboard" });
    }, 500);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <Scanlines />
      <MatrixRain />
      <Logo />
      <form onSubmit={submit} className="panel mt-6 w-full max-w-md p-7">
        <h1 className="glow-text text-lg font-bold tracking-[0.2em] text-primary">LOGIN</h1>
        <p className="mt-1 text-xs text-muted-foreground">// AUTHENTICATE TO CONTINUE</p>

        <label className="mt-6 block text-[11px] tracking-[0.2em] text-muted-foreground">EMAIL / USERNAME</label>
        <input
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          className="mt-2 w-full rounded border border-input bg-surface px-3 py-3 text-sm outline-none focus:border-primary"
          placeholder="admin@spiderhex.com"
          autoComplete="username"
        />

        <label className="mt-4 block text-[11px] tracking-[0.2em] text-muted-foreground">PASSWORD</label>
        <div className="relative mt-2">
          <input
            type={show ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded border border-input bg-surface px-3 py-3 pr-11 text-sm outline-none focus:border-primary"
            placeholder="••••••••"
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-primary"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        <div className="mt-3 text-right">
          <button
            type="button"
            onClick={() => toast("Contact support on WhatsApp to reset your password.")}
            className="text-[11px] text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
          >
            FORGOT PASSWORD?
          </button>
        </div>

        <button
          type="button"
          onClick={() => setVerified((v) => !v)}
          className={`mt-5 flex w-full items-center gap-3 rounded border px-4 py-3 text-left text-xs transition ${
            verified ? "border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/60"
          }`}
        >
          <span
            className={`flex h-5 w-5 items-center justify-center rounded-sm border ${
              verified ? "border-primary bg-primary text-primary-foreground" : "border-border"
            }`}
          >
            {verified ? "✓" : ""}
          </span>
          {verified ? "VERIFIED — HUMAN CONFIRMED" : "VERIFY YOU ARE HUMAN"}
          <ShieldCheck className="ml-auto h-4 w-4 text-gold" />
        </button>

        {error ? <p className="mt-4 rounded border border-danger/50 px-3 py-2 text-xs text-danger">{error}</p> : null}

        <button
          disabled={loading}
          className="pulse-glow mt-5 w-full rounded bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "AUTHENTICATING..." : "LOGIN"}
        </button>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          NO ACCOUNT?{" "}
          <Link to="/signup" className="text-primary hover:underline">
            SIGNUP
          </Link>{" "}
          •{" "}
          <Link to="/" className="text-muted-foreground hover:text-primary">
            BACK TO STORE
          </Link>
        </p>
      </form>
    </div>
  );
}
