import {
  IllustrationKey,
  MarketplaceSearchItem,
  MarketplaceSearchResponse,
} from '../../src/types/budol.ts';
import {
  buildShopSearchUrl,
  resolveListingExternalUrl,
} from '../../src/lib/formatters.ts';
import { MARKETPLACE_CATALOG_SEED, CatalogSeedEntry } from '../data/marketplaceCatalog.ts';
import { getDbPool, prepareCached } from '../db/pool.ts';
import {
  discoverLiveWebMarketplaceListings,
  inferProductCategoryMeta,
} from '../lib/liveWebSearch.ts';

interface CatalogRow {
  id: string;
  canonical_key: string | null;
  product_group: string;
  platform_name: 'Shopee' | 'Lazada' | 'Temu';
  product_title: string;
  brand_name: string;
  seller_name: string;
  seller_location: string;
  is_mall_verified: number;
  price_php: number;
  original_price_php: number | null;
  star_rating: number;
  review_count: number;
  sold_count_text: string;
  image_url: string;
  source_url: string;
  illustration_key: IllustrationKey;
  category_label: string;
  variants_json: string;
  keywords_text: string;
  shipping_note: string;
  about_text: string;
}

export interface HydratedCatalogItem extends MarketplaceSearchItem {
  keywordsText: string;
  aboutText: string;
  imageUrls?: string[];
  storeAge?: string;
  responseRate?: string;
  fulfillmentRate?: string;
  storeRatingsText?: string;
}

const SEED_META_BY_ID = new Map<string, CatalogSeedEntry>(
  MARKETPLACE_CATALOG_SEED.map((entry) => [entry.id, entry])
);

