import {
  findBestCatalogItemByTitle,
  findCatalogItemByUrl,
  HydratedCatalogItem,
  searchMarketplaceCatalog,
} from '../repositories/catalogRepository.ts';
import {
  parseAndValidateAllowedUrl,
  safeFetchText,
  sanitizeScrapedImageUrl,
} from './security.ts';

export type MarketplacePlatform = 'Shopee' | 'Lazada' | 'Temu';

export interface ScrapedListingMetadata {
  sourceUrl: string;
  finalUrl: string;
  platformName: MarketplacePlatform;
  importedFrom?: string;
  title: string;
  description?: string;
  listedPricePhp?: number;
  originalPricePhp?: number;
  soldCountText?: string;
  variants?: string[];
  imageUrls: string[];
  sellerName?: string;
  sellerLocation?: string;
  sellerRating?: number;
  storeReviewCount?: number;
  rating?: number;
  reviewCount?: number;
  catalogItem?: HydratedCatalogItem;
  extractionMode: 'catalog-verified' | 'live-metadata' | 'oembed' | 'url-slug';
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#(\d+);/g, (_, dec) => {
      const code = Number(dec);
      return Number.isFinite(code) && code > 31 && code < 127000
        ? String.fromCodePoint(code)
        : '';
    })
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanMarketplaceTitle(raw: string): string {
  return decodeHtmlEntities(raw)
    .replace(
      /\s*[|-]\s*(Shopee\s*Philippines|Shopee|Lazada\s*PH|Lazada\s*Philippines|Lazada|Temu\s*Philippines|Temu|YouTube|Instagram|Facebook).*$/i,
      ''
    )
    .replace(/^Buy\s+/i, '')
    .replace(/\s+online\s+at\s+lazada.*$/i, '')
    .trim();
}

export function inferPlatformAndOrigin(url: URL): {
  platformName: MarketplacePlatform;
  importedFrom?: string;
} {
  const host = url.hostname.toLowerCase().replace(/^www\./, '');

  if (host.includes('shopee.') || host === 'shp.ee') {
    return { platformName: 'Shopee' };
  }
  if (host.includes('lazada.')) {
    return { platformName: 'Lazada' };
  }
  if (host.includes('temu.')) {
    return { platformName: 'Temu' };
  }
  if (host.endsWith('instagram.com')) {
    return { platformName: 'Shopee', importedFrom: 'Instagram' };
  }
  if (host.endsWith('facebook.com') || host === 'fb.com' || host === 'fb.watch') {
    return { platformName: 'Shopee', importedFrom: 'Facebook' };
  }
  if (host.endsWith('youtube.com') || host === 'youtu.be') {
    return { platformName: 'Lazada', importedFrom: 'YouTube' };
  }
  if (host.endsWith('pinterest.com') || host === 'pin.it') {
    return { platformName: 'Shopee', importedFrom: 'Pinterest' };
  }
  if (host.endsWith('twitter.com') || host === 'x.com') {
    return { platformName: 'Shopee', importedFrom: 'X' };
  }
  return { platformName: 'Shopee' };
}

export function extractUrlEmbeddedImages(url: URL): string[] {
  const collected: string[] = [];
  const host = url.hostname.toLowerCase();

  if (host.includes('shopee.')) {
    const rawIds = url.searchParams.get('image_ids') || url.searchParams.get('image_id') || '';
    if (rawIds) {
      const parts = rawIds
        .split(',')
        .map((s) => s.trim())
        .filter((s) => /^[a-z0-9_-]{10,80}$/i.test(s));
      for (const fileId of parts.slice(0, 6)) {
        const cdnHost = host.endsWith('shopee.sg')
          ? 'down-sg.img.susercontent.com'
          : 'down-ph.img.susercontent.com';
        const candidate = sanitizeScrapedImageUrl(`https://${cdnHost}/file/${fileId}`);
        if (candidate && !collected.includes(candidate)) {
          collected.push(candidate);
        }
      }
    }
  }

  for (const param of ['img_url', 'image', 'thumb_url', 'pic']) {
    const rawVal = url.searchParams.get(param);
    const safe = sanitizeScrapedImageUrl(rawVal);
    if (safe && !collected.includes(safe)) {
      collected.push(safe);
    }
  }

  return collected;
}

