import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin-shell";
import { SectionTitle } from "@/components/shell";
import { supabase } from "@/integrations/supabase/client";
import { fetchCategories, type Category, type Product, uid } from "@/lib/spiderhex";

export const Route = createFileRoute("/admin/products")({
  component: () => (
    <AdminShell>
      <ProductsAdmin />
    </AdminShell>
  ),
  head: () => ({
    meta: [
      { title: "Manage Panels — SPIDER HEX Admin" },
      { name: "description", content: "Create, edit and remove SPIDER HEX gaming panels." },
    ],
  }),
});

const empty = (): Product => ({
  id: "",
  name: "",
  price: 0,
  priceMonthly: null,
  priceWeekly: null,
  category: "",
  badge: "NEW",
  inStock: true,
  downloadLink: "",
  imageUrl: "",
  description: "",
  videoUrl: "",
});

const field = "w-full rounded border border-border bg-background/60 px-3 py-2 text-xs text-foreground outline-none focus:border-primary";

function ProductsAdmin() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [draft, setDraft] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('Error loading products:', error);
        toast.error('Failed to load products');
        setProducts([]);
      } else {
        const mappedProducts: Product[] = (data || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          priceMonthly: p.price_monthly ?? null,
          priceWeekly: p.price_weekly ?? null,
          category: p.category,
          badge: p.badge || 'NEW',
          inStock: p.in_stock !== false,
          downloadLink: p.download_link || '',
          imageUrl: p.image_url || '',
          description: p.description || '',
          videoUrl: p.video_url || '',
        }));
        setProducts(mappedProducts);
      }
    } catch (error) {
      console.error('Error:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await fetchCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories([]);
    }
  };

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const save = async () => {
    if (!draft || !draft.name.trim()) {
      toast.error('Product name is required');
      return;
    }

    const productData = {
      name: draft.name.trim(),
      price: draft.price,
      price_monthly: draft.priceMonthly,
      price_weekly: draft.priceWeekly,
      category: draft.category,
      badge: draft.badge || 'NEW',
      in_stock: draft.inStock,
      download_link: draft.downloadLink || '',
      image_url: draft.imageUrl || '',
      description: draft.description || '',
      video_url: draft.videoUrl || '',
    };

    try {
      let error;
      if (draft.id) {
        const { error: updateError } = await supabase
          .from('products')
          .update(productData)
          .eq('id', draft.id);
        error = updateError;
        if (!error) toast.success('PRODUCT UPDATED');
      } else {
        const { error: insertError } = await supabase
          .from('products')
          .insert({
            ...productData,
            created_at: new Date().toISOString(),
          });
        error = insertError;
        if (!error) toast.success('PRODUCT CREATED');
      }

      if (error) {
        console.error('Error saving product:', error);
        toast.error('Failed to save product');
        return;
      }

      setDraft(null);
      loadProducts();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to save product');
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this product?")) return;
    
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      
      if (error) {
        toast.error('Failed to delete product');
        return;
      }
      
      toast.success('PRODUCT DELETED');
      loadProducts();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to delete product');
    }
  };

  if (loading) {
    return (
      <AdminShell>
        <SectionTitle sub="// CATALOG CONTROL">PANELS</SectionTitle>
        <div className="flex justify-center items-center py-20">
          <p className="text-sm text-muted-foreground">LOADING PRODUCTS...</p>
        </div>
      </AdminShell>
    );
  }

  return (
    <>
      <SectionTitle sub="// CATALOG CONTROL">PANELS</SectionTitle>

      <button
        onClick={() => setDraft(empty())}
        className="pulse-glow rounded bg-primary px-4 py-2 text-[11px] font-bold text-primary-foreground hover:opacity-90"
      >
        <Plus className="mr-1 inline h-4 w-4" />
        NEW PANEL
      </button>

      {draft && (
        <div className="panel mt-5 space-y-3 p-5">
          <p className="text-[11px] tracking-[0.2em] text-muted-foreground">
            {draft.id ? "EDIT PANEL" : "ADD PANEL"}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              className={field}
              placeholder="PANEL NAME"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
            <input
              className={field}
              type="number"
              min={0}
              placeholder="BASE PRICE USD"
              value={draft.price}
              onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) || 0 })}
            />
            <select
              className={field}
              value={draft.category}
              onChange={(e) => setDraft({ ...draft, category: e.target.value })}
            >
              <option value="">SELECT CATEGORY</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.display_name}
                </option>
              ))}
            </select>
            <input
              className={field}
              placeholder="BADGE (HOT / NEW / PRO)"
              value={draft.badge}
              onChange={(e) => setDraft({ ...draft, badge: e.target.value })}
            />
          </div>

          {/* ✅ FIXED: Pricing section with correct fields */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="text-[10px] text-muted-foreground">LIFETIME PRICE</label>
              <input
                className={`${field} mt-1`}
                type="number"
                min={0}
                placeholder="0"
                value={draft.price ?? ''}
                onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground">30 DAYS PRICE</label>
              <input
                className={`${field} mt-1`}
                type="number"
                min={0}
                placeholder="0"
                value={draft.priceMonthly ?? ''}
                onChange={(e) => setDraft({ ...draft, priceMonthly: Number(e.target.value) || null })}
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground">7 DAYS PRICE</label>
              <input
                className={`${field} mt-1`}
                type="number"
                min={0}
                placeholder="0"
                value={draft.priceWeekly ?? ''}
                onChange={(e) => setDraft({ ...draft, priceWeekly: Number(e.target.value) || null })}
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-muted-foreground">DESCRIPTION</label>
            <textarea
              className={`${field} mt-1 min-h-[80px]`}
              placeholder="Product description..."
              value={draft.description || ''}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-[10px] text-muted-foreground">DEMO VIDEO URL (YouTube)</label>
              <input
                className={`${field} mt-1`}
                placeholder="https://youtube.com/watch?v=..."
                value={draft.videoUrl || ''}
                onChange={(e) => setDraft({ ...draft, videoUrl: e.target.value })}
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground">IMAGE URL</label>
              <input
                className={`${field} mt-1`}
                placeholder="https://example.com/image.jpg"
                value={draft.imageUrl || ''}
                onChange={(e) => setDraft({ ...draft, imageUrl: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-muted-foreground">DOWNLOAD LINK</label>
            <input
              className={`${field} mt-1`}
              placeholder="https://example.com/download.zip"
              value={draft.downloadLink}
              onChange={(e) => setDraft({ ...draft, downloadLink: e.target.value })}
            />
          </div>

          {draft.imageUrl ? (
            <img
              src={draft.imageUrl}
              alt={`${draft.name || "Panel"} preview`}
              loading="lazy"
              className="h-28 w-full rounded border border-border object-cover"
            />
          ) : null}

          <label className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <input
              type="checkbox"
              checked={draft.inStock}
              onChange={(e) => setDraft({ ...draft, inStock: e.target.checked })}
            />
            IN STOCK
          </label>

          <div className="flex gap-2">
            <button
              onClick={save}
              className="rounded bg-primary px-4 py-2 text-[11px] font-bold text-primary-foreground hover:opacity-90"
            >
              SAVE
            </button>
            <button
              onClick={() => setDraft(null)}
              className="rounded border border-border px-4 py-2 text-[11px] text-muted-foreground hover:text-primary"
            >
              CANCEL
            </button>
          </div>
        </div>
      )}

      <div className="panel mt-6 overflow-x-auto">
        {products.length === 0 ? (
          <p className="p-8 text-center text-xs text-muted-foreground">NO PANELS YET</p>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="text-[10px] tracking-[0.15em] text-muted-foreground">
              <tr className="border-b border-border">
                <th className="p-3">NAME</th>
                <th className="p-3">CATEGORY</th>
                <th className="p-3">PRICE</th>
                <th className="p-3">PLANS</th>
                <th className="p-3">STOCK</th>
                <th className="p-3 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-border/50">
                  <td className="p-3 text-primary">{p.name}</td>
                  <td className="p-3 text-muted-foreground">{p.category}</td>
                  <td className="p-3">${p.price}</td>
                  <td className="p-3 text-[10px]">
                    {p.price ? `L:$${p.price}` : ''}
                    {p.priceMonthly ? ` M:$${p.priceMonthly}` : ''}
                    {p.priceWeekly ? ` W:$${p.priceWeekly}` : ''}
                  </td>
                  <td className={`p-3 ${p.inStock ? "text-primary" : "text-danger"}`}>
                    {p.inStock ? "IN STOCK" : "OUT"}
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setDraft(p)}
                        className="rounded border border-border p-2 text-muted-foreground hover:text-primary"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => remove(p.id)}
                        className="rounded border border-danger/50 p-2 text-danger hover:bg-danger/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
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