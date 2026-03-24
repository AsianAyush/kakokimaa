export interface ServicePackage {
  id: string;
  name: string;
  qty: number;
  qtyLabel: string;
  price: number;
  category: string;
  badge?: 'budget' | 'premium';
}

export const SERVICES: ServicePackage[] = [
  // Views
  { id: 'views-starter', name: 'Starter Views', qty: 10000, qtyLabel: '10,000', price: 20, category: 'Views' },
  { id: 'views-growth', name: 'Growth Views', qty: 50000, qtyLabel: '50,000', price: 50, category: 'Views' },
  { id: 'views-viral', name: 'Viral Views', qty: 100000, qtyLabel: '1,00,000', price: 85, category: 'Views' },
  { id: 'views-mega', name: 'Mega Viral', qty: 500000, qtyLabel: '5,00,000', price: 350, category: 'Views' },

  // Likes
  { id: 'likes-basic', name: 'Basic Likes', qty: 100, qtyLabel: '100', price: 20, category: 'Likes' },
  { id: 'likes-boost', name: 'Boost Likes', qty: 1000, qtyLabel: '1,000', price: 40, category: 'Likes' },
  { id: 'likes-pro', name: 'Pro Likes', qty: 10000, qtyLabel: '10,000', price: 350, category: 'Likes' },

  // Followers Non-Premium
  { id: 'followers-np-starter', name: 'Starter', qty: 100, qtyLabel: '100', price: 30, category: 'Followers — Non Premium', badge: 'budget' },
  { id: 'followers-np-growth', name: 'Growth', qty: 500, qtyLabel: '500', price: 90, category: 'Followers — Non Premium', badge: 'budget' },
  { id: 'followers-np-pro', name: 'Pro', qty: 1000, qtyLabel: '1,000', price: 230, category: 'Followers — Non Premium', badge: 'budget' },

  // Followers Premium
  { id: 'followers-p-starter', name: 'Starter', qty: 100, qtyLabel: '100', price: 80, category: 'Followers — Premium', badge: 'premium' },
  { id: 'followers-p-growth', name: 'Growth', qty: 500, qtyLabel: '500', price: 270, category: 'Followers — Premium', badge: 'premium' },
  { id: 'followers-p-pro', name: 'Pro', qty: 1000, qtyLabel: '1,000', price: 400, category: 'Followers — Premium', badge: 'premium' },
];

export const CATEGORIES = ['Views', 'Likes', 'Followers — Non Premium', 'Followers — Premium'];

export const CATEGORY_ICONS: Record<string, string> = {
  'Views': '👁️',
  'Likes': '❤️',
  'Followers — Non Premium': '👥',
  'Followers — Premium': '👑',
};

export const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  'Views': 'Boost your video views and reach a wider audience.',
  'Likes': 'Increase engagement with high-quality likes.',
  'Followers — Non Premium': 'Mixed accounts (new + old), no guaranteed profile pictures. Best for fast growth on a low budget. Great for people who want numbers without spending much.',
  'Followers — Premium': 'All followers have real-looking profiles — aged accounts, profile pictures, and bios. Much harder to distinguish from organic followers. Best for creators and businesses who care about profile credibility.',
};

export function getPricePerUnit(category: string, qty: number): number {
  const categoryServices = SERVICES.filter(s => s.category === category);
  if (categoryServices.length === 0) return 0;

  // Find the closest tier at or below qty
  const sorted = [...categoryServices].sort((a, b) => a.qty - b.qty);
  let tier = sorted[0];
  for (const s of sorted) {
    if (qty >= s.qty) tier = s;
  }
  return tier.price / tier.qty;
}

export function estimatePrice(category: string, qty: number): number {
  const perUnit = getPricePerUnit(category, qty);
  return Math.ceil(perUnit * qty);
}

export interface CartItem {
  id: string;
  serviceId: string;
  name: string;
  category: string;
  qty: number;
  price: number;
  note?: string;
  isCustom?: boolean;
}
