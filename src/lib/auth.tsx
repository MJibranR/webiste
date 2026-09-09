import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getUsers, setUsers, type User, logActivity, uid } from "./spiderhex";

interface AuthValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signup: (data: {
    fullName: string;
    email: string;
    whatsapp: string;
    password: string;
  }) => Promise<{ ok: boolean; error?: string; pending?: boolean }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

/** Reads the signed-in member's profile + role from the database. */
export async function loadCurrentUser(): Promise<User | null> {
  const { data: auth } = await supabase.auth.getUser();
  const authUser = auth.user;
  if (!authUser) return null;

  const meta = (authUser.user_metadata ?? {}) as Record<string, string>;
  await supabase.rpc("ensure_profile", {
    _full_name: meta["full_name"] ?? "",
    _whatsapp: meta["whatsapp"] ?? "",
    _username: meta["username"] ?? "",
  });

  const [{ data: profile }, { data: roles }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", authUser.id).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", authUser.id),
  ]);

  const email = profile?.email ?? authUser.email ?? "";
  return {
    id: authUser.id,
    email,
    fullName: profile?.full_name ?? meta["full_name"] ?? email,
    whatsapp: profile?.whatsapp ?? meta["whatsapp"] ?? "",
    role: roles?.some((r) => r.role === "admin") ? "admin" : "user",
    balance: Number(profile?.balance ?? 0),
    totalSpent: Number(profile?.total_spent ?? 0),
    level: profile?.level ?? 1,
    xp: profile?.xp ?? 0,
    username: profile?.username ?? email.split("@")[0] ?? "hunter",
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setUser(await loadCurrentUser());
  }, []);

  useEffect(() => {
    let active = true;

    void (async () => {
      const found = await loadCurrentUser();
      if (active) {
        setUser(found);
        setLoading(false);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      void (async () => {
        const found = await loadCurrentUser();
        if (active) setUser(found);
      })();
    });

    const handler = () => void refresh();
    window.addEventListener("sh:update", handler);
    return () => {
      active = false;
      sub.subscription.unsubscribe();
      window.removeEventListener("sh:update", handler);
    };
  }, [refresh]);

  const login: AuthValue["login"] = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) {
      // 🔥 FIX: Remove confirmation check
      return { ok: false, error: "WRONG EMAIL OR PASSWORD" };
    }
    const found = await loadCurrentUser();
    setUser(found);
    if (found) logActivity("login", found.email, `${found.fullName} signed in`);
    return { ok: true };
  }, []);

  const signup: AuthValue["signup"] = useCallback(async (data) => {
    const email = data.email.trim().toLowerCase();
    
    const { data: res, error } = await supabase.auth.signUp({
      email,
      password: data.password,
      options: {
        emailRedirectTo: "https://spiderhex-store.vercel.app/login",
        data: {
          full_name: data.fullName.trim(),
          whatsapp: data.whatsapp.trim(),
          username: data.fullName.trim().toLowerCase().replace(/\s+/g, "_") || "hunter",
        },
      },
    });
    
    if (error) {
      const msg = /already/i.test(error.message)
        ? "EMAIL ALREADY REGISTERED"
        : error.message.toUpperCase();
      return { ok: false, error: msg };
    }
    
    // Also save to localStorage
    const newUser: User = {
      id: res.user?.id || uid(),
      email,
      fullName: data.fullName.trim(),
      whatsapp: data.whatsapp.trim(),
      role: 'user',
      balance: 0,
      totalSpent: 0,
      level: 1,
      xp: 0,
      username: data.fullName.trim().toLowerCase().replace(/\s+/g, "_") || "hunter",
      password: data.password,
    };
    
    const users = getUsers();
    if (!users.some(u => u.email === email)) {
      users.push(newUser);
      setUsers(users);
    }
    
    logActivity("signup", email, `${data.fullName.trim() || email} created an account`);
    
    if (!res.session) return { ok: true, pending: true };
    
    const found = await loadCurrentUser();
    setUser(found);
    return { ok: true };
  }, []);

  const logout = useCallback(async () => {
    if (user) logActivity("logout", user.email, `${user.fullName} signed out`);
    await supabase.auth.signOut();
    setUser(null);
  }, [user]);

  const value = useMemo(
    () => ({ user, loading, login, signup, logout, refresh }),
    [user, loading, login, signup, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}