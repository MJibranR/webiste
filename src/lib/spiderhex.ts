export type Role = "admin" | "user";

export interface User {
  id: string;
  email: string;
  fullName: string;
  whatsapp: string;
  password?: string;
  role: Role;
  balance: number;
  totalSpent: number;
  level: number;
  xp: number;
  username: string;
}

/** One row inside the download popup (label + tag + url). */
export interface DownloadFile {
  id: string;
  label: string;
  tag: string;
  url: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  badge: string;
  inStock: boolean;
  downloadLink: string;
  imageUrl?: string;
  files?: DownloadFile[];
}

export interface Purchase {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  price: number;
  purchaseDate: string;
  status: "active" | "expired" | "pending";
  downloadLink: string;
  files?: DownloadFile[];
  isRedeem?: boolean;
  credentials?: string;
}

/** Redeem Code Interface */
/** Redeem Code Interface - Make all optional fields explicitly optional with undefined */
export interface RedeemCode {
  id: string;
  code: string;
  productName: string;
  downloadLink: string;
  credentials: string;
  createdBy: string;
  createdAt: string;
  used: boolean;
  usedBy?: string;
  usedAt?: string;
  expiresAt?: string; // This is optional, so it can be undefined
}

/** All download rows for an order, falling back to the legacy single link. */
export const purchaseFiles = (p: Purchase): DownloadFile[] => {
  if (p.files && p.files.length > 0) return p.files;
  if (p.downloadLink) return [{ id: "legacy", label: "MAIN DOWNLOAD", tag: "OFFICIAL", url: p.downloadLink }];
  return [];
};

export const CATEGORIES = [
  "ALL",
  "PC PANEL",
  "NON ROOT",
  "ROOT",
  "IOS PANEL",
  "OTHERS ITEM",
] as const;

const K_USERS = "sh_users";
const K_PRODUCTS = "sh_products";
const K_PURCHASES = "sh_purchases";
const K_SESSION = "sh_session";
const K_REDEEM_CODES = "sh_redeem_codes";

const isBrowser = () => typeof window !== "undefined";

function read<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event("sh:update"));
  } catch {
    /* storage unavailable */
  }
}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

const ADMIN: User = {
  id: "admin-root",
  email: "admin@spiderhex.com",
  fullName: "Spider Admin",
  whatsapp: "",
  password: "admin123",
  role: "admin",
  balance: 0,
  totalSpent: 0,
  level: 99,
  xp: 9999,
  username: "spiderhex_admin",
};

const SEED_PRODUCTS: Product[] = [
  { id: "p1", name: "SPIDER PC PANEL", price: 25, category: "PC PANEL", badge: "HOT", inStock: true, downloadLink: "" },
  { id: "p2", name: "HEX NON ROOT MOD", price: 15, category: "NON ROOT", badge: "NEW", inStock: true, downloadLink: "" },
  { id: "p3", name: "VENOM ROOT PANEL", price: 30, category: "ROOT", badge: "PRO", inStock: true, downloadLink: "" },
  { id: "p4", name: "IOS SPIDER TOOL", price: 40, category: "IOS PANEL", badge: "ELITE", inStock: true, downloadLink: "" },
  { id: "p5", name: "GIFT KEY BUNDLE", price: 10, category: "OTHERS ITEM", badge: "SALE", inStock: true, downloadLink: "" },
  { id: "p6", name: "WEB HEX PANEL", price: 20, category: "PC PANEL", badge: "TOP", inStock: true, downloadLink: "" },
];

export function ensureSeed() {
  if (!isBrowser()) return;
  const users = read<User[]>(K_USERS, []);
  if (!users.some((u) => u.email === ADMIN.email)) write(K_USERS, [ADMIN, ...users]);
  if (!window.localStorage.getItem(K_PRODUCTS)) write(K_PRODUCTS, SEED_PRODUCTS);
}

export function notify() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('sh:update'));
  }
}

export const getUsers = () => read<User[]>(K_USERS, []);
export const setUsers = (u: User[]) => write(K_USERS, u);
export const getProducts = () => read<Product[]>(K_PRODUCTS, []);
export const setProducts = (p: Product[]) => write(K_PRODUCTS, p);
export const getPurchases = () => read<Purchase[]>(K_PURCHASES, []);
export const setPurchases = (p: Purchase[]) => write(K_PURCHASES, p);
export const getSessionId = () => read<string | null>(K_SESSION, null);
export const setSessionId = (id: string | null) => write(K_SESSION, id);

