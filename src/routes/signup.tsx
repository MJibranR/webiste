import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { Logo, MatrixRain, Scanlines } from "@/components/shell";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
  head: () => ({
    meta: [
      { title: "Create Account — SPIDER HEX" },
      { name: "description", content: "Create your SPIDER HEX account to buy panels and get instant download access." },
      { property: "og:title", content: "Create Account — SPIDER HEX" },
      { property: "og:description", content: "Join SPIDER HEX for premium gaming panels and instant downloads." },
    ],
  }),
});

function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: "", email: "", whatsapp: "", password: "", confirm: "" });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [input, setInput] = useState("");
  const [key, setKey] = useState("HEX-XXXXX");

  useEffect(() => {
    setKey(`HEX-${Math.random().toString(36).slice(2, 7).toUpperCase()}`);
  }, []);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.fullName || !form.email || !form.whatsapp || !form.password) return setError("ALL FIELDS REQUIRED");
    if (form.password.length < 6) return setError("PASSWORD MUST BE 6+ CHARACTERS");
    if (form.password !== form.confirm) return setError("PASSWORDS DO NOT MATCH");
    if (input.trim().toUpperCase() !== key) return setError("VERIFICATION KEY INCORRECT");
    setLoading(true);
    window.setTimeout(() => {
      const res = signup(form);
      setLoading(false);
      if (!res.ok) return setError(res.error ?? "SIGNUP FAILED");
      toast.success("ACCOUNT CREATED");
      navigate({ to: "/dashboard" });
    }, 500);
  };

  const field = "mt-2 w-full rounded border border-input bg-surface px-3 py-3 text-sm outline-none focus:border-primary";
  const label = "mt-4 block text-[11px] tracking-[0.2em] text-muted-foreground";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <Scanlines />
      <MatrixRain />
      <Logo />
      <form onSubmit={submit} className="panel mt-6 w-full max-w-md p-7">
        <h1 className="glow-text text-lg font-bold tracking-[0.2em] text-primary">CREATE ACCOUNT</h1>
        <p className="mt-1 text-xs text-muted-foreground">// JOIN THE HEX NETWORK</p>

        <label className={label}>FULL NAME</label>
        <input value={form.fullName} onChange={set("fullName")} className={field} placeholder="John Spider" />

        <label className={label}>EMAIL ADDRESS</label>
        <input type="email" value={form.email} onChange={set("email")} className={field} placeholder="you@mail.com" />

        <label className={label}>WHATSAPP NUMBER</label>
        <input value={form.whatsapp} onChange={set("whatsapp")} className={field} placeholder="+92 300 0000000" />

        <label className={label}>PASSWORD</label>
        <div className="relative">
          <input
            type={show ? "text" : "password"}
            value={form.password}
            onChange={set("password")}
            className={`${field} pr-11`}
            placeholder="••••••••"
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

        <label className={label}>CONFIRM PASSWORD</label>
        <input
          type={show ? "text" : "password"}
          value={form.confirm}
          onChange={set("confirm")}
          className={field}
          placeholder="••••••••"
        />

        <div className="mt-5 rounded border border-border bg-surface-2/60 p-4">
          <p className="text-[11px] tracking-[0.2em] text-muted-foreground">HUMAN VERIFICATION</p>
          <p className="glow-gold mt-2 text-lg tracking-[0.35em]">{key}</p>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className={field}
            placeholder="TYPE THE KEY ABOVE"
          />
        </div>

        {error ? <p className="mt-4 rounded border border-danger/50 px-3 py-2 text-xs text-danger">{error}</p> : null}

        <button
          disabled={loading}
          className="pulse-glow mt-5 w-full rounded bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "CREATING..." : "CREATE ACCOUNT"}
        </button>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          HAVE AN ACCOUNT?{" "}
          <Link to="/login" className="text-primary hover:underline">
            LOGIN
          </Link>{" "}
          •{" "}
          <Link to="/" className="hover:text-primary">
            BACK TO STORE
          </Link>
        </p>
      </form>
    </div>
  );
}
