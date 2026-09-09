import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin-shell";
import { SectionTitle } from "@/components/shell";
import { useAuth } from "@/lib/auth";
import { fetchUsers, fetchPurchases, logActivity, pushNotification, type Role, type User } from "@/lib/spiderhex";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/users")({
  component: () => (
    <AdminShell>
      <UsersAdmin />
    </AdminShell>
  ),
  head: () => ({
    meta: [
      { title: "Members — SPIDER HEX Admin" },
      { name: "description", content: "Browse SPIDER HEX members, change roles and adjust wallet balances." },
    ],
  }),
});

const QUICK = [1, 5, 10];

function UsersAdmin() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [custom, setCustom] = useState<Record<string, string>>({});

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersData, purchasesData] = await Promise.all([
        fetchUsers(),
        fetchPurchases()
      ]);
      setUsers(usersData);
      setPurchases(purchasesData);
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

  const q = query.trim().toLowerCase();
  const list = users.filter(
    (u) => !q || u.email.toLowerCase().includes(q) || u.fullName.toLowerCase().includes(q),
  );

  const adjust = async (id: string, delta: number) => {
    if (!delta || Number.isNaN(delta)) return;
    const target = users.find((u) => u.id === id);
    if (!target) return;
    const next = Math.max(0, target.balance + delta);
    const { error } = await supabase.from("profiles").update({ balance: next }).eq("id", id);
    if (error) {
      toast.error("COULD NOT UPDATE WALLET");
      return;
    }
    pushNotification(
      id,
      delta > 0 ? "PAYMENT ADDED" : "BALANCE UPDATED",
      `${delta > 0 ? "+" : "-"}$${Math.abs(delta).toFixed(2)} was applied to your wallet. New balance: $${next.toFixed(2)}.`,
    );
    logActivity("wallet", "ADMIN", `${delta > 0 ? "Added" : "Removed"} $${Math.abs(delta)} for ${target.email}`);
    toast.success(`WALLET UPDATED — $${next.toFixed(2)}`);
    loadData();
  };

  const applyCustom = (id: string, sign: 1 | -1) => {
    const amount = Number(custom[id]);
    if (!amount || amount <= 0) {
      toast.error("ENTER AN AMOUNT FIRST");
      return;
    }
    void adjust(id, amount * sign);
    setCustom({ ...custom, [id]: "" });
  };

  const changeRole = async (id: string, role: Role) => {
    const target = users.find((u) => u.id === id);
    if (!target || target.role === role) return;
    const { error } = await supabase.rpc("admin_set_role", { _user_id: id, _role: role });
    if (error) {
      toast.error("COULD NOT CHANGE ROLE");
      return;
    }
    pushNotification(id, "ROLE UPDATED", `Your account role is now ${role.toUpperCase()}.`);
    logActivity("user", "ADMIN", `Changed role of ${target.email} to ${role}`);
    toast.success(`ROLE SET TO ${role.toUpperCase()}`);
    loadData();
  };

  if (loading) {
    return (
      <AdminShell>
        <SectionTitle sub="// MEMBER DIRECTORY">USERS</SectionTitle>
        <div className="flex justify-center items-center py-20">
          <p className="text-sm text-muted-foreground">LOADING...</p>
        </div>
      </AdminShell>
    );
  }

  return (
    <>
      <SectionTitle sub="// MEMBER DIRECTORY">USERS</SectionTitle>

      <input
        className="w-full max-w-sm rounded border border-border bg-background/60 px-3 py-2 text-xs text-foreground outline-none focus:border-primary"
        placeholder="SEARCH NAME OR EMAIL"
        aria-label="Search members"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="panel mt-6 overflow-x-auto">
        {list.length === 0 ? (
          <p className="p-8 text-center text-xs text-muted-foreground">NO MEMBERS FOUND</p>
        ) : (
          <table className="w-full min-w-[860px] text-left text-xs">
            <thead className="text-[10px] tracking-[0.15em] text-muted-foreground">
              <tr className="border-b border-border">
                <th className="p-3">MEMBER</th>
                <th className="p-3">ROLE</th>
                <th className="p-3">BALANCE</th>
                <th className="p-3">ORDERS</th>
                <th className="p-3 text-right">WALLET</th>
              </tr>
            </thead>
            <tbody>
              {list.map((u) => (
                <tr key={u.id} className="border-b border-border/50">
                  <td className="p-3">
                    <p className="text-primary">{u.fullName}</p>
                    <p className="text-[10px] text-muted-foreground">{u.email}</p>
                  </td>
                  <td className="p-3">
                    <select
                      value={u.role}
                      aria-label={`Role for ${u.fullName}`}
                      disabled={u.id === me?.id}
                      onChange={(e) => void changeRole(u.id, e.target.value as Role)}
                      className={`rounded border border-border bg-background/60 px-2 py-1 text-[10px] outline-none focus:border-primary disabled:opacity-50 ${
                        u.role === "admin" ? "text-gold" : "text-muted-foreground"
                      }`}
                    >
                      <option value="user">USER</option>
                      <option value="admin">ADMIN</option>
                    </select>
                  </td>
                  <td className="p-3">${u.balance.toFixed(2)}</td>
                  <td className="p-3 text-muted-foreground">
                    {purchases.filter((p) => p.userId === u.id).length}
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      {QUICK.map((amt) => (
                        <button
                          key={amt}
                          onClick={() => void adjust(u.id, amt)}
                          className="rounded border border-border px-2 py-1 text-[10px] text-muted-foreground hover:border-primary hover:text-primary"
                        >
                          +${amt}
                        </button>
                      ))}
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        placeholder="CUSTOM"
                        aria-label={`Custom amount for ${u.fullName}`}
                        value={custom[u.id] ?? ""}
                        onChange={(e) => setCustom({ ...custom, [u.id]: e.target.value })}
                        className="w-20 rounded border border-border bg-background/60 px-2 py-1 text-[10px] text-foreground outline-none focus:border-primary"
                      />
                      <button
                        onClick={() => applyCustom(u.id, 1)}
                        className="rounded bg-primary px-2 py-1 text-[10px] font-bold text-primary-foreground hover:opacity-90"
                      >
                        ADD
                      </button>
                      <button
                        onClick={() => applyCustom(u.id, -1)}
                        className="rounded border border-danger/50 px-2 py-1 text-[10px] text-danger hover:bg-danger/10"
                      >
                        DEDUCT
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}