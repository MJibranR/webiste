import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin-shell";
import { SectionTitle } from "@/components/shell";
import {
  DEFAULT_PAYMENT_SETTINGS,
  deletePaymentMethod,
  fetchPaymentMethods,
  fetchPaymentSettings,
  savePaymentMethod,
  savePaymentSettings,
  type PaymentMethod,
  type PaymentSettings,
} from "@/lib/wallet";

export const Route = createFileRoute("/admin/payments")({
  component: PaymentsPage,
  head: () => ({
    meta: [
      { title: "Payment Methods — PROXIUM Admin" },
      { name: "description", content: "Manage PROXIUM payment methods, exchange rate and the recharge tutorial." },
      { property: "og:title", content: "Payment Methods — PROXIUM Admin" },
      { property: "og:description", content: "Manage PROXIUM payment methods and wallet settings." },
    ],
  }),
});

function PaymentsPage() {
  return (
    <AdminShell>
      <PaymentsInner />
    </AdminShell>
  );
}

const EMPTY: Partial<PaymentMethod> = {
  name: "",
  accountLabel: "Number",
  accountValue: "",
  instructions: "",
  logoEmoji: "💳",
  enabled: true,
  sortOrder: 0,
};

function PaymentsInner() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [settings, setSettings] = useState<PaymentSettings>(DEFAULT_PAYMENT_SETTINGS);
  const [draft, setDraft] = useState<Partial<PaymentMethod>>(EMPTY);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [m, s] = await Promise.all([fetchPaymentMethods(), fetchPaymentSettings()]);
    setMethods(m);
    setSettings(s);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const saveMethod = async () => {
    if (!draft.name?.trim()) {
      toast.error("Enter a method name");
      return;
    }
    const err = await savePaymentMethod(draft);
    if (err) {
      toast.error(err);
      return;
    }
    toast.success("PAYMENT METHOD SAVED");
    setDraft(EMPTY);
    await load();
  };

  const remove = async (id: string) => {
    const err = await deletePaymentMethod(id);
    if (err) {
      toast.error(err);
      return;
    }
    toast.success("METHOD DELETED");
    await load();
  };

  const saveSettings = async () => {
    const err = await savePaymentSettings(settings);
    if (err) {
      toast.error(err);
      return;
    }
    toast.success("WALLET SETTINGS SAVED");
    await load();
  };

  if (loading) return <p className="py-20 text-center text-sm text-muted-foreground">LOADING PAYMENT SETUP...</p>;

  const field = "mt-1 w-full rounded border border-border bg-background px-3 py-2 text-xs text-primary";

  return (
    <>
      <SectionTitle sub="// WALLET TOP-UP CONFIGURATION">PAYMENT METHODS</SectionTitle>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="panel p-6">
          <p className="text-[11px] tracking-[0.2em] text-muted-foreground">
            {draft.id ? "EDIT METHOD" : "ADD NEW METHOD"}
          </p>
          <div className="mt-3 space-y-3">
            <label className="block text-[10px] text-muted-foreground">
              NAME
              <input value={draft.name ?? ""} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className={field} />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-[10px] text-muted-foreground">
                ACCOUNT LABEL
                <input
                  value={draft.accountLabel ?? ""}
                  onChange={(e) => setDraft({ ...draft, accountLabel: e.target.value })}
                  className={field}
                />
              </label>
              <label className="block text-[10px] text-muted-foreground">
                ACCOUNT NUMBER / ID
                <input
                  value={draft.accountValue ?? ""}
                  onChange={(e) => setDraft({ ...draft, accountValue: e.target.value })}
                  className={field}
                />
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block text-[10px] text-muted-foreground">
                ICON
                <input value={draft.logoEmoji ?? ""} onChange={(e) => setDraft({ ...draft, logoEmoji: e.target.value })} className={field} />
              </label>
              <label className="block text-[10px] text-muted-foreground">
                ORDER
                <input
                  type="number"
                  value={draft.sortOrder ?? 0}
                  onChange={(e) => setDraft({ ...draft, sortOrder: Number(e.target.value) })}
                  className={field}
                />
              </label>
              <label className="mt-5 flex items-center gap-2 text-[10px] text-muted-foreground">
                <input
                  type="checkbox"
                  checked={draft.enabled !== false}
                  onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })}
                />
                ENABLED
              </label>
            </div>
            <label className="block text-[10px] text-muted-foreground">
              INSTRUCTIONS
              <textarea
                rows={3}
                value={draft.instructions ?? ""}
                onChange={(e) => setDraft({ ...draft, instructions: e.target.value })}
                className={field}
              />
            </label>
            <div className="flex gap-2">
              <button
                onClick={saveMethod}
                className="rounded bg-primary px-4 py-2 text-[11px] font-bold text-primary-foreground transition hover:opacity-90"
              >
                {draft.id ? "UPDATE METHOD" : "ADD METHOD"}
              </button>
              {draft.id ? (
                <button
                  onClick={() => setDraft(EMPTY)}
                  className="rounded border border-border px-4 py-2 text-[11px] text-muted-foreground hover:text-primary"
                >
                  CANCEL
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="panel p-6">
          <p className="text-[11px] tracking-[0.2em] text-muted-foreground">WALLET SETTINGS</p>
          <div className="mt-3 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-[10px] text-muted-foreground">
                1 USD = BDT
                <input
                  type="number"
                  value={settings.usdToBdt}
                  onChange={(e) => setSettings({ ...settings, usdToBdt: Number(e.target.value) })}
                  className={field}
                />
              </label>
              <label className="block text-[10px] text-muted-foreground">
                MIN DEPOSIT (USD)
                <input
                  type="number"
                  value={settings.minDepositUsd}
                  onChange={(e) => setSettings({ ...settings, minDepositUsd: Number(e.target.value) })}
                  className={field}
                />
              </label>
            </div>
            <label className="block text-[10px] text-muted-foreground">
              TUTORIAL HEADING
              <input
                value={settings.tutorialHeading}
                onChange={(e) => setSettings({ ...settings, tutorialHeading: e.target.value })}
                className={field}
              />
            </label>
            <label className="block text-[10px] text-muted-foreground">
              TUTORIAL VIDEO URL
              <input
                value={settings.tutorialVideoUrl}
                onChange={(e) => setSettings({ ...settings, tutorialVideoUrl: e.target.value })}
                className={field}
              />
            </label>
            <label className="block text-[10px] text-muted-foreground">
              TUTORIAL TEXT
              <textarea
                rows={3}
                value={settings.tutorialText}
                onChange={(e) => setSettings({ ...settings, tutorialText: e.target.value })}
                className={field}
              />
            </label>
            <button
              onClick={saveSettings}
              className="rounded bg-primary px-4 py-2 text-[11px] font-bold text-primary-foreground transition hover:opacity-90"
            >
              SAVE WALLET SETTINGS
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {methods.map((m) => (
          <div key={m.id} className="panel flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="text-sm text-primary">
                {m.logoEmoji} {m.name} {m.enabled ? "" : <span className="text-danger">(DISABLED)</span>}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {m.accountLabel}: <span className="font-mono text-gold">{m.accountValue}</span>
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setDraft(m)}
                className="rounded border border-border px-3 py-2 text-[11px] text-primary hover:bg-accent"
              >
                EDIT
              </button>
              <button
                onClick={() => remove(m.id)}
                className="rounded border border-danger/60 px-3 py-2 text-[11px] text-danger hover:bg-danger/10"
              >
                DELETE
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
