import { supabase } from "@/integrations/supabase/client";

export interface RedeemCode {
  id: string;
  code: string;
  product_id: string | null;
  product_name: string;
  download_link: string;
  access_key: string;
  note: string;
  created_by: string | null;
  claimed_by: string | null;
  claimed_at: string | null;
  created_at: string;
}

/** Random human friendly code like SPX-8F3K-2QD9 */
export function generateCode(prefix = "SPX") {
  const chunk = () =>
    Array.from({ length: 4 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("");
  return `${prefix}-${chunk()}-${chunk()}`;
}

export async function listAllCodes(): Promise<RedeemCode[]> {
  const { data } = await supabase
    .from("redeem_codes")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []) as RedeemCode[];
}

export async function listMyCodes(): Promise<RedeemCode[]> {
  const { data } = await supabase
    .from("redeem_codes")
    .select("*")
    .order("claimed_at", { ascending: false });
  return (data ?? []) as RedeemCode[];
}

export async function createCode(input: {
  code: string;
  productId?: string | null;
  productName: string;
  downloadLink: string;
  accessKey: string;
  note?: string;
}) {
  const { data: auth } = await supabase.auth.getUser();
  const { error } = await supabase.from("redeem_codes").insert({
    code: input.code.trim().toUpperCase(),
    product_id: input.productId ?? null,
    product_name: input.productName.trim(),
    download_link: input.downloadLink.trim(),
    access_key: input.accessKey.trim(),
    note: input.note?.trim() ?? "",
    created_by: auth.user?.id ?? null,
  });
  return error?.message;
}

export async function deleteCode(id: string) {
  const { error } = await supabase.from("redeem_codes").delete().eq("id", id);
  return error?.message;
}

export async function claimCode(code: string): Promise<{ row?: RedeemCode; error?: string }> {
  const { data, error } = await supabase.rpc("redeem_code", { _code: code });
  if (error) {
    const msg = /already used/i.test(error.message)
      ? "THIS CODE HAS ALREADY BEEN USED"
      : /invalid/i.test(error.message)
        ? "INVALID REDEEM CODE"
        : error.message.toUpperCase();
    return { error: msg };
  }
  return { row: data as unknown as RedeemCode };
}
