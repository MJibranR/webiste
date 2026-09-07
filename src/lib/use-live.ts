import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ensureSeed, getProducts, getPurchases, type Product, type Purchase, type User } from "./spiderhex";

/** Members stored online (profiles + roles). */
export async function fetchMembers(): Promise<User[]> {
  const [{ data: profiles }, { data: roles }] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at", { ascending: false }),
    supabase.from("user_roles").select("user_id, role"),
  ]);
  const adminIds = new Set((roles ?? []).filter((r) => r.role === "admin").map((r) => r.user_id));
  return (profiles ?? []).map((p) => ({
    id: p.id,
    email: p.email,
    fullName: p.full_name ?? p.email,
    whatsapp: p.whatsapp ?? "",
    role: adminIds.has(p.id) ? "admin" : "user",
    balance: Number(p.balance ?? 0),
    totalSpent: Number(p.total_spent ?? 0),
    level: p.level ?? 1,
    xp: p.xp ?? 0,
    username: p.username ?? p.email.split("@")[0] ?? "hunter",
  }));
}

export function useLive() {
  const [products, setProductsState] = useState<Product[]>([]);
  const [purchases, setPurchasesState] = useState<Purchase[]>([]);
  const [users, setUsersState] = useState<User[]>([]);
  const [ready, setReady] = useState(false);

  const sync = useCallback(() => {
    setProductsState(getProducts());
    setPurchasesState(getPurchases());
    void fetchMembers().then(setUsersState).catch(() => setUsersState([]));
  }, []);

  useEffect(() => {
    ensureSeed();
    sync();
    setReady(true);
    const handler = () => sync();
    window.addEventListener("sh:update", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("sh:update", handler);
      window.removeEventListener("storage", handler);
    };
  }, [sync]);

  return { products, purchases, users, ready, sync };
}