// -------- REDEEM CODE FUNCTIONS --------
export const getRedeemCodes = (): RedeemCode[] => read<RedeemCode[]>(K_REDEEM_CODES, []);
export const setRedeemCodes = (codes: RedeemCode[]) => write(K_REDEEM_CODES, codes);

export function generateRedeemCode(
  productName: string,
  downloadLink: string,
  credentials: string,
  adminEmail: string,
  expiresIn?: number
): RedeemCode {
  const code = `HEX-${Math.random().toString(36).slice(2, 8).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  
  // Create the object with all required fields
  const redeemCode: RedeemCode = {
    id: uid(),
    code,
    productName,
    downloadLink,
    credentials,
    createdBy: adminEmail,
    createdAt: new Date().toISOString(),
    used: false,
  };
  
  // Only add expiresAt if provided
  if (expiresIn) {
    redeemCode.expiresAt = new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000).toISOString();
  }
  
  const codes = getRedeemCodes();
  codes.push(redeemCode);
  setRedeemCodes(codes);
  return redeemCode;
}

export function redeemCode(code: string, userEmail: string): { 
  success: boolean; 
  message: string; 
  data?: { productName: string; downloadLink: string; credentials: string; files?: DownloadFile[] } 
} {
  const codes = getRedeemCodes();
  const index = codes.findIndex(c => c.code === code && !c.used);
  
  if (index === -1) {
    return { success: false, message: 'INVALID OR ALREADY USED CODE' };
  }
  
  const redeem = codes[index];
  
  // Check if redeem exists
  if (!redeem) {
    return { success: false, message: 'CODE NOT FOUND' };
  }
  
  // Check expiry
  if (redeem.expiresAt && new Date(redeem.expiresAt) < new Date()) {
    return { success: false, message: 'CODE HAS EXPIRED' };
  }
  
  // Mark as used - create a new object with only defined properties
  const updatedCode: RedeemCode = {
    id: redeem.id,
    code: redeem.code,
    productName: redeem.productName,
    downloadLink: redeem.downloadLink,
    credentials: redeem.credentials,
    createdBy: redeem.createdBy,
    createdAt: redeem.createdAt,
    used: true,
    usedBy: userEmail,
    usedAt: new Date().toISOString(),
  };
  
  // Only add expiresAt if it exists
  if (redeem.expiresAt) {
    updatedCode.expiresAt = redeem.expiresAt;
  }
  
  codes[index] = updatedCode;
  setRedeemCodes(codes);
  
  // Create files from the single link
  const files: DownloadFile[] = [
    {
      id: uid(),
      label: redeem.productName,
      tag: 'REDEEMED',
      url: redeem.downloadLink,
    }
  ];
  
  // Add to user's purchases
  const purchases = getPurchases();
  const newPurchase: Purchase = {
    id: uid(),
    userId: userEmail,
    productId: `redeem-${Date.now()}`,
    productName: redeem.productName,
    price: 0,
    purchaseDate: new Date().toISOString(),
    status: 'active',
    downloadLink: redeem.downloadLink,
    credentials: redeem.credentials,
    files: files,
    isRedeem: true,
  };
  purchases.push(newPurchase);
  setPurchases(purchases);
  
  pushNotification(
    userEmail,
    'REDEEM SUCCESSFUL 🎉',
    `You successfully redeemed ${redeem.productName}. Check your downloads!`
  );
  
  logActivity('purchase', userEmail, `Redeemed ${redeem.productName} via code ${code}`);
  
  return {
    success: true,
    message: 'REDEEM SUCCESSFUL',
    data: {
      productName: redeem.productName,
      downloadLink: redeem.downloadLink,
      credentials: redeem.credentials,
      files: files,
    }
  };
}

// ---------------- EDITABLE SITE CONTENT ----------------

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

const K_SETTINGS = "sh_settings";

export const DEFAULT_SETTINGS: SiteSettings = {
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
  buyTemplate:
    "Hello I'm {name} I want to buy {product} panel for pc/ios/android for lifetime for ${price} USD thank you!",
  topUpTemplate:
    "Hello I'm {name} ({email}) I want to top up my {brand} wallet with ${amount} USD thank you!",
};

export const getSettings = (): SiteSettings => ({
  ...DEFAULT_SETTINGS,
  ...read<Partial<SiteSettings>>(K_SETTINGS, {}),
});
export const setSettings = (s: SiteSettings) => write(K_SETTINGS, s);

/** Turns a YouTube watch/share/embed URL or bare ID into an embeddable URL. */
export function youtubeEmbed(url: string): string {
  const raw = url.trim();
  if (!raw) return "";
  const match =
    raw.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{6,})/) ??
    raw.match(/^([\w-]{6,})$/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : raw;
}

const fill = (template: string, vars: Record<string, string>) =>
  template.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? "");

export const waLink = (message: string, number?: string) => {
  const digits = (number ?? getSettings().whatsappNumber).replace(/\D/g, "");
  const base = digits ? `https://wa.me/${digits}` : "https://wa.me/";
  return `${base}?text=${encodeURIComponent(message)}`;
};