function parseStringArray(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

export function buildLiveCatalogPhotoUrl(productTitle: string, _angleIdx = 0): string {
  const cleanTitle =
    productTitle
      .replace(/\[.*?\]|\(.*?\)|【.*?】|\*.*?\*/g, ' ')
      .replace(
        /\b(LazMall|Shopee\s*Mall|Official\s*Store|Flagship\s*Store|Mall\s*Pullout|100%\s*Original|Authentic|COD|Free\s*Shipping|Local\s*Stock)\b/gi,
        ' '
      )
      .replace(/[^a-zA-Z0-9\s.-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 68) || 'Product';
  return `https://tse1.mm.bing.net/th?q=${encodeURIComponent(
    `${cleanTitle} product photo`
  )}&w=720&h=720&c=7&rs=1&p=0`;
}

export function buildLiveCatalogGalleryUrls(productTitle: string): string[] {
  return [buildLiveCatalogPhotoUrl(productTitle, 0)];
}

function mapCatalogRow(row: CatalogRow): HydratedCatalogItem {
  const seedMeta = SEED_META_BY_ID.get(row.id);
  const variants = parseStringArray(row.variants_json);
  const firstVariant = variants[0] ? ` ${variants[0]}` : '';
  const distinctQuery = `${row.brand_name} ${row.product_title}${firstVariant} ${row.seller_name}`.trim();
  const singleLiveUrl = buildLiveCatalogPhotoUrl(distinctQuery, 0);

  const rawImg = row.image_url || seedMeta?.imageUrl || '';
  const isCleanExternal =
    rawImg.startsWith('https://') && !rawImg.includes('images.unsplash.com');

  const resolvedImageUrl = isCleanExternal ? rawImg : singleLiveUrl;

  const seedGallery = (seedMeta?.imageUrls || []).filter(
    (u) => u.startsWith('https://') && !u.includes('images.unsplash.com')
  );
  const resolvedImageUrls =
    seedGallery.length > 0 ? seedGallery : [resolvedImageUrl];

  return {
    id: row.id,
    canonicalKey: row.canonical_key || undefined,
    productGroup: row.product_group,
    platformName: row.platform_name,
    productTitle: row.product_title,
    brandName: row.brand_name,
    sellerName: row.seller_name,
    sellerLocation: row.seller_location,
    isMallVerified: Boolean(row.is_mall_verified),
    pricePhp: row.price_php,
    originalPricePhp: row.original_price_php ?? undefined,
    starRating: row.star_rating,
    reviewCount: row.review_count,
    soldCountText: row.sold_count_text,
    imageUrl: resolvedImageUrl,
    imageUrls: resolvedImageUrls,
    sourceUrl: resolveListingExternalUrl(
      row.source_url,
      row.platform_name,
      row.product_title
    ),
    illustrationKey: row.illustration_key,
    categoryLabel: row.category_label,
    variants,
    shippingNote: row.shipping_note,
    keywordsText: row.keywords_text,
    aboutText: row.about_text,
    storeAge: seedMeta?.storeAge,
    responseRate: seedMeta?.responseRate,
    fulfillmentRate: seedMeta?.fulfillmentRate,
    storeRatingsText: seedMeta?.storeRatingsText,
  };
}

let catalogReady = false;

export function ensureMarketplaceCatalogSeeded(): void {
  if (catalogReady) return;
  const pool = getDbPool();
  const writer = pool.getWriter();

  writer.exec(`
    CREATE TABLE IF NOT EXISTS marketplace_catalog (
      id TEXT PRIMARY KEY,
      canonical_key TEXT UNIQUE,
      product_group TEXT NOT NULL,
      platform_name TEXT NOT NULL,
      product_title TEXT NOT NULL,
      brand_name TEXT NOT NULL DEFAULT '',
      seller_name TEXT NOT NULL,
      seller_location TEXT NOT NULL DEFAULT 'Metro Manila',
      is_mall_verified INTEGER NOT NULL DEFAULT 0,
      price_php REAL NOT NULL,
      original_price_php REAL,
      star_rating REAL NOT NULL DEFAULT 4.8,
      review_count INTEGER NOT NULL DEFAULT 100,
      sold_count_text TEXT NOT NULL DEFAULT '',
      image_url TEXT NOT NULL DEFAULT '',
      source_url TEXT NOT NULL,
      illustration_key TEXT NOT NULL DEFAULT 'coaster',
      category_label TEXT NOT NULL DEFAULT 'General Merchandise',
      variants_json TEXT NOT NULL DEFAULT '[]',
      keywords_text TEXT NOT NULL DEFAULT '',
      shipping_note TEXT NOT NULL DEFAULT '',
      about_text TEXT NOT NULL DEFAULT ''
    );
    CREATE INDEX IF NOT EXISTS ix_catalog_group_platform
      ON marketplace_catalog (product_group, platform_name, price_php ASC);
  `);

  pool.withWriteTransaction((db) => {
    db.prepare(
      `DELETE FROM marketplace_catalog
       WHERE platform_name = 'TikTok Shop'
          OR id LIKE 'cat_%_tt_%'
          OR id LIKE 'cat_dyn_%'
          OR id LIKE 'cat_web_%_store_%'
          OR (id LIKE 'cat_web_%' AND (
            (seller_name LIKE '%Marketplace Search%' AND price_php <= 600)
            OR seller_name LIKE '%Preferred Store (Shopee PH)%'
            OR seller_name LIKE '%Authorized Store (Lazada PH)%'
            OR seller_name LIKE '%Direct Store (Temu)%'
            OR source_url LIKE '%...%'
            OR source_url LIKE '%/tag/%'
            OR product_title LIKE '%...%'
            OR product_title LIKE '%PH Listing)%'
            OR product_title LIKE '%Cheap - Fast%'
            OR product_title LIKE '%Resmi%'
            OR product_title LIKE '%Notebookcheck%'
            OR product_title LIKE '%Jam Online%'
            OR product_title LIKE '%Jual %'
          ))`
    ).run();

    db.prepare(
      "DELETE FROM product_reviews WHERE check_id LIKE 'chk_cat_cat_dyn_%' OR check_id LIKE 'chk_cat_cat_web_%'"
    ).run();
    db.prepare(
      "DELETE FROM similar_products WHERE check_id LIKE 'chk_cat_cat_dyn_%' OR check_id LIKE 'chk_cat_cat_web_%'"
    ).run();
    db.prepare(
      "DELETE FROM platform_comparisons WHERE check_id LIKE 'chk_cat_cat_dyn_%' OR check_id LIKE 'chk_cat_cat_web_%'"
    ).run();
    db.prepare(
      "DELETE FROM product_checks WHERE id LIKE 'chk_cat_cat_dyn_%' OR id LIKE 'chk_cat_cat_web_%'"
    ).run();

    const upsertStmt = prepareCached(
      db,
      `INSERT INTO marketplace_catalog (
        id, canonical_key, product_group, platform_name, product_title, brand_name,
        seller_name, seller_location, is_mall_verified, price_php, original_price_php,
        star_rating, review_count, sold_count_text, image_url, source_url,
        illustration_key, category_label, variants_json, keywords_text, shipping_note, about_text
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?
      )
      ON CONFLICT(id) DO UPDATE SET
        canonical_key = excluded.canonical_key,
        product_group = excluded.product_group,
        platform_name = excluded.platform_name,
        product_title = excluded.product_title,
        brand_name = excluded.brand_name,
        seller_name = excluded.seller_name,
        seller_location = excluded.seller_location,
        is_mall_verified = excluded.is_mall_verified,
        price_php = excluded.price_php,
        original_price_php = excluded.original_price_php,
        star_rating = excluded.star_rating,
        review_count = excluded.review_count,
        sold_count_text = excluded.sold_count_text,
        image_url = excluded.image_url,
        source_url = excluded.source_url,
        illustration_key = excluded.illustration_key,
        category_label = excluded.category_label,
        variants_json = excluded.variants_json,
        keywords_text = excluded.keywords_text,
        shipping_note = excluded.shipping_note,
        about_text = excluded.about_text`
    );

    for (const entry of MARKETPLACE_CATALOG_SEED) {
      SEED_META_BY_ID.set(entry.id, entry);
      upsertStmt.run(
        entry.id,
        entry.canonicalKey ?? null,
        entry.productGroup,
        entry.platformName,
        entry.productTitle,
        entry.brandName,
        entry.sellerName,
        entry.sellerLocation,
        entry.isMallVerified ? 1 : 0,
        entry.pricePhp,
        entry.originalPricePhp ?? null,
        entry.starRating,
        entry.reviewCount,
        entry.soldCountText,
        entry.imageUrl ?? '',
        entry.sourceUrl,
        entry.illustrationKey,
        entry.categoryLabel,
        JSON.stringify(entry.variants),
        entry.keywordsText,
        entry.shippingNote,
        entry.aboutText
      );
    }
  });

  catalogReady = true;
}

export function extractCanonicalMarketplaceKey(rawUrl: string): string | null {
  try {
    const withScheme = /^https?:\/\//i.test(rawUrl.trim())
      ? rawUrl.trim()
      : `https://${rawUrl.trim()}`;
    const parsed = new URL(withScheme);
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname;

    if (host.includes('shopee.')) {
      const m = path.match(/-i\.(\d+)\.(\d+)/i) || path.match(/\/product\/(\d+)\/(\d+)/i);
      if (m) return `shopee:${m[1]}.${m[2]}`;
    }

    if (host.includes('lazada.')) {
      const m = path.match(/-i(\d+)(?:-s\d+)?\.html/i);
      if (m) return `lazada:${m[1]}`;
    }

    if (host.includes('temu.')) {
      const m = path.match(/-g-(\d+)\.html/i);
      if (m) return `temu:${m[1]}`;
    }
  } catch {}
  return null;
}

export function findCatalogItemById(id: string): HydratedCatalogItem | null {
  ensureMarketplaceCatalogSeeded();
  return getDbPool().withRead((db) => {
    const row = prepareCached(
      db,
      'SELECT * FROM marketplace_catalog WHERE id = ? LIMIT 1'
    ).get(id) as CatalogRow | undefined;
    return row ? mapCatalogRow(row) : null;
  });
}

export function findCatalogItemByUrl(rawUrl: string): HydratedCatalogItem | null {
  ensureMarketplaceCatalogSeeded();
  const canonicalKey = extractCanonicalMarketplaceKey(rawUrl);

  return getDbPool().withRead((db) => {
    if (canonicalKey) {
      const byKey = prepareCached(
        db,
        'SELECT * FROM marketplace_catalog WHERE canonical_key = ? LIMIT 1'
      ).get(canonicalKey) as CatalogRow | undefined;
      if (byKey) return mapCatalogRow(byKey);
    }

    const clean = rawUrl.trim().split('?')[0].replace(/\/+$/, '');
    const byUrl = prepareCached(
      db,
      'SELECT * FROM marketplace_catalog WHERE source_url = ? OR source_url = ? LIMIT 1'
    ).get(rawUrl.trim(), clean) as CatalogRow | undefined;

    return byUrl ? mapCatalogRow(byUrl) : null;
  });
}

export function findBestCatalogItemByTitle(
  rawTitle: string,
  preferredPlatform?: 'Shopee' | 'Lazada' | 'Temu'
): HydratedCatalogItem | null {
  ensureMarketplaceCatalogSeeded();
  const words = rawTitle
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(
      (w) =>
        w.length >= 2 &&
        ![
          'shopee',
          'lazada',
          'temu',
          'listing',
          'marketplace',
          'philippines',
          'ph',
          'official',
          'store',
          'mall',
        ].includes(w)
    );
  if (words.length < 2) return null;

  return getDbPool().withRead((db) => {
    const rows = prepareCached(
      db,
      "SELECT * FROM marketplace_catalog WHERE id NOT LIKE 'cat_dyn_%' AND id NOT LIKE 'cat_web_%'"
    ).all() as CatalogRow[];

    let bestRow: CatalogRow | null = null;
    let bestScore = 0;

    for (const row of rows) {
      const haystack = `${row.product_title} ${row.brand_name} ${row.keywords_text}`.toLowerCase();
      let matched = 0;
      for (const w of words) {
        if (containsWholeWordOrPhrase(haystack, w)) {
          matched += 1;
        }
      }
      const minRequired = Math.max(2, Math.ceil(words.length * 0.6));
      if (matched < minRequired) continue;

      let score = matched * 20;
      if (preferredPlatform && row.platform_name === preferredPlatform) {
        score += 10;
      }
      if (score > bestScore) {
        bestScore = score;
        bestRow = row;
      }
    }

    return bestRow ? mapCatalogRow(bestRow) : null;
  });
}

export function listCatalogItemsByGroup(
  productGroup: string,
  excludeId?: string,
  referencePricePhp?: number
): HydratedCatalogItem[] {
  ensureMarketplaceCatalogSeeded();
  return getDbPool().withRead((db) => {
    const rows = prepareCached(
      db,
      'SELECT * FROM marketplace_catalog WHERE product_group = ? ORDER BY price_php ASC'
    ).all(productGroup) as CatalogRow[];
    return rows
      .filter((r) => {
        if (r.id === excludeId) return false;
        if (referencePricePhp && referencePricePhp > 0) {
          if (r.price_php < referencePricePhp * 0.25 || r.price_php > referencePricePhp * 3.5) {
            return false;
          }
        }
        return true;
      })
      .map(mapCatalogRow);
  });
}

export function listCatalogItemsByIllustrationKey(
  illustrationKey: IllustrationKey,
  excludeUrl?: string,
  referencePricePhp?: number
): HydratedCatalogItem[] {
  ensureMarketplaceCatalogSeeded();
  return getDbPool().withRead((db) => {
    const rows = prepareCached(
      db,
      'SELECT * FROM marketplace_catalog WHERE illustration_key = ? ORDER BY star_rating DESC, price_php ASC LIMIT 24'
    ).all(illustrationKey) as CatalogRow[];
    return rows
      .filter((r) => {
        if (r.source_url === excludeUrl) return false;
        if (referencePricePhp && referencePricePhp > 0) {
          if (r.price_php < referencePricePhp * 0.25 || r.price_php > referencePricePhp * 3.5) {
            return false;
          }
        }
        return true;
      })
      .slice(0, 12)
      .map(mapCatalogRow);
  });
}

function buildDirectStoreSearchLinks(query: string): MarketplaceSearchResponse['storeSearchLinks'] {
  return [
    { platform: 'Shopee', url: buildShopSearchUrl('Shopee', query) },
    { platform: 'Lazada', url: buildShopSearchUrl('Lazada', query) },
    { platform: 'Temu', url: buildShopSearchUrl('Temu', query) },
  ];
}

function upsertDiscoveredCatalogEntries(entries: CatalogSeedEntry[]): HydratedCatalogItem[] {
  if (entries.length === 0) return [];
  const pool = getDbPool();
  pool.withWriteTransaction((db) => {
    const upsertStmt = prepareCached(
      db,
      `INSERT INTO marketplace_catalog (
        id, canonical_key, product_group, platform_name, product_title, brand_name,
        seller_name, seller_location, is_mall_verified, price_php, original_price_php,
        star_rating, review_count, sold_count_text, image_url, source_url,
        illustration_key, category_label, variants_json, keywords_text, shipping_note, about_text
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?
      )
      ON CONFLICT(id) DO UPDATE SET
        product_title = excluded.product_title,
        brand_name = excluded.brand_name,
        seller_name = excluded.seller_name,
        price_php = excluded.price_php,
        original_price_php = excluded.original_price_php,
        image_url = excluded.image_url,
        source_url = excluded.source_url,
        keywords_text = excluded.keywords_text,
        shipping_note = excluded.shipping_note,
        about_text = excluded.about_text`
    );

    for (const entry of entries) {
      SEED_META_BY_ID.set(entry.id, entry);
      upsertStmt.run(
        entry.id,
        entry.canonicalKey ?? null,
        entry.productGroup,
        entry.platformName,
        entry.productTitle,
        entry.brandName,
        entry.sellerName,
        entry.sellerLocation,
        entry.isMallVerified ? 1 : 0,
        entry.pricePhp,
        entry.originalPricePhp ?? null,
        entry.starRating,
        entry.reviewCount,
        entry.soldCountText,
        entry.imageUrl ?? '',
        entry.sourceUrl,
        entry.illustrationKey,
        entry.categoryLabel,
        JSON.stringify(entry.variants),
        entry.keywordsText,
        entry.shippingNote,
        entry.aboutText
      );
    }
  });

  return entries
    .map((e) => findCatalogItemById(e.id))
    .filter((v): v is HydratedCatalogItem => Boolean(v));
}

function buildOfflineDirectSearchCards(rawQuery: string): CatalogSeedEntry[] {
  const cleanQuery = rawQuery.trim().replace(/\s+/g, ' ').slice(0, 75);
  const slug =
    cleanQuery
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 32) || 'query';
  const meta = inferProductCategoryMeta(cleanQuery);
  const qEncoded = encodeURIComponent(cleanQuery);
  const firstWord = cleanQuery.split(' ')[0] || 'Marketplace';
  const brandName = firstWord.charAt(0).toUpperCase() + firstWord.slice(1);

  return [
    {
      id: `cat_web_${slug}_sp`,
      productGroup: `web-${slug}`,
      platformName: 'Shopee',
      productTitle: `${cleanQuery} (Shopee PH Marketplace Search)`,
      brandName,
      sellerName: 'Shopee Philippines Search',
      sellerLocation: 'Philippines',
      isMallVerified: true,
      pricePhp: meta.basePricePhp,
      starRating: 4.8,
      reviewCount: 120,
      soldCountText: 'Category benchmark',
      imageUrl: buildLiveCatalogPhotoUrl(`${cleanQuery} Shopee PH`, 0),
      sourceUrl: `https://shopee.ph/search?keyword=${qEncoded}`,
      illustrationKey: meta.illustrationKey,
      categoryLabel: meta.categoryLabel,
      variants: meta.variants,
      keywordsText: `${cleanQuery.toLowerCase()} shopee`,
      shippingNote: 'Click Open on Shopee to view live seller listings and current prices',
      aboutText: `Direct Shopee Philippines search launcher for "${cleanQuery}" benchmarked at typical ${meta.categoryLabel} pricing.`,
    },
    {
      id: `cat_web_${slug}_lz`,
      productGroup: `web-${slug}`,
      platformName: 'Lazada',
      productTitle: `${cleanQuery} (Lazada PH Marketplace Search)`,
      brandName,
      sellerName: 'Lazada Philippines Search',
      sellerLocation: 'Philippines',
      isMallVerified: true,
      pricePhp: meta.basePricePhp,
      starRating: 4.8,
      reviewCount: 95,
      soldCountText: 'Category benchmark',
      imageUrl: buildLiveCatalogPhotoUrl(`${cleanQuery} Lazada PH`, 0),
      sourceUrl: `https://www.lazada.com.ph/catalog/?q=${qEncoded}`,
      illustrationKey: meta.illustrationKey,
      categoryLabel: meta.categoryLabel,
      variants: meta.variants,
      keywordsText: `${cleanQuery.toLowerCase()} lazada`,
      shippingNote: 'Click Open on Lazada to view live LazMall and local seller prices',
      aboutText: `Direct Lazada Philippines search launcher for "${cleanQuery}" benchmarked at typical ${meta.categoryLabel} pricing.`,
    },
  ];
}

function normalizeSearchTokens(rawQuery: string): string[] {
  const normalized = rawQuery
    .toLowerCase()
    .replace(/smart\s+watch/g, 'smartwatch')
    .replace(/ear\s+buds/g, 'earbuds')
    .replace(/ear\s+phones/g, 'earphones')
    .replace(/power\s+bank/g, 'powerbank')
    .replace(/[^a-z0-9\s-]/g, ' ');

  const rawTokens = normalized
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);

  const expanded = new Set<string>();
  for (const tok of rawTokens) {
    expanded.add(tok);
    if (tok.endsWith('es') && tok.length > 4) {
      expanded.add(tok.slice(0, -2));
    } else if (tok.endsWith('s') && tok.length > 3) {
      expanded.add(tok.slice(0, -1));
    }
    if (tok === 'mice') expanded.add('mouse');
    if (tok === 'payong') expanded.add('umbrella');
    if (tok === 'relo') expanded.add('watch');
    if (tok === 'sapatos') expanded.add('shoe');
  }
  return Array.from(expanded);
}

