import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin-shell";
import { SectionTitle } from "@/components/shell";
import { Modal } from "@/components/modal";
import { supabase } from "@/integrations/supabase/client";
import {
  logActivity,
  purchaseFiles,
  pushNotification,
  uid,
  fetchPurchases,
  fetchUsers,
  updatePurchase,
  type DownloadFile,
  type Purchase,
} from "@/lib/spiderhex";

export const Route = createFileRoute("/admin/downloads")({
  component: () => (
    <AdminShell>
      <DownloadsAdmin />
    </AdminShell>
  ),
  head: () => ({
    meta: [
      { title: "Download Links — SPIDER HEX Admin" },
      { name: "description", content: "Attach and update download links for every SPIDER HEX order." },
    ],
  }),
});

const field = "w-full rounded border border-border bg-background/60 px-3 py-2 text-xs text-foreground outline-none focus:border-primary";

function DownloadsAdmin() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "active">("all");
  const [editing, setEditing] = useState<Purchase | null>(null);
  const [rows, setRows] = useState<DownloadFile[]>([]);
  const [credentials, setCredentials] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [purchasesData, usersData] = await Promise.all([
        fetchPurchases(),
        fetchUsers()
      ]);
      // Remove duplicates by id
      const uniquePurchases = purchasesData.filter((p, index, self) => 
        index === self.findIndex((t) => t.id === p.id)
      );
      setPurchases(uniquePurchases);
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const list = filter === "pending" 
    ? purchases.filter((p) => p.status === "pending") 
    : filter === "active"
    ? purchases.filter((p) => p.status === "active")
    : purchases;

  const openEditor = (p: Purchase) => {
    const existing = purchaseFiles(p);
    setRows(existing.length ? existing.map((f) => ({ ...f, id: f.id === "legacy" ? uid() : f.id })) : [blank()]);
    setCredentials(p.credentials || "");
    setEditing(p);
  };

  const blank = (): DownloadFile => ({ id: uid(), label: "", tag: "", url: "" });

  const update = (id: string, patch: Partial<DownloadFile>) =>
    setRows((r) => r.map((f) => (f.id === id ? { ...f, ...patch } : f)));

  const save = async () => {
    if (!editing) return;
    const clean = rows
      .map((f) => ({ ...f, label: f.label.trim(), tag: f.tag.trim(), url: f.url.trim() }))
      .filter((f) => f.url);
    
    if (clean.length === 0) {
      toast.error("ADD AT LEAST ONE LINK");
      return;
    }
    
    const wasPending = editing.status === 'pending';

    // ✅ Save with credentials
    const error = await updatePurchase(editing.id, {
      files: clean,
      downloadLink: clean[0]?.url ?? "",
      status: clean.length > 0 ? 'active' : editing.status,
      credentials: credentials.trim() || editing.credentials || "",
    });

    if (error) {
      toast.error('Failed to save changes');
      return;
    }

    pushNotification(
      editing.userId,
      wasPending ? "✅ ORDER ACTIVATED" : "📥 DOWNLOAD LINKS UPDATED",
      `${clean.length} download link${clean.length > 1 ? "s are" : " is"} now available for ${editing.productName}.`,
    );
    
    logActivity(
      "download",
      "ADMIN",
      `${wasPending ? "Activated" : "Updated"} ${clean.length} download link(s) for ${editing.productName}`
    );
    
    toast.success(wasPending ? "ORDER ACTIVATED ✅" : "CHANGES SAVED");
    setEditing(null);
    setCredentials("");
    loadData();
  };

  const toggleStatus = async (p: Purchase) => {
    const next = p.status === "active" ? "expired" : "active";
    
    const error = await updatePurchase(p.id, { status: next });
    if (error) {
      toast.error('Failed to update status');
      return;
    }

    pushNotification(
      p.userId,
      "LICENSE STATUS CHANGED",
      `Your license for ${p.productName} is now ${next.toUpperCase()}.`,
    );
    logActivity("download", "ADMIN", `Set ${p.productName} license to ${next}`);
    toast.success(`STATUS CHANGED TO ${next.toUpperCase()}`);
    loadData();
  };

  if (loading) {
    return (
      <>
        <SectionTitle sub="// DELIVERY CONTROL">DOWNLOAD LINKS</SectionTitle>
        <div className="flex justify-center items-center py-20">
          <p className="text-sm text-muted-foreground">LOADING...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <SectionTitle sub="// DELIVERY CONTROL">DOWNLOAD LINKS</SectionTitle>

      <div className="flex gap-2 text-[11px] flex-wrap">
        {(["all", "pending", "active"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded border px-3 py-2 ${
              filter === f
                ? "border-primary bg-accent text-primary"
                : "border-border text-muted-foreground hover:text-primary"
            }`}
          >
            {f === "all" ? "ALL ORDERS" : f === "pending" ? "⏳ PENDING" : "✅ ACTIVE"}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="panel mt-6 p-10 text-center text-xs text-muted-foreground">NO ORDERS HERE</div>
      ) : (
        <div className="mt-6 space-y-3">
          {list.map((p) => {
            const buyer = users.find((u) => u.id === p.userId);
            const count = purchaseFiles(p).length;
            const isPending = p.status === 'pending';
            return (
              <div key={p.id} className={`panel flex flex-wrap items-center justify-between gap-3 p-4 ${isPending ? 'border-gold/50' : ''}`}>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-primary">{p.productName}</p>
                    {isPending && (
                      <span className="rounded border border-gold/50 px-2 py-0.5 text-[9px] text-gold">⏳ PENDING</span>
                    )}
                    {p.isRedeem && (
                      <span className="rounded border border-primary/50 px-2 py-0.5 text-[9px] text-primary">🎁 REDEEM</span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {buyer?.email ?? "UNKNOWN"} • ${p.price} • {new Date(p.purchaseDate).toLocaleString()}
                  </p>
                  {p.credentials && (
                    <p className="text-[10px] text-gold font-mono mt-1">🔑 {p.credentials}</p>
                  )}
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {count === 0 ? "⏳ NO LINKS ADDED" : `📥 ${count} LINK${count > 1 ? "S" : ""} ADDED`}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => toggleStatus(p)}
                    className={`rounded border px-2 py-1 text-[10px] ${
                      p.status === "active" ? "border-primary/60 text-primary" : 
                      p.status === "pending" ? "border-gold/60 text-gold" :
                      "border-danger/60 text-danger"
                    }`}
                  >
                    {p.status.toUpperCase()}
                  </button>
                  <button
                    onClick={() => openEditor(p)}
                    className={`rounded px-4 py-2 text-[11px] font-bold transition ${
                      isPending 
                        ? "pulse-glow bg-gold text-black hover:opacity-90" 
                        : "bg-primary text-primary-foreground hover:opacity-90"
                    }`}
                  >
                    {count === 0 ? (isPending ? "⚡ ACTIVATE" : "ADD LINKS") : "📝 MANAGE"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={!!editing}
        onClose={() => {
          setEditing(null);
          setCredentials("");
        }}
        sub="DELIVERY SETUP"
        title={editing?.productName ?? ""}
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <button
              onClick={() => {
                setEditing(null);
                setCredentials("");
              }}
              className="rounded border border-border px-4 py-2 text-[11px] text-muted-foreground hover:text-primary"
            >
              CANCEL
            </button>
            <button
              onClick={save}
              className="rounded bg-primary px-5 py-2 text-[11px] font-bold text-primary-foreground hover:opacity-90"
            >
              SAVE CHANGES
            </button>
          </div>
        }
      >
        <p className="text-center text-[11px] text-muted-foreground">
          Add all the download links for this product. Empty links are ignored on save.
        </p>
        
        {/* ✅ ACCESS KEY FIELD - ADDED */}
        <div className="mt-4">
          <label className="text-[10px] text-muted-foreground">🔑 ACCESS KEY / CREDENTIALS (Optional)</label>
          <input
            className={`${field} mt-1`}
            placeholder="username:password or license key"
            value={credentials}
            onChange={(e) => setCredentials(e.target.value)}
          />
          <p className="text-[9px] text-muted-foreground mt-1">Users will see this key when they download</p>
        </div>

        <div className="mt-4 max-h-[45vh] space-y-3 overflow-y-auto pr-1">
          {rows.map((f, i) => (
            <div key={f.id} className="rounded border border-border bg-background/60 p-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] tracking-[0.2em] text-muted-foreground">LINK {i + 1}</span>
                <button
                  onClick={() => setRows(rows.filter((r) => r.id !== f.id))}
                  aria-label={`Remove file ${i + 1}`}
                  className="rounded border border-danger/50 p-1.5 text-danger hover:bg-danger/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <input
                  className={field}
                  placeholder="TITLE (e.g. SPIDER LAUNCHER)"
                  aria-label={`Title for file ${i + 1}`}
                  value={f.label}
                  onChange={(e) => update(f.id, { label: e.target.value })}
                />
                <input
                  className={field}
                  placeholder="TAG (e.g. OFFICIAL .EXE)"
                  aria-label={`Tag for file ${i + 1}`}
                  value={f.tag}
                  onChange={(e) => update(f.id, { tag: e.target.value })}
                />
              </div>
              <input
                className={`${field} mt-2`}
                placeholder="https://download-link.com/file"
                aria-label={`Link for file ${i + 1}`}
                value={f.url}
                onChange={(e) => update(f.id, { url: e.target.value })}
              />
            </div>
          ))}
        </div>
        <button
          onClick={() => setRows([...rows, blank()])}
          className="mt-3 flex items-center gap-2 rounded border border-primary/50 px-3 py-2 text-[11px] text-primary hover:bg-accent"
        >
          <Plus className="h-4 w-4" /> ADD ANOTHER LINK
        </button>
      </Modal>
    </>
  );
}