import {
  ADMIN_ACTIVITIES_PRESETS,
  ADMIN_QUEUE_PRESETS,
  ADMIN_USERS_PRESETS,
  SELLER_PRODUCTS_PRESETS,
  SELLER_PROFILE_PRESET,
  SHOWCASE_CHECKS,
  TIPS_AND_GUIDES_PRESETS,
} from '../data/presets.ts';
import {
  AdminOverviewResponse,
  AdminQueueItem,
  AdminReportStatus,
  AdminUserRecord,
  AuthSessionResponse,
  IllustrationKey,
  MarketplaceSearchResponse,
  PaginatedReviewsResponse,
  ProductCheckRecord,
  ReviewFilterType,
  SellerDashboardResponse,
  SellerProductItem,
  SellerShopProfile,
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

export function invalidateClientCache(urlPrefix?: string): void {
  if (!urlPrefix) {
    clientCache.clear();
    return;
  }
  for (const key of clientCache.keys()) {
    if (key.startsWith(urlPrefix)) {
      clientCache.delete(key);
    }
  }
}

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
    const response = await fetch(url, {
      headers,
      credentials: 'include',
    });
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

async function parseAuthResponseOrThrow(response: Response): Promise<AuthSessionResponse> {
  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? ((await response.json()) as { error?: string } & Partial<AuthSessionResponse>)
    : null;

  if (!response.ok) {
    throw new Error(payload?.error || 'Authentication request failed. Please try again.');
  }

  return {
    authenticated: Boolean(payload?.authenticated),
    user: payload?.user ?? null,
    token: payload?.token,
  };
}

export async function fetchCurrentSession(): Promise<AuthSessionResponse> {
  try {
    const response = await fetch('/api/auth/me', {
      headers: { Accept: 'application/json' },
      credentials: 'include',
    });
    if (response.ok) {
      return await parseAuthResponseOrThrow(response);
    }
  } catch {}
  return { authenticated: false, user: null };
}

export async function loginWithPassword(
  email: string,
  password: string
): Promise<AuthSessionResponse> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  return parseAuthResponseOrThrow(response);
}

export async function registerAccount(params: {
  fullName: string;
  email: string;
  password: string;
  role?: 'user' | 'seller';
}): Promise<AuthSessionResponse> {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    credentials: 'include',
    body: JSON.stringify(params),
  });
  return parseAuthResponseOrThrow(response);
}

export interface ConnectShopInput {
  platform: 'Shopee' | 'Lazada' | 'Temu';
  shopName?: string;
  storeUrl?: string;
  email?: string;
  password?: string;
}

export async function connectShopAccount(
  input: 'Shopee' | 'Lazada' | 'Temu' | ConnectShopInput
): Promise<AuthSessionResponse> {
  const payload: ConnectShopInput =
    typeof input === 'string' ? { platform: input } : input;
  const response = await fetch('/api/auth/shop-connect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  invalidateClientCache('/api/seller');
  invalidateClientCache('/api/admin');
  return parseAuthResponseOrThrow(response);
}

export async function logoutAccount(): Promise<AuthSessionResponse> {
  try {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { Accept: 'application/json' },
      credentials: 'include',
    });
    if (response.ok) {
      return await parseAuthResponseOrThrow(response);
    }
  } catch {}
  return { authenticated: false, user: null };
}

export async function patchUserProfileOnServer(updates: {
  fullName?: string;
  email?: string;
  connectedShop?: string;
}): Promise<AuthSessionResponse> {
  const response = await fetch('/api/auth/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    credentials: 'include',
    body: JSON.stringify(updates),
  });
  return parseAuthResponseOrThrow(response);
}

export async function loginWithGoogleToken(
  credential: string,
  role: 'user' | 'seller' = 'user'
): Promise<AuthSessionResponse> {
  const response = await fetch('/api/auth/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ credential, role }),
  });
  return parseAuthResponseOrThrow(response);
}

export async function requestPasswordResetCode(email: string): Promise<{
  sent: boolean;
  message: string;
  expiresInMinutes: number;
  resetCodePreview?: string;
}> {
  const response = await fetch('/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email }),
  });
  const payload = (await response.json()) as {
    error?: string;
    sent?: boolean;
    message?: string;
    expiresInMinutes?: number;
    resetCodePreview?: string;
  };
  if (!response.ok) {
    throw new Error(payload?.error || 'Unable to request a password reset code right now.');
  }
  return {
    sent: Boolean(payload.sent),
    message:
      payload.message ||
      'If an account matches that email, a 6-digit password reset code has been generated.',
    expiresInMinutes: payload.expiresInMinutes ?? 15,
    resetCodePreview: payload.resetCodePreview,
  };
}

export async function resetPasswordWithCode(params: {
  email: string;
  code: string;
  newPassword: string;
}): Promise<AuthSessionResponse> {
  const response = await fetch('/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    credentials: 'include',
    body: JSON.stringify(params),
  });
  return parseAuthResponseOrThrow(response);
}

export async function changeAccountPassword(params: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ updated: boolean; message: string }> {
  const response = await fetch('/api/auth/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    credentials: 'include',
    body: JSON.stringify(params),
  });
  const payload = (await response.json()) as {
    error?: string;
    updated?: boolean;
    message?: string;
  };
  if (!response.ok) {
    throw new Error(payload?.error || 'Unable to change password right now.');
  }
  return {
    updated: Boolean(payload.updated),
    message: payload.message || 'Your password has been updated.',
  };
}

export async function searchMarketplaceListings(
  query: string,
  platform: 'all' | 'Shopee' | 'Lazada' | 'Temu' = 'all'
): Promise<MarketplaceSearchResponse> {
  const params = new URLSearchParams({
    q: query.trim(),
    platform,
  });
  const url = `/api/search?${params.toString()}`;
  const cleanQ = encodeURIComponent(query.trim());

  return cachedFetchJson<MarketplaceSearchResponse>(url, () => ({
    query: query.trim(),
    total: 0,
    items: [],
    storeSearchLinks: [
      { platform: 'Shopee', url: `https://shopee.ph/search?keyword=${cleanQ}` },
      { platform: 'Lazada', url: `https://www.lazada.com.ph/catalog/?q=${cleanQ}` },
      { platform: 'Temu', url: `https://www.temu.com/search_result.html?search_key=${cleanQ}` },
    ],
  }));
}

export async function createCheckFromCatalogId(
  catalogId: string
): Promise<ProductCheckRecord | null> {
  try {
    const response = await fetch('/api/checks/from-catalog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ catalogId }),
    });
    if (response.ok) {
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const record = (await response.json()) as ProductCheckRecord;
        invalidateClientCache('/api/checks');
        return record;
      }
    }
  } catch {}
  return null;
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
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ input: inputUrlOrQuery }),
    });
    if (response.ok) {
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const record = (await response.json()) as ProductCheckRecord;
        invalidateClientCache('/api/checks');
        return record;
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

export async function fetchAdminOverview(): Promise<AdminOverviewResponse> {
  return cachedFetchJson<AdminOverviewResponse>('/api/admin/overview', () => ({
    stats: {
      usersCount: 100,
      sellersCount: 100,
      checkedProductsCount: 100,
    },
    activities: ADMIN_ACTIVITIES_PRESETS,
    users: ADMIN_USERS_PRESETS,
    reports: ADMIN_QUEUE_PRESETS,
  }));
}

export async function patchAdminQueueStatus(
  itemId: string,
  status: AdminReportStatus
): Promise<AdminQueueItem | null> {
  try {
    const response = await fetch(`/api/admin/queue/${encodeURIComponent(itemId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status }),
    });
    if (response.ok) {
      invalidateClientCache('/api/admin/queue');
      return (await response.json()) as AdminQueueItem;
    }
  } catch {}
  return null;
}

export async function patchAdminUserRole(
  userId: string,
  role: 'shopper' | 'seller' | 'admin'
): Promise<AdminUserRecord | null> {
  try {
    const response = await fetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ role }),
    });
    if (response.ok) {
      invalidateClientCache('/api/admin/overview');
      return (await response.json()) as AdminUserRecord;
    }
  } catch {}
  return null;
}

export async function fetchSellerDashboard(): Promise<SellerDashboardResponse> {
  return cachedFetchJson<SellerDashboardResponse>('/api/seller/dashboard', () => ({
    profile: SELLER_PROFILE_PRESET,
    products: SELLER_PRODUCTS_PRESETS,
  }));
}

export async function createAdminQueueItemOnServer(input: {
  productTitle: string;
  subtitle?: string;
  platform: 'Shopee' | 'Lazada' | 'Temu';
  flagReason: string;
  reportCategory?: 'report' | 'complaint';
  priceAnomaly?: string;
  illustrationKey?: IllustrationKey;
  thumbnailUrl?: string;
  sourceUrl?: string;
}): Promise<AdminQueueItem | null> {
  try {
    const response = await fetch('/api/admin/queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      credentials: 'include',
      body: JSON.stringify(input),
    });
    if (response.ok) {
      invalidateClientCache('/api/admin');
      return (await response.json()) as AdminQueueItem;
    }
  } catch {}
  return null;
}

export async function createSellerProductOnServer(input: {
  title: string;
  pricePhp: number;
  platform: 'Shopee' | 'Lazada' | 'Temu';
  status?: 'active' | 'pending';
  illustrationKey?: IllustrationKey;
  specNote?: string;
  thumbnailUrl?: string;
  sourceUrl?: string;
}): Promise<SellerProductItem | null> {
  try {
    const response = await fetch('/api/seller/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      credentials: 'include',
      body: JSON.stringify(input),
    });
    if (response.ok) {
      invalidateClientCache('/api/seller/dashboard');
      return (await response.json()) as SellerProductItem;
    }
  } catch {}
  return null;
}

export async function patchSellerProductOnServer(
  productId: string,
  updates: {
    status?: 'active' | 'pending';
    pricePhp?: number;
    title?: string;
    platform?: 'Shopee' | 'Lazada' | 'Temu';
    specNote?: string;
    sourceUrl?: string;
    illustrationKey?: IllustrationKey;
  }
): Promise<SellerProductItem | null> {
  try {
    const response = await fetch(`/api/seller/products/${encodeURIComponent(productId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      credentials: 'include',
      body: JSON.stringify(updates),
    });
    if (response.ok) {
      invalidateClientCache('/api/seller/dashboard');
      return (await response.json()) as SellerProductItem;
    }
  } catch {}
  return null;
}

export async function deleteSellerProductOnServer(productId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/seller/products/${encodeURIComponent(productId)}`, {
      method: 'DELETE',
      headers: { Accept: 'application/json' },
      credentials: 'include',
    });
    if (response.ok) {
      invalidateClientCache('/api/seller/dashboard');
      return true;
    }
  } catch {}
  return false;
}

export interface SystemHealthTelemetry {
  status: string;
  timestamp: string;
  db: {
    storageMode: string;
    journalMode: string;
    poolSize: number;
    readConnections: number;
    writeConnections: number;
    totalReads: number;
    totalWrites: number;
    seededChecksCount: number;
    indexes: Array<{ name: string; tableName: string }>;
  };
  cache: {
    entries: number;
    maxEntries: number;
    hits: number;
    misses: number;
    hitRatio: number;
  };
}

export async function fetchSystemHealthTelemetry(): Promise<SystemHealthTelemetry | null> {
  try {
    const response = await fetch('/api/health', {
      headers: { Accept: 'application/json' },
      credentials: 'include',
    });
    if (response.ok) {
      return (await response.json()) as SystemHealthTelemetry;
    }
  } catch {}
  return null;
}

export async function patchSellerProfileOnServer(updates: {
  storeName?: string;
  shopDescription?: string;
  phoneNumber?: string;
  platforms?: Array<'Shopee' | 'Lazada' | 'Temu'>;
  storeUrl?: string;
}): Promise<SellerShopProfile | null> {
  try {
    const response = await fetch('/api/seller/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      credentials: 'include',
      body: JSON.stringify(updates),
    });
    if (response.ok) {
      invalidateClientCache('/api/seller/dashboard');
      const json = (await response.json()) as { profile: SellerShopProfile };
      return json.profile;
    }
  } catch {}
  return null;
}

export async function fetchSavedChecksState(): Promise<{
  savedCheckIds: string[];
  savedAt: Record<string, number>;
} | null> {
  try {
    const response = await fetch('/api/saved', {
      headers: { Accept: 'application/json' },
      credentials: 'include',
    });
    if (response.ok) {
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        return (await response.json()) as {
          savedCheckIds: string[];
          savedAt: Record<string, number>;
        };
      }
    }
  } catch {}
  return null;
}

export async function toggleSavedCheckOnServer(checkId: string): Promise<void> {
  try {
    await fetch('/api/saved/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ checkId }),
    });
  } catch {}
}

export async function publishSellerSpecAuditOnServer(params: {
  checkId: string;
  specAttribute: string;
}): Promise<ProductCheckRecord | null> {
  try {
    const response = await fetch('/api/seller/spec-audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      credentials: 'include',
      body: JSON.stringify(params),
    });
    if (response.ok) {
      invalidateClientCache('/api/checks');
      return (await response.json()) as ProductCheckRecord;
    }
  } catch {}
  return null;
}
