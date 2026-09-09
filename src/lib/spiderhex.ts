import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_SETTINGS, type SiteSettings, type VideoItem } from "./settings";

// Re-export settings types
export type { SiteSettings, VideoItem };
export { DEFAULT_SETTINGS };

export type Role = "admin" | "user";



// ---------------- CATEGORIES ----------------

export interface Category {
  id: string;
  name: string;
  display_name: string;
  sort_order: number;
  created_at?: string;
}

// ---------------- USERS (from database) ----------------

export async function fetchUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching users:', error);
    return [];
  }
  
  // Get roles for users
  const { data: rolesData, error: rolesError } = await supabase
    .from('user_roles')
    .select('*');
  
  if (rolesError) {
    console.error('Error fetching roles:', rolesError);
    // Return users with default 'user' role
    return (data || []).map((p: any) => ({
      id: p.id,
      email: p.email || '',
      fullName: p.full_name || '',
      whatsapp: p.whatsapp || '',
      role: 'user' as Role,
      balance: p.balance || 0,
      totalSpent: p.total_spent || 0,
      level: p.level || 1,
      xp: p.xp || 0,
      username: p.username || '',
    }));
  }
  
  // Merge roles with profiles
  return (data || []).map((p: any) => {
    const roleData = rolesData?.find((r: any) => r.user_id === p.id);
    return {
      id: p.id,
      email: p.email || '',
      fullName: p.full_name || '',
      whatsapp: p.whatsapp || '',
      role: roleData?.role || 'user',
      balance: p.balance || 0,
      totalSpent: p.total_spent || 0,
      level: p.level || 1,
      xp: p.xp || 0,
      username: p.username || '',
    };
  });
}

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true });
  
  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
  return data || [];
}

export async function createCategory(name: string, displayName: string): Promise<string | null> {
  const id = name.toLowerCase().replace(/\s+/g, '_');
  const { error } = await supabase
    .from('categories')
    .insert({ id, name, display_name: displayName });
  
  if (error) {
    console.error('Error creating category:', error);
    return error.message;
  }
  return null;
}

export async function updateCategory(id: string, displayName: string): Promise<string | null> {
  const { error } = await supabase
    .from('categories')
    .update({ display_name: displayName })
    .eq('id', id);
  
  if (error) {
    console.error('Error updating category:', error);
    return error.message;
  }
  return null;
}

export async function deleteCategory(id: string): Promise<string | null> {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting category:', error);
    return error.message;
  }
  return null;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  whatsapp: string;
  password?: string;
  role: Role;
  balance: number;
  totalSpent: number;
  level: number;
  xp: number;
  username: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  priceMonthly: number | null;
  priceWeekly: number | null;
  category: string;
  badge: string;
  inStock: boolean;
  downloadLink: string;
  imageUrl: string;
  description: string;
  videoUrl: string;
}

// ---------------- USERS (localStorage fallback for auth) ----------------

export function getUsers(): User[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem('sh_users');
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function setUsers(users: User[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('sh_users', JSON.stringify(users));
    notify();
  } catch {
    // ignore
  }
}

// ---------------- PURCHASES (localStorage fallback) ----------------

export function getPurchases(): Purchase[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem('sh_purchases');
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function setPurchases(purchases: Purchase[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('sh_purchases', JSON.stringify(purchases));
    notify();
  } catch {
    // ignore
  }
}

export function getUserByEmail(email: string): User | undefined {
  const users = getUsers();
  return users.find(u => u.email === email);
}

/** One row inside the download popup (label + tag + url). */
export interface DownloadFile {
  id: string;
  label: string;
  tag: string;
  url: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  priceMonthly: number | null;
  priceWeekly: number | null;
  category: string;
  badge: string;
  inStock: boolean;
  downloadLink: string;
  imageUrl: string;
  description: string;
  videoUrl: string;
}

export interface Purchase {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  plan: string;
  price: number;
  purchaseDate: string;
  status: "active" | "expired" | "pending";
  downloadLink: string;
  files?: DownloadFile[];
  isRedeem?: boolean;
  credentials?: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  date: string;
  readBy: string[];
}

export type ActivityType =
  | "login"
  | "logout"
  | "signup"
  | "purchase"
  | "product"
  | "wallet"
  | "download"
  | "user"
  | "notification"
  | "content";

export interface ActivityLog {
  id: string;
  type: ActivityType;
  actor: string;
  message: string;
  date: string;
}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

/** Tell every live view to reload from the database. */
export function notify() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("sh:update"));
}

