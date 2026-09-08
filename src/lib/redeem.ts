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
  files: string | null;
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
  
  // Map the data to include default values for missing fields
  return (data || []).map((item: any) => ({
    id: item.id,
    code: item.code,
    product_id: item.product_id || null,
    product_name: item.product_name || 'Unknown',
    download_link: item.download_link || '',
    access_key: item.access_key || '',
    note: item.note || '',
    created_by: item.created_by || null,
    created_at: item.created_at || new Date().toISOString(),
    claimed_by: item.claimed_by || null,
    claimed_at: item.claimed_at || null,
    usage_limit: item.usage_limit ?? 1,
    usage_count: item.usage_count ?? 0,
    files: item.files || null,
  }));
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
  try {
    const filesArray = data.files || [];
    const filesJson = filesArray.length > 0 ? JSON.stringify(filesArray) : null;
    
    const insertData: any = {
      code: data.code.toUpperCase(),
      product_name: data.productName || 'Unknown Panel',
      download_link: data.downloadLink || '',
      access_key: data.accessKey || '',
      note: data.note || '',
      usage_limit: data.usageLimit || 1,
      usage_count: 0,
      files: filesJson,
      created_at: new Date().toISOString(),
    };

    if (data.productId && data.productId.trim() !== '') {
      insertData.product_id = data.productId;
    }

    const { error } = await supabase
      .from('redeem_codes')
      .insert(insertData);
    
    if (error) {
      console.error('Supabase error creating redeem code:', error);
      return error.message;
    }
    return null;
  } catch (err: any) {
    console.error('Error in createCode:', err);
    return err.message || 'Unknown error';
  }
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
  try {
    // First, get the code
    const { data: codes, error: fetchError } = await supabase
      .from('redeem_codes')
      .select('*')
      .eq('code', code.toUpperCase());
    
    if (fetchError) {
      console.error('Fetch error:', fetchError);
      return { success: false, message: 'DATABASE ERROR' };
    }
    
    if (!codes || codes.length === 0) {
      return { success: false, message: 'INVALID CODE' };
    }
    
    const redeem = codes[0];
    
    // ✅ Check if redeem exists (add null check)
    if (!redeem) {
      return { success: false, message: 'CODE NOT FOUND' };
    }
    
    // Safely access properties with defaults
    const currentUsage = redeem.usage_count ?? 0;
    const maxUsage = redeem.usage_limit ?? 1;
    
    // Check if code is already fully used
    if (maxUsage === 1 && currentUsage >= 1) {
      return { success: false, message: 'THIS CODE HAS ALREADY BEEN USED' };
    }
    
    // Check if code has reached its limit
    if (maxUsage !== -1 && currentUsage >= maxUsage) {
      return { success: false, message: 'CODE HAS REACHED MAXIMUM USES' };
    }
    
    // Check if this specific user already used this specific code
    if (redeem.claimed_by === userId) {
      return { success: false, message: 'YOU ALREADY USED THIS CODE' };
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
        const parsed = JSON.parse(redeem.files);
        if (Array.isArray(parsed)) {
          files = parsed;
        }
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
      message: isFullyUsed ? 'CODE REDEEMED SUCCESSFULLY' : `REDEEMED (${newCount}/${maxUsage === -1 ? '∞' : maxUsage})`,
      data: {
        productName: redeem.product_name || 'Unknown',
        downloadLink: redeem.download_link || '',
        accessKey: redeem.access_key || '',
        files: files,
      }
    };
  } catch (err: any) {
    console.error('Error in redeemCodeAction:', err);
    return { success: false, message: err.message || 'REDEEM FAILED' };
  }
}