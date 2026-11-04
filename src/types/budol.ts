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
  | 'admin-dash'
  | 'privacy'
  | 'terms';

export type ProductSubTab = 'overview' | 'reviews' | 'similar';

export type ReviewFilterType = 'all' | 'visuals' | '5star' | '4star' | '3star' | 'critical';

export type IllustrationKey =
  | 'cupmat'
  | 'earbuds'
  | 'serum'
  | 'coaster'
  | 'cat'
  | 'rabbit'
  | 'car'
  | 'phonecase'
  | 'shoes'
  | 'bag'
  | 'dress'
  | 'watch'
  | 'umbrella'
  | 'mouse'
  | 'massager';

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
  illustrationType: IllustrationKey;
  thumbnailUrl?: string;
  sourceUrl?: string;
}

export interface PlatformComparisonItem {
  id: string;
  platformName: 'Shopee' | 'Temu' | 'Lazada';
  productTitle: string;
  pricePhp: number;
  shippingPerk: string;
  starRating: number;
  isBestPrice: boolean;
  sourceUrl?: string;
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
  platformName: 'Shopee' | 'Lazada' | 'Temu';
  productTitle: string;
  listedPricePhp: number;
  originalPricePhp?: number;
  isPriceEstimated?: boolean;
  soldCountText?: string;
  shippingNote?: string;
  variants?: string[];
  illustrationKey: IllustrationKey;
  imageUrls?: string[];
  checkedAt: string;
  uploadedImageUrl?: string;
  importedFrom?: string;
  categoryLabel?: string;
  aboutText?: string;
  highlights?: string[];
  overview: {
    material: string;
    pattern: string;
    quantity: string;
    isPriceEstimated?: boolean;
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

export type AdminReportStatus =
  | 'pending'
  | 'under_review'
  | 'investigating'
  | 'resolved'
  | 'flagged'
  | 'dismissed';

export interface AdminQueueItem {
  id: string;
  productTitle: string;
  subtitle?: string;
  reportedDate?: string;
  reportCategory?: 'report' | 'complaint';
  thumbnailUrl?: string;
  illustrationKey?: IllustrationKey;
  sourceUrl?: string;
  platform: string;
  flagReason: string;
  reportsCount: number;
  priceAnomaly: string;
  status: AdminReportStatus;
}

export interface AdminUserRecord {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  connectedShop: string;
  avatarColor: string;
  createdAt: string;
}

export interface AdminActivityItem {
  id: string;
  type: 'verification' | 'report' | 'verified';
  title: string;
  detail: string;
  timestamp: string;
}

export interface AdminOverviewResponse {
  stats: {
    usersCount: number;
    sellersCount: number;
    checkedProductsCount: number;
  };
  activities: AdminActivityItem[];
  users: AdminUserRecord[];
  reports: AdminQueueItem[];
}

export interface SellerProductItem {
  id: string;
  title: string;
  pricePhp: number;
  status: 'active' | 'pending';
  platform: 'Shopee' | 'Lazada' | 'Temu';
  sourceUrl?: string;
  imageUrl: string;
  illustrationKey: IllustrationKey;
  specNote?: string;
  updatedAt: string;
}

export interface SellerShopProfile {
  id: string;
  ownerName: string;
  shopName: string;
  storeUrl?: string;
  shopDescription: string;
  phoneNumber: string;
  platforms: Array<'Shopee' | 'Lazada' | 'Temu'>;
  verificationStatus: 'Verified!' | 'Pending Review';
  certificateId: string;
  storeLocation: string;
  sellerRating: number;
  reviewCount: number;
  transparencyScore: number;
}

export interface SellerDashboardResponse {
  profile: SellerShopProfile;
  products: SellerProductItem[];
}

export interface PaginatedReviewsResponse {
  items: ProductReviewItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  cacheStatus?: string;
}

export interface PaginatedHistoryResponse {
  items: ProductCheckRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  cacheStatus?: string;
}

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  connectedShop: string;
  preferredCurrency: CurrencyCode;
}

export interface AuthSessionResponse {
  authenticated: boolean;
  user: AuthUser | null;
  token?: string;
}

export interface MarketplaceSearchItem {
  id: string;
  canonicalKey?: string;
  productGroup: string;
  platformName: 'Shopee' | 'Lazada' | 'Temu';
  productTitle: string;
  brandName: string;
  sellerName: string;
  sellerLocation: string;
  isMallVerified: boolean;
  pricePhp: number;
  originalPricePhp?: number;
  starRating: number;
  reviewCount: number;
  soldCountText: string;
  imageUrl?: string;
  imageUrls?: string[];
  sourceUrl: string;
  illustrationKey: IllustrationKey;
  categoryLabel: string;
  variants: string[];
  shippingNote: string;
}

export interface MarketplaceSearchResponse {
  query: string;
  total: number;
  items: MarketplaceSearchItem[];
  storeSearchLinks: Array<{
    platform: 'Shopee' | 'Lazada' | 'Temu';
    url: string;
  }>;
}