/** All download rows for an order, falling back to the legacy single link. */
export const purchaseFiles = (p: Purchase): DownloadFile[] => {
  if (p.files && p.files.length > 0) return p.files;
  if (p.downloadLink) return [{ id: "legacy", label: "MAIN DOWNLOAD", tag: "OFFICIAL", url: p.downloadLink }];
  return [];
};

// ---------------- PRODUCTS ----------------

type ProductRow = {
  id: string;
  name: string;
  price: number | string;
  price_monthly: number | string | null;
  price_weekly: number | string | null;
  category: string;
  badge: string | null;
  in_stock: boolean | null;
  download_link: string | null;
  image_url: string | null;
  description: string | null;
  video_url: string | null;
};

const toProduct = (p: ProductRow): Product => ({
  id: p.id,
  name: p.name,
  price: Number(p.price ?? 0),
  priceMonthly: p.price_monthly === null || p.price_monthly === undefined ? null : Number(p.price_monthly),
  priceWeekly: p.price_weekly === null || p.price_weekly === undefined ? null : Number(p.price_weekly),
  category: p.category,
  badge: p.badge ?? "NEW",
  inStock: p.in_stock !== false,
  downloadLink: p.download_link ?? "",
  imageUrl: p.image_url ?? "",
  description: p.description ?? "",
  videoUrl: p.video_url ?? "",
});

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) {
    console.error("Error loading products:", error);
    return [];
  }
  return (data ?? []).map((p) => toProduct(p as unknown as ProductRow));
}

export async function fetchProduct(id: string): Promise<Product | null> {
  const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  return toProduct(data as unknown as ProductRow);
}

export async function saveProduct(p: Product): Promise<string | null> {
  const payload = {
    name: p.name.trim(),
    price: p.price,
    price_monthly: p.priceMonthly,
    price_weekly: p.priceWeekly,
    category: p.category,
    badge: p.badge || "NEW",
    in_stock: p.inStock,
    download_link: p.downloadLink || "",
    image_url: p.imageUrl || "",
    description: p.description || "",
    video_url: p.videoUrl || "",
  };
  const { error } = p.id
    ? await supabase.from("products").update(payload).eq("id", p.id)
    : await supabase.from("products").insert({ id: uid(), ...payload });
  return error ? error.message : null;
}

export async function deleteProduct(id: string): Promise<string | null> {
  const { error } = await supabase.from("products").delete().eq("id", id);
  return error ? error.message : null;
}

// ---------------- PURCHASES ----------------

type PurchaseRow = {
  id: string;
  user_id: string;
  product_id: string | null;
  product_name: string;
  plan: string | null;
  price: number | string;
  status: string;
  download_link: string | null;
  files: unknown;
  credentials: string | null;
  is_redeem: boolean | null;
  purchase_date: string;
};

const toPurchase = (r: PurchaseRow): Purchase => ({
  id: r.id,
  userId: r.user_id,
  productId: r.product_id ?? "",
  productName: r.product_name,
  plan: r.plan ?? "LIFETIME",
  price: Number(r.price ?? 0),
  purchaseDate: r.purchase_date,
  status: (r.status as Purchase["status"]) ?? "pending",
  downloadLink: r.download_link ?? "",
  files: Array.isArray(r.files) ? (r.files as DownloadFile[]) : [],
  credentials: r.credentials ?? "",
  isRedeem: r.is_redeem === true,
});

/** RLS returns the caller's own orders, or every order for admins. */
export async function fetchPurchases(): Promise<Purchase[]> {
  const { data, error } = await supabase
    .from("purchases")
    .select("*")
    .order("purchase_date", { ascending: false });
  if (error) {
    console.error("Error loading purchases:", error);
    return [];
  }
  return (data ?? []).map((r) => toPurchase(r as unknown as PurchaseRow));
}

export async function createPurchase(input: {
  userId: string;
  productId: string;
  productName: string;
  plan?: string;
  price: number;
  status?: Purchase["status"];
  downloadLink?: string;
  files?: DownloadFile[];
  credentials?: string;
  isRedeem?: boolean;
}): Promise<string | null> {
  try {
    const insertData = {
      user_id: input.userId,
      product_id: input.productId || null,
      product_name: input.productName,
      plan: input.plan ?? "LIFETIME",
      price: input.price,
      status: input.status ?? "pending",
      download_link: input.downloadLink ?? "",
      files: (input.files ?? []) as any,
      credentials: input.credentials ?? "",
      is_redeem: input.isRedeem ?? false,
    };
    
    const { error } = await supabase
      .from("purchases")
      .insert(insertData);
    
    if (error) {
      console.error("Error creating purchase:", error);
      notify();
      return error.message;
    }
    notify();
    return null;
  } catch (err: any) {
    console.error("Error creating purchase:", err);
    return err.message || "Unknown error";
  }
}

