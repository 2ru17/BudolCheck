import { DEMO_LISTINGS } from '../data/demoListings.ts';
import { PlatformComparisonItem, ProductCheckRecord } from '../types/budol.ts';

export type ListingPlatform = 'Shopee' | 'Lazada' | 'Temu';

export interface NormalizedListing {
  sourceUrl: string;
  platform: ListingPlatform;
  title: string;
  pricePhp: number;
  originalPricePhp?: number;
  soldCountText?: string;
  shippingNote?: string;
  variants?: string[];
  imageUrls: string[];
  description?: string;
  comparisons?: PlatformComparisonItem[];
  rating?: number;
  ratingCount?: number;
  seller?: {
    name: string;
    location?: string;
    rating?: number;
    responseRate?: string;
  };
}

export interface ListingProvider {
  id: string;
  supports: (url: URL) => boolean;
  fetchListing: (url: string) => Promise<NormalizedListing | null>;
}

const PLATFORM_HOSTS: Array<{ match: string; platform: ListingPlatform }> = [
  { match: 'shopee.', platform: 'Shopee' },
  { match: 'lazada.', platform: 'Lazada' },
  { match: 'temu.', platform: 'Temu' },
];

export function platformFromUrl(url: URL): ListingPlatform | null {
  const host = url.hostname.toLowerCase();
  return PLATFORM_HOSTS.find((item) => host.includes(item.match))?.platform ?? null;
}

/**
 * Calls the BudolCheck backend, which is the only place that may hold
 * marketplace credentials or vendor API keys. Returns null until that
 * endpoint exists, so callers fall back to sample data.
 */
const backendProvider: ListingProvider = {
  id: 'backend',
  supports: (url) => platformFromUrl(url) !== null,
  fetchListing: async (url) => {
    try {
      const response = await fetch(`/api/listings?url=${encodeURIComponent(url)}`, {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) return null;
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) return null;
      return (await response.json()) as NormalizedListing;
    } catch {
      return null;
    }
  },
};

export function canonicalListingKey(rawUrl: string): string {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    return rawUrl.trim().toLowerCase();
  }
  const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
  const path = parsed.pathname;
  const shopee = path.match(/i\.(\d+)\.(\d+)/) || path.match(/\/product\/(\d+)\/(\d+)/);
  if (host.includes('shopee.') && shopee) return `shopee:${shopee[1]}.${shopee[2]}`;
  const lazada = path.match(/-i(\d+)(?:-s\d+)?\.html/);
  if (host.includes('lazada.') && lazada) return `lazada:${lazada[1]}`;
  const temu = path.match(/-g-(\d+)/);
  if (host.includes('temu.') && temu) return `temu:${temu[1]}`;
  return `${host}${path.replace(/\/+$/, '')}`.toLowerCase();
}

const demoProvider: ListingProvider = {
  id: 'demo-dataset',
  supports: () => DEMO_LISTINGS.length > 0,
  fetchListing: async (url) => {
    const key = canonicalListingKey(url);
    const match = DEMO_LISTINGS.find(
      (item) =>
        canonicalListingKey(item.sourceUrl) === key ||
        item.aliases?.some((alias) => canonicalListingKey(alias) === key)
    );
    if (!match) return null;
    if (!match.productGroup) return match;

    const siblings = DEMO_LISTINGS.filter(
      (item) => item.productGroup === match.productGroup
    );
    const cheapest = Math.min(...siblings.map((item) => item.pricePhp));
    const comparisons: PlatformComparisonItem[] = siblings.map((item) => ({
      id: `cmp_${canonicalListingKey(item.sourceUrl)}`,
      platformName: item.platform,
      productTitle: item.title,
      pricePhp: item.pricePhp,
      shippingPerk: item.shippingNote ?? 'Check shipping at checkout',
      starRating: item.rating ?? 0,
      isBestPrice: item.pricePhp === cheapest,
    }));
    return { ...match, comparisons };
  },
};

const providers: ListingProvider[] = [demoProvider, backendProvider];

export async function resolveListing(rawUrl: string): Promise<NormalizedListing | null> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    return null;
  }
  for (const provider of providers) {
    if (!provider.supports(parsed)) continue;
    const listing = await provider.fetchListing(parsed.toString());
    if (listing) return listing;
  }
  return null;
}

/**
 * Overlays real listing fields onto a template record. Check results
 * (seller verdicts, red flags, marketing tactics) still come from the
 * analysis service; only the listing facts are replaced here.
 */
export function applyListingToCheck(
  base: ProductCheckRecord,
  listing: NormalizedListing
): ProductCheckRecord {
  return {
    ...base,
    sourceUrl: listing.sourceUrl,
    platformName: listing.platform,
    productTitle: listing.title,
    listedPricePhp: listing.pricePhp,
    originalPricePhp: listing.originalPricePhp,
    soldCountText: listing.soldCountText ?? base.soldCountText,
    shippingNote: listing.shippingNote ?? base.shippingNote,
    variants: listing.variants ?? base.variants,
    comparisons: listing.comparisons ?? base.comparisons,
    seller: listing.seller
      ? {
          ...base.seller,
          storeName: listing.seller.name,
          storeLocation: listing.seller.location ?? base.seller.storeLocation,
          rating: listing.seller.rating ?? base.seller.rating,
          responseRate: listing.seller.responseRate ?? base.seller.responseRate,
        }
      : base.seller,
  };
}