export async function discordCopy(message: string) {
  try {
    await navigator.clipboard.writeText(message);
  } catch {
    /* clipboard blocked */
  }
  window.open(getSettings().discordUrl || "https://discord.com/app", "_blank", "noopener");
}

export const buyMessage = (name: string, product: string, price: number) => {
  const s = getSettings();
  return fill(s.buyTemplate, { name, product, price: String(price), brand: s.brandName });
};

export const topUpMessage = (name: string, email: string, amount: number) => {
  const s = getSettings();
  return fill(s.topUpTemplate, { name, email, amount: String(amount), brand: s.brandName });
};

// ---------------- NOTIFICATIONS ----------------

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  date: string;
  readBy: string[];
}

const K_NOTIFICATIONS = "sh_notifications";

export const getNotifications = () => read<AppNotification[]>(K_NOTIFICATIONS, []);
export const setNotifications = (n: AppNotification[]) => write(K_NOTIFICATIONS, n);

export function pushNotification(userId: string, title: string, message: string) {
  const item: AppNotification = {
    id: uid(),
    userId,
    title,
    message,
    date: new Date().toISOString(),
    readBy: [],
  };
  setNotifications([...getNotifications(), item]);
  return item;
}

export const notificationsFor = (userId: string) =>
  getNotifications()
    .filter((n) => n.userId === userId || n.userId === "*")
    .sort((a, b) => b.date.localeCompare(a.date));

export const unreadCount = (userId: string) =>
  notificationsFor(userId).filter((n) => !n.readBy.includes(userId)).length;

export function markAllRead(userId: string) {
  setNotifications(
    getNotifications().map((n) =>
      (n.userId === userId || n.userId === "*") && !n.readBy.includes(userId)
        ? { ...n, readBy: [...n.readBy, userId] }
        : n,
    ),
  );
}

export function deleteNotification(id: string) {
  setNotifications(getNotifications().filter((n) => n.id !== id));
}

// ---------------- ACTIVITY LOG ----------------

export type ActivityType =
  | "login"
  | "logout"
  | "signup"
  | "purchase"
  | "product"
  | "wallet"
  | "download"
  | "user"
  | "notification"
  | "content";

export interface ActivityLog {
  id: string;
  type: ActivityType;
  actor: string;
  message: string;
  date: string;
}

const K_ACTIVITY = "sh_activity";
const MAX_ACTIVITY = 300;

export const getActivity = () =>
  read<ActivityLog[]>(K_ACTIVITY, []).sort((a, b) => b.date.localeCompare(a.date));

export const setActivity = (a: ActivityLog[]) => write(K_ACTIVITY, a);

export function logActivity(type: ActivityType, actor: string, message: string) {
  const item: ActivityLog = { id: uid(), type, actor, message, date: new Date().toISOString() };
  setActivity([item, ...read<ActivityLog[]>(K_ACTIVITY, [])].slice(0, MAX_ACTIVITY));
  return item;
}

export const clearActivity = () => setActivity([]);

/** Notify every member (broadcast) and record it in the activity log. */
export function broadcastNotification(title: string, message: string, actor = "SYSTEM") {
  pushNotification("*", title, message);
  logActivity("notification", actor, `Broadcast: ${title}`);
}