export async function updatePurchase(
  id: string,
  patch: { status?: Purchase["status"]; files?: DownloadFile[]; downloadLink?: string }
): Promise<string | null> {
  try {
    const payload: any = {};
    if (patch.status !== undefined) payload.status = patch.status;
    if (patch.files !== undefined) payload.files = patch.files;
    if (patch.downloadLink !== undefined) payload.download_link = patch.downloadLink;
    
    const { error } = await supabase
      .from("purchases")
      .update(payload)
      .eq("id", id);
    
    if (error) {
      console.error("Error updating purchase:", error);
      notify();
      return error.message;
    }
    notify();
    return null;
  } catch (err: any) {
    console.error("Error updating purchase:", err);
    return err.message || "Unknown error";
  }
}

// ---------------- NOTIFICATIONS ----------------

export async function fetchNotifications(): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Error loading notifications:", error);
    return [];
  }
  return (data ?? []).map((n) => ({
    id: n.id as string,
    userId: n.user_id as string,
    title: (n.title as string) ?? "",
    message: (n.message as string) ?? "",
    date: n.created_at as string,
    readBy: ((n.read_by as string[]) ?? []) as string[],
  }));
}

export async function pushNotification(userId: string, title: string, message: string) {
  const { error } = await supabase.from("notifications").insert({ user_id: userId, title, message });
  if (error) console.error("Error sending notification:", error);
  notify();
}

export async function markAllRead(userId: string) {
  const items = await fetchNotifications();
  const pending = items.filter(
    (n) => (n.userId === userId || n.userId === "*") && !n.readBy.includes(userId),
  );
  await Promise.all(
    pending.map((n) =>
      supabase
        .from("notifications")
        .update({ read_by: [...n.readBy, userId] })
        .eq("id", n.id),
    ),
  );
}

export async function deleteNotification(id: string) {
  const { error } = await supabase.from("notifications").delete().eq("id", id);
  if (error) console.error("Error deleting notification:", error);
  notify();
}

export async function broadcastNotification(title: string, message: string, actor = "SYSTEM") {
  await pushNotification("*", title, message);
  await logActivity("notification", actor, `Broadcast: ${title}`);
}

// ---------------- ACTIVITY LOG ----------------

export async function fetchActivity(): Promise<ActivityLog[]> {
  const { data, error } = await supabase
    .from("activity_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) {
    console.error("Error loading activity:", error);
    return [];
  }
  return (data ?? []).map((l) => ({
    id: l.id as string,
    type: (l.type as ActivityType) ?? "user",
    actor: (l.actor as string) ?? "",
    message: (l.message as string) ?? "",
    date: l.created_at as string,
  }));
}

export async function logActivity(type: ActivityType, actor: string, message: string) {
  const { error } = await supabase.from("activity_log").insert({ type, actor, message });
  if (error) console.error("Error logging activity:", error);
}

export async function clearActivity() {
  const { error } = await supabase.from("activity_log").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (error) console.error("Error clearing activity:", error);
  notify();
}

// ---------------- MESSAGING HELPERS ----------------

/** Turns a YouTube watch/share/embed URL or bare ID into an embeddable URL. */
export function youtubeEmbed(url: string): string {
  const raw = url.trim();
  if (!raw) return "";
  const match =
    raw.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{6,})/) ??
    raw.match(/^([\w-]{6,})$/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : raw;
}

const fill = (template: string, vars: Record<string, string>) =>
  template.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? "");

export const waLink = (message: string, number?: string) => {
  const base = "https://wa.me/";
  return `${base}?text=${encodeURIComponent(message)}`;
};

export async function discordCopy(message: string) {
  try {
    await navigator.clipboard.writeText(message);
  } catch {
    /* clipboard blocked */
  }
  window.open("https://discord.com/app", "_blank", "noopener");
}

export const buyMessage = (name: string, product: string, price: number, plan?: string) => {
  const template = "Hello I'm {name} I want to buy {product} for ${price} USD thank you!";
  const base = fill(template, { name, product, price: String(price), brand: "SPIDER HEX" });
  return plan ? `${base}\nPlan: ${plan}` : base;
};

export const topUpMessage = (name: string, email: string, amount: number) => {
  const template = "Hello I'm {name} ({email}) I want to top up my {brand} wallet with ${amount} USD thank you!";
  return fill(template, { name, email, amount: String(amount), brand: "SPIDER HEX" });
};

// ---------------- USER HELPERS ----------------

export async function getUserById(userId: string): Promise<{ email: string; fullName: string } | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return { email: data.email, fullName: data.full_name ?? data.email };
}