import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Page, SectionTitle } from "@/components/shell";
import { useAuth } from "@/lib/auth";
import { useSettings } from "@/lib/use-settings";
import { useLive } from "@/lib/use-live";
import {
  CATEGORIES,
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
      { property: "og:title", content: "Store — SPIDER HEX Gaming Panels" },
      { property: "og:description", content: "PC, root, non-root and iOS gaming panels with lifetime access." },
    ],
  }),
});

function StorePage() {
  const { user } = useAuth();
  const settings = useSettings();
  const { products, ready } = useLive();
  const navigate = useNavigate();
  const [cat, setCat] = useState<string>("ALL");

  const list = cat === "ALL" ? products : products.filter((p) => p.category === cat);

  const record = (product: Product): Purchase | null => {
    if (!user) return null;
    
    // Create purchase with 'pending' status
    const purchase: Purchase = {
      id: uid(),
      userId: user.id,
      productId: product.id,
      productName: product.name,
      price: product.price,
      purchaseDate: new Date().toISOString(),
      status: 'pending',
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
    
    setPurchases([...getPurchases(), purchase]);
    
    pushNotification(
      user.id,
      "ORDER PLACED 🛒",
      `Your order for ${product.name} ($${product.price}) is pending admin approval.`,
    );
    
    logActivity("purchase", user.email, `Ordered ${product.name} for $${product.price} (PENDING)`);
    return purchase;
  };

  const buy = (product: Product, channel: "whatsapp" | "discord") => {
    if (!user) {
      toast.error("LOGIN REQUIRED");
      navigate({ to: "/login" });
      return;
    }
    
    record(product);
    const msg = buyMessage(user.fullName, product.name, product.price);
    
    if (channel === "whatsapp") {
      window.open(waLink(msg), "_blank", "noopener");
      toast.success("✅ ORDER PLACED! Complete payment on WhatsApp to activate your download.");
    } else {
      void discordCopy(msg);
      toast.success("✅ ORDER PLACED! Message copied. Send to admin on Discord.");
    }
  };

  return (
    <Page>
      <SectionTitle sub={settings.storeSub}>{settings.storeHeading}</SectionTitle>

      <div className="flex flex-wrap gap-2 text-[11px]">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`rounded border px-3 py-2 transition ${
              cat === c
                ? "border-primary bg-accent text-primary"
                : "border-border text-muted-foreground hover:text-primary"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {!ready ? (
        <p className="mt-8 text-xs text-muted-foreground">LOADING CATALOG...</p>
      ) : list.length === 0 ? (
        <p className="panel mt-8 p-8 text-center text-xs text-muted-foreground">NO PRODUCTS IN THIS CATEGORY</p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => (
            <article key={p.id} className="panel flex flex-col p-5 transition hover:-translate-y-1 hover:border-primary">
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
              <p className="mt-2 text-2xl font-bold text-foreground">${p.price}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                <span className="status-dot mr-2 align-middle" />
                {p.inStock ? "IN STOCK • LIFETIME" : "OUT OF STOCK"}
              </p>
              <div className="mt-5 flex gap-2 text-[11px]">
                <button
                  onClick={() => buy(p, "whatsapp")}
                  className="flex-1 rounded bg-primary px-3 py-2.5 font-bold text-primary-foreground transition hover:opacity-90"
                >
                  BUY • WHATSAPP
                </button>
                <button
                  onClick={() => buy(p, "discord")}
                  className="rounded border border-border px-3 py-2.5 text-muted-foreground transition hover:text-primary"
                >
                  DISCORD
                </button>
              </div>
              <p className="mt-2 text-[9px] text-muted-foreground text-center">
                ⚠️ Payment required. Links appear after admin approval.
              </p>
            </article>
          ))}
        </div>
      )}
    </Page>
  );
}