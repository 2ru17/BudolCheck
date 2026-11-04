import type { Database as SqliteDatabase } from 'better-sqlite3';
import {
  ADMIN_ACTIVITIES_PRESETS,
  ADMIN_USERS_PRESETS,
  SELLER_PRODUCTS_PRESETS,
  SELLER_PROFILE_PRESET,
} from '../../src/data/presets.ts';
import { resolveListingExternalUrl } from '../../src/lib/formatters.ts';
import {
  AdminOverviewResponse,
  AdminQueueItem,
  AdminUserRecord,
  IllustrationKey,
  PaginatedHistoryResponse,
  PaginatedReviewsResponse,
  PlatformComparisonItem,
  ProductCheckRecord,
  ProductReviewItem,
  ReviewFilterType,
  SellerDashboardResponse,
  SellerProductItem,
  SellerShopProfile,
  SimilarProductItem,
  TipGuideItem,
  UserRole,
} from '../../src/types/budol.ts';
import { getDbPool, prepareCached } from '../db/pool.ts';
import {
  buildLiveCatalogGalleryUrls,
  buildLiveCatalogPhotoUrl,
} from './catalogRepository.ts';

interface JoinedCheckRow {
  id: string;
  source_url: string;
  platform_name: 'Shopee' | 'Lazada' | 'Temu';
  product_title: string;
  listed_price: number;
  original_price: number | null;
  sold_count_text: string | null;
  shipping_note: string | null;
  variants_json: string;
  image_urls_json: string;
  illustration_key: IllustrationKey;
  imported_from: string | null;
  category_label: string | null;
  about_text: string | null;
  highlights_json: string;
  checked_at: string;
  product_check_json: string;
  seller_check_json: string;
  review_check_json: string;
  marketing_check_json: string;
  red_flags_json: string;
  final_summary_json: string;
}

interface ReviewRow {
  id: string;
  check_id: string;
  masked_username: string;
  star_rating: number;
  variant_purchased: string;
  review_comment: string;
  photo_urls: string;
  has_visuals: number;
  is_verified_purchase: number;
}

interface SimilarRow {
  id: string;
  check_id: string;
  title: string;
  sale_price: number;
  original_price: number;
  discount_percentage: number;
  promo_badge: string;
  star_rating: number;
  sold_count_text: string;
  thumbnail_key: IllustrationKey;
  thumbnail_url: string | null;
  source_url: string | null;
}

interface ComparisonRow {
  id: string;
  check_id: string;
  platform_name: 'Shopee' | 'Temu' | 'Lazada';
  product_title: string;
  price: number;
  shipping_perk: string;
  star_rating: number;
  is_best_price: number;
  source_url: string | null;
}

function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function mapReviewRow(row: ReviewRow): ProductReviewItem {
  return {
    id: row.id,
    checkId: row.check_id,
    maskedUsername: row.masked_username,
    starRating: row.star_rating,
    variantPurchased: row.variant_purchased,
    comment: row.review_comment,
    photoLabels: safeJsonParse<string[]>(row.photo_urls, []),
    hasVisuals: Boolean(row.has_visuals),
    isVerifiedPurchase: Boolean(row.is_verified_purchase),
  };
}

function mapSimilarRow(
  row: SimilarRow,
  parentPlatform: 'Shopee' | 'Lazada' | 'Temu' = 'Shopee'
): SimilarProductItem {
  const rawThumb = row.thumbnail_url || '';
  const isCleanExternal =
    rawThumb.startsWith('https://') && !rawThumb.includes('images.unsplash.com');
  const inferredPlatform =
    row.promo_badge.toLowerCase().includes('laz') ||
    (row.source_url || '').toLowerCase().includes('lazada.')
      ? 'Lazada'
      : row.promo_badge.toLowerCase().includes('temu') ||
        (row.source_url || '').toLowerCase().includes('temu.')
      ? 'Temu'
      : row.promo_badge.toLowerCase().includes('shopee') ||
        (row.source_url || '').toLowerCase().includes('shopee.')
      ? 'Shopee'
      : parentPlatform;
  return {
    id: row.id,
    title: row.title,
    salePricePhp: row.sale_price,
    originalPricePhp: row.original_price,
    discountPercentage: row.discount_percentage,
    promoBadge: row.promo_badge,
    starRating: row.star_rating,
    soldCountText: row.sold_count_text,
    illustrationType: row.thumbnail_key,
    thumbnailUrl: isCleanExternal ? rawThumb : buildLiveCatalogPhotoUrl(row.title, 0),
    sourceUrl: resolveListingExternalUrl(row.source_url, inferredPlatform, row.title),
  };
}

function mapComparisonRow(row: ComparisonRow): PlatformComparisonItem {
  return {
    id: row.id,
    platformName: row.platform_name,
    productTitle: row.product_title,
    pricePhp: row.price,
    shippingPerk: row.shipping_perk,
    starRating: row.star_rating,
    isBestPrice: Boolean(row.is_best_price),
    sourceUrl: resolveListingExternalUrl(
      row.source_url,
      row.platform_name,
      row.product_title
    ),
  };
}