function containsWholeWordOrPhrase(haystack: string, needle: string): boolean {
  if (!needle) return false;
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`, 'i').test(haystack);
}

export async function searchMarketplaceCatalog(
  rawQuery: string,
  platformFilter?: string
): Promise<MarketplaceSearchResponse> {
  ensureMarketplaceCatalogSeeded();
  const cleanQuery = rawQuery.trim();
  const storeSearchLinks = buildDirectStoreSearchLinks(cleanQuery || 'popular deals');

  if (!cleanQuery) {
    return {
      query: '',
      total: 0,
      items: [],
      storeSearchLinks,
    };
  }

  const queryLower = cleanQuery.toLowerCase();
  const rawWords = queryLower
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 2);
  const tokens = normalizeSearchTokens(cleanQuery);

  const curatedRows = getDbPool().withRead((db) => {
    return prepareCached(
      db,
      "SELECT * FROM marketplace_catalog WHERE id NOT LIKE 'cat_dyn_%' AND id NOT LIKE 'cat_web_%'"
    ).all() as CatalogRow[];
  });

  const scored: Array<{ item: HydratedCatalogItem; score: number }> = [];

  for (const row of curatedRows) {
    if (
      platformFilter &&
      platformFilter !== 'all' &&
      row.platform_name.toLowerCase() !== platformFilter.toLowerCase()
    ) {
      continue;
    }

    const titleLower = row.product_title.toLowerCase();
    const haystack = `${titleLower} ${row.brand_name.toLowerCase()} ${row.keywords_text.toLowerCase()} ${row.product_group.toLowerCase()}`;

    const modelTokens = rawWords.filter(
      (w) => /[a-z]/.test(w) && /\d/.test(w) && !/^(5g|4g|24g|gb|tb|hz)$/i.test(w)
    );

    if (
      modelTokens.length > 0 &&
      !modelTokens.every((mTok) => containsWholeWordOrPhrase(`${titleLower} ${row.product_group.toLowerCase()}`, mTok))
    ) {
      continue;
    }

    let matchedRawWords = 0;
    for (const word of rawWords) {
      const singular =
        word === 'mice'
          ? 'mouse'
          : word.endsWith('s') && word.length > 3
          ? word.slice(0, -1)
          : word;
      if (
        containsWholeWordOrPhrase(haystack, word) ||
        containsWholeWordOrPhrase(haystack, singular)
      ) {
        matchedRawWords += 1;
      }
    }

    let tokenHits = 0;
    for (const tok of tokens) {
      if (containsWholeWordOrPhrase(haystack, tok)) {
        tokenHits += 1;
      }
    }

    if (matchedRawWords === 0 && tokenHits === 0) {
      continue;
    }

    const requiredMatches =
      rawWords.length >= 3 ? rawWords.length - 1 : rawWords.length >= 2 ? 2 : 1;
    if (matchedRawWords < requiredMatches && !haystack.includes(queryLower)) {
      continue;
    }

    let score = matchedRawWords * 30 + tokenHits * 10;
    if (matchedRawWords === rawWords.length) score += 50;
    if (titleLower.includes(queryLower)) score += 45;
    if (row.product_group.replace(/-/g, ' ').includes(queryLower)) score += 35;
    if (row.is_mall_verified) score += 6;
    score += row.star_rating;

    scored.push({ item: mapCatalogRow(row), score });
  }

  if (scored.length < 6) {
    const liveDiscovered = await discoverLiveWebMarketplaceListings(cleanQuery);
    const entriesToUpsert =
      liveDiscovered.length > 0
        ? liveDiscovered
        : scored.length === 0
        ? buildOfflineDirectSearchCards(cleanQuery)
        : [];

    if (entriesToUpsert.length > 0) {
      const hydrated = upsertDiscoveredCatalogEntries(entriesToUpsert);
      const existingTitles = new Set(
        scored.map((s) =>
          s.item.productTitle
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, ' ')
            .trim()
            .slice(0, 42)
        )
      );

      for (let idx = 0; idx < hydrated.length; idx += 1) {
        const item = hydrated[idx];
        if (
          platformFilter &&
          platformFilter !== 'all' &&
          item.platformName.toLowerCase() !== platformFilter.toLowerCase()
        ) {
          continue;
        }
        const normKey = item.productTitle
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, ' ')
          .trim()
          .slice(0, 42);
        if (existingTitles.has(normKey)) continue;
        existingTitles.add(normKey);

        scored.push({
          item,
          score: 80 - idx * 2,
        });
      }
    }
  }

  scored.sort((a, b) => b.score - a.score || a.item.pricePhp - b.item.pricePhp);

  const orderedItems = scored.map((s) => s.item);

  return {
    query: cleanQuery,
    total: orderedItems.length,
    items: orderedItems.slice(0, 24),
    storeSearchLinks,
  };
}
