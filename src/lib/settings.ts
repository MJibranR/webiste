import { supabase } from "@/integrations/supabase/client";

export interface VideoItem {
  id: string;
  title: string;
  url: string;
}

export interface SiteSettings {
  brandName: string;
  logoEmoji: string;
  logoImageUrl: string;
  whatsappNumber: string;
  discordUrl: string;
  footerText: string;
  footerStatus: string;
  heroBadge: string;
  heroTitle: string;
  heroSubtitle: string;
  heroPrimaryCta: string;
  heroSecondaryCta: string;
  heroImages: string[];
  stats: { value: string; label: string }[];
  featuresHeading: string;
  features: { title: string; text: string }[];
  secureHeading: string;
  secureText: string;
  videosHeading: string;
  videosSub: string;
  videos: VideoItem[];
  storeHeading: string;
  storeSub: string;
  buyTemplate: string;
  topUpTemplate: string;
}

const DEFAULT_SETTINGS: SiteSettings = {
  brandName: "SPIDER HEX",
  logoEmoji: "🕷️",
  logoImageUrl: "",
  whatsappNumber: "",
  discordUrl: "https://discord.com/app",
  footerText: "SPIDER HEX // PREMIUM GAMING PANELS",
  footerStatus: "ALL SYSTEMS OPERATIONAL",
  heroBadge: "// SYSTEM ONLINE",
  heroTitle: "SPIDER HEX",
  heroSubtitle: "PREMIUM GAMING PANEL STORE • PC / ROOT / NON-ROOT / IOS • LIFETIME ACCESS",
  heroPrimaryCta: "ENTER STORE",
  heroSecondaryCta: "CREATE ACCOUNT",
  heroImages: [],
  stats: [
    { value: "80K+", label: "ACTIVE PLAYERS" },
    { value: "50K+", label: "GIFT KEYS" },
    { value: "99.9%", label: "UPTIME" },
  ],
  featuresHeading: "WHY SPIDER HEX",
  features: [
    { title: "LIGHTNING FAST", text: "Instant delivery the moment your order is verified." },
    { title: "ULTRA SECURE", text: "Encrypted keys, protected sessions, zero leaks." },
    { title: "PREMIUM QUALITY", text: "Hand-tested panels updated with every patch." },
    { title: "NEXT LEVEL", text: "Elite tooling built for serious competitors." },
  ],
  secureHeading: "SECURE ACCESS",
  secureText: "Authenticate to view your licenses, wallet and downloads.",
  videosHeading: "LATEST VIDEOS",
  videosSub: "// STRAIGHT FROM THE CHANNEL",
  videos: [],
  storeHeading: "STORE",
  storeSub: "// SELECT YOUR WEAPON",
  buyTemplate: "Hello I'm {name} I want to buy {product} for ${price} USD thank you! Send me account details for payment.",
  topUpTemplate: "Hello I'm {name} ({email}) I want to top up my {brand} wallet with ${amount} USD thank you!",
};

export async function getSettings(): Promise<SiteSettings> {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .eq('id', 'main')
      .single();

    if (error) {
      console.error('Error fetching settings:', error);
      return DEFAULT_SETTINGS;
    }

    if (!data) {
      return DEFAULT_SETTINGS;
    }

    // Map database column names to frontend property names
    return {
      brandName: data.brand_name || DEFAULT_SETTINGS.brandName,
      logoEmoji: data.logo_emoji || DEFAULT_SETTINGS.logoEmoji,
      logoImageUrl: data.logo_image_url || DEFAULT_SETTINGS.logoImageUrl,
      whatsappNumber: data.whatsapp_number || DEFAULT_SETTINGS.whatsappNumber,
      discordUrl: data.discord_url || DEFAULT_SETTINGS.discordUrl,
      footerText: data.footer_text || DEFAULT_SETTINGS.footerText,
      footerStatus: data.footer_status || DEFAULT_SETTINGS.footerStatus,
      heroBadge: data.hero_badge || DEFAULT_SETTINGS.heroBadge,
      heroTitle: data.hero_title || DEFAULT_SETTINGS.heroTitle,
      heroSubtitle: data.hero_subtitle || DEFAULT_SETTINGS.heroSubtitle,
      heroPrimaryCta: data.hero_primary_cta || DEFAULT_SETTINGS.heroPrimaryCta,
      heroSecondaryCta: data.hero_secondary_cta || DEFAULT_SETTINGS.heroSecondaryCta,
      heroImages: data.hero_images || DEFAULT_SETTINGS.heroImages,
      stats: data.stats || DEFAULT_SETTINGS.stats,
      featuresHeading: data.features_heading || DEFAULT_SETTINGS.featuresHeading,
      features: data.features || DEFAULT_SETTINGS.features,
      secureHeading: data.secure_heading || DEFAULT_SETTINGS.secureHeading,
      secureText: data.secure_text || DEFAULT_SETTINGS.secureText,
      videosHeading: data.videos_heading || DEFAULT_SETTINGS.videosHeading,
      videosSub: data.videos_sub || DEFAULT_SETTINGS.videosSub,
      videos: data.videos || DEFAULT_SETTINGS.videos,
      storeHeading: data.store_heading || DEFAULT_SETTINGS.storeHeading,
      storeSub: data.store_sub || DEFAULT_SETTINGS.storeSub,
      buyTemplate: data.buy_template || DEFAULT_SETTINGS.buyTemplate,
      topUpTemplate: data.top_up_template || DEFAULT_SETTINGS.topUpTemplate,
    };
  } catch (error) {
    console.error('Error loading settings:', error);
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: SiteSettings): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('site_settings')
      .update({
        brand_name: settings.brandName,
        logo_emoji: settings.logoEmoji,
        logo_image_url: settings.logoImageUrl,
        whatsapp_number: settings.whatsappNumber,
        discord_url: settings.discordUrl,
        footer_text: settings.footerText,
        footer_status: settings.footerStatus,
        hero_badge: settings.heroBadge,
        hero_title: settings.heroTitle,
        hero_subtitle: settings.heroSubtitle,
        hero_primary_cta: settings.heroPrimaryCta,
        hero_secondary_cta: settings.heroSecondaryCta,
        hero_images: settings.heroImages,
        stats: settings.stats,
        features_heading: settings.featuresHeading,
        features: settings.features,
        secure_heading: settings.secureHeading,
        secure_text: settings.secureText,
        videos_heading: settings.videosHeading,
        videos_sub: settings.videosSub,
        videos: settings.videos,
        store_heading: settings.storeHeading,
        store_sub: settings.storeSub,
        buy_template: settings.buyTemplate,
        top_up_template: settings.topUpTemplate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 'main');

    if (error) {
      console.error('Error saving settings:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error saving settings:', error);
    return false;
  }
}