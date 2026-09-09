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
      code: data.code.toUpperCase().trim(),
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

    console.log('Inserting redeem code:', insertData);

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
    // ✅ Trim and uppercase the code
    const cleanCode = code.trim().toUpperCase();
    console.log('🔍 Looking for code:', cleanCode);
    
    // ✅ Query for the code
    const { data: codes, error: fetchError } = await supabase
      .from('redeem_codes')
      .select('*')
      .eq('code', cleanCode);
    
    if (fetchError) {
      console.error('Fetch error:', fetchError);
      return { success: false, message: 'DATABASE ERROR' };
    }
    
    console.log('📦 Codes found:', codes?.length || 0);
    
    if (!codes || codes.length === 0) {
      console.log('❌ Code not found:', cleanCode);
      return { success: false, message: 'INVALID CODE' };
    }
    
    const redeem = codes[0];
    console.log('✅ Code found:', redeem);
    
    // ✅ Check if code is already fully used
    const currentUsage = redeem.usage_count || 0;
    const maxUsage = redeem.usage_limit || 1;
    
    // If maxUsage is 1 and currentUsage >= 1, code is already used
    if (maxUsage === 1 && currentUsage >= 1) {
      return { success: false, message: 'THIS CODE HAS ALREADY BEEN USED' };
    }
    
    // If maxUsage > 1, check if it's reached its limit
    if (maxUsage !== -1 && currentUsage >= maxUsage) {
      return { success: false, message: 'CODE HAS REACHED MAXIMUM USES' };
    }
    
    // ✅ Check if this specific user already used this specific code
    if (redeem.claimed_by === userId) {
      return { success: false, message: 'YOU ALREADY USED THIS CODE' };
    }
    
    // ✅ Calculate new usage count
    const newCount = currentUsage + 1;
    const isFullyUsed = maxUsage !== -1 && newCount >= maxUsage;
    
    // ✅ Update usage count
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
    
    // ✅ Parse files
    let files: DownloadFile[] = [];
    if (redeem.files) {
      try {
        files = JSON.parse(redeem.files);
        if (!Array.isArray(files)) {
          files = [];
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
    
    // ✅ Also create a purchase record for the user
    const purchaseData = {
      user_id: userId,
      product_id: redeem.product_id || 'redeem',
      product_name: redeem.product_name || 'Redeemed Panel',
      plan: 'REDEEM',
      price: 0,
      status: 'active',
      download_link: redeem.download_link || '',
      files: files as any,
      credentials: redeem.access_key || '',
      is_redeem: true,
    };
    
    const { error: purchaseError } = await supabase
      .from('purchases')
      .insert(purchaseData);
    
    if (purchaseError) {
      console.error('Error creating purchase for redeem:', purchaseError);
      // Continue anyway - the redeem was successful
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

export async function getUserById(userId: string): Promise<{ email: string; fullName: string } | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single();
    
    if (error || !data) {
      return null;
    }
    
    return {
      email: data.email || 'Unknown',
      fullName: data.full_name || 'Unknown User',
    };
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}