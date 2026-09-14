import { supabase } from "@/integrations/supabase/client";
import { notify } from "./spiderhex";

export interface PaymentMethod {
  id: string;
  name: string;
  accountLabel: string;
  accountValue: string;
  instructions: string;
  logoEmoji: string;
  enabled: boolean;
  sortOrder: number;
}

export interface PaymentSettings {
  usdToBdt: number;
  tutorialVideoUrl: string;
  tutorialHeading: string;
  tutorialText: string;
  minDepositUsd: number;
}

export type DepositStatus = "pending" | "approved" | "rejected";

export interface Deposit {
  id: string;
  userId: string;
  userEmail: string;
  amountUsd: number;
  amountBdt: number;
  rate: number;
  methodId: string | null;
  methodName: string;
  senderInfo: string;
  reference: string;
  note: string;
  status: DepositStatus;
  adminNote: string;
  createdAt: string;
  reviewedAt: string | null;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  kind: "credit" | "debit";
  amount: number;
  balanceAfter: number;
  sourceType: string;
  note: string;
  createdAt: string;
}

export const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  usdToBdt: 125,
  tutorialVideoUrl: "https://www.youtube.com/embed/O2Xrrlw_xQo",
  tutorialHeading: "HOW TO RECHARGE WALLET // STEP-BY-STEP",
  tutorialText:
    "Pick a method, send the exact BDT amount, then submit your transaction ID. Your wallet is credited after admin approval.",
  minDepositUsd: 1,
};

/** Turns any YouTube URL into an embeddable one. */
export function youtubeEmbed(url: string): string {
  if (!url) return "";
  const id =
    url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([A-Za-z0-9_-]{6,})/)?.[1] ?? "";
  return id ? `https://www.youtube.com/embed/${id}` : url;
}

export const bdt = (usd: number, rate: number) => Math.round(usd * rate);

// ---------------- PAYMENT METHODS ----------------

export async function fetchPaymentMethods(onlyEnabled = false): Promise<PaymentMethod[]> {
  let query = supabase.from("payment_methods").select("*").order("sort_order", { ascending: true });
  if (onlyEnabled) query = query.eq("enabled", true);
  const { data, error } = await query;
  if (error) {
    console.error("Error loading payment methods:", error);
    return [];
  }
  return (data ?? []).map((m) => ({
    id: m.id,
    name: m.name,
    accountLabel: m.account_label,
    accountValue: m.account_value,
    instructions: m.instructions,
    logoEmoji: m.logo_emoji,
    enabled: m.enabled,
    sortOrder: m.sort_order,
  }));
}

export async function savePaymentMethod(m: Partial<PaymentMethod>): Promise<string | null> {
  const payload = {
    name: (m.name ?? "").trim(),
    account_label: m.accountLabel ?? "Number",
    account_value: m.accountValue ?? "",
    instructions: m.instructions ?? "",
    logo_emoji: m.logoEmoji || "💳",
    enabled: m.enabled !== false,
    sort_order: m.sortOrder ?? 0,
  };
  const { error } = m.id
    ? await supabase.from("payment_methods").update(payload).eq("id", m.id)
    : await supabase.from("payment_methods").insert(payload);
  if (!error) notify();
  return error ? error.message : null;
}

export async function deletePaymentMethod(id: string): Promise<string | null> {
  const { error } = await supabase.from("payment_methods").delete().eq("id", id);
  if (!error) notify();
  return error ? error.message : null;
}

// ---------------- PAYMENT SETTINGS ----------------

export async function fetchPaymentSettings(): Promise<PaymentSettings> {
  const { data, error } = await supabase.from("payment_settings").select("*").eq("id", "main").maybeSingle();
  if (error || !data) return DEFAULT_PAYMENT_SETTINGS;
  return {
    usdToBdt: Number(data.usd_to_bdt ?? 125),
    tutorialVideoUrl: data.tutorial_video_url ?? DEFAULT_PAYMENT_SETTINGS.tutorialVideoUrl,
    tutorialHeading: data.tutorial_heading ?? DEFAULT_PAYMENT_SETTINGS.tutorialHeading,
    tutorialText: data.tutorial_text ?? DEFAULT_PAYMENT_SETTINGS.tutorialText,
    minDepositUsd: Number(data.min_deposit_usd ?? 1),
  };
}

export async function savePaymentSettings(s: PaymentSettings): Promise<string | null> {
  const { error } = await supabase
    .from("payment_settings")
    .update({
      usd_to_bdt: s.usdToBdt,
      tutorial_video_url: youtubeEmbed(s.tutorialVideoUrl),
      tutorial_heading: s.tutorialHeading,
      tutorial_text: s.tutorialText,
      min_deposit_usd: s.minDepositUsd,
      updated_at: new Date().toISOString(),
    })
    .eq("id", "main");
  if (!error) notify();
  return error ? error.message : null;
}

// ---------------- DEPOSITS ----------------

const toDeposit = (d: Record<string, unknown>): Deposit => ({
  id: d["id"] as string,
  userId: d["user_id"] as string,
  userEmail: (d["user_email"] as string) ?? "",
  amountUsd: Number(d["amount_usd"] ?? 0),
  amountBdt: Number(d["amount_bdt"] ?? 0),
  rate: Number(d["rate"] ?? 125),
  methodId: (d["method_id"] as string) ?? null,
  methodName: (d["method_name"] as string) ?? "",
  senderInfo: (d["sender_info"] as string) ?? "",
  reference: (d["reference"] as string) ?? "",
  note: (d["note"] as string) ?? "",
  status: ((d["status"] as DepositStatus) ?? "pending"),
  adminNote: (d["admin_note"] as string) ?? "",
  createdAt: d["created_at"] as string,
  reviewedAt: (d["reviewed_at"] as string) ?? null,
});

