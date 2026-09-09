import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Page } from "@/components/shell";
import { useAuth } from "@/lib/auth";
import { useSettings } from "@/lib/use-settings";
import { fetchProduct, createPurchase } from "@/lib/spiderhex";
import {
  buyMessage,
  discordCopy,
  waLink,
  pushNotification,
  logActivity,
  uid,
  type Product,
} from "@/lib/spiderhex";

export const Route = createFileRoute("/product/$id")({
  component: ProductPage,
  head: () => ({
    meta: [
      { title: "Product — SPIDER HEX" },
      { name: "description", content: "View SPIDER HEX gaming panel details." },
    ],
  }),
});

function ProductPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<'lifetime' | 'monthly' | 'weekly'>('lifetime');

  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      try {
        const data = await fetchProduct(id);
        if (!data) {
          toast.error('Product not found');
          navigate({ to: '/store' });
          return;
        }
        setProduct(data);
      } catch (error) {
        console.error('Error loading product:', error);
        toast.error('Failed to load product');
        navigate({ to: '/store' });
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [id, navigate]);

  const getPlanPrice = (plan: 'lifetime' | 'monthly' | 'weekly') => {
    if (!product) return 0;
    if (plan === 'lifetime') return product.price || 0;
    if (plan === 'monthly') return product.priceMonthly || 0;
    return product.priceWeekly || 0;
  };

  const getPlanLabel = (plan: 'lifetime' | 'monthly' | 'weekly') => {
    if (plan === 'lifetime') return 'LIFETIME PASS';
    if (plan === 'monthly') return '30 DAYS ACCESS';
    return '7 DAY ACCESS';
  };

  // ✅ FIX: Save purchase to DATABASE
  const handleBuy = async (plan: 'lifetime' | 'monthly' | 'weekly', channel: 'whatsapp' | 'discord') => {
    if (!user) {
      toast.error("PLEASE LOGIN FIRST");
      navigate({ to: '/login' });
      return;
    }

    if (!product) return;

    const price = getPlanPrice(plan);
    const planLabel = getPlanLabel(plan);

    if (price <= 0) {
      toast.error("This plan is not available");
      return;
    }

    // ✅ Create purchase in DATABASE
    const error = await createPurchase({
      userId: user.id,
      productId: product.id,
      productName: `${product.name} (${planLabel})`,
      plan: planLabel,
      price: price,
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
      credentials: plan,
    });

    if (error) {
      console.error('Error creating purchase:', error);
      toast.error('Failed to place order. Please try again.');
      return;
    }

    pushNotification(
      user.id,
      "ORDER PLACED 🛒",
      `Your order for ${product.name} (${planLabel}) ($${price}) is pending admin approval.`,
    );

    logActivity("purchase", user.email, `Ordered ${product.name} (${planLabel}) for $${price} (PENDING)`);

    // Send WhatsApp/Discord message
    const whatsappNumber = settings?.whatsappNumber || '+923001234567';
    const discordLink = settings?.discordUrl || 'https://discord.com/app';

    const msg = `Hello I'm ${user.fullName} I want to buy ${product.name} for ${planLabel} for $${price} USD thank you!`;

    if (channel === 'whatsapp') {
      const waUrl = `https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`;
      window.open(waUrl, "_blank", "noopener");
      toast.success("✅ ORDER PLACED! Complete payment on WhatsApp to activate your download.");
    } else {
      navigator.clipboard.writeText(msg).then(() => {
        toast.success("✅ ORDER PLACED! Message copied. Open Discord and send it to the admin.");
      }).catch(() => {
        toast.success("✅ ORDER PLACED! Copy the message and send it on Discord.");
      });
      window.open(discordLink, "_blank", "noopener");
    }
  };

  if (loading) {
    return (
      <Page>
        <div className="flex justify-center items-center py-20">
          <p className="text-sm text-muted-foreground">LOADING PRODUCT...</p>
        </div>
      </Page>
    );
  }

  if (!product) {
    return (
      <Page>
        <div className="flex justify-center items-center py-20">
          <p className="text-sm text-muted-foreground">PRODUCT NOT FOUND</p>
        </div>
      </Page>
    );
  }

  const pp = settings?.productPage || {
    heading: "CHOOSE YOUR PLAN",
    supportText: "Contact our support team for assistance with setup, custom configurations, or any questions.",
    discordLabel: "💬 DISCORD SUPPORT",
    telegramLabel: "📱 TELEGRAM SUPPORT",
    dummyImage: "https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=800&h=400&fit=crop",
    dummyVideo: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    badge1: { icon: "🛡️", title: "100% SAFE", desc: "Undetected bypass" },
    badge2: { icon: "⚡", title: "24/7 SUPPORT", desc: "Always here to help" },
    badge3: { icon: "🔒", title: "ALWAYS ACTIVE", desc: "No downtime" },
  };

  const productImage = product.imageUrl || pp.dummyImage;
  const productVideo = product.videoUrl || pp.dummyVideo;

  const youtubeEmbedUrl = productVideo
    ? productVideo.includes('youtube.com') || productVideo.includes('youtu.be')
      ? `https://www.youtube.com/embed/${productVideo.split('v=')[1]?.split('&')[0] || productVideo.split('/').pop()}`
      : productVideo
    : '';

  return (
    <Page>
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate({ to: '/store' })}
          className="text-[11px] text-muted-foreground hover:text-primary transition mb-4 flex items-center gap-1"
        >
          ← BACK TO STORE
        </button>

        {/* Hero Section - Image + Video + Badges */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Left Column - Image & Video */}
          <div className="space-y-4">
            {/* Thumbnail Image */}
            <div className="panel overflow-hidden">
              <img
                src={productImage}
                alt={product.name}
                className="w-full h-auto max-h-[300px] object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = pp.dummyImage;
                }}
              />
            </div>
            {/* Demo Video */}
            {product.videoUrl ? (
              <div className="panel overflow-hidden">
                <div className="aspect-video w-full bg-black">
                  <iframe
                    src={youtubeEmbedUrl}
                    title={`${product.name} Demo`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="h-full w-full"
                  />
                </div>
              </div>
            ) : null}
          </div>

          {/* Right Column - Product Info & Badges */}
          <div className="space-y-4">
            {/* Product Name & Badge */}
            <div className="panel p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="glow-text text-2xl font-bold tracking-[0.15em] text-primary">{product.name}</h1>
                  <p className="text-[11px] text-muted-foreground mt-1">{product.category}</p>
                </div>
                <span className="rounded border border-gold/50 px-3 py-1 text-[10px] text-gold">{product.badge || "NEW"}</span>
              </div>
              {product.description && (
                <p className="mt-3 text-sm text-foreground/80 leading-relaxed">{product.description}</p>
              )}
            </div>

            {/* Quality Badges - 3 boxes horizontal */}
            <div className="grid grid-cols-3 gap-3">
              <div className="panel p-3 text-center border border-primary/30">
                <div className="text-2xl">{pp.badge1.icon}</div>
                <h4 className="text-[10px] font-bold text-primary tracking-[0.1em] mt-1">{pp.badge1.title}</h4>
                <p className="text-[9px] text-muted-foreground">{pp.badge1.desc}</p>
              </div>
              <div className="panel p-3 text-center border border-primary/30">
                <div className="text-2xl">{pp.badge2.icon}</div>
                <h4 className="text-[10px] font-bold text-primary tracking-[0.1em] mt-1">{pp.badge2.title}</h4>
                <p className="text-[9px] text-muted-foreground">{pp.badge2.desc}</p>
              </div>
              <div className="panel p-3 text-center border border-primary/30">
                <div className="text-2xl">{pp.badge3.icon}</div>
                <h4 className="text-[10px] font-bold text-primary tracking-[0.1em] mt-1">{pp.badge3.title}</h4>
                <p className="text-[9px] text-muted-foreground">{pp.badge3.desc}</p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="panel p-3 text-center bg-accent/20">
                <p className="text-[10px] text-muted-foreground">💳 SECURE PAYMENT</p>
              </div>
              <div className="panel p-3 text-center bg-accent/20">
                <p className="text-[10px] text-muted-foreground">⚡ INSTANT ACCESS</p>
              </div>
              <div className="panel p-3 text-center bg-accent/20">
                <p className="text-[10px] text-muted-foreground">🌍 WORLDWIDE</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Plans */}
        <div className="mb-8">
          <h2 className="text-[11px] tracking-[0.2em] text-muted-foreground mb-4">{pp.heading}</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Lifetime */}
            <div 
              className={`panel p-5 border ${selectedPlan === 'lifetime' ? 'border-primary shadow-lg shadow-primary/10' : 'border-border'} transition cursor-pointer hover:border-primary/50`}
              onClick={() => setSelectedPlan('lifetime')}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-primary">LIFETIME PASS</h3>
                {selectedPlan === 'lifetime' && (
                  <span className="text-[10px] text-primary">✓ SELECTED</span>
                )}
              </div>
              <p className="text-3xl font-bold text-foreground">${getPlanPrice('lifetime')}</p>
              <p className="text-[10px] text-muted-foreground">One-time payment</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); handleBuy('lifetime', 'whatsapp'); }}
                  className="rounded bg-[#ff0044] px-2 py-2 text-[10px] font-bold text-white hover:bg-[#cc0033] transition flex items-center justify-center gap-1"
                  disabled={getPlanPrice('lifetime') <= 0}
                >
                  📱 WHATSAPP
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleBuy('lifetime', 'discord'); }}
                  className="rounded bg-[#ff0044] px-2 py-2 text-[10px] font-bold text-white hover:bg-[#cc0033] transition flex items-center justify-center gap-1"
                  disabled={getPlanPrice('lifetime') <= 0}
                >
                  💬 DISCORD
                </button>
              </div>
            </div>

            {/* Monthly */}
            <div 
              className={`panel p-5 border ${selectedPlan === 'monthly' ? 'border-primary shadow-lg shadow-primary/10' : 'border-border'} transition cursor-pointer hover:border-primary/50`}
              onClick={() => setSelectedPlan('monthly')}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-primary">30 DAYS ACCESS</h3>
                {selectedPlan === 'monthly' && (
                  <span className="text-[10px] text-primary">✓ SELECTED</span>
                )}
              </div>
              <p className="text-3xl font-bold text-foreground">${getPlanPrice('monthly')}</p>
              <p className="text-[10px] text-muted-foreground">30 days access</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); handleBuy('monthly', 'whatsapp'); }}
                  className="rounded bg-[#ff0044] px-2 py-2 text-[10px] font-bold text-white hover:bg-[#cc0033] transition flex items-center justify-center gap-1"
                  disabled={getPlanPrice('monthly') <= 0}
                >
                  📱 WHATSAPP
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleBuy('monthly', 'discord'); }}
                  className="rounded bg-[#ff0044] px-2 py-2 text-[10px] font-bold text-white hover:bg-[#cc0033] transition flex items-center justify-center gap-1"
                  disabled={getPlanPrice('monthly') <= 0}
                >
                  💬 DISCORD
                </button>
              </div>
            </div>

            {/* Weekly */}
            <div 
              className={`panel p-5 border ${selectedPlan === 'weekly' ? 'border-primary shadow-lg shadow-primary/10' : 'border-border'} transition cursor-pointer hover:border-primary/50`}
              onClick={() => setSelectedPlan('weekly')}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-primary">7 DAYS ACCESS</h3>
                {selectedPlan === 'weekly' && (
                  <span className="text-[10px] text-primary">✓ SELECTED</span>
                )}
              </div>
              <p className="text-3xl font-bold text-foreground">${getPlanPrice('weekly')}</p>
              <p className="text-[10px] text-muted-foreground">7 days access</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); handleBuy('weekly', 'whatsapp'); }}
                  className="rounded bg-[#ff0044] px-2 py-2 text-[10px] font-bold text-white hover:bg-[#cc0033] transition flex items-center justify-center gap-1"
                  disabled={getPlanPrice('weekly') <= 0}
                >
                  WHATSAPP
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleBuy('weekly', 'discord'); }}
                  className="rounded bg-[#ff0044] px-2 py-2 text-[10px] font-bold text-white hover:bg-[#cc0033] transition flex items-center justify-center gap-1"
                  disabled={getPlanPrice('weekly') <= 0}
                >
                  DISCORD
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Support */}
        <div className="panel p-6 border border-gold/30">
          <p className="text-[11px] tracking-[0.2em] text-gold">NEED HELP?</p>
          <p className="text-sm text-muted-foreground mt-2">{pp.supportText}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href={settings?.discordUrl || "https://discord.com/app"}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded border border-primary/50 px-4 py-2 text-[11px] text-primary hover:bg-accent transition"
            >
              {pp.discordLabel}
            </a>
            <a
              href="https://t.me/"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded border border-primary/50 px-4 py-2 text-[11px] text-primary hover:bg-accent transition"
            >
              {pp.telegramLabel}
            </a>
          </div>
        </div>
      </div>
    </Page>
  );
}