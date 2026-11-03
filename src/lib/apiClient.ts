import {
  ADMIN_QUEUE_PRESETS,
  SHOWCASE_CHECKS,
  TIPS_AND_GUIDES_PRESETS,
} from '../data/presets.ts';
import {
  AdminQueueItem,
  PaginatedReviewsResponse,
  ProductCheckRecord,
  ReviewFilterType,
  TipGuideItem,
} from '../types/budol.ts';
import { applyListingToCheck, resolveListing } from './listingProvider.ts';

interface ClientCacheEntry<T> {
  data: T;
  expiresAt: number;
  etag?: string;
}

const clientCache = new Map<string, ClientCacheEntry<unknown>>();
const DEFAULT_TTL_MS = 60_000;

async function cachedFetchJson<T>(url: string, fallback: () => T): Promise<T> {
  const now = Date.now();
  const cached = clientCache.get(url) as ClientCacheEntry<T> | undefined;
  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  try {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (cached?.etag) {
      headers['If-None-Match'] = cached.etag;
    }
    const response = await fetch(url, { headers });
    if (response.status === 304 && cached) {
      cached.expiresAt = now + DEFAULT_TTL_MS;
      return cached.data;
    }
    if (response.ok) {
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = (await response.json()) as T;
        clientCache.set(url, {
          data: json,
          expiresAt: now + DEFAULT_TTL_MS,
          etag: response.headers.get('etag') || undefined,
        });
        return json;
      }
    }
  } catch {}

  const localData = fallback();
  clientCache.set(url, {
    data: localData,
    expiresAt: now + DEFAULT_TTL_MS,
  });
  return localData;
}

export async function fetchAllChecks(): Promise<ProductCheckRecord[]> {
  return cachedFetchJson<ProductCheckRecord[]>('/api/checks', () => SHOWCASE_CHECKS);
}

export async function fetchCheckById(id: string): Promise<ProductCheckRecord> {
  return cachedFetchJson<ProductCheckRecord>(`/api/checks/${encodeURIComponent(id)}`, () => {
    return SHOWCASE_CHECKS.find((item) => item.id === id) || SHOWCASE_CHECKS[0];
  });
}

export async function fetchPaginatedReviews(
  checkId: string,
  filter: ReviewFilterType,
  page: number,
  limit = 2
): Promise<PaginatedReviewsResponse> {
  const query = new URLSearchParams({
    filter,
    page: String(page),
    limit: String(limit),
  });
  const url = `/api/checks/${encodeURIComponent(checkId)}/reviews?${query.toString()}`;

  return cachedFetchJson<PaginatedReviewsResponse>(url, () => {
    const check =
      SHOWCASE_CHECKS.find((item) => item.id === checkId) || SHOWCASE_CHECKS[0];
    const filtered = check.reviews.filter((rev) => {
      if (filter === 'all') return true;
      if (filter === 'visuals') return rev.hasVisuals;
      if (filter === '5star') return rev.starRating === 5;
      if (filter === '4star') return rev.starRating === 4;
      if (filter === '3star') return rev.starRating === 3;
      if (filter === 'critical') return rev.starRating <= 2;
      return true;
    });

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const start = (safePage - 1) * limit;
    const items = filtered.slice(start, start + limit);

    return {
      items,
      total,
      page: safePage,
      limit,
      totalPages,
      cacheStatus: 'CLIENT-PRESET',
    };
  });
}

export async function analyzeProductInput(inputUrlOrQuery: string): Promise<ProductCheckRecord> {
  const normalized = inputUrlOrQuery.trim().toLowerCase();

  try {
    const response = await fetch('/api/checks/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: inputUrlOrQuery }),
    });
    if (response.ok) {
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        return (await response.json()) as ProductCheckRecord;
      }
    }
  } catch {}

  const template = pickTemplate(normalized);
  if (/^https?:\/\//i.test(normalized)) {
    const listing = await resolveListing(inputUrlOrQuery);
    if (listing) return applyListingToCheck(template, listing);
  }
  return template;
}

function pickTemplate(normalized: string): ProductCheckRecord {
  if (
    normalized.includes('earbud') ||
    normalized.includes('pod') ||
    normalized.includes('anc') ||
    normalized.includes('99812312')
  ) {
    return SHOWCASE_CHECKS[1];
  }
  if (
    normalized.includes('serum') ||
    normalized.includes('vitamin') ||
    normalized.includes('lazada')
  ) {
    return SHOWCASE_CHECKS[2];
  }
  return SHOWCASE_CHECKS[0];
}

export async function fetchTipsAndGuides(): Promise<TipGuideItem[]> {
  return cachedFetchJson<TipGuideItem[]>('/api/tips', () => TIPS_AND_GUIDES_PRESETS);
}

export async function fetchAdminQueue(): Promise<AdminQueueItem[]> {
  return cachedFetchJson<AdminQueueItem[]>('/api/admin/queue', () => ADMIN_QUEUE_PRESETS);
}