/** RLS returns the caller's own deposits, or every deposit for admins. */
export async function fetchDeposits(): Promise<Deposit[]> {
  const { data, error } = await supabase.from("deposits").select("*").order("created_at", { ascending: false });
  if (error) {
    console.error("Error loading deposits:", error);
    return [];
  }
  return (data ?? []).map((d) => toDeposit(d as unknown as Record<string, unknown>));
}

export async function createDeposit(input: {
  userId: string;
  userEmail: string;
  amountUsd: number;
  rate: number;
  methodId: string;
  methodName: string;
  senderInfo: string;
  reference: string;
  note?: string;
}): Promise<string | null> {
  if (!Number.isFinite(input.amountUsd) || input.amountUsd <= 0) return "Enter a valid amount";
  if (!input.methodId) return "Select a payment method";
  if (!input.reference.trim()) return "Enter your transaction / reference ID";

  const { error } = await supabase.from("deposits").insert({
    user_id: input.userId,
    user_email: input.userEmail,
    amount_usd: input.amountUsd,
    amount_bdt: bdt(input.amountUsd, input.rate),
    rate: input.rate,
    method_id: input.methodId,
    method_name: input.methodName,
    sender_info: input.senderInfo.trim(),
    reference: input.reference.trim(),
    note: input.note?.trim() ?? "",
    status: "pending",
  });
  if (!error) notify();
  return error ? error.message : null;
}

export async function approveDeposit(id: string, adminNote = ""): Promise<string | null> {
  const { error } = await supabase.rpc("approve_deposit", { _deposit_id: id, _admin_note: adminNote });
  if (!error) notify();
  return error ? error.message : null;
}

export async function rejectDeposit(id: string, adminNote = ""): Promise<string | null> {
  const { error } = await supabase.rpc("reject_deposit", { _deposit_id: id, _admin_note: adminNote });
  if (!error) notify();
  return error ? error.message : null;
}

export async function countPendingDeposits(): Promise<number> {
  const { count, error } = await supabase
    .from("deposits")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");
  if (error) return 0;
  return count ?? 0;
}

// ---------------- WALLET TRANSACTIONS ----------------

export async function fetchWalletTransactions(): Promise<WalletTransaction[]> {
  const { data, error } = await supabase
    .from("wallet_transactions")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []).map((t) => ({
    id: t.id,
    userId: t.user_id,
    kind: (t.kind as "credit" | "debit") ?? "credit",
    amount: Number(t.amount ?? 0),
    balanceAfter: Number(t.balance_after ?? 0),
    sourceType: t.source_type ?? "manual",
    note: t.note ?? "",
    createdAt: t.created_at,
  }));
}

// ---------------- PRODUCT DURATIONS ----------------

export interface ProductDuration {
  id: string;
  productId: string;
  label: string;
  days: number;
  price: number;
  sortOrder: number;
}

export const DURATION_PRESETS = [
  { label: "1 DAY", days: 1 },
  { label: "7 DAYS", days: 7 },
  { label: "15 DAYS", days: 15 },
  { label: "30 DAYS", days: 30 },
  { label: "60 DAYS", days: 60 },
  { label: "90 DAYS", days: 90 },
  { label: "365 DAYS", days: 365 },
  { label: "LIFETIME", days: 0 },
];

export async function fetchDurations(productId?: string): Promise<ProductDuration[]> {
  let q = supabase.from("product_durations").select("*").order("sort_order", { ascending: true });
  if (productId) q = q.eq("product_id", productId);
  const { data, error } = await q;
  if (error) return [];
  return (data ?? []).map((d) => ({
    id: d.id,
    productId: d.product_id,
    label: d.label,
    days: d.days,
    price: Number(d.price ?? 0),
    sortOrder: d.sort_order,
  }));
}

export async function saveDuration(d: Partial<ProductDuration> & { productId: string }): Promise<string | null> {
  const payload = {
    product_id: d.productId,
    label: d.label ?? "LIFETIME",
    days: d.days ?? 0,
    price: d.price ?? 0,
    sort_order: d.sortOrder ?? 0,
  };
  const { error } = d.id
    ? await supabase.from("product_durations").update(payload).eq("id", d.id)
    : await supabase.from("product_durations").insert(payload);
  if (!error) notify();
  return error ? error.message : null;
}

export async function deleteDuration(id: string): Promise<string | null> {
  const { error } = await supabase.from("product_durations").delete().eq("id", id);
  if (!error) notify();
  return error ? error.message : null;
}

/** Server-side wallet purchase — price and balance are validated in the database. */
export async function purchaseWithWallet(productId: string, durationId?: string): Promise<string | null> {
  const { error } = await supabase.rpc("purchase_with_wallet", {
    _product_id: productId,
    _duration_id: durationId ?? undefined,
  });
  if (!error) notify();
  if (!error) return null;
  if (/insufficient/i.test(error.message)) return "Not enough wallet balance — top up first.";
  return error.message;
}