function hydrateRowsBatched(db: SqliteDatabase, baseRows: JoinedCheckRow[]): ProductCheckRecord[] {
  if (baseRows.length === 0) return [];

  const checkIds = baseRows.map((row) => row.id);
  const placeholders = checkIds.map(() => '?').join(', ');

  const reviewRows = db
    .prepare(
      `SELECT id, check_id, masked_username, star_rating, variant_purchased, review_comment, photo_urls, has_visuals, is_verified_purchase
       FROM product_reviews
       WHERE check_id IN (${placeholders})
       ORDER BY star_rating DESC, has_visuals DESC`
    )
    .all(...checkIds) as ReviewRow[];

  const similarRows = db
    .prepare(
      `SELECT id, check_id, title, sale_price, original_price, discount_percentage, promo_badge, star_rating, sold_count_text, thumbnail_key, thumbnail_url, source_url
       FROM similar_products
       WHERE check_id IN (${placeholders})
       ORDER BY sale_price ASC`
    )
    .all(...checkIds) as SimilarRow[];

  const comparisonRows = db
    .prepare(
      `SELECT id, check_id, platform_name, product_title, price, shipping_perk, star_rating, is_best_price, source_url
       FROM platform_comparisons
       WHERE check_id IN (${placeholders})
       ORDER BY price ASC`
    )
    .all(...checkIds) as ComparisonRow[];

  const reviewsByCheck = new Map<string, ProductReviewItem[]>();
  const similarByCheck = new Map<string, SimilarProductItem[]>();
  const comparisonsByCheck = new Map<string, PlatformComparisonItem[]>();

  for (const row of reviewRows) {
    const bucket = reviewsByCheck.get(row.check_id) ?? [];
    bucket.push(mapReviewRow(row));
    reviewsByCheck.set(row.check_id, bucket);
  }

  for (const row of similarRows) {
    const bucket = similarByCheck.get(row.check_id) ?? [];
    bucket.push(mapSimilarRow(row));
    similarByCheck.set(row.check_id, bucket);
  }

  for (const row of comparisonRows) {
    if ((row.platform_name as string) === 'TikTok Shop') continue;
    const bucket = comparisonsByCheck.get(row.check_id) ?? [];
    bucket.push(mapComparisonRow(row));
    comparisonsByCheck.set(row.check_id, bucket);
  }

  return baseRows
    .filter((row) => (row.platform_name as string) !== 'TikTok Shop')
    .map((row) => {
      const variants = safeJsonParse<string[]>(row.variants_json, []);
      const rawImageUrls = safeJsonParse<string[]>(row.image_urls_json, []).filter(
        (u) => u && u.startsWith('https://') && !u.includes('images.unsplash.com')
      );
      const liveGallery = buildLiveCatalogGalleryUrls(row.product_title);
      const imageUrls =
        rawImageUrls.length >= 4
          ? rawImageUrls
          : [...rawImageUrls, ...liveGallery.filter((u) => !rawImageUrls.includes(u))].slice(0, 4);
      const highlights = safeJsonParse<string[]>(row.highlights_json, []);

    const parsedOverview = safeJsonParse<ProductCheckRecord['overview']>(row.product_check_json, {
      material: 'Unspecified',
      pattern: 'Standard',
      quantity: '1 pc',
      claims: [],
      contradictionWarning: '',
    });

    return {
      id: row.id,
      sourceUrl: resolveListingExternalUrl(
        row.source_url,
        row.platform_name,
        row.product_title
      ),
      platformName: row.platform_name,
      productTitle: row.product_title,
      listedPricePhp: row.listed_price,
      originalPricePhp: row.original_price ?? undefined,
      isPriceEstimated: Boolean(parsedOverview.isPriceEstimated),
      soldCountText: row.sold_count_text ?? undefined,
      shippingNote: row.shipping_note ?? undefined,
      variants: variants.length > 0 ? variants : undefined,
      illustrationKey: row.illustration_key,
      imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      checkedAt: row.checked_at,
      importedFrom: row.imported_from ?? undefined,
      categoryLabel: row.category_label ?? undefined,
      aboutText: row.about_text ?? undefined,
      highlights: highlights.length > 0 ? highlights : undefined,
      overview: parsedOverview,
      seller: safeJsonParse<ProductCheckRecord['seller']>(row.seller_check_json, {
        storeName: 'Unknown Store',
        storeAge: 'Unverified',
        storeLocation: 'Philippines',
        responseRate: '85%',
        fulfillmentRate: '92%',
        cancellationRate: '2.0%',
        certificateId: 'Pending Verification',
        rating: 4.5,
        reviewCountText: '0 reviews',
        checklist: {
          verifiedSeller: false,
          customerRating: false,
          productInfoConfirmed: false,
          returnPolicy: true,
        },
        unverifiedNote: '',
      }),
      reviewSummary: safeJsonParse<ProductCheckRecord['reviewSummary']>(row.review_check_json, {
        productReviewsCount: 0,
        productAverageRating: 0,
        storeReviewsCountText: '0',
        filterCounts: {
          visuals: '0',
          star5: '0',
          star4: '0',
          star3: '0',
          critical: '0',
        },
      }),
      reviews: reviewsByCheck.get(row.id) ?? [],
      similarProducts: similarByCheck.get(row.id) ?? [],
      comparisons: comparisonsByCheck.get(row.id) ?? [],
      marketing: safeJsonParse<ProductCheckRecord['marketing']>(row.marketing_check_json, {
        hypeScoreLabel: 'Moderate Promo Pressure',
        summary: '',
        tactics: [],
      }),
      redFlags: safeJsonParse<ProductCheckRecord['redFlags']>(row.red_flags_json, {
        riskScore: 50,
        riskLabel: 'Moderate Risk (50/100)',
        items: [],
      }),
      finalSummary: safeJsonParse<ProductCheckRecord['finalSummary']>(row.final_summary_json, {
        verdictTitle: 'Review Before Buying',
        verdictSubtitle: '',
        checkedAndVerified: [],
        needsVerification: [],
      }),
    };
  });
}

