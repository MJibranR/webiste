import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Page, SectionTitle } from "@/components/shell";
import { useAuth } from "@/lib/auth";
import { useSettings } from "@/lib/use-settings";
import { fetchProducts, fetchCategories, type Category, createPurchase } from "@/lib/spiderhex";
import {
  buyMessage,
  discordCopy,
  getPurchases,
  setPurchases,
  uid,
  waLink,
  pushNotification,
  logActivity,
  type Product,
  type Purchase,
} from "@/lib/spiderhex";

export const Route = createFileRoute("/store")({
  component: StorePage,
  head: () => ({
    meta: [
      { title: "Store — SPIDER HEX Gaming Panels" },
      {
        name: "description",
        content: "Browse SPIDER HEX gaming panels: PC panels, root, non-root, iOS tools and gift keys with lifetime access.",
      },
    ],
  }),
});

const getDisplayPrice = (product: Product) => {
  const prices = [];
  if (product.price && product.price > 0) prices.push(product.price);
  if (product.priceMonthly && product.priceMonthly > 0) prices.push(product.priceMonthly);
  if (product.priceWeekly && product.priceWeekly > 0) prices.push(product.priceWeekly);
  
  if (prices.length === 0) return '$0';
  if (prices.length === 1) return `$${prices[0]}`;
  
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return `$${min} - $${max}`;
};

function StorePage() {
  const { user } = useAuth();
  const { settings, loading: settingsLoading } = useSettings();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [productsData, categoriesData] = await Promise.all([
          fetchProducts(),
          fetchCategories()
        ]);
        setProducts(productsData);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error loading data:', error);
        setProducts([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredProducts = selectedCategory === "ALL" 
    ? products 
    : products.filter((p) => p.category === selectedCategory);

  // ✅ FIX: Save purchase to DATABASE
  const record = async (product: Product): Promise<Purchase | null> => {
    if (!user) return null;
    
    const purchaseData = {
      userId: user.id,
      productId: product.id,
      productName: product.name,
      plan: "LIFETIME",
      price: product.price,
      status: 'pending' as const,
      downloadLink: product.downloadLink || "",
      files: product.downloadLink ? [
        {
          id: uid(),
          label: product.name,
          tag: 'PENDING',
          url: product.downloadLink,
        }
      ] : [],
      isRedeem: false,
    };
    
    // Save to database
    const error = await createPurchase(purchaseData);
    if (error) {
      console.error('Error saving purchase:', error);
      toast.error('Failed to place order');
      return null;
    }
    
    // Also save to localStorage for backup
    const localPurchase: Purchase = {
      id: uid(),
      ...purchaseData,
      purchaseDate: new Date().toISOString(),
    };
    setPurchases([...getPurchases(), localPurchase]);
    
    pushNotification(
      user.id,
      "ORDER PLACED 🛒",
      `Your order for ${product.name} ($${product.price}) is pending admin approval.`,
    );
    
    logActivity("purchase", user.email, `Ordered ${product.name} for $${product.price} (PENDING)`);
    return localPurchase;
  };

  const buy = async (product: Product, channel: "whatsapp" | "discord") => {
    if (!user) {
      toast.error("LOGIN REQUIRED");
      navigate({ to: "/login" });
      return;
    }
    
    await record(product);
    const msg = buyMessage(user.fullName, product.name, product.price);
    
    if (channel === "whatsapp") {
      window.open(waLink(msg), "_blank", "noopener");
      toast.success("✅ ORDER PLACED! Complete payment on WhatsApp to activate your download.");
    } else {
      void discordCopy(msg);
      toast.success("✅ ORDER PLACED! Message copied. Send to admin on Discord.");
    }
  };

  const goToProduct = (productId: string) => {
    navigate({ to: `/product/${productId}` });
  };

  if (settingsLoading || loading) {
    return (
      <Page>
        <div className="flex justify-center items-center py-20">
          <p className="text-sm text-muted-foreground">LOADING PRODUCTS...</p>
        </div>
      </Page>
    );
  }

  const storeHeading = settings?.storeHeading || "STORE";
  const storeSub = settings?.storeSub || "// SELECT YOUR WEAPON";

  return (
    <Page>
      <SectionTitle sub={storeSub}>
        {storeHeading}
      </SectionTitle>

      <div className="flex flex-wrap gap-2 text-[11px]">
        <button
          onClick={() => setSelectedCategory("ALL")}
          className={`rounded border px-3 py-2 transition ${
            selectedCategory === "ALL"
              ? "border-primary bg-accent text-primary"
              : "border-border text-muted-foreground hover:text-primary"
          }`}
        >
          ALL
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.name)}
            className={`rounded border px-3 py-2 transition ${
              selectedCategory === cat.name
                ? "border-primary bg-accent text-primary"
                : "border-border text-muted-foreground hover:text-primary"
            }`}
          >
            {cat.display_name}
          </button>
        ))}
      </div>

      {filteredProducts.length === 0 ? (
        <p className="panel mt-8 p-8 text-center text-xs text-muted-foreground">NO PRODUCTS IN THIS CATEGORY</p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((p) => (
            <div
              key={p.id}
              onClick={() => goToProduct(p.id)}
              className="cursor-pointer panel flex flex-col p-5 transition hover:-translate-y-1 hover:border-primary"
            >
              {p.imageUrl ? (
                <img
                  src={p.imageUrl}
                  alt={`${p.name} panel`}
                  loading="lazy"
                  className="mb-4 h-36 w-full rounded border border-border object-cover"
                />
              ) : null}
              <div className="flex items-start justify-between">
                <span className="rounded border border-gold/50 px-2 py-1 text-[10px] text-gold">{p.badge || "NEW"}</span>
                <span className="text-[10px] text-muted-foreground">{p.category}</span>
              </div>
              <h3 className="glow-text mt-4 text-sm font-bold tracking-[0.12em] text-primary">{p.name}</h3>
              <p className="mt-2 text-2xl font-bold text-foreground">{getDisplayPrice(p)}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                <span className="status-dot mr-2 align-middle" />
                {p.inStock ? "IN STOCK • LIFETIME" : "OUT OF STOCK"}
              </p>
              <div className="mt-5 flex gap-2 text-[11px]">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate({ to: `/product/${p.id}` });
                  }}
                  className="flex-1 rounded bg-primary px-3 py-2.5 font-bold text-primary-foreground transition hover:opacity-90"
                >
                  VIEW DETAILS
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Page>
  );
}