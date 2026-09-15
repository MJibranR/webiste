import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Wallet, Copy, CheckCircle2, XCircle, Clock } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { SectionTitle } from "@/components/shell";
import { useAuth } from "@/lib/auth";
import {
  bdt,
  createDeposit,
  fetchDeposits,
  fetchPaymentMethods,
  fetchPaymentSettings,
  fetchWalletTransactions,
  youtubeEmbed,
  DEFAULT_PAYMENT_SETTINGS,
  type Deposit,
  type PaymentMethod,
  type PaymentSettings,
  type WalletTransaction,
} from "@/lib/wallet";

export const Route = createFileRoute("/dashboard/wallet")({
  component: WalletPage,
  head: () => ({
    meta: [
      { title: "Add Balance — PROXIUM CORPORATION" },
      { name: "description", content: "Top up your PROXIUM wallet with bKash, Nagad or Binance and track deposit approvals." },
      { property: "og:title", content: "Add Balance — PROXIUM CORPORATION" },
      { property: "og:description", content: "Top up your PROXIUM wallet and track deposit approvals." },
    ],
  }),
});

function WalletPage() {
  return (
    <DashboardShell>
      <WalletInner />
    </DashboardShell>
  );
}

function WalletInner() {
  const { user, refresh } = useAuth();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [settings, setSettings] = useState<PaymentSettings>(DEFAULT_PAYMENT_SETTINGS);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [txs, setTxs] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [methodId, setMethodId] = useState("");
  const [amount, setAmount] = useState("5");
  const [sender, setSender] = useState("");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");

  const load = async () => {
    const [m, s, d, t] = await Promise.all([
      fetchPaymentMethods(true),
      fetchPaymentSettings(),
      fetchDeposits(),
      fetchWalletTransactions(),
    ]);
    setMethods(m);
    setSettings(s);
    setDeposits(d);
    setTxs(t);
    if (!methodId && m[0]) setMethodId(m[0].id);
    setLoading(false);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = useMemo(() => methods.find((m) => m.id === methodId), [methods, methodId]);
  const usd = Number(amount) || 0;

  const copy = (value: string) => {
    navigator.clipboard.writeText(value).then(
      () => toast.success("COPIED"),
      () => toast.error("Copy failed"),
    );
  };

  const submit = async () => {
    if (!user || !selected) return;
    if (usd < settings.minDepositUsd) {
      toast.error(`Minimum deposit is $${settings.minDepositUsd}`);
      return;
    }
    setSaving(true);
    const err = await createDeposit({
      userId: user.id,
      userEmail: user.email,
      amountUsd: usd,
      rate: settings.usdToBdt,
      methodId: selected.id,
      methodName: selected.name,
      senderInfo: sender,
      reference,
      note,
    });
    setSaving(false);
    if (err) {
      toast.error(err);
      return;
    }
    toast.success("DEPOSIT SUBMITTED — waiting for admin approval");
    setReference("");
    setNote("");
    setSender("");
    await load();
    await refresh();
  };

  if (loading) {
    return <p className="py-20 text-center text-sm text-muted-foreground">LOADING WALLET...</p>;
  }

  return (
    <>
      <SectionTitle sub="// TOP UP YOUR PROXIUM WALLET">ADD BALANCE</SectionTitle>

      <div className="panel p-6">
        <p className="text-[11px] tracking-[0.2em] text-muted-foreground">
          <Wallet className="mr-2 inline h-4 w-4 text-primary" /> CURRENT BALANCE
        </p>
        <p className="glow-gold mt-2 text-4xl font-bold">${(user?.balance ?? 0).toFixed(2)}</p>
        <p className="mt-2 text-[11px] text-muted-foreground">
          RATE: 1 USD = ৳{settings.usdToBdt} • MIN DEPOSIT ${settings.minDepositUsd}
        </p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="panel p-6">
          <p className="text-[11px] tracking-[0.2em] text-muted-foreground">1. SELECT PAYMENT METHOD</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {methods.map((m) => (
              <button
                key={m.id}
                onClick={() => setMethodId(m.id)}
                className={`rounded border px-3 py-3 text-xs transition ${
                  methodId === m.id ? "border-primary bg-accent text-primary" : "border-border text-muted-foreground hover:text-primary"
                }`}
              >
                <span className="mr-1 text-base">{m.logoEmoji}</span> {m.name}
              </button>
            ))}
            {methods.length === 0 ? <p className="text-xs text-muted-foreground">NO METHODS AVAILABLE</p> : null}
          </div>

          {selected ? (
            <div className="mt-5 rounded border border-primary/30 bg-accent/20 p-4">
              <p className="text-[11px] tracking-[0.2em] text-muted-foreground">2. SEND PAYMENT TO</p>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] text-muted-foreground">{selected.accountLabel}</p>
                  <p className="font-mono text-lg text-primary">{selected.accountValue}</p>
                </div>
                <button
                  onClick={() => copy(selected.accountValue)}
                  className="flex items-center gap-1 rounded border border-border px-3 py-2 text-[11px] text-primary hover:bg-accent"
                >
                  <Copy className="h-3.5 w-3.5" /> COPY
                </button>
              </div>
              {selected.instructions ? (
                <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">{selected.instructions}</p>
              ) : null}
            </div>
          ) : null}

          <p className="mt-5 text-[11px] tracking-[0.2em] text-muted-foreground">3. SUBMIT YOUR DEPOSIT</p>
          <div className="mt-3 space-y-3 text-xs">
            <div className="flex flex-wrap gap-2">
              {[5, 10, 25, 50].map((a) => (
                <button
                  key={a}
                  onClick={() => setAmount(String(a))}
                  className="rounded border border-border px-3 py-2 text-primary transition hover:bg-accent"
                >
                  ${a}
                </button>
              ))}
            </div>
            <label className="block">
              <span className="text-[10px] text-muted-foreground">AMOUNT (USD)</span>
              <input
                type="number"
                min={settings.minDepositUsd}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-primary"
              />
              <span className="mt-1 block text-[10px] text-gold">= ৳{bdt(usd, settings.usdToBdt)} BDT</span>
            </label>
            <label className="block">
              <span className="text-[10px] text-muted-foreground">YOUR SENDER NUMBER / ACCOUNT</span>
              <input
                value={sender}
                onChange={(e) => setSender(e.target.value)}
                placeholder="01XXXXXXXXX"
                className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-primary"
              />
            </label>
            <label className="block">
              <span className="text-[10px] text-muted-foreground">TRANSACTION / REFERENCE ID</span>
              <input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="TRX ID"
                className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-primary"
              />
            </label>
            <label className="block">
              <span className="text-[10px] text-muted-foreground">NOTE (OPTIONAL)</span>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-primary"
              />
            </label>
            <button
              onClick={submit}
              disabled={saving || !selected}
              className="pulse-glow w-full rounded bg-primary px-4 py-3 text-[11px] font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "SUBMITTING..." : "SUBMIT DEPOSIT REQUEST"}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="panel p-6">
            <p className="text-sm font-bold tracking-[0.15em] text-primary">{settings.tutorialHeading}</p>
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{settings.tutorialText}</p>
            {settings.tutorialVideoUrl ? (
              <div className="mt-4 aspect-video w-full overflow-hidden rounded border border-border bg-black">
                <iframe
                  src={youtubeEmbed(settings.tutorialVideoUrl)}
                  title="Recharge tutorial"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="h-full w-full"
                />
              </div>
            ) : null}
          </div>

          <div className="panel p-6">
            <p className="text-[11px] tracking-[0.2em] text-muted-foreground">MY DEPOSIT REQUESTS</p>
            <div className="mt-3 space-y-2">
              {deposits.length === 0 ? (
                <p className="text-xs text-muted-foreground">NO DEPOSITS YET</p>
              ) : (
                deposits.map((d) => (
                  <div key={d.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-border p-3 text-xs">
                    <div>
                      <p className="text-primary">
                        ${d.amountUsd.toFixed(2)} <span className="text-muted-foreground">• ৳{d.amountBdt}</span>
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {d.methodName} • {d.reference} • {new Date(d.createdAt).toLocaleString()}
                      </p>
                      {d.adminNote ? <p className="text-[10px] text-gold">{d.adminNote}</p> : null}
                    </div>
                    <StatusChip status={d.status} />
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="panel p-6">
            <p className="text-[11px] tracking-[0.2em] text-muted-foreground">WALLET HISTORY</p>
            <div className="mt-3 space-y-2">
              {txs.length === 0 ? (
                <p className="text-xs text-muted-foreground">NO TRANSACTIONS YET</p>
              ) : (
                txs.map((t) => (
                  <div key={t.id} className="flex items-center justify-between gap-2 rounded border border-border p-3 text-xs">
                    <div>
                      <p className={t.kind === "credit" ? "text-success" : "text-danger"}>
                        {t.kind === "credit" ? "+" : "-"}${t.amount.toFixed(2)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{t.note}</p>
                    </div>
                    <p className="text-[10px] text-muted-foreground">${t.balanceAfter.toFixed(2)}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function StatusChip({ status }: { status: Deposit["status"] }) {
  if (status === "approved")
    return (
      <span className="flex items-center gap-1 rounded border border-success/60 px-2 py-1 text-[10px] text-success">
        <CheckCircle2 className="h-3 w-3" /> APPROVED
      </span>
    );
  if (status === "rejected")
    return (
      <span className="flex items-center gap-1 rounded border border-danger/60 px-2 py-1 text-[10px] text-danger">
        <XCircle className="h-3 w-3" /> REJECTED
      </span>
    );
  return (
    <span className="flex items-center gap-1 rounded border border-gold/60 px-2 py-1 text-[10px] text-gold">
      <Clock className="h-3 w-3" /> PENDING
    </span>
  );
}