const BASE_SELECT_SQL = `
  SELECT
    pc.id,
    pc.source_url,
    pc.platform_name,
    pc.product_title,
    pc.listed_price,
    pc.original_price,
    pc.sold_count_text,
    pc.shipping_note,
    pc.variants_json,
    pc.image_urls_json,
    pc.illustration_key,
    pc.imported_from,
    pc.category_label,
    pc.about_text,
    pc.highlights_json,
    pc.checked_at,
    cm.product_check_json,
    cm.seller_check_json,
    cm.review_check_json,
    cm.marketing_check_json,
    cm.red_flags_json,
    cm.final_summary_json
  FROM product_checks pc
  INNER JOIN check_modules_result cm ON cm.check_id = pc.id
`;

export function listAllChecksBatched(): ProductCheckRecord[] {
  return getDbPool().withRead((db) => {
    const stmt = prepareCached(
      db,
      `${BASE_SELECT_SQL} ORDER BY pc.checked_at DESC LIMIT 50`
    );
    const rows = stmt.all() as JoinedCheckRow[];
    return hydrateRowsBatched(db, rows);
  });
}

export function listHistoryChecksPaginated(
  page: number,
  limit: number,
  userId?: string
): PaginatedHistoryResponse {
  return getDbPool().withRead((db) => {
    const safeLimit = Math.min(Math.max(1, limit), 50);
    const countRow = userId
      ? (prepareCached(
          db,
          'SELECT COUNT(*) AS count FROM product_checks WHERE user_id = ?'
        ).get(userId) as { count: number })
      : (prepareCached(db, 'SELECT COUNT(*) AS count FROM product_checks').get() as {
          count: number;
        });

    const total = countRow.count;
    const totalPages = Math.max(1, Math.ceil(total / safeLimit));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const offset = (safePage - 1) * safeLimit;

    const rows = userId
      ? (prepareCached(
          db,
          `${BASE_SELECT_SQL} WHERE pc.user_id = ? ORDER BY pc.checked_at DESC LIMIT ? OFFSET ?`
        ).all(userId, safeLimit, offset) as JoinedCheckRow[])
      : (prepareCached(
          db,
          `${BASE_SELECT_SQL} ORDER BY pc.checked_at DESC LIMIT ? OFFSET ?`
        ).all(safeLimit, offset) as JoinedCheckRow[]);

    return {
      items: hydrateRowsBatched(db, rows),
      total,
      page: safePage,
      limit: safeLimit,
      totalPages,
    };
  });
}

export function getCheckByIdBatched(checkId: string): ProductCheckRecord | null {
  return getDbPool().withRead((db) => {
    const row = prepareCached(db, `${BASE_SELECT_SQL} WHERE pc.id = ? LIMIT 1`).get(checkId) as
      | JoinedCheckRow
      | undefined;
    if (!row) return null;
    return hydrateRowsBatched(db, [row])[0] ?? null;
  });
}

export function getCheckBySourceUrlBatched(sourceUrl: string): ProductCheckRecord | null {
  return getDbPool().withRead((db) => {
    const row = prepareCached(
      db,
      `${BASE_SELECT_SQL} WHERE pc.source_url = ? LIMIT 1`
    ).get(sourceUrl) as JoinedCheckRow | undefined;
    if (!row) return null;
    return hydrateRowsBatched(db, [row])[0] ?? null;
  });
}

export function searchCheckByKeywordBatched(keyword: string): ProductCheckRecord | null {
  const cleaned = keyword.trim().toLowerCase();
  if (!cleaned) return null;
  return getDbPool().withRead((db) => {
    const pattern = `%${cleaned}%`;
    const row = prepareCached(
      db,
      `${BASE_SELECT_SQL} WHERE LOWER(pc.product_title) LIKE ? OR LOWER(pc.category_label) LIKE ? ORDER BY pc.checked_at DESC LIMIT 1`
    ).get(pattern, pattern) as JoinedCheckRow | undefined;
    if (!row) return null;
    return hydrateRowsBatched(db, [row])[0] ?? null;
  });
}

export function getPaginatedReviewsFromDb(
  checkId: string,
  filter: ReviewFilterType,
  page: number,
  limit: number
): PaginatedReviewsResponse {
  return getDbPool().withRead((db) => {
    const safeLimit = Math.min(Math.max(1, limit), 20);
    let whereSuffix = '';
    const filterParams: Array<string | number> = [checkId];

    if (filter === 'visuals') {
      whereSuffix = ' AND has_visuals = 1';
    } else if (filter === '5star') {
      whereSuffix = ' AND star_rating = 5';
    } else if (filter === '4star') {
      whereSuffix = ' AND star_rating = 4';
    } else if (filter === '3star') {
      whereSuffix = ' AND star_rating = 3';
    } else if (filter === 'critical') {
      whereSuffix = ' AND star_rating <= 2';
    }

    const countRow = prepareCached(
      db,
      `SELECT COUNT(*) AS count FROM product_reviews WHERE check_id = ?${whereSuffix}`
    ).get(...filterParams) as { count: number };

    const total = countRow.count;
    const totalPages = Math.max(1, Math.ceil(total / safeLimit));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const offset = (safePage - 1) * safeLimit;

    const rows = prepareCached(
      db,
      `SELECT id, check_id, masked_username, star_rating, variant_purchased, review_comment, photo_urls, has_visuals, is_verified_purchase
       FROM product_reviews
       WHERE check_id = ?${whereSuffix}
       ORDER BY star_rating DESC, has_visuals DESC
       LIMIT ? OFFSET ?`
    ).all(...filterParams, safeLimit, offset) as ReviewRow[];

    return {
      items: rows.map(mapReviewRow),
      total,
      page: safePage,
      limit: safeLimit,
      totalPages,
    };
  });
}

