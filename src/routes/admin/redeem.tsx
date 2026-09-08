import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Copy, RefreshCw, Trash2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin-shell";
import { SectionTitle } from "@/components/shell";
import { Modal } from "@/components/modal";
import { useLive } from "@/lib/use-live";
import { logActivity, getUserById } from "@/lib/spiderhex";
import { createCode, deleteCode, generateCode, listAllCodes, type RedeemCode, type DownloadFile } from "@/lib/redeem";

// ✅ Fixed route name
export const Route = createFileRoute("/admin/redeem-codes")({
  component: () => (
    <AdminShell>
      <RedeemAdmin />
    </AdminShell>
  ),
  head: () => ({
    meta: [
      { title: "Redeem Codes — SPIDER HEX Admin" },
      { name: "description", content: "Create redeem codes that unlock a panel download link and access key." },
    ],
  }),
});

const input =
  "w-full rounded border border-border bg-background/60 px-3 py-2 text-xs text-foreground outline-none focus:border-primary";

function RedeemAdmin() {
  const { products, users } = useLive();
  const [codes, setCodes] = useState<RedeemCode[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [code, setCode] = useState(generateCode());
  const [productId, setProductId] = useState("");
  const [productName, setProductName] = useState("");
  const [downloadLink, setDownloadLink] = useState("");
  const [accessKey, setAccessKey] = useState("");
  const [note, setNote] = useState("");
  const [usageLimit, setUsageLimit] = useState(1);
  const [files, setFiles] = useState<DownloadFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedCode, setSelectedCode] = useState<RedeemCode | null>(null);
  const [userDetails, setUserDetails] = useState<{ email: string; fullName: string } | null>(null);

  const load = useCallback(() => {
    void listAllCodes().then(setCodes);
  }, []);
  useEffect(load, [load]);

  const pickProduct = (id: string) => {
    setProductId(id);
    const p = products.find((x) => x.id === id);
    if (p) {
      setProductName(p.name);
      if (p.downloadLink) setDownloadLink(p.downloadLink);
    }
  };

  const resetForm = () => {
    setCode(generateCode());
    setProductId("");
    setProductName("");
    setDownloadLink("");
    setAccessKey("");
    setNote("");
    setUsageLimit(1);
    setFiles([]);
  };

  const addFile = () => {
    setFiles([...files, { id: Date.now().toString(), label: "", tag: "", url: "" }]);
  };

  const removeFile = (id: string) => {
    setFiles(files.filter(f => f.id !== id));
  };

  const updateFile = (id: string, field: keyof DownloadFile, value: string) => {
    setFiles(files.map(f => f.id === id ? { ...f, [field]: value } : f));
  };

  const submit = async () => {
    if (!code.trim() || !productName.trim()) {
      toast.error("CODE AND PANEL NAME ARE REQUIRED");
      return;
    }
    if (!downloadLink.trim() && files.length === 0) {
      toast.error("ADD A DOWNLOAD LINK OR FILES");
      return;
    }
    setBusy(true);
    const err = await createCode({ 
      code, 
      productId: productId || null, 
      productName, 
      downloadLink, 
      accessKey, 
      note,
      usageLimit,
      files: files || []
    });
    setBusy(false);
    if (err) {
      toast.error(/duplicate|unique/i.test(err) ? "THAT CODE ALREADY EXISTS" : err.toUpperCase());
      return;
    }
    logActivity("product", "ADMIN", `Created redeem code ${code.toUpperCase()} for ${productName}`);
    toast.success("REDEEM CODE CREATED");
    resetForm();
    setShowModal(false);
    load();
  };

  const remove = async (row: RedeemCode) => {
    if (!window.confirm(`Delete code ${row.code}?`)) return;
    const err = await deleteCode(row.id);
    if (err) {
      toast.error(err.toUpperCase());
      return;
    }
    logActivity("product", "ADMIN", `Deleted redeem code ${row.code}`);
    toast.success("CODE DELETED");
    load();
  };

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("COPIED");
    } catch {
      toast.error("COPY BLOCKED BY BROWSER");
    }
  };

  const owner = (id: string | null) => users.find((u) => u.id === id)?.email ?? "—";

  const getUsageText = (c: RedeemCode) => {
    if (c.usage_limit === -1) return `∞ used: ${c.usage_count}`;
    return `${c.usage_count}/${c.usage_limit}`;
  };

  const viewUsers = async (code: RedeemCode) => {
    if (!code.claimed_by) {
      toast.info('NO ONE HAS USED THIS CODE YET');
      return;
    }
    setSelectedCode(code);
    const user = await getUserById(code.claimed_by);
    if (user) {
      setUserDetails(user);
      setShowUserModal(true);
    } else {
      toast.error('USER NOT FOUND');
    }
  };

  return (
    <>
      <SectionTitle sub="// ONE CODE = ONE PANEL UNLOCK">REDEEM CODES</SectionTitle>

      <button
        onClick={() => setShowModal(true)}
        className="pulse-glow rounded bg-primary px-4 py-2 text-[11px] font-bold text-primary-foreground hover:opacity-90 flex items-center gap-2"
      >
        <Plus className="h-4 w-4" /> CREATE NEW CODE
      </button>

      <Modal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        sub="// GENERATE NEW REDEEM CODE"
        title="CREATE REDEEM CODE"
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <button
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
              className="rounded border border-border px-4 py-2 text-[11px] text-muted-foreground hover:text-primary"
            >
              CANCEL
            </button>
            <button
              onClick={() => void submit()}
              disabled={busy}
              className="rounded bg-primary px-5 py-2 text-[11px] font-bold text-primary-foreground hover:opacity-90 disabled:opacity-60"
            >
              {busy ? "CREATING..." : "GENERATE CODE"}
            </button>
          </div>
        }
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-[10px] text-muted-foreground mb-1">CODE</label>
              <div className="flex gap-2">
                <input 
                  className={input} 
                  value={code} 
                  onChange={(e) => setCode(e.target.value.toUpperCase())} 
                  placeholder="SPX-XXXX-XXXX"
                />
                <button
                  onClick={() => setCode(generateCode())}
                  aria-label="Generate code"
                  className="rounded border border-border px-3 text-muted-foreground hover:border-primary hover:text-primary flex-shrink-0"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[10px] text-muted-foreground mb-1">USAGE LIMIT</label>
              <select className={input} value={usageLimit} onChange={(e) => setUsageLimit(Number(e.target.value))}>
                <option value="1">1 User</option>
                <option value="5">5 Users</option>
                <option value="10">10 Users</option>
                <option value="25">25 Users</option>
                <option value="50">50 Users</option>
                <option value="100">100 Users</option>
                <option value="-1">Unlimited (∞)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-muted-foreground mb-1">PANEL</label>
            <select className={input} value={productId} onChange={(e) => pickProduct(e.target.value)}>
              <option value="">— CUSTOM / MANUAL —</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-muted-foreground mb-1">PANEL NAME</label>
            <input 
              className={input} 
              value={productName} 
              onChange={(e) => setProductName(e.target.value)} 
              placeholder="SPIDER PC PANEL"
            />
          </div>

          <div>
            <label className="block text-[10px] text-muted-foreground mb-1">ACCESS KEY / CREDENTIALS</label>
            <input
              className={input}
              placeholder="username:password or license key"
              value={accessKey}
              onChange={(e) => setAccessKey(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-[10px] text-muted-foreground mb-1">DOWNLOAD LINKS (FILES)</label>
            {files.map((f) => (
              <div key={f.id} className="flex gap-2 mb-2">
                <input
                  className={input}
                  placeholder="Title"
                  value={f.label}
                  onChange={(e) => updateFile(f.id, 'label', e.target.value)}
                />
                <input
                  className={input}
                  placeholder="Tag (e.g. OFFICIAL)"
                  value={f.tag}
                  onChange={(e) => updateFile(f.id, 'tag', e.target.value)}
                />
                <input
                  className={input}
                  placeholder="https://..."
                  value={f.url}
                  onChange={(e) => updateFile(f.id, 'url', e.target.value)}
                />
                <button
                  onClick={() => removeFile(f.id)}
                  className="rounded border border-danger/50 px-2 text-danger hover:bg-danger/10"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              onClick={addFile}
              className="text-[11px] text-primary hover:underline flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" /> ADD LINK
            </button>
          </div>

          <div>
            <label className="block text-[10px] text-muted-foreground mb-1">SINGLE DOWNLOAD LINK (FALLBACK)</label>
            <input
              className={input}
              placeholder="https://example.com/download.zip"
              value={downloadLink}
              onChange={(e) => setDownloadLink(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-[10px] text-muted-foreground mb-1">NOTE (OPTIONAL)</label>
            <input 
              className={input} 
              placeholder="Add a note for this code" 
              value={note} 
              onChange={(e) => setNote(e.target.value)} 
            />
          </div>
        </div>
      </Modal>

      <div className="panel mt-6 overflow-x-auto">
        {codes.length === 0 ? (
          <p className="p-8 text-center text-xs text-muted-foreground">NO CODES YET</p>
        ) : (
          <table className="w-full min-w-[900px] text-left text-xs">
            <thead className="text-[10px] tracking-[0.15em] text-muted-foreground">
              <tr className="border-b border-border">
                <th className="p-3">CODE</th>
                <th className="p-3">PANEL</th>
                <th className="p-3">USAGE</th>
                <th className="p-3">STATUS</th>
                <th className="p-3 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {codes.map((c) => (
                <tr key={c.id} className="border-b border-border/50">
                  <td className="p-3 font-bold text-primary">{c.code}</td>
                  <td className="p-3">{c.product_name}</td>
                  <td className="p-3 text-muted-foreground">{getUsageText(c)}</td>
                  <td className="p-3">
                    {c.claimed_by && c.usage_limit !== -1 && c.usage_count >= c.usage_limit ? (
                      <span className="text-[10px] text-muted-foreground">USED UP</span>
                    ) : c.usage_count > 0 ? (
                      <span className="rounded border border-gold/60 px-2 py-1 text-[10px] text-gold">PARTIAL</span>
                    ) : (
                      <span className="rounded border border-primary/60 px-2 py-1 text-[10px] text-primary">UNUSED</span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      {c.claimed_by && (
                        <button
                          onClick={() => viewUsers(c)}
                          className="rounded border border-primary/50 p-2 text-primary hover:bg-primary/10"
                          title="View who used this code"
                        >
                          👤
                        </button>
                      )}
                      <button
                        onClick={() => void copy(c.code)}
                        aria-label={`Copy ${c.code}`}
                        className="rounded border border-border p-2 text-muted-foreground hover:border-primary hover:text-primary"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => void remove(c)}
                        aria-label={`Delete ${c.code}`}
                        className="rounded border border-danger/50 p-2 text-danger hover:bg-danger/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        open={showUserModal}
        onClose={() => {
          setShowUserModal(false);
          setSelectedCode(null);
          setUserDetails(null);
        }}
        sub="// CLAIMED BY"
        title={selectedCode?.code || 'CODE DETAILS'}
        footer={
          <button
            onClick={() => {
              setShowUserModal(false);
              setSelectedCode(null);
              setUserDetails(null);
            }}
            className="rounded border border-border px-4 py-2 text-[11px] text-muted-foreground hover:text-primary"
          >
            CLOSE
          </button>
        }
      >
        {userDetails ? (
          <div className="space-y-4 p-2">
            <div className="bg-accent/20 rounded p-4 border border-primary/30">
              <p className="text-[10px] text-muted-foreground">EMAIL</p>
              <p className="text-sm font-mono text-primary break-all">{userDetails.email}</p>
            </div>
            <div className="bg-accent/20 rounded p-4 border border-primary/30">
              <p className="text-[10px] text-muted-foreground">FULL NAME</p>
              <p className="text-sm font-mono text-foreground">{userDetails.fullName}</p>
            </div>
            <div className="bg-accent/20 rounded p-4 border border-primary/30">
              <p className="text-[10px] text-muted-foreground">REDEEMED AT</p>
              <p className="text-sm font-mono text-foreground">
                {selectedCode?.claimed_at ? new Date(selectedCode.claimed_at).toLocaleString() : 'Unknown'}
              </p>
            </div>
            <div className="bg-accent/20 rounded p-4 border border-primary/30">
              <p className="text-[10px] text-muted-foreground">PRODUCT</p>
              <p className="text-sm font-mono text-foreground">{selectedCode?.product_name}</p>
            </div>
          </div>
        ) : (
          <p className="text-center text-muted-foreground">LOADING...</p>
        )}
      </Modal>
    </>
  );
}