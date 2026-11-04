

const NOISE_SEARCH_WORDS = new Set([
  'complink',
  'villman',
  'lazmall',
  'shopee',
  'lazada',
  'temu',
  'mall',
  'official',
  'store',
  'flagship',
  'authorized',
  'philippines',
  'ph',
  'notebookcheck',
  'jam',
  'online',
  'yugatech',
  'unbox',
  'specs',
  'price',
  'availability',
  'external',
  'reviews',
  'review',
  'preorder',
  'pre-order',
  'ends',
  'soon',
  'resmi',
  'dirilis',
  'pengganti',
  'jual',
  'harga',
  'murah',
  'terbaru',
  'promo',
  'original',
  'authentic',
  'legit',
  'cod',
  'free',
  'shipping',
  'sale',
  'discount',
  'slim',
  'fhd',
  'wuxga',
  'qhd',
  'wqhd',
  'uhd',
  'ips',
  'oled',
  'amoled',
  'lcd',
  'tft',
  'ram',
  'ssd',
  'nvme',
  'pcie',
  'ddr4',
  'ddr5',
  'lpddr5',
  'lpddr5x',
  'gddr6',
  'windows',
  'win11',
  'inch',
  'warranty',
  '1year',
  '2year',
  'global',
  'version',
  'edition',
  'series',
  'bundle',
  'with',
  'and',
  'for',
]);

const SYNTHETIC_DEAD_URL_PATTERNS = [
  'i294810293',
  '99812312/28491023',
  'i1928374',
  '28491022.918273645',
  'i40291847',
  '134073139.43504768637',
];

export function isDirectMarketplaceProductUrl(rawUrl: string | undefined | null): boolean {
  if (!rawUrl || !rawUrl.trim()) return false;
  const trimmed = rawUrl.trim();
  for (const deadPattern of SYNTHETIC_DEAD_URL_PATTERNS) {
    if (trimmed.includes(deadPattern)) return false;
  }
  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname;

    if (host.endsWith('lazada.com.ph')) {
      return /\/products\/[^/?#]+-i\d+(?:-s\d+)?\.html/i.test(path);
    }
    if (host.endsWith('shopee.ph')) {
      return (
        /-i\.\d+\.\d+/i.test(path) ||
        /\/product\/\d+\/\d+/i.test(path) ||
        /^\/[^/?#]+\/\d{6,}\/\d{6,}/i.test(path)
      );
    }
    if (host.includes('temu.')) {
      return /-g-\d+\.html/i.test(path);
    }
    return false;
  } catch {
    return false;
  }
}

export function inferPlatformFromUrlOrBadge(
  sourceUrl?: string | null,
  promoBadge?: string | null,
  fallbackPlatform: 'Shopee' | 'Lazada' | 'Temu' = 'Shopee',
): 'Shopee' | 'Lazada' | 'Temu' {
  const urlLower = (sourceUrl || '').toLowerCase();
  if (urlLower.includes('lazada.')) return 'Lazada';
  if (urlLower.includes('temu.')) return 'Temu';
  if (urlLower.includes('shopee.') || urlLower.includes('shp.ee')) return 'Shopee';

  const badgeLower = (promoBadge || '').toLowerCase();
  if (badgeLower.includes('lazada') || badgeLower.includes('lazmall')) return 'Lazada';
  if (badgeLower.includes('temu')) return 'Temu';
  if (badgeLower.includes('shopee')) return 'Shopee';

  return fallbackPlatform;
}

export function normalizeMarketplaceSearchKeyword(rawTitle: string): string {
  if (!rawTitle || !rawTitle.trim()) return '';

  let cleaned = rawTitle
    .replace(/【[^】]*】/g, ' ')
    .replace(/[^\x20-\x7E]+/g, ' ')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/\.{2,}/g, ' ');

  const parts = cleaned.split(/\s+(?:\||-)\s+/);
  if (parts.length > 1) {
    cleaned = parts
      .filter((segment, idx) => {
        if (idx === 0) return true;
        const lower = segment.toLowerCase();
        return !/(shopee|lazada|temu|lazmall|villman|complink|notebookcheck|jam online|yugatech|unbox|specs|price|availability|review|official|store|philippines)/i.test(
          lower,
        );
      })
      .join(' ');
  }

  // Strip only the long factory sub-SKU suffix after a hyphen while preserving the main model family prefix (e.g., FA608UHI-TU143WSM -> FA608)
  cleaned = cleaned
    .replace(/\b((?:FA|FX|GA|GU|GV|AN|ANV|PHN|LOQ)\d{2,3})[A-Z0-9]*-[A-Z0-9]+\b/gi, '$1')
    .replace(/\b\d{2}(?:IRX|IAX|AHP|ARP|APH|IRH|IAH)\d+[A-Z0-9-]*\b/gi, ' ')
    .replace(/\b([A-Z]{2,3}\d{3,4}[A-Z0-9]{1,3})-[A-Z0-9]{4,}\b/gi, '$1')
    .replace(/\b(i[3579])-\d{4,5}[A-Z0-9]*\b/gi, '$1')
    .replace(/\b(Ryzen\s+[3579])\s+\d{3,4}[A-Z0-9]*\b/gi, '$1')
    .replace(/\b\d{1,2}(?:\.\d)?\s*(?:"|''|in\b|-inch|\s+inch)/gi, ' ')
    .replace(/\b(?:13\.3|14\.0|15\.6|16\.0|17\.3|23\.8|24\.5|27\.0)\b/g, ' ')
    .replace(/\b\d{2,3}Hz\b/gi, ' ')
    .replace(/\b\d{1,3}\s*(?:GB|TB)\b/gi, ' ')
    .replace(/\b\d{2,3}W\b/gi, ' ')
    .replace(/\b\d+(?:\.\d+)?\s*(?:ms|GTG|sRGB|ATM|IP\d{2})\b/gi, ' ')
    .replace(/["',:;!?|/\\+]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const rawTokens = cleaned.split(' ').filter(Boolean);
  const kept: string[] = [];
  const seen = new Set<string>();

  for (const token of rawTokens) {
    const cleanToken = token.replace(/^-+|-+$/g, '');
    if (!cleanToken) continue;
    const lower = cleanToken.toLowerCase();
    if (NOISE_SEARCH_WORDS.has(lower)) continue;
    if (seen.has(lower)) continue;
    seen.add(lower);
    kept.push(cleanToken);
    if (kept.length >= 6) break;
  }

  if (kept.length === 0) {
    return rawTitle
      .replace(/[^\x20-\x7E]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .slice(0, 5)
      .join(' ');
  }

  return kept.join(' ');
}

const UNVERIFIED_SELLER_PLACEHOLDER_REGEX =
  /\b(verified\s+seller|unverified|open\s+listing\s+to\s+verify|marketplace\s+seller|seller\s+on\s+(?:shopee|lazada|temu)|ph\s+listing)\b/i;

export function normalizeStoreSearchName(rawStoreName: string): string {
  if (!rawStoreName || !rawStoreName.trim()) return '';
  if (UNVERIFIED_SELLER_PLACEHOLDER_REGEX.test(rawStoreName)) return '';
  return rawStoreName
    .replace(/\([^)]*\)/g, ' ')
    .replace(
      /\b(Shopee\s*Mall|LazMall|Official\s*Store|Flagship\s*Store|Authorized\s*Store|Preferred\s*Store|Direct\s*Store|Seller\s*on\s*\w+|Open\s*Listing\s*to\s*Verify|Philippines|PH|Global|Direct|Hub)\b/gi,
      ' '
    )
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildShopSearchUrl(platform: string, title: string): string {
  const normalized = normalizeMarketplaceSearchKeyword(title) || title.trim();
  const q = encodeURIComponent(normalized);
  switch (platform) {
    case 'Shopee':
      return `https://shopee.ph/search?keyword=${q}`;
    case 'Lazada':
      return `https://www.lazada.com.ph/catalog/?q=${q}`;
    case 'Temu':
      return `https://www.temu.com/search_result.html?search_key=${q}`;
    default:
      return `https://www.google.com/search?q=${q}`;
  }
}

export function buildStorefrontSearchUrl(
  platform: string,
  storeName: string,
  fallbackProductTitle = ''
): string {
  const cleanStore = normalizeStoreSearchName(storeName);
  if (cleanStore.length < 2) {
    return buildShopSearchUrl(platform, fallbackProductTitle || storeName);
  }
  const q = encodeURIComponent(`${cleanStore} official store`.trim());
  switch (platform) {
    case 'Shopee':
      return `https://shopee.ph/search?keyword=${encodeURIComponent(cleanStore)}`;
    case 'Lazada':
      return `https://www.lazada.com.ph/catalog/?q=${encodeURIComponent(cleanStore)}`;
    case 'Temu':
      return `https://www.temu.com/search_result.html?search_key=${encodeURIComponent(cleanStore)}`;
    default:
      return `https://www.google.com/search?q=${q}`;
  }
}

export interface ResolveListingUrlInput {
  sourceUrl?: string | null;
  platform?: string;
  title?: string;
}

export function resolveListingExternalUrl(
  sourceUrlOrObj: string | undefined | null | ResolveListingUrlInput,
  platformArg?: string,
  productTitleArg?: string,
): string {
  const sourceUrl =
    typeof sourceUrlOrObj === 'object' && sourceUrlOrObj !== null
      ? sourceUrlOrObj.sourceUrl
      : sourceUrlOrObj;
  const rawPlatform =
    typeof sourceUrlOrObj === 'object' && sourceUrlOrObj !== null
      ? sourceUrlOrObj.platform
      : platformArg;
  const productTitle =
    (typeof sourceUrlOrObj === 'object' && sourceUrlOrObj !== null
      ? sourceUrlOrObj.title
      : productTitleArg) || '';

  const trimmedUrl = (sourceUrl || '').trim();
  const platform = inferPlatformFromUrlOrBadge(
    trimmedUrl,
    rawPlatform,
    (rawPlatform as 'Shopee' | 'Lazada' | 'Temu') || 'Shopee',
  );

  if (!trimmedUrl) {
    return buildShopSearchUrl(platform, productTitle);
  }

  for (const deadPattern of SYNTHETIC_DEAD_URL_PATTERNS) {
    if (trimmedUrl.includes(deadPattern)) {
      return buildShopSearchUrl(platform, productTitle);
    }
  }

  if (isDirectMarketplaceProductUrl(trimmedUrl)) {
    return trimmedUrl;
  }

  try {
    const parsed = new URL(trimmedUrl);
    const host = parsed.hostname.toLowerCase();

    const isShopeeUrl = host.includes('shopee.') || host === 'shp.ee';
    const isLazadaUrl = host.includes('lazada.');
    const isTemuUrl = host.includes('temu.');

    if (
      (platform === 'Shopee' && !isShopeeUrl) ||
      (platform === 'Lazada' && !isLazadaUrl) ||
      (platform === 'Temu' && !isTemuUrl)
    ) {
      return buildShopSearchUrl(platform, productTitle);
    }

    if (isLazadaUrl && (/^\/tag\//i.test(parsed.pathname) || /^\/shop-/i.test(parsed.pathname))) {
      return buildShopSearchUrl('Lazada', productTitle);
    }

    if (
      parsed.searchParams.has('keyword') ||
      parsed.searchParams.has('q') ||
      parsed.searchParams.has('search_key')
    ) {
      const rawParam =
        parsed.searchParams.get('keyword') ||
        parsed.searchParams.get('q') ||
        parsed.searchParams.get('search_key') ||
        '';
      const hasPollutedParam =
        rawParam.includes('...') ||
        /\b(resmi|dirilis|pengganti|notebookcheck|jam online|complink)\b/i.test(rawParam);
      const sourceText = hasPollutedParam && productTitle ? productTitle : productTitle || rawParam;
      return buildShopSearchUrl(platform, sourceText);
    }

    return trimmedUrl;
  } catch {
    return buildShopSearchUrl(platform, productTitle);
  }
}

export function formatCurrency(amountPhp: number): string {
  return `₱${amountPhp.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