export function upsertProductCheckRecord(
  record: ProductCheckRecord,
  userId = 'usr_daisy_001'
): ProductCheckRecord {
  return getDbPool().withWriteTransaction((db) => {
    prepareCached(
      db,
      `INSERT INTO product_checks (
        id, user_id, source_url, input_method, platform_name, product_title,
        listed_price, original_price, sold_count_text, shipping_note, variants_json,
        currency, hero_image_url, image_urls_json, illustration_key, imported_from,
        category_label, about_text, highlights_json, overview_specs, is_saved, checked_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        'PHP', ?, ?, ?, ?,
        ?, ?, ?, ?, 0, ?
      )
      ON CONFLICT(id) DO UPDATE SET
        source_url = excluded.source_url,
        platform_name = excluded.platform_name,
        product_title = excluded.product_title,
        listed_price = excluded.listed_price,
        original_price = excluded.original_price,
        sold_count_text = excluded.sold_count_text,
        shipping_note = excluded.shipping_note,
        variants_json = excluded.variants_json,
        hero_image_url = excluded.hero_image_url,
        image_urls_json = excluded.image_urls_json,
        illustration_key = excluded.illustration_key,
        imported_from = excluded.imported_from,
        category_label = excluded.category_label,
        about_text = excluded.about_text,
        highlights_json = excluded.highlights_json,
        overview_specs = excluded.overview_specs,
        checked_at = excluded.checked_at`
    ).run(
      record.id,
      userId,
      record.sourceUrl,
      record.importedFrom === 'Image upload' ? 'image' : 'url',
      record.platformName,
      record.productTitle,
      record.listedPricePhp,
      record.originalPricePhp ?? null,
      record.soldCountText ?? null,
      record.shippingNote ?? null,
      JSON.stringify(record.variants ?? []),
      record.imageUrls?.[0] ?? '',
      JSON.stringify(record.imageUrls ?? []),
      record.illustrationKey,
      record.importedFrom ?? null,
      record.categoryLabel ?? null,
      record.aboutText ?? null,
      JSON.stringify(record.highlights ?? []),
      JSON.stringify({
        material: record.overview.material,
        pattern: record.overview.pattern,
        quantity: record.overview.quantity,
      }),
      record.checkedAt
    );

    prepareCached(
      db,
      `INSERT INTO check_modules_result (
        id, check_id, product_check_json, seller_check_json, review_check_json,
        marketing_check_json, red_flags_json, final_summary_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(check_id) DO UPDATE SET
        product_check_json = excluded.product_check_json,
        seller_check_json = excluded.seller_check_json,
        review_check_json = excluded.review_check_json,
        marketing_check_json = excluded.marketing_check_json,
        red_flags_json = excluded.red_flags_json,
        final_summary_json = excluded.final_summary_json`
    ).run(
      `mod_${record.id}`,
      record.id,
      JSON.stringify({
        ...record.overview,
        isPriceEstimated: Boolean(
          record.isPriceEstimated ?? record.overview.isPriceEstimated
        ),
      }),
      JSON.stringify(record.seller),
      JSON.stringify(record.reviewSummary),
      JSON.stringify(record.marketing),
      JSON.stringify(record.redFlags),
      JSON.stringify(record.finalSummary)
    );

    prepareCached(db, 'DELETE FROM product_reviews WHERE check_id = ?').run(record.id);
    const insertReview = prepareCached(
      db,
      `INSERT INTO product_reviews (
        id, check_id, masked_username, star_rating, variant_purchased,
        review_comment, photo_urls, has_visuals, is_verified_purchase
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const rev of record.reviews) {
      insertReview.run(
        rev.id,
        record.id,
        rev.maskedUsername,
        rev.starRating,
        rev.variantPurchased,
        rev.comment,
        JSON.stringify(rev.photoLabels),
        rev.hasVisuals ? 1 : 0,
        rev.isVerifiedPurchase ? 1 : 0
      );
    }

    prepareCached(db, 'DELETE FROM similar_products WHERE check_id = ?').run(record.id);
    const insertSimilar = prepareCached(
      db,
      `INSERT INTO similar_products (
        id, check_id, title, sale_price, original_price, discount_percentage,
        promo_badge, star_rating, sold_count, sold_count_text, thumbnail_key, thumbnail_url, source_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const sim of record.similarProducts) {
      insertSimilar.run(
        sim.id,
        record.id,
        sim.title,
        sim.salePricePhp,
        sim.originalPricePhp,
        sim.discountPercentage,
        sim.promoBadge,
        sim.starRating,
        0,
        sim.soldCountText,
        sim.illustrationType,
        sim.thumbnailUrl ?? null,
        sim.sourceUrl ?? null
      );
    }

    prepareCached(db, 'DELETE FROM platform_comparisons WHERE check_id = ?').run(record.id);
    const insertComparison = prepareCached(
      db,
      `INSERT INTO platform_comparisons (
        id, check_id, platform_name, product_title, price, shipping_perk,
        star_rating, is_best_price, is_saved, source_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`
    );
    for (const cmp of record.comparisons) {
      insertComparison.run(
        cmp.id,
        record.id,
        cmp.platformName,
        cmp.productTitle,
        cmp.pricePhp,
        cmp.shippingPerk,
        cmp.starRating,
        cmp.isBestPrice ? 1 : 0,
        cmp.sourceUrl ?? null
      );
    }

    return record;
  });
}

export function listTipsFromDb(): TipGuideItem[] {
  return getDbPool().withRead((db) => {
    const rows = prepareCached(
      db,
      `SELECT id, category, title, summary, body_markdown
       FROM tips_and_guides
       WHERE is_active = 1
       ORDER BY display_order ASC`
    ).all() as Array<{
      id: string;
      category: TipGuideItem['category'];
      title: string;
      summary: string;
      body_markdown: string;
    }>;

    return rows.map((row) => ({
      id: row.id,
      category: row.category,
      title: row.title,
      summary: row.summary,
      steps: safeJsonParse<string[]>(row.body_markdown, []),
    }));
  });
}

interface AdminQueueRow {
  id: string;
  product_title: string;
  subtitle: string | null;
  platform: string;
  flag_reason: string;
  reports_count: number;
  price_anomaly: string;
  reported_date: string | null;
  report_category: 'report' | 'complaint' | null;
  thumbnail_url: string | null;
  illustration_key: IllustrationKey | null;
  source_url: string | null;
  status: AdminQueueItem['status'];
}

function mapAdminQueueRow(row: AdminQueueRow): AdminQueueItem {
  return {
    id: row.id,
    productTitle: row.product_title,
    subtitle: row.subtitle ?? row.flag_reason,
    platform: row.platform,
    flagReason: row.flag_reason,
    reportsCount: row.reports_count,
    priceAnomaly: row.price_anomaly,
    reportedDate: row.reported_date ?? 'Reported on November 2, 2026',
    reportCategory: row.report_category ?? 'report',
    thumbnailUrl: row.thumbnail_url ?? undefined,
    illustrationKey: row.illustration_key ?? 'shoes',
    sourceUrl: row.source_url || undefined,
    status: row.status,
  };
}

export function listAdminQueueFromDb(): AdminQueueItem[] {
  return getDbPool().withRead((db) => {
    const rows = prepareCached(
      db,
      `SELECT id, product_title, subtitle, platform, flag_reason, reports_count, price_anomaly,
              reported_date, report_category, thumbnail_url, illustration_key, source_url, status
       FROM admin_queue
       ORDER BY id ASC`
    ).all() as AdminQueueRow[];

    return rows.map(mapAdminQueueRow);
  });
}

export function updateAdminQueueItemStatusInDb(
  itemId: string,
  status: AdminQueueItem['status']
): AdminQueueItem | null {
  return getDbPool().withWriteTransaction((db) => {
    const result = prepareCached(
      db,
      'UPDATE admin_queue SET status = ?, updated_at = ? WHERE id = ?'
    ).run(status, new Date().toISOString(), itemId);

    if (result.changes === 0) return null;

    const row = prepareCached(
      db,
      `SELECT id, product_title, subtitle, platform, flag_reason, reports_count, price_anomaly,
              reported_date, report_category, thumbnail_url, illustration_key, source_url, status
       FROM admin_queue
       WHERE id = ?`
    ).get(itemId) as AdminQueueRow;

    return mapAdminQueueRow(row);
  });
}

export function createAdminQueueItemInDb(input: {
  productTitle: string;
  subtitle?: string;
  platform: 'Shopee' | 'Lazada' | 'Temu';
  flagReason: string;
  reportCategory?: 'report' | 'complaint';
  priceAnomaly?: string;
  illustrationKey?: IllustrationKey;
  thumbnailUrl?: string;
  sourceUrl?: string;
}): AdminQueueItem {
  return getDbPool().withWriteTransaction((db) => {
    const id = `adm_${Date.now().toString(36)}`;
    const nowIso = new Date().toISOString();
    const dateLabel = `Reported on ${new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })}`;
    const reportCategory = input.reportCategory ?? 'report';
    const initialStatus: AdminQueueItem['status'] =
      reportCategory === 'complaint' ? 'pending' : 'under_review';
    const subtitle = input.subtitle?.trim() || input.flagReason.trim();
    const priceAnomaly =
      input.priceAnomaly?.trim() ||
      (reportCategory === 'complaint' ? 'Order / Fulfillment Issue' : 'Community Flagged');
    const illustrationKey = input.illustrationKey ?? 'bag';
    const thumbnailUrl =
      input.thumbnailUrl?.trim() || buildLiveCatalogPhotoUrl(input.productTitle, 0);
    const sourceUrl = input.sourceUrl?.trim() || '';

    prepareCached(
      db,
      `INSERT INTO admin_queue (
        id, product_title, subtitle, platform, flag_reason, reports_count,
        price_anomaly, reported_date, report_category, thumbnail_url,
        illustration_key, source_url, status, updated_at
      ) VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      input.productTitle.trim(),
      subtitle,
      input.platform,
      input.flagReason.trim(),
      priceAnomaly,
      dateLabel,
      reportCategory,
      thumbnailUrl,
      illustrationKey,
      sourceUrl,
      initialStatus,
      nowIso
    );

    return {
      id,
      productTitle: input.productTitle.trim(),
      subtitle,
      platform: input.platform,
      flagReason: input.flagReason.trim(),
      reportsCount: 1,
      priceAnomaly,
      reportedDate: dateLabel,
      reportCategory,
      thumbnailUrl,
      illustrationKey,
      sourceUrl: sourceUrl || undefined,
      status: initialStatus,
    };
  });
}

export function getAdminOverviewFromDb(): AdminOverviewResponse {
  return getDbPool().withRead((db) => {
    const userRows = prepareCached(
      db,
      `SELECT id, email, full_name, role, connected_shop_account, created_at
       FROM users
       WHERE role IN ('user', 'seller', 'admin')
         AND id NOT LIKE 'usr_alias_%'
         AND id != 'usr_seller_001'
       ORDER BY created_at ASC`
    ).all() as Array<{
      id: string;
      email: string;
      full_name: string;
      role: string;
      connected_shop_account: string | null;
      created_at: string;
    }>;

    const palette = [
      '#D7E6D0',
      '#FAD6B8',
      '#DCE9F6',
      '#FDEEC8',
      '#FCE2DF',
      '#E4EFE0',
      '#DFD8F5',
    ];

    const users: AdminUserRecord[] =
      userRows.length > 0
        ? userRows.map((u, idx) => {
            const presetMatch = ADMIN_USERS_PRESETS.find(
              (p) => p.id === u.id || p.email.toLowerCase() === u.email.toLowerCase()
            );
            const normalizedRole: UserRole =
              u.role === 'seller' ? 'seller' : u.role === 'admin' ? 'admin' : 'user';
            return {
              id: u.id,
              fullName: u.full_name,
              email: u.email,
              role: normalizedRole,
              connectedShop:
                u.connected_shop_account ||
                presetMatch?.connectedShop ||
                'Shopee / Lazada PH',
              avatarColor: presetMatch?.avatarColor ?? palette[idx % palette.length],
              createdAt: u.created_at || presetMatch?.createdAt || '2026-11-02T08:00:00Z',
            };
          })
        : ADMIN_USERS_PRESETS;

    const checksCountRow = prepareCached(
      db,
      'SELECT COUNT(*) AS count FROM product_checks'
    ).get() as { count: number };

    const catalogCountRow = prepareCached(
      db,
      'SELECT COUNT(*) AS count FROM marketplace_catalog'
    ).get() as { count: number };

    const activeUsersCount = users.filter((u) => u.role === 'user').length;
    const activeSellersCount = users.filter((u) => u.role === 'seller').length;

    return {
      stats: {
        usersCount: Math.max(activeUsersCount, 1),
        sellersCount: Math.max(activeSellersCount, 1),
        checkedProductsCount: checksCountRow.count + catalogCountRow.count,
      },
      activities: ADMIN_ACTIVITIES_PRESETS,
      users,
      reports: listAdminQueueFromDb(),
    };
  });
}

export function updateAdminUserRoleInDb(
  userId: string,
  role: 'user' | 'seller' | 'admin'
): AdminUserRecord | null {
  return getDbPool().withWriteTransaction((db) => {
    const result = prepareCached(
      db,
      'UPDATE users SET role = ? WHERE id = ?'
    ).run(role, userId);

    if (result.changes === 0) return null;

    const row = prepareCached(
      db,
      'SELECT id, email, full_name, role, connected_shop_account, created_at FROM users WHERE id = ?'
    ).get(userId) as
      | {
          id: string;
          email: string;
          full_name: string;
          role: string;
          connected_shop_account: string | null;
          created_at: string;
        }
      | undefined;

    if (!row) return null;
    const presetMatch = ADMIN_USERS_PRESETS.find((p) => p.id === row.id);
    const normalizedRole: UserRole =
      row.role === 'seller' ? 'seller' : row.role === 'admin' ? 'admin' : 'user';
    return {
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      role: normalizedRole,
      connectedShop:
        row.connected_shop_account ||
        presetMatch?.connectedShop ||
        'Shopee / Lazada PH',
      avatarColor: presetMatch?.avatarColor ?? '#D7E6D0',
      createdAt: row.created_at || presetMatch?.createdAt || '2026-11-02T08:00:00Z',
    };
  });
}

interface SellerProductRow {
  id: string;
  owner_user_id: string | null;
  title: string;
  price_php: number;
  status: 'active' | 'pending';
  platform: 'Shopee' | 'Lazada' | 'Temu';
  image_url: string;
  illustration_key: IllustrationKey;
  spec_note: string;
  source_url: string;
  updated_at: string;
}

function mapSellerProductRow(row: SellerProductRow): SellerProductItem {
  return {
    id: row.id,
    title: row.title,
    pricePhp: row.price_php,
    status: row.status,
    platform: row.platform,
    imageUrl: row.image_url || buildLiveCatalogPhotoUrl(row.title, 0),
    illustrationKey: row.illustration_key || 'shoes',
    specNote: row.spec_note || undefined,
    sourceUrl: row.source_url || undefined,
    updatedAt: row.updated_at,
  };
}

export function getSellerDashboardFromDb(sellerUserId?: string): SellerDashboardResponse {
  return getDbPool().withRead((db) => {
    const targetUserId = sellerUserId || 'usr_zavina_006';

    const userRow = prepareCached(
      db,
      'SELECT id, full_name, email, connected_shop_account FROM users WHERE id = ? LIMIT 1'
    ).get(targetUserId) as
      | {
          id: string;
          full_name: string;
          email: string;
          connected_shop_account: string;
        }
      | undefined;

    const isZavinaOrSeed =
      targetUserId === 'usr_zavina_006' ||
      targetUserId === 'usr_seller_001' ||
      userRow?.email?.toLowerCase().startsWith('zavina');

    const storeRow = prepareCached(
      db,
      `SELECT id, owner_user_id, store_name, platform_name, seller_rating, review_count,
              is_verified_seller, store_location, shop_description,
              phone_number, platforms_json, certificate_id, transparency_score, store_url
       FROM seller_stores
       WHERE owner_user_id = ?
       LIMIT 1`
    ).get(targetUserId) as
      | {
          id: string;
          owner_user_id: string | null;
          store_name: string;
          platform_name: string;
          seller_rating: number;
          review_count: number;
          is_verified_seller: number;
          store_location: string;
          shop_description: string | null;
          phone_number: string | null;
          platforms_json: string | null;
          certificate_id: string | null;
          transparency_score: number | null;
          store_url: string | null;
        }
      | undefined;

    const productRows = prepareCached(
      db,
      `SELECT id, owner_user_id, title, price_php, status, platform,
              image_url, illustration_key, spec_note, source_url, updated_at
       FROM seller_products
       WHERE owner_user_id = ?
       ORDER BY updated_at DESC, id ASC`
    ).all(targetUserId) as SellerProductRow[];

    const derivedShopName =
      userRow?.connected_shop_account?.replace(/\s*\(.*?\)\s*$/, '').trim() ||
      (userRow?.full_name ? `${userRow.full_name} Official Store` : SELLER_PROFILE_PRESET.shopName);

    const profile: SellerShopProfile = storeRow
      ? {
          id: storeRow.id,
          ownerName: userRow?.full_name ?? SELLER_PROFILE_PRESET.ownerName,
          shopName: storeRow.store_name || derivedShopName,
          verificationStatus: storeRow.is_verified_seller ? 'Verified!' : 'Pending Review',
          shopDescription:
            storeRow.shop_description ||
            `Verified merchant storefront operated by ${userRow?.full_name || derivedShopName}.`,
          phoneNumber: storeRow.phone_number || '09170000000',
          platforms: safeJsonParse<Array<'Shopee' | 'Lazada' | 'Temu'>>(
            storeRow.platforms_json,
            ['Shopee', 'Lazada', 'Temu']
          ),
          certificateId: storeRow.certificate_id || 'DTI-88412-2026-NCR',
          storeLocation: storeRow.store_location || 'Metro Manila, Philippines',
          sellerRating: storeRow.seller_rating ?? 4.9,
          reviewCount: storeRow.review_count ?? 0,
          transparencyScore: storeRow.transparency_score ?? 95,
          storeUrl:
            storeRow.store_url ||
            (isZavinaOrSeed ? SELLER_PROFILE_PRESET.storeUrl : undefined),
        }
      : isZavinaOrSeed
      ? SELLER_PROFILE_PRESET
      : {
          id: `str_${targetUserId}`,
          ownerName: userRow?.full_name || 'Verified Seller',
          shopName: derivedShopName,
          verificationStatus: 'Verified!',
          shopDescription: `Official merchant storefront managed by ${userRow?.full_name || derivedShopName}.`,
          phoneNumber: '09170000000',
          platforms: ['Shopee', 'Lazada', 'Temu'],
          certificateId: 'DTI-VERIFIED-2026',
          storeLocation: 'Metro Manila, Philippines',
          sellerRating: 4.9,
          reviewCount: 1,
          transparencyScore: 95,
        };

    return {
      profile,
      products:
        productRows.length > 0
          ? productRows.map(mapSellerProductRow)
          : isZavinaOrSeed
          ? SELLER_PRODUCTS_PRESETS
          : [],
    };
  });
}

export function createSellerProductInDb(
  input: {
    title: string;
    pricePhp: number;
    platform: 'Shopee' | 'Lazada' | 'Temu';
    status?: 'active' | 'pending';
    illustrationKey?: IllustrationKey;
    thumbnailUrl?: string;
    specNote?: string;
    sourceUrl?: string;
  },
  sellerUserId = 'usr_zavina_006'
): SellerProductItem {
  return getDbPool().withWriteTransaction((db) => {
    const id = `sprod_${Date.now().toString(36)}`;
    const now = new Date().toISOString();
    const status = input.status ?? 'pending';
    const illustrationKey = input.illustrationKey ?? 'bag';
    const imageUrl =
      input.thumbnailUrl?.trim() || buildLiveCatalogPhotoUrl(input.title, 0);
    const specNote = input.specNote?.trim() || '';
    const sourceUrl = input.sourceUrl?.trim() || '';

    prepareCached(
      db,
      `INSERT INTO seller_products (
        id, owner_user_id, title, price_php, status, platform,
        image_url, illustration_key, spec_note, source_url, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      sellerUserId,
      input.title.trim(),
      Math.max(1, Math.round(input.pricePhp)),
      status,
      input.platform,
      imageUrl,
      illustrationKey,
      specNote,
      sourceUrl,
      now
    );

    return {
      id,
      title: input.title.trim(),
      pricePhp: Math.max(1, Math.round(input.pricePhp)),
      status,
      platform: input.platform,
      imageUrl,
      illustrationKey,
      specNote: specNote || undefined,
      sourceUrl: sourceUrl || undefined,
      updatedAt: now,
    };
  });
}

export function updateSellerProductStatusInDb(
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
): SellerProductItem | null {
  return getDbPool().withWriteTransaction((db) => {
    const existing = prepareCached(
      db,
      `SELECT id, owner_user_id, title, price_php, status, platform,
              image_url, illustration_key, spec_note, source_url, updated_at
       FROM seller_products WHERE id = ? LIMIT 1`
    ).get(productId) as SellerProductRow | undefined;

    if (!existing) return null;

    const nextStatus = updates.status ?? existing.status;
    const nextPrice =
      updates.pricePhp !== undefined
        ? Math.max(1, Math.round(updates.pricePhp))
        : existing.price_php;
    const nextTitle = updates.title?.trim() || existing.title;
    const nextPlatform = updates.platform ?? existing.platform;
    const nextSpecNote =
      updates.specNote !== undefined ? updates.specNote.trim() : existing.spec_note;
    const nextSourceUrl =
      updates.sourceUrl !== undefined ? updates.sourceUrl.trim() : existing.source_url;
    const nextIllustration = updates.illustrationKey ?? existing.illustration_key;
    const now = new Date().toISOString();

    prepareCached(
      db,
      `UPDATE seller_products
       SET title = ?, price_php = ?, status = ?, platform = ?, spec_note = ?, source_url = ?, illustration_key = ?, updated_at = ?
       WHERE id = ?`
    ).run(
      nextTitle,
      nextPrice,
      nextStatus,
      nextPlatform,
      nextSpecNote,
      nextSourceUrl,
      nextIllustration,
      now,
      productId
    );

    return {
      id: existing.id,
      title: nextTitle,
      pricePhp: nextPrice,
      status: nextStatus,
      platform: nextPlatform,
      imageUrl: existing.image_url,
      illustrationKey: nextIllustration,
      specNote: nextSpecNote || undefined,
      sourceUrl: nextSourceUrl || undefined,
      updatedAt: now,
    };
  });
}

export function deleteSellerProductInDb(productId: string): boolean {
  return getDbPool().withWriteTransaction((db) => {
    const res = prepareCached(
      db,
      'DELETE FROM seller_products WHERE id = ?'
    ).run(productId);
    return res.changes > 0;
  });
}

export function updateSellerProfileInDb(
  updates: {
    storeName?: string;
    shopDescription?: string;
    phoneNumber?: string;
    platforms?: Array<'Shopee' | 'Lazada' | 'Temu'>;
    storeUrl?: string;
  },
  sellerUserId = 'usr_zavina_006'
): SellerShopProfile {
  return getDbPool().withWriteTransaction((db) => {
    const current = getSellerDashboardFromDb(sellerUserId).profile;
    const nextStoreName = updates.storeName?.trim() || current.shopName;
    const nextDesc = updates.shopDescription?.trim() || current.shopDescription;
    const nextPhone = updates.phoneNumber?.trim() || current.phoneNumber;
    const nextPlatforms =
      updates.platforms && updates.platforms.length > 0
        ? updates.platforms
        : current.platforms;
    const nextStoreUrl =
      updates.storeUrl !== undefined ? updates.storeUrl.trim() : current.storeUrl ?? '';
    const nowIso = new Date().toISOString();

    const existingStore = prepareCached(
      db,
      'SELECT id FROM seller_stores WHERE owner_user_id = ? LIMIT 1'
    ).get(sellerUserId) as { id: string } | undefined;

    if (existingStore) {
      prepareCached(
        db,
        `UPDATE seller_stores
         SET store_name = ?, shop_description = ?, phone_number = ?, platforms_json = ?, store_url = ?, updated_at = ?
         WHERE id = ?`
      ).run(
        nextStoreName,
        nextDesc,
        nextPhone,
        JSON.stringify(nextPlatforms),
        nextStoreUrl,
        nowIso,
        existingStore.id
      );
    } else {
      prepareCached(
        db,
        `INSERT INTO seller_stores (
          id, owner_user_id, store_name, platform_name, seller_rating, review_count,
          is_verified_seller, is_customer_rating_confirmed, is_product_info_confirmed,
          has_return_policy, store_location, shop_description, phone_number, platforms_json,
          certificate_id, transparency_score, store_url, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 1, 1, 1, 1, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        `str_${sellerUserId}`,
        sellerUserId,
        nextStoreName,
        nextPlatforms[0] ?? 'Shopee',
        current.sellerRating,
        current.reviewCount,
        current.storeLocation,
        nextDesc,
        nextPhone,
        JSON.stringify(nextPlatforms),
        current.certificateId,
        current.transparencyScore,
        nextStoreUrl,
        nowIso
      );
    }

    return {
      ...current,
      shopName: nextStoreName,
      shopDescription: nextDesc,
      phoneNumber: nextPhone,
      platforms: nextPlatforms,
      storeUrl: nextStoreUrl || undefined,
    };
  });
}

export function listSavedItemsForUser(userId = 'usr_daisy_001'): {
  savedCheckIds: string[];
  savedAt: Record<string, number>;
} {
  return getDbPool().withRead((db) => {
    const rows = prepareCached(
      db,
      'SELECT check_id, saved_at FROM saved_items WHERE user_id = ? ORDER BY saved_at DESC'
    ).all(userId) as Array<{ check_id: string; saved_at: string }>;

    const savedCheckIds: string[] = [];
    const savedAt: Record<string, number> = {};

    for (const row of rows) {
      savedCheckIds.push(row.check_id);
      const parsedTime = Date.parse(row.saved_at);
      savedAt[row.check_id] = Number.isNaN(parsedTime) ? Date.now() : parsedTime;
    }

    return { savedCheckIds, savedAt };
  });
}

export function toggleSavedItemInDb(
  checkId: string,
  userId = 'usr_daisy_001'
): { saved: boolean; savedAtMs: number | null } {
  return getDbPool().withWriteTransaction((db) => {
    const existing = prepareCached(
      db,
      'SELECT id FROM saved_items WHERE user_id = ? AND check_id = ? LIMIT 1'
    ).get(userId, checkId) as { id: string } | undefined;

    if (existing) {
      prepareCached(
        db,
        'DELETE FROM saved_items WHERE user_id = ? AND check_id = ?'
      ).run(userId, checkId);
      prepareCached(
        db,
        'UPDATE product_checks SET is_saved = 0 WHERE id = ?'
      ).run(checkId);
      return { saved: false, savedAtMs: null };
    }

    const checkExists = prepareCached(
      db,
      'SELECT id FROM product_checks WHERE id = ? LIMIT 1'
    ).get(checkId) as { id: string } | undefined;

    if (!checkExists) {
      return { saved: false, savedAtMs: null };
    }

    const nowIso = new Date().toISOString();
    prepareCached(
      db,
      'INSERT INTO saved_items (id, user_id, check_id, saved_at) VALUES (?, ?, ?, ?)'
    ).run(`sav_${userId}_${checkId}`, userId, checkId, nowIso);
    prepareCached(
      db,
      'UPDATE product_checks SET is_saved = 1 WHERE id = ?'
    ).run(checkId);

    return { saved: true, savedAtMs: Date.parse(nowIso) };
  });
}
