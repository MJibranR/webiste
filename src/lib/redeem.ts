import { supabase } from "@/integrations/supabase/client";

export interface DownloadFile {
  id: string;
  label: string;
  tag: string;
  url: string;
}

export interface RedeemCode {
  id: string;
  code: string;
  product_id: string | null;
  product_name: string;
  download_link: string;
  access_key: string;
  note: string;
  created_by: string | null;
  created_at: string;
  claimed_by: string | null;
  claimed_at: string | null;
  usage_limit: number;
  usage_count: number;
  files: string | null; // JSON string in database
}

export function generateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'SPX-';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  result += '-';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function listAllCodes(): Promise<RedeemCode[]> {
  const { data, error } = await supabase
    .from('redeem_codes')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching redeem codes:', error);
    return [];
  }
  
  return data || [];
}

export async function createCode(data: {
  code: string;
  productId: string | null;
  productName: string;
  downloadLink: string;
  accessKey: string;
  note: string;
  usageLimit: number;
  files: DownloadFile[];
}): Promise<string | null> {
  const filesJson = data.files.length > 0 ? JSON.stringify(data.files) : null;
  
  const { error } = await supabase
    .from('redeem_codes')
    .insert({
      code: data.code.toUpperCase(),
      product_id: data.productId,
      product_name: data.productName,
      download_link: data.downloadLink,
      access_key: data.accessKey,
      note: data.note,
      usage_limit: data.usageLimit,
      usage_count: 0,
      files: filesJson,
      created_at: new Date().toISOString(),
    });
  
  if (error) {
    console.error('Error creating redeem code:', error);
    return error.message;
  }
  return null;
}

export async function deleteCode(id: string): Promise<string | null> {
  const { error } = await supabase
    .from('redeem_codes')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting redeem code:', error);
    return error.message;
  }
  return null;
}

export async function redeemCodeAction(code: string, userId: string): Promise<{ 
  success: boolean; 
  message: string; 
  data?: { 
    productName: string; 
    downloadLink: string; 
    accessKey: string; 
    files?: DownloadFile[];
  } 
}> {
  // First, get the code
  const { data: codes, error: fetchError } = await supabase
    .from('redeem_codes')
    .select('*')
    .eq('code', code.toUpperCase());
  
  if (fetchError || !codes || codes.length === 0) {
    return { success: false, message: 'INVALID OR ALREADY USED CODE' };
  }
  
  const redeem = codes[0];
  
  // Check if already claimed by this user
  if (redeem.claimed_by === userId) {
    return { success: false, message: 'YOU ALREADY CLAIMED THIS CODE' };
  }
  
  // Check usage limit
  const currentUsage = redeem.usage_count || 0;
  const maxUsage = redeem.usage_limit || 1;
  
  if (maxUsage !== -1 && currentUsage >= maxUsage) {
    return { success: false, message: 'CODE HAS REACHED MAXIMUM USES' };
  }
  
  // Calculate new usage count
  const newCount = currentUsage + 1;
  const isFullyUsed = maxUsage !== -1 && newCount >= maxUsage;
  
  // Update usage count
  const { error: updateError } = await supabase
    .from('redeem_codes')
    .update({
      usage_count: newCount,
      claimed_by: isFullyUsed ? userId : null,
      claimed_at: isFullyUsed ? new Date().toISOString() : null,
    })
    .eq('id', redeem.id);
  
  if (updateError) {
    console.error('Error updating redeem code:', updateError);
    return { success: false, message: 'FAILED TO REDEEM CODE' };
  }
  
  // Parse files
  let files: DownloadFile[] = [];
  if (redeem.files) {
    try {
      files = JSON.parse(redeem.files);
    } catch {
      files = [];
    }
  }
  
  // If no files but download_link exists, create a file entry
  if (files.length === 0 && redeem.download_link) {
    files = [{ 
      id: 'legacy', 
      label: 'MAIN DOWNLOAD', 
      tag: 'OFFICIAL', 
      url: redeem.download_link 
    }];
  }
  
  return {
    success: true,
    message: isFullyUsed ? 'REDEEM SUCCESSFUL' : `REDEEMED (${newCount}/${maxUsage === -1 ? '∞' : maxUsage})`,
    data: {
      productName: redeem.product_name,
      downloadLink: redeem.download_link || '',
      accessKey: redeem.access_key || '',
      files: files,
    }
  };
}