export function extractSlugTitleFromUrl(url: URL): string {
  const queryTitle =
    url.searchParams.get('title') ||
    url.searchParams.get('q') ||
    url.searchParams.get('keyword') ||
    url.searchParams.get('search') ||
    url.searchParams.get('search_key');

  if (queryTitle && queryTitle.trim().length >= 3) {
    return toTitleCaseWords(queryTitle.trim());
  }

  let path = decodeURIComponent(url.pathname);

  path = path
    .replace(/-i\.\d+\.\d+.*$/i, '')
    .replace(/-i\d+(?:-s\d+)?\.html.*$/i, '')
    .replace(/-g-\d+\.html.*$/i, '')
    .replace(/\.html$/i, '');

  const segments = path
    .split('/')
    .map((seg) => seg.trim())
    .filter(
      (seg) =>
        seg.length > 0 &&
        ![
          'products',
          'product',
          'item',
          'view',
          'shop',
          'ph',
          'p',
          'reel',
          'reels',
          'watch',
          'shorts',
          'video',
          'pin',
          'status',
          'share',
        ].includes(seg.toLowerCase()) &&
        !/^\d+$/.test(seg) &&
        !/^@[a-z0-9_.-]+$/i.test(seg)
    );

  const bestSegment = segments.sort((a, b) => b.length - a.length)[0] || '';

  const humanized = bestSegment
    .replace(/[\u2013\u2014]/g, ' - ')
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[_-]+/g, ' ')
    .replace(/\b[a-f0-9]{12,}\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (humanized.length >= 3 && /[a-zA-Z]{2,}/.test(humanized)) {
    return toTitleCaseWords(humanized);
  }

  const handleMatch = url.pathname.match(/\/@([a-zA-Z0-9_.-]+)/);
  if (handleMatch) {
    return `Featured Item by @${handleMatch[1]}`;
  }

  const shopeeIds =
    url.pathname.match(/\/product\/(\d+)\/(\d+)/) || url.pathname.match(/i\.(\d+)\.(\d+)/);
  if (shopeeIds) {
    return `Shopee Listing #${shopeeIds[2].slice(-6)}`;
  }

  return `${inferPlatformAndOrigin(url).platformName} Marketplace Listing`;
}

