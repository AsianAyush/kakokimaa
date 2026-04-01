export interface ServicePackage {
  id: string;
  name: string;
  qty: number;
  qtyLabel: string;
  price: number;
  category: string;
  badge?: 'budget' | 'premium';
  min: number;
  max: number;
}

export const SERVICES: ServicePackage[] = [
  // Views (Reels only)
  { id: 'views-starter', name: 'Starter Views', qty: 10000, qtyLabel: '10,000', price: 20, category: 'Views', min: 10000, max: 1000000 },
  { id: 'views-growth', name: 'Growth Views', qty: 50000, qtyLabel: '50,000', price: 50, category: 'Views', min: 10000, max: 1000000 },
  { id: 'views-viral', name: 'Viral Views', qty: 100000, qtyLabel: '1,00,000', price: 85, category: 'Views', min: 10000, max: 1000000 },
  { id: 'views-mega', name: 'Mega Viral', qty: 500000, qtyLabel: '5,00,000', price: 350, category: 'Views', min: 10000, max: 1000000 },

  // Likes
  { id: 'likes-basic', name: 'Basic Likes', qty: 100, qtyLabel: '100', price: 20, category: 'Likes', min: 100, max: 50000 },
  { id: 'likes-boost', name: 'Boost Likes', qty: 1000, qtyLabel: '1,000', price: 40, category: 'Likes', min: 100, max: 50000 },
  { id: 'likes-pro', name: 'Pro Likes', qty: 10000, qtyLabel: '10,000', price: 350, category: 'Likes', min: 100, max: 50000 },

  // Followers Non-Premium
  { id: 'followers-np-starter', name: 'Starter', qty: 100, qtyLabel: '100', price: 30, category: 'Followers — Non Premium', badge: 'budget', min: 100, max: 100000 },
  { id: 'followers-np-growth', name: 'Growth', qty: 500, qtyLabel: '500', price: 90, category: 'Followers — Non Premium', badge: 'budget', min: 100, max: 100000 },
  { id: 'followers-np-pro', name: 'Pro', qty: 1000, qtyLabel: '1,000', price: 230, category: 'Followers — Non Premium', badge: 'budget', min: 100, max: 100000 },

  // Followers Premium
  { id: 'followers-p-starter', name: 'Starter', qty: 100, qtyLabel: '100', price: 80, category: 'Followers — Premium', badge: 'premium', min: 100, max: 100000 },
  { id: 'followers-p-growth', name: 'Growth', qty: 500, qtyLabel: '500', price: 270, category: 'Followers — Premium', badge: 'premium', min: 100, max: 100000 },
  { id: 'followers-p-pro', name: 'Pro', qty: 1000, qtyLabel: '1,000', price: 400, category: 'Followers — Premium', badge: 'premium', min: 100, max: 100000 },

  // Shares
  { id: 'shares-starter', name: 'Starter Shares', qty: 100, qtyLabel: '100', price: 20, category: 'Shares', min: 100, max: 20000 },
  { id: 'shares-growth', name: 'Growth Shares', qty: 500, qtyLabel: '500', price: 50, category: 'Shares', min: 100, max: 20000 },
  { id: 'shares-pro', name: 'Pro Shares', qty: 1000, qtyLabel: '1,000', price: 100, category: 'Shares', min: 100, max: 20000 },

  // Reposts
  { id: 'reposts-starter', name: 'Starter Reposts', qty: 100, qtyLabel: '100', price: 25, category: 'Reposts', min: 100, max: 20000 },
  { id: 'reposts-growth', name: 'Growth Reposts', qty: 500, qtyLabel: '500', price: 79, category: 'Reposts', min: 100, max: 20000 },
  { id: 'reposts-pro', name: 'Pro Reposts', qty: 1000, qtyLabel: '1,000', price: 199, category: 'Reposts', min: 100, max: 20000 },

  // Saves
  { id: 'saves-starter', name: 'Starter Saves', qty: 100, qtyLabel: '100', price: 25, category: 'Saves', min: 100, max: 20000 },
  { id: 'saves-growth', name: 'Growth Saves', qty: 500, qtyLabel: '500', price: 79, category: 'Saves', min: 100, max: 20000 },
  { id: 'saves-pro', name: 'Pro Saves', qty: 1000, qtyLabel: '1,000', price: 199, category: 'Saves', min: 100, max: 20000 },

  // Custom Comments
  { id: 'comments-min', name: 'Minimum', qty: 20, qtyLabel: '20', price: 19, category: 'Custom Comments', min: 20, max: 10000 },
  { id: 'comments-starter', name: 'Starter Comments', qty: 100, qtyLabel: '100', price: 40, category: 'Custom Comments', min: 20, max: 10000 },
  { id: 'comments-growth', name: 'Growth Comments', qty: 500, qtyLabel: '500', price: 149, category: 'Custom Comments', min: 20, max: 10000 },
  { id: 'comments-pro', name: 'Pro Comments', qty: 1000, qtyLabel: '1,000', price: 249, category: 'Custom Comments', min: 20, max: 10000 },
];

export const CATEGORIES = [
  'Views',
  'Likes',
  'Followers — Non Premium',
  'Followers — Premium',
  'Shares',
  'Reposts',
  'Saves',
  'Custom Comments',
];

export const CATEGORY_ICONS: Record<string, string> = {
  'Views': '👁️',
  'Likes': '❤️',
  'Followers — Non Premium': '👥',
  'Followers — Premium': '👑',
  'Shares': '📤',
  'Reposts': '🔁',
  'Saves': '🔖',
  'Custom Comments': '💬',
};

export const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  'Views': 'Boost your Reel views and reach a wider audience.',
  'Likes': 'Increase engagement with high-quality likes.',
  'Followers — Non Premium': 'Mixed accounts (new + old), no guaranteed profile pictures. Best for fast growth on a low budget.',
  'Followers — Premium': 'All followers have real-looking profiles — aged accounts, profile pictures, and bios. Best for creators and businesses.',
  'Shares': 'Amplify your reach by boosting shares on your Reels and Posts.',
  'Reposts': 'Get your Reels and Posts reposted for viral growth.',
  'Saves': 'Boost your saves — signals Instagram to push your content further.',
  'Custom Comments': 'Add custom comments to your Reels and Posts. You provide the exact comments you want.',
};

/** Min/max limits per category */
export const CATEGORY_LIMITS: Record<string, { min: number; max: number }> = {
  'Views': { min: 10000, max: 1000000 },
  'Likes': { min: 100, max: 50000 },
  'Followers — Non Premium': { min: 100, max: 100000 },
  'Followers — Premium': { min: 100, max: 100000 },
  'Shares': { min: 100, max: 20000 },
  'Reposts': { min: 100, max: 20000 },
  'Saves': { min: 100, max: 20000 },
  'Custom Comments': { min: 20, max: 10000 },
};

/** Categories requiring a post/reel link */
export const LINK_REQUIRED_CATEGORIES = new Set([
  'Views', 'Likes', 'Shares', 'Reposts', 'Saves', 'Custom Comments',
]);

export function getPricePerUnit(category: string, qty: number): number {
  const categoryServices = SERVICES.filter(s => s.category === category);
  if (categoryServices.length === 0) return 0;
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
  targetLink?: string;
  commentsText?: string;
}
