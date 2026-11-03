export type UserRole = 'user' | 'seller' | 'admin';

export type CurrencyCode = 'PHP' | 'USD';

export type ScreenId =
  | 'front'
  | 'auth'
  | 'home'
  | 'product'
  | 'seller'
  | 'compare'
  | 'marketing'
  | 'redflags'
  | 'summary'
  | 'tips'
  | 'saved'
  | 'profile'
  | 'seller-dash'
  | 'admin-dash';

export type ProductSubTab = 'overview' | 'reviews' | 'similar';

export type ReviewFilterType = 'all' | 'visuals' | '5star' | '4star' | '3star' | 'critical';

export interface ProductReviewItem {
  id: string;
  checkId: string;
  maskedUsername: string;
  starRating: number;
  variantPurchased: string;
  comment: string;
  photoLabels: string[];
  hasVisuals: boolean;
  isVerifiedPurchase: boolean;
}

export interface SimilarProductItem {
  id: string;
  title: string;
  salePricePhp: number;
  originalPricePhp: number;
  discountPercentage: number;
  promoBadge: string;
  starRating: number;
  soldCountText: string;
  illustrationType: 'coaster' | 'cat' | 'rabbit' | 'car';
}

export interface PlatformComparisonItem {
  id: string;
  platformName: 'Shopee' | 'Temu' | 'Lazada' | 'TikTok Shop';
  productTitle: string;
  pricePhp: number;
  shippingPerk: string;
  starRating: number;
  isBestPrice: boolean;
}

export interface MarketingTacticItem {
  id: string;
  type: string;
  badgeText: string;
  severity: 'high' | 'medium' | 'info';
  description: string;
}

export interface RedFlagItem {
  id: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
}

export interface SellerChecklistState {
  verifiedSeller: boolean;
  customerRating: boolean;
  productInfoConfirmed: boolean;
  returnPolicy: boolean;
}

export interface ProductCheckRecord {
  id: string;
  sourceUrl: string;
  platformName: 'TikTok Shop' | 'Shopee' | 'Lazada' | 'Temu';
  productTitle: string;
  listedPricePhp: number;
  originalPricePhp?: number;
  soldCountText?: string;
  shippingNote?: string;
  variants?: string[];
  illustrationKey: 'cupmat' | 'earbuds' | 'serum';
  checkedAt: string;
  uploadedImageUrl?: string;
  importedFrom?: string;
  overview: {
    material: string;
    pattern: string;
    quantity: string;
    claims: { label: string; text: string }[];
    contradictionWarning: string;
  };
  seller: {
    storeName: string;
    storeAge: string;
    storeLocation: string;
    responseRate: string;
    fulfillmentRate: string;
    cancellationRate: string;
    certificateId: string;
    rating: number;
    reviewCountText: string;
    checklist: SellerChecklistState;
    unverifiedNote: string;
  };
  reviewSummary: {
    productReviewsCount: number;
    productAverageRating: number;
    storeReviewsCountText: string;
    filterCounts: {
      visuals: string;
      star5: string;
      star4: string;
      star3: string;
      critical: string;
    };
  };
  reviews: ProductReviewItem[];
  similarProducts: SimilarProductItem[];
  comparisons: PlatformComparisonItem[];
  marketing: {
    hypeScoreLabel: string;
    summary: string;
    tactics: MarketingTacticItem[];
  };
  redFlags: {
    riskScore: number;
    riskLabel: string;
    items: RedFlagItem[];
  };
  finalSummary: {
    verdictTitle: string;
    verdictSubtitle: string;
    checkedAndVerified: string[];
    needsVerification: string[];
  };
}

export interface TipGuideItem {
  id: string;
  category: 'Product Check' | 'Seller Check' | 'Review Check' | 'Marketing & Ads';
  title: string;
  summary: string;
  steps: string[];
}

export interface AdminQueueItem {
  id: string;
  productTitle: string;
  platform: string;
  flagReason: string;
  reportsCount: number;
  priceAnomaly: string;
  status: 'pending' | 'flagged' | 'dismissed';
}

export interface PaginatedReviewsResponse {
  items: ProductReviewItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  cacheStatus?: string;
}
