import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ensureSeed,
  getSessionId,
  getUsers,
  setSessionId,
  setUsers,
  uid,
  logActivity,
  type User,
} from "./spiderhex";

interface AuthValue {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password: string) => { ok: boolean; error?: string };
  signup: (data: {
    fullName: string;
    email: string;
    whatsapp: string;
    password: string;
  }) => { ok: boolean; error?: string };
  logout: () => void;
  refresh: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    const id = getSessionId();
    const found = id ? getUsers().find((u) => u.id === id) ?? null : null;
    setUser(found);
  }, []);

  useEffect(() => {
    ensureSeed();
    refresh();
    setLoading(false);
    const handler = () => refresh();
    window.addEventListener("sh:update", handler);
    return () => window.removeEventListener("sh:update", handler);
  }, [refresh]);

  const login: AuthValue["login"] = useCallback(
    (identifier, password) => {
      ensureSeed();
      const key = identifier.trim().toLowerCase();
      const found = getUsers().find(
        (u) => u.email.toLowerCase() === key || u.username.toLowerCase() === key,
      );
      if (!found) return { ok: false, error: "ACCOUNT NOT FOUND" };
      if (found.password !== password) return { ok: false, error: "INVALID PASSWORD" };
      setSessionId(found.id);
      setUser(found);
      logActivity("login", found.email, `${found.fullName} signed in`);
      return { ok: true };
    },
    [],
  );

  const signup: AuthValue["signup"] = useCallback((data) => {
    ensureSeed();
    const users = getUsers();
    if (users.some((u) => u.email.toLowerCase() === data.email.trim().toLowerCase()))
      return { ok: false, error: "EMAIL ALREADY REGISTERED" };
    const newUser: User = {
      id: uid(),
      email: data.email.trim(),
      fullName: data.fullName.trim(),
      whatsapp: data.whatsapp.trim(),
      password: data.password,
      role: "user",
      balance: 0,
      totalSpent: 0,
      level: 1,
      xp: 0,
      username: data.fullName.trim().toLowerCase().replace(/\s+/g, "_") || "hunter",
    };
    setUsers([...users, newUser]);
    setSessionId(newUser.id);
    setUser(newUser);
    logActivity("signup", newUser.email, `${newUser.fullName} created an account`);
    return { ok: true };
  }, []);

  const logout = useCallback(() => {
    if (user) logActivity("logout", user.email, `${user.fullName} signed out`);
    setSessionId(null);
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