function toTitleCaseWords(text: string): string {
  const preserveUpper = new Set([
    'ANC',
    'USB',
    'USB-C',
    'SSD',
    'LED',
    'LCD',
    'AMOLED',
    'RGB',
    'TWS',
    'TPU',
    'EVA',
    'SPF',
    'UV',
    'PH',
    'PC',
    'DPI',
    'GPS',
    'BT',
    'PRO',
    'MAX',
    'S24',
    'S23',
    'A55',
    'A54',
    '5G',
  ]);
  return text
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 22)
    .map((word) => {
      const upper = word.toUpperCase();
      if (preserveUpper.has(upper)) return upper;
      if (/^\d+["']?$/.test(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

function extractMetaContent(html: string, attrValues: string[]): string | undefined {
  for (const attr of attrValues) {
    const escaped = attr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regexA = new RegExp(
      `<meta[^>]+(?:property|name|itemprop)=["']${escaped}["'][^>]+content=["']([^"']+)["']`,
      'i'
    );
    const matchA = html.match(regexA);
    if (matchA?.[1]) return decodeHtmlEntities(matchA[1]);

    const regexB = new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name|itemprop)=["']${escaped}["']`,
      'i'
    );
    const matchB = html.match(regexB);
    if (matchB?.[1]) return decodeHtmlEntities(matchB[1]);
  }
  return undefined;
}

const KNOWN_MERCHANT_PATTERNS: Array<{ pattern: RegExp; sellerName: string }> = [
  { pattern: /\bitech\s*ph\b|\bitech\b/i, sellerName: 'iTech PH Official Store' },
  { pattern: /\bvillman\b/i, sellerName: 'VillMan Computers' },
  { pattern: /\bpc\s*express\b|\bpcexpress\b/i, sellerName: 'PC Express Official Store' },
  { pattern: /\bdatablitz\b/i, sellerName: 'DataBlitz Official Store' },
  { pattern: /\bcomplink\b/i, sellerName: 'Complink Official Store' },
  { pattern: /\bpc\s*central\b|\bpccentral\b/i, sellerName: 'PC Central Official Store' },
  { pattern: /\blaptop\s*factory\b/i, sellerName: 'Laptop Factory PH' },
  { pattern: /\bdynaquest\b/i, sellerName: 'DynaQuest PC' },
  { pattern: /\bgamextreme\b/i, sellerName: 'GameXtreme Official Store' },
  { pattern: /\boctagon\b/i, sellerName: 'Octagon Computer Superstore' },
  { pattern: /\bsilicon\s*valley\b/i, sellerName: 'Silicon Valley Official Store' },
  { pattern: /\bkimstore\b/i, sellerName: 'Kimstore Official' },
  { pattern: /\bbeyond\s*the\s*box\b/i, sellerName: 'Beyond the Box Official' },
  { pattern: /\bpower\s*mac\b/i, sellerName: 'Power Mac Center' },
  { pattern: /\bdigital\s*walker\b/i, sellerName: 'Digital Walker Official' },
];

export interface ParsedLazadaPdpData {
  title?: string;
  pricePhp?: number;
  originalPricePhp?: number;
  brandName?: string;
  sellerName?: string;
  categoryLabel?: string;
  description?: string;
  images: string[];
  variants: string[];
}

export function parseLazadaPdpHtml(html: string): ParsedLazadaPdpData | null {
  if (!html || (!html.includes('pdpTrackingData') && !html.includes('__moduleData__'))) {
    return null;
  }

  const out: ParsedLazadaPdpData = {
    images: [],
    variants: [],
  };

  const trackingMatch = html.match(/var\s+pdpTrackingData\s*=\s*"(\{[\s\S]*?\})"/);
  if (trackingMatch?.[1]) {
    try {
      const unescaped = trackingMatch[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
      const tracking = JSON.parse(unescaped) as Record<string, unknown>;
      if (typeof tracking.pdt_name === 'string' && tracking.pdt_name.trim()) {
        out.title = cleanMarketplaceTitle(tracking.pdt_name.trim());
      }
      if (typeof tracking.brand_name === 'string' && tracking.brand_name.trim()) {
        out.brandName = decodeHtmlEntities(tracking.brand_name.trim());
      }
      if (typeof tracking.seller_name === 'string' && tracking.seller_name.trim()) {
        out.sellerName = decodeHtmlEntities(tracking.seller_name.trim());
      }
      if (typeof tracking.pdt_price === 'string' && tracking.pdt_price.trim()) {
        const numericPrice = Number(tracking.pdt_price.replace(/[^0-9.]/g, ''));
        if (Number.isFinite(numericPrice) && numericPrice > 0) {
          out.pricePhp = numericPrice;
        }
      }
      if (Array.isArray(tracking.pdt_category) && tracking.pdt_category.length > 0) {
        out.categoryLabel = tracking.pdt_category
          .map((c) => String(c))
          .filter(Boolean)
          .join(' · ');
      }
    } catch {}
  }

  const modMatch = html.match(/var\s+__moduleData__\s*=\s*(\{[\s\S]*?\});\s*var\s+/);
  if (modMatch?.[1]) {
    try {
      const modObj = JSON.parse(modMatch[1]) as {
        data?: { root?: { fields?: Record<string, unknown> } };
      };
      const fields = modObj?.data?.root?.fields;
      if (fields && typeof fields === 'object') {
        const galleries = fields.skuGalleries as Record<string, Array<{ src?: string; poster?: string }>> | undefined;
        if (galleries && typeof galleries === 'object') {
          for (const key of Object.keys(galleries)) {
            const list = galleries[key];
            if (Array.isArray(list)) {
              for (const entry of list) {
                const safeImg = sanitizeScrapedImageUrl(entry?.src || entry?.poster);
                if (safeImg && !out.images.includes(safeImg)) {
                  out.images.push(safeImg);
                }
              }
            }
          }
        }

        const productOption = fields.productOption as {
          skuBase?: {
            properties?: Array<{
              name?: string;
              values?: Array<{ name?: string } | string>;
            }>;
          };
        } | undefined;
        const props = productOption?.skuBase?.properties;
        if (Array.isArray(props)) {
          for (const prop of props) {
            if (Array.isArray(prop?.values)) {
              for (const val of prop.values) {
                const vName = typeof val === 'string' ? val : val?.name;
                if (typeof vName === 'string' && vName.trim() && !out.variants.includes(vName.trim())) {
                  out.variants.push(decodeHtmlEntities(vName.trim()));
                }
              }
            }
          }
        }

        const productNode = fields.product as { desc?: string; title?: string } | undefined;
        if (productNode && typeof productNode === 'object') {
          if (!out.title && typeof productNode.title === 'string' && productNode.title.trim()) {
            out.title = cleanMarketplaceTitle(productNode.title.trim());
          }
          if (typeof productNode.desc === 'string' && productNode.desc.trim()) {
            const strippedDesc = decodeHtmlEntities(
              productNode.desc
                .replace(/<style[\s\S]*?<\/style>/gi, ' ')
                .replace(/<script[\s\S]*?<\/script>/gi, ' ')
                .replace(/<[^>]+>/g, ' ')
            );
            if (strippedDesc.length >= 12) {
              out.description = strippedDesc.slice(0, 360);
            }
            if (!out.sellerName) {
              const prodNameMerchant = strippedDesc.match(
                /PRODUCT\s*NAME\s*:\s*([A-Za-z0-9 .&_-]{2,28})\s*\|/i
              );
              if (prodNameMerchant?.[1]) {
                const candidateMerchant = prodNameMerchant[1].trim();
                for (const known of KNOWN_MERCHANT_PATTERNS) {
                  if (known.pattern.test(candidateMerchant)) {
                    out.sellerName = known.sellerName;
                    break;
                  }
                }
                if (!out.sellerName && candidateMerchant.length >= 3) {
                  out.sellerName = `${candidateMerchant} (Lazada PH)`;
                }
              }
              if (!out.sellerName) {
                for (const known of KNOWN_MERCHANT_PATTERNS) {
                  if (known.pattern.test(strippedDesc.slice(0, 300))) {
                    out.sellerName = known.sellerName;
                    break;
                  }
                }
              }
            }
          }
        }
      }
    } catch {}
  }

  if (!out.sellerName && out.brandName && !/^(no brand|oem|generic)$/i.test(out.brandName)) {
    for (const known of KNOWN_MERCHANT_PATTERNS) {
      if (known.pattern.test(out.title || '')) {
        out.sellerName = known.sellerName;
        break;
      }
    }
  }

  if (!out.title && !out.pricePhp && out.images.length === 0) {
    return null;
  }

  return out;
}
interface ParsedJsonLdProduct {
  title?: string;
  description?: string;
  price?: number;
  highPrice?: number;
  images: string[];
  sellerName?: string;
  sellerRating?: number;
  storeReviewCount?: number;
  rating?: number;
  reviewCount?: number;
}

function parseJsonLdProducts(html: string, targetItemId?: string): ParsedJsonLdProduct {
  const result: ParsedJsonLdProduct = { images: [] };
  const scriptRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;

  while ((match = scriptRegex.exec(html)) !== null) {
    const rawJson = match[1]?.trim();
    if (!rawJson) continue;
    try {
      const parsed = JSON.parse(rawJson) as unknown;
      const candidates = flattenJsonLdNodes(parsed);
      for (const node of candidates) {
        const nodeType = String(node['@type'] || '').toLowerCase();

        if (nodeType === 'organization' || nodeType === 'store') {
          if (!result.sellerName && typeof node.name === 'string') {
            const orgName = decodeHtmlEntities(node.name);
            if (!/^(shopee|lazada|temu|tiktok)/i.test(orgName)) {
              result.sellerName = orgName;
            }
          }
          if (node.aggregateRating && typeof node.aggregateRating === 'object') {
            const agg = node.aggregateRating as Record<string, unknown>;
            const rVal = Number(agg.ratingValue);
            const rCnt = Number(agg.ratingCount ?? agg.reviewCount);
            if (Number.isFinite(rVal) && rVal > 0 && rVal <= 5) {
              result.sellerRating = Number(rVal.toFixed(2));
            }
            if (Number.isFinite(rCnt) && rCnt >= 0) {
              result.storeReviewCount = Math.round(rCnt);
            }
          }
          continue;
        }

        if (!nodeType.includes('product')) continue;

        if (targetItemId) {
          const productUrl = String(node.url || node.productID || '');
          if (productUrl && !productUrl.includes(targetItemId)) {
            continue;
          }
        }

        if (!result.title && typeof node.name === 'string') {
          result.title = cleanMarketplaceTitle(node.name);
        }
        if (!result.description && typeof node.description === 'string') {
          result.description = decodeHtmlEntities(node.description).slice(0, 320);
        }

        if (typeof node.image === 'string') {
          const safe = sanitizeScrapedImageUrl(node.image);
          if (safe) result.images.push(safe);
        } else if (Array.isArray(node.image)) {
          for (const img of node.image) {
            const urlStr = typeof img === 'string' ? img : (img as Record<string, unknown>)?.url;
            if (typeof urlStr === 'string') {
              const safe = sanitizeScrapedImageUrl(urlStr);
              if (safe) result.images.push(safe);
            }
          }
        }

        const offers = Array.isArray(node.offers) ? node.offers[0] : node.offers;
        if (offers && typeof offers === 'object') {
          const offerObj = offers as Record<string, unknown>;
          const rawPrice = Number(offerObj.price ?? offerObj.lowPrice);
          const rawHigh = Number(offerObj.highPrice);
          if (Number.isFinite(rawPrice) && rawPrice > 0) {
            result.price = rawPrice;
          }
          if (Number.isFinite(rawHigh) && rawHigh > (result.price ?? 0)) {
            result.highPrice = rawHigh;
          }
          const seller = offerObj.seller as Record<string, unknown> | undefined;
          if (seller && typeof seller.name === 'string') {
            const cleanSeller = decodeHtmlEntities(seller.name.trim());
            if (cleanSeller && !/^(shopee|lazada|temu|tiktok|no brand)$/i.test(cleanSeller)) {
              result.sellerName = cleanSeller;
            }
          }
        }

        if (node.aggregateRating && typeof node.aggregateRating === 'object') {
          const agg = node.aggregateRating as Record<string, unknown>;
          const ratingVal = Number(agg.ratingValue);
          const countVal = Number(agg.reviewCount ?? agg.ratingCount);
          if (Number.isFinite(ratingVal) && ratingVal > 0 && ratingVal <= 5) {
            result.rating = Number(ratingVal.toFixed(1));
          }
          if (Number.isFinite(countVal) && countVal >= 0) {
            result.reviewCount = Math.round(countVal);
          }
        }
      }
    } catch {}
  }

  return result;
}

function flattenJsonLdNodes(input: unknown): Array<Record<string, unknown>> {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input.flatMap((item) => flattenJsonLdNodes(item));
  }
  if (typeof input === 'object') {
    const obj = input as Record<string, unknown>;
    if (Array.isArray(obj['@graph'])) {
      return [obj, ...flattenJsonLdNodes(obj['@graph'])];
    }
    return [obj];
  }
  return [];
}

async function tryShopeeShopJsonLd(
  parsedUrl: URL
): Promise<{
  sellerName?: string;
  sellerRating?: number;
  storeReviewCount?: number;
  productTitle?: string;
  productPrice?: number;
  productImages: string[];
  productRating?: number;
  productReviews?: number;
} | null> {
  const host = parsedUrl.hostname.toLowerCase();
  if (!host.includes('shopee.')) return null;

  const idMatch =
    parsedUrl.pathname.match(/-i\.(\d+)\.(\d+)/i) ||
    parsedUrl.pathname.match(/\/product\/(\d+)\/(\d+)/i);
  if (!idMatch) return null;

  const [, shopId, itemId] = idMatch;
  const shopEndpoint = `https://${host}/shop/${shopId}`;

  try {
    const res = await safeFetchText(shopEndpoint, {
      timeoutMs: 2800,
      maxBytes: 384 * 1024,
    });
    if (res.status < 200 || res.status >= 400 || !res.bodyText) return null;
    const parsed = parseJsonLdProducts(res.bodyText, itemId);
    return {
      sellerName: parsed.sellerName,
      sellerRating: parsed.sellerRating,
      storeReviewCount: parsed.storeReviewCount,
      productTitle: parsed.title,
      productPrice: parsed.price,
      productImages: parsed.images,
      productRating: parsed.rating,
      productReviews: parsed.reviewCount,
    };
  } catch {
    return null;
  }
}

async function tryOembedMetadata(
  parsedUrl: URL
): Promise<Partial<ScrapedListingMetadata> | null> {
  const host = parsedUrl.hostname.toLowerCase().replace(/^www\./, '');
  let oembedEndpoint: string | null = null;

  if (host.endsWith('youtube.com') || host === 'youtu.be') {
    oembedEndpoint = `https://www.youtube.com/oembed?url=${encodeURIComponent(
      parsedUrl.toString()
    )}&format=json`;
  }

  if (!oembedEndpoint) return null;

  try {
    const res = await safeFetchText(oembedEndpoint, {
      timeoutMs: 3000,
      maxBytes: 128 * 1024,
      accept: 'application/json',
    });
    if (res.status < 200 || res.status >= 300) return null;
    const data = JSON.parse(res.bodyText) as Record<string, unknown>;
    const rawTitle = typeof data.title === 'string' ? cleanMarketplaceTitle(data.title) : '';
    const author = typeof data.author_name === 'string' ? data.author_name.trim() : undefined;
    const thumb =
      typeof data.thumbnail_url === 'string'
        ? sanitizeScrapedImageUrl(data.thumbnail_url)
        : null;

    if (!rawTitle && !thumb) return null;

    return {
      title: rawTitle || undefined,
      sellerName: author ? `${author} Featured Shop` : undefined,
      imageUrls: thumb ? [thumb] : [],
      extractionMode: 'oembed',
    };
  } catch {
    return null;
  }
}

function extractAlphanumericModelTokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/[\s-]+/)
    .filter(
      (tok) =>
        tok.length >= 3 &&
        /[a-z]/.test(tok) &&
        /\d/.test(tok) &&
        !/^(win11|win10|ddr4|ddr5|lpddr5|gddr6|pcie|nvme|wifi6|usb3|ip68|ip56|5atm|1080p|144hz|165hz|180hz|\d+gb|\d+tb|\d+mah|\d+w|\d+in|\d+inch)$/i.test(
          tok
        )
    );
}

function hasConsistentModelTokens(slugTitle: string, candidateTitle: string): boolean {
  const slugModels = extractAlphanumericModelTokens(slugTitle);
  if (slugModels.length === 0) return true;
  const candLower = candidateTitle.toLowerCase();
  return slugModels.every((modelTok) => candLower.includes(modelTok));
}

export async function scrapeMarketplaceOrSocialUrl(
  rawUrl: string
): Promise<ScrapedListingMetadata> {
  const initialUrl = parseAndValidateAllowedUrl(rawUrl);
  let activeUrl = initialUrl;
  let originInfo = inferPlatformAndOrigin(activeUrl);
  const embeddedImages = extractUrlEmbeddedImages(initialUrl);

  const slugTitle = extractSlugTitleFromUrl(initialUrl);

  // 1. Exact URL match in catalog
  const exactUrlCatalogMatch = findCatalogItemByUrl(initialUrl.toString());
  if (exactUrlCatalogMatch) {
    const combinedImages = [...embeddedImages];
    for (const img of exactUrlCatalogMatch.imageUrls ?? []) {
      if (img && !combinedImages.includes(img)) combinedImages.push(img);
    }
    if (exactUrlCatalogMatch.imageUrl && !combinedImages.includes(exactUrlCatalogMatch.imageUrl)) {
      combinedImages.unshift(exactUrlCatalogMatch.imageUrl);
    }
    return {
      sourceUrl: initialUrl.toString(),
      finalUrl: initialUrl.toString(),
      platformName: exactUrlCatalogMatch.platformName,
      importedFrom: originInfo.importedFrom,
      title: exactUrlCatalogMatch.productTitle,
      description: exactUrlCatalogMatch.aboutText,
      listedPricePhp: exactUrlCatalogMatch.pricePhp,
      originalPricePhp: exactUrlCatalogMatch.originalPricePhp,
      soldCountText: exactUrlCatalogMatch.soldCountText,
      variants: exactUrlCatalogMatch.variants,
      imageUrls: combinedImages.slice(0, 6),
      sellerName: exactUrlCatalogMatch.sellerName,
      sellerLocation: exactUrlCatalogMatch.sellerLocation,
      rating: exactUrlCatalogMatch.starRating,
      reviewCount: exactUrlCatalogMatch.reviewCount,
      catalogItem: exactUrlCatalogMatch,
      extractionMode: 'catalog-verified',
    };
  }

  const oembed = await tryOembedMetadata(activeUrl);
  if (oembed?.title) {
    return {
      sourceUrl: initialUrl.toString(),
      finalUrl: activeUrl.toString(),
      platformName: originInfo.platformName,
      importedFrom: originInfo.importedFrom,
      title: oembed.title,
      imageUrls: [...embeddedImages, ...(oembed.imageUrls ?? [])].slice(0, 6),
      sellerName: oembed.sellerName,
      extractionMode: 'oembed',
    };
  }

  const shopeeShopData = await tryShopeeShopJsonLd(activeUrl);

  // 2. Attempt live product page extraction first (especially effective for Lazada PDPs and open listings)
  try {
    const fetched = await safeFetchText(activeUrl.toString(), {
      timeoutMs: 4200,
      maxBytes: 1024 * 1024,
    });

    try {
      activeUrl = new URL(fetched.finalUrl);
      originInfo = inferPlatformAndOrigin(activeUrl);
    } catch {}

    if (fetched.status >= 200 && fetched.status < 400 && fetched.bodyText) {
      const html = fetched.bodyText;
      const lazadaPdp = originInfo.platformName === 'Lazada' ? parseLazadaPdpHtml(html) : null;
      const jsonLd = parseJsonLdProducts(html);

      const ogTitle = extractMetaContent(html, ['og:title', 'twitter:title']);
      const ogDesc = extractMetaContent(html, [
        'og:description',
        'twitter:description',
        'description',
      ]);
      const ogImage = extractMetaContent(html, [
        'og:image',
        'og:image:secure_url',
        'twitter:image',
      ]);
      const ogPriceRaw = extractMetaContent(html, [
        'product:price:amount',
        'og:price:amount',
        'price',
      ]);

      const titleTagMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      const htmlTitle = titleTagMatch?.[1]
        ? cleanMarketplaceTitle(titleTagMatch[1])
        : undefined;

      const candidateTitle =
        lazadaPdp?.title ||
        jsonLd.title ||
        shopeeShopData?.productTitle ||
        (ogTitle ? cleanMarketplaceTitle(ogTitle) : '') ||
        htmlTitle;
      const isGenericBlockTitle =
        !candidateTitle ||
        /^(shopee|lazada|tiktok|temu|login|just a moment|security check|captcha|access denied|robot|verify)/i.test(
          candidateTitle
        ) ||
        candidateTitle.length < 3;

      const resolvedTitle = isGenericBlockTitle
        ? extractSlugTitleFromUrl(activeUrl)
        : candidateTitle;

      const parsedOgPrice = ogPriceRaw
        ? Number(ogPriceRaw.replace(/[^0-9.]/g, ''))
        : undefined;
      const finalPrice =
        lazadaPdp?.pricePhp && lazadaPdp.pricePhp > 0
          ? lazadaPdp.pricePhp
          : jsonLd.price && jsonLd.price > 0
          ? jsonLd.price
          : shopeeShopData?.productPrice && shopeeShopData.productPrice > 0
          ? shopeeShopData.productPrice
          : parsedOgPrice && Number.isFinite(parsedOgPrice) && parsedOgPrice > 0
          ? parsedOgPrice
          : undefined;

      const images = [
        ...embeddedImages,
        ...(lazadaPdp?.images ?? []),
        ...jsonLd.images,
        ...(shopeeShopData?.productImages ?? []),
      ];
      const safeOgImg = sanitizeScrapedImageUrl(ogImage);
      if (safeOgImg && !images.includes(safeOgImg)) {
        images.unshift(safeOgImg);
      }
      const uniqueImages = Array.from(new Set(images)).slice(0, 6);

      const resolvedSeller =
        lazadaPdp?.sellerName || jsonLd.sellerName || shopeeShopData?.sellerName;
      const resolvedRating = jsonLd.rating || shopeeShopData?.productRating;
      const resolvedReviews = jsonLd.reviewCount ?? shopeeShopData?.productReviews;

      if (finalPrice || !isGenericBlockTitle || Boolean(resolvedSeller) || uniqueImages.length > 0) {
        const compatibleCatalogItem = findBestCatalogItemByTitle(
          resolvedTitle,
          originInfo.platformName
        );
        const strictCatalogMatch =
          compatibleCatalogItem &&
          hasConsistentModelTokens(resolvedTitle, compatibleCatalogItem.productTitle)
            ? compatibleCatalogItem
            : undefined;

        return {
          sourceUrl: initialUrl.toString(),
          finalUrl: initialUrl.toString(),
          platformName: originInfo.platformName,
          importedFrom: originInfo.importedFrom,
          title: resolvedTitle,
          description:
            lazadaPdp?.description ||
            jsonLd.description ||
            ogDesc?.slice(0, 320) ||
            strictCatalogMatch?.aboutText,
          listedPricePhp: finalPrice ?? strictCatalogMatch?.pricePhp,
          originalPricePhp: jsonLd.highPrice ?? strictCatalogMatch?.originalPricePhp,
          variants:
            lazadaPdp?.variants && lazadaPdp.variants.length > 0
              ? lazadaPdp.variants
              : strictCatalogMatch?.variants,
          imageUrls:
            uniqueImages.length > 0
              ? uniqueImages
              : strictCatalogMatch?.imageUrls?.slice(0, 6) ?? [],
          sellerName: resolvedSeller || strictCatalogMatch?.sellerName,
          sellerLocation: strictCatalogMatch?.sellerLocation,
          sellerRating: shopeeShopData?.sellerRating,
          storeReviewCount: shopeeShopData?.storeReviewCount,
          rating: resolvedRating ?? strictCatalogMatch?.starRating,
          reviewCount: resolvedReviews ?? strictCatalogMatch?.reviewCount,
          catalogItem: strictCatalogMatch,
          extractionMode: 'live-metadata',
        };
      }
    }
  } catch (err) {
    if (err && typeof err === 'object' && (err as { name?: string }).name === 'SsrfValidationError') {
      throw err;
    }
  }

  // 3. Fallback when live page is login-gated (e.g. Shopee): check catalog match only if model tokens are consistent
  let catalogMatch = findBestCatalogItemByTitle(slugTitle, originInfo.platformName);
  if (catalogMatch && !hasConsistentModelTokens(slugTitle, catalogMatch.productTitle)) {
    catalogMatch = null;
  }

  if (
    !catalogMatch &&
    slugTitle.length >= 4 &&
    !/Marketplace Listing|Featured Item|Shopee Listing/i.test(slugTitle)
  ) {
    try {
      const searchFallback = await searchMarketplaceCatalog(slugTitle, originInfo.platformName);
      const firstHit = searchFallback.items.find((item) =>
        hasConsistentModelTokens(slugTitle, item.productTitle)
      );
      if (firstHit) {
        catalogMatch = firstHit as HydratedCatalogItem;
      }
    } catch {}
  }

  if (catalogMatch) {
    const combinedImages = [...embeddedImages];
    for (const img of catalogMatch.imageUrls ?? []) {
      if (img && !combinedImages.includes(img)) combinedImages.push(img);
    }
    if (catalogMatch.imageUrl && !combinedImages.includes(catalogMatch.imageUrl)) {
      combinedImages.unshift(catalogMatch.imageUrl);
    }
    return {
      sourceUrl: initialUrl.toString(),
      finalUrl: initialUrl.toString(),
      platformName: originInfo.platformName,
      importedFrom: originInfo.importedFrom,
      title: slugTitle.length >= 12 ? slugTitle : catalogMatch.productTitle,
      description: catalogMatch.aboutText,
      listedPricePhp: catalogMatch.pricePhp,
      originalPricePhp: catalogMatch.originalPricePhp,
      soldCountText: catalogMatch.soldCountText,
      variants: catalogMatch.variants,
      imageUrls: combinedImages.slice(0, 6),
      sellerName: shopeeShopData?.sellerName || catalogMatch.sellerName,
      sellerLocation: catalogMatch.sellerLocation,
      rating: shopeeShopData?.productRating ?? catalogMatch.starRating,
      reviewCount: shopeeShopData?.productReviews ?? catalogMatch.reviewCount,
      catalogItem: catalogMatch,
      extractionMode: 'catalog-verified',
    };
  }

  return {
    sourceUrl: initialUrl.toString(),
    finalUrl: initialUrl.toString(),
    platformName: originInfo.platformName,
    importedFrom: originInfo.importedFrom,
    title: shopeeShopData?.productTitle || slugTitle,
    listedPricePhp: shopeeShopData?.productPrice,
    imageUrls: Array.from(
      new Set([...embeddedImages, ...(shopeeShopData?.productImages ?? []), ...(oembed?.imageUrls ?? [])])
    ).slice(0, 6),
    sellerName: shopeeShopData?.sellerName || oembed?.sellerName,
    sellerRating: shopeeShopData?.sellerRating,
    storeReviewCount: shopeeShopData?.storeReviewCount,
    rating: shopeeShopData?.productRating,
    reviewCount: shopeeShopData?.productReviews,
    extractionMode: shopeeShopData?.sellerName ? 'live-metadata' : 'url-slug',
  };
}
