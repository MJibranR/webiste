import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin-shell";
import { SectionTitle } from "@/components/shell";
import { approveDeposit, fetchDeposits, rejectDeposit, type Deposit } from "@/lib/wallet";

export const Route = createFileRoute("/admin/deposits")({
  component: DepositsPage,
  head: () => ({
    meta: [
      { title: "Deposit Requests — PROXIUM Admin" },
      { name: "description", content: "Review, approve or reject wallet deposit requests for PROXIUM CORPORATION." },
      { property: "og:title", content: "Deposit Requests — PROXIUM Admin" },
      { property: "og:description", content: "Review and approve PROXIUM wallet deposits." },
    ],
  }),
});

function DepositsPage() {
  return (
    <AdminShell>
      <DepositsInner />
    </AdminShell>
  );
}

const FILTERS = ["pending", "approved", "rejected", "all"] as const;

function DepositsInner() {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("pending");
  const [busy, setBusy] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setDeposits(await fetchDeposits());
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const act = async (d: Deposit, approve: boolean) => {
    setBusy(d.id);
    const note = notes[d.id] ?? "";
    const err = approve ? await approveDeposit(d.id, note) : await rejectDeposit(d.id, note);
    setBusy(null);
    if (err) {
      toast.error(err);
      return;
    }
    toast.success(approve ? "DEPOSIT APPROVED — wallet credited" : "DEPOSIT REJECTED");
    await load();
  };

  const rows = filter === "all" ? deposits : deposits.filter((d) => d.status === filter);

  return (
    <>
      <SectionTitle sub="// WALLET TOP-UP REQUESTS">DEPOSITS</SectionTitle>

      <div className="mb-4 flex flex-wrap gap-2 text-[11px]">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded border px-3 py-2 uppercase transition ${
              filter === f ? "border-primary bg-accent text-primary" : "border-border text-muted-foreground hover:text-primary"
            }`}
          >
            {f} ({f === "all" ? deposits.length : deposits.filter((d) => d.status === f).length})
          </button>
        ))}
      </div>

      {loading ? (
        <p className="py-20 text-center text-sm text-muted-foreground">LOADING DEPOSITS...</p>
      ) : rows.length === 0 ? (
        <div className="panel p-8 text-center text-xs text-muted-foreground">NO DEPOSITS IN THIS VIEW</div>
      ) : (
        <div className="space-y-3">
          {rows.map((d) => (
            <div key={d.id} className="panel p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-primary">
                    ${d.amountUsd.toFixed(2)} <span className="text-muted-foreground">• ৳{d.amountBdt} @ {d.rate}</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground">{d.userEmail}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {d.methodName} • SENDER: {d.senderInfo || "—"} • TRX: <span className="font-mono text-gold">{d.reference}</span>
                  </p>
                  {d.note ? <p className="mt-1 text-[11px] text-muted-foreground">NOTE: {d.note}</p> : null}
                  <p className="mt-1 text-[10px] text-muted-foreground">{new Date(d.createdAt).toLocaleString()}</p>
                </div>
                <span
                  className={`rounded border px-2 py-1 text-[10px] uppercase ${
                    d.status === "approved"
                      ? "border-success/60 text-success"
                      : d.status === "rejected"
                        ? "border-danger/60 text-danger"
                        : "border-gold/60 text-gold"
                  }`}
                >
                  {d.status}
                </span>
              </div>

              {d.status === "pending" ? (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <input
                    value={notes[d.id] ?? ""}
                    onChange={(e) => setNotes((n) => ({ ...n, [d.id]: e.target.value }))}
                    placeholder="Admin note (optional)"
                    className="min-w-[200px] flex-1 rounded border border-border bg-background px-3 py-2 text-xs text-primary"
                  />
                  <button
                    disabled={busy === d.id}
                    onClick={() => act(d, true)}
                    className="rounded bg-primary px-4 py-2 text-[11px] font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                  >
                    APPROVE
                  </button>
                  <button
                    disabled={busy === d.id}
                    onClick={() => act(d, false)}
                    className="rounded border border-danger/60 px-4 py-2 text-[11px] text-danger transition hover:bg-danger/10 disabled:opacity-50"
                  >
                    REJECT
                  </button>
                </div>
              ) : d.adminNote ? (
                <p className="mt-2 text-[11px] text-gold">ADMIN NOTE: {d.adminNote}</p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
