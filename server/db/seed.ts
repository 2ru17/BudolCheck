import {
  ADMIN_QUEUE_PRESETS,
  SELLER_PRODUCTS_PRESETS,
  SELLER_PROFILE_PRESET,
  SHOWCASE_CHECKS,
  TIPS_AND_GUIDES_PRESETS,
} from '../../src/data/presets.ts';
import { ProductCheckRecord } from '../../src/types/budol.ts';
import { ensureAuthTablesAndSeedPasswords } from '../lib/auth.ts';
import { synthesizeCheckFromCatalogItem } from '../lib/heuristics.ts';
import {
  ensureMarketplaceCatalogSeeded,
  findCatalogItemById,
} from '../repositories/catalogRepository.ts';
import { getDbPool, prepareCached } from './pool.ts';
import { upsertProductCheckRecord } from '../repositories/checkRepository.ts';

const EXTRA_SEEDED_CHECKS: ProductCheckRecord[] = [
  {
    id: 'chk_phonecase_004',
    sourceUrl: 'https://shopee.ph/search?keyword=Samsung%20Galaxy%20S24%20Ultra%20MagSafe%20Clear%20Case',
    platformName: 'Shopee',
    productTitle: 'Samsung Galaxy S24 Ultra Shockproof MagSafe Clear Case',
    listedPricePhp: 349.0,
    originalPricePhp: 699.0,
    soldCountText: '19.2K sold',
    shippingNote: 'Ships from Valenzuela, Metro Manila within 24 hours',
    variants: ['S24 Ultra Clear', 'S24 Plus Matte', 'S24 Base Frosted'],
    illustrationKey: 'phonecase',
    imageUrls: [
      '/catalog/case-sp-s24ultra.jpg',
      '/catalog/case-sp-ringke.jpg',
      '/catalog/case-lz-nillkin.jpg',
      '/catalog/case-tm-clear.jpg',
    ],
    categoryLabel: 'Mobile Accessories',
    aboutText:
      'Hybrid polycarbonate backplate with TPU shock-absorbing corners and an embedded N52 magnetic ring for Samsung Galaxy S24 series phones.',
    highlights: [
      '2.0mm raised lip around rear camera lenses',
      'Embedded N52 magnetic ring for wireless chargers',
      'Anti-yellowing UV coating on acrylic backplate',
      'Confirm exact Galaxy S24 / S24+ / S24 Ultra model before checkout',
    ],
    checkedAt: '2026-10-28T09:15:00Z',
    overview: {
      material: 'Bayer TPU Bumper + 2.0mm Polycarbonate Backplate',
      pattern: 'Crystal Clear with White MagSafe Ring',
      quantity: '1 Case + Lens Film',
      claims: [
        {
          label: 'First',
          text: 'Military-grade 8ft corner airbag drop protection with raised camera lip.',
        },
        {
          label: 'Second',
          text: 'N52 neodymium magnetic ring compatible with magnetic car mounts and power banks.',
        },
        {
          label: 'Third',
          text: 'Zero-yellowing guarantee for 12 months under daily UV exposure.',
        },
      ],
      contradictionWarning:
        'Acrylic back resists yellowing, but soft TPU side bumpers still develop slight amber tint after 4 to 6 months according to long-term buyer photos.',
    },
    seller: {
      storeName: 'Ringke Official Store PH',
      storeAge: '3 Years, 5 Months',
      storeLocation: 'Valenzuela City, Metro Manila',
      responseRate: '97% (within 20 minutes)',
      fulfillmentRate: '99.4% on-time dispatch',
      cancellationRate: '0.3%',
      certificateId: 'DTI-58210-2023-NCR',
      rating: 4.9,
      reviewCountText: '46.8K reviews',
      checklist: {
        verifiedSeller: true,
        customerRating: true,
        productInfoConfirmed: true,
        returnPolicy: true,
      },
      unverifiedNote:
        'Verify S-Pen magnetic interference notes if using third-party magnetic wallets on S24 Ultra.',
    },
    reviewSummary: {
      productReviewsCount: 2840,
      productAverageRating: 4.8,
      storeReviewsCountText: '46.8K',
      filterCounts: {
        visuals: '1.1K',
        star5: '2.4K',
        star4: '310',
        star3: '92',
        critical: '38',
      },
    },
    reviews: [
      {
        id: 'rev_pc_1',
        checkId: 'chk_phonecase_004',
        maskedUsername: 'n**l',
        starRating: 5,
        variantPurchased: 'Item: S24 Ultra Clear',
        comment:
          'Sakto lahat ng cutouts sa S24 Ultra at malakas ang dikit ng MagSafe powerbank. Makapal yung kanto kaya kampante kahit mabagsak.',
        photoLabels: ['Camera Lip', 'MagSafe Test', 'S-Pen Clearance'],
        hasVisuals: true,
        isVerifiedPurchase: true,
      },
      {
        id: 'rev_pc_2',
        checkId: 'chk_phonecase_004',
        maskedUsername: 't**a',
        starRating: 4,
        variantPurchased: 'Item: S24 Plus Matte',
        comment:
          'Clean frosted finish and fast Valenzuela delivery. Remove the thin inner and outer protective plastic films first or it will look scratched.',
        photoLabels: ['Peel Film Tip', 'Fitted Phone'],
        hasVisuals: true,
        isVerifiedPurchase: true,
      },
      {
        id: 'rev_pc_3',
        checkId: 'chk_phonecase_004',
        maskedUsername: 'g**r',
        starRating: 3,
        variantPurchased: 'Item: S24 Ultra Clear',
        comment:
          'When a thick magnetic ring grip is attached, S-Pen pressure skips right over the magnet circle. Fine when accessory is detached.',
        photoLabels: [],
        hasVisuals: false,
        isVerifiedPurchase: true,
      },
    ],
    similarProducts: [
      {
        id: 'sim_pc_1',
        title: 'Ringke Fusion X Samsung S24 Ultra Case',
        salePricePhp: 690.0,
        originalPricePhp: 850.0,
        discountPercentage: 19,
        promoBadge: 'Shopee Mall',
        starRating: 4.9,
        soldCountText: '9.4K sold',
        illustrationType: 'phonecase',
        thumbnailUrl: '/catalog/case-sp-ringke.jpg',
      },
      {
        id: 'sim_pc_2',
        title: 'Nillkin Frosted Shield Pro Magnetic S24',
        salePricePhp: 425.0,
        originalPricePhp: 599.0,
        discountPercentage: 29,
        promoBadge: 'Anti-Fingerprint',
        starRating: 4.9,
        soldCountText: '14.2K sold',
        illustrationType: 'phonecase',
        thumbnailUrl: '/catalog/case-lz-nillkin.jpg',
      },
      {
        id: 'sim_pc_3',
        title: 'Liquid Silicone Soft-Touch Case S24 Series',
        salePricePhp: 159.0,
        originalPricePhp: 299.0,
        discountPercentage: 47,
        promoBadge: 'Buy 2 Save 5%',
        starRating: 4.7,
        soldCountText: '6.8K sold',
        illustrationType: 'phonecase',
        thumbnailUrl: '/catalog/case-tt-silicone.jpg',
      },
      {
        id: 'sim_pc_4',
        title: 'Clear TPU Airbag Case S24 (Non-MagSafe)',
        salePricePhp: 89.0,
        originalPricePhp: 180.0,
        discountPercentage: 51,
        promoBadge: 'Budget Pick',
        starRating: 4.6,
        soldCountText: '22.1K sold',
        illustrationType: 'phonecase',
        thumbnailUrl: '/catalog/case-tm-clear.jpg',
      },
    ],
    comparisons: [
      {
        id: 'cmp_pc_temu',
        platformName: 'Temu',
        productTitle: 'Samsung S24 Ultra MagSafe Clear Hybrid Case',
        pricePhp: 215.0,
        shippingPerk: 'Free Cross-Border Shipping (5-8 days)',
        starRating: 4.7,
        isBestPrice: true,
      },
      {
        id: 'cmp_pc_lazada',
        platformName: 'Lazada',
        productTitle: 'CaseVault Samsung S24 Ultra Clear MagSafe',
        pricePhp: 355.0,
        shippingPerk: 'LazMall Next-Day Metro Manila',
        starRating: 4.9,
        isBestPrice: false,
      },
    ],
    marketing: {
      hypeScoreLabel: 'Low-Moderate Promo Pressure',
      summary:
        'Standard 50% crossed-out reference price common in phone accessories, but final PHP price stays within fair market range.',
      tactics: [
        {
          id: 'mkt_pc_1',
          type: 'Reference Price Strikethrough',
          badgeText: '-50% Tag',
          severity: 'info',
          description:
            'Crossed-out P699 anchor is higher than typical unbranded hybrid cases, though P349 matches local Metro Manila stock pricing.',
        },
      ],
    },
    redFlags: {
      riskScore: 24,
      riskLabel: 'Low Risk (24/100)',
      items: [
        {
          id: 'rf_pc_1',
          severity: 'LOW',
          title: 'TPU Side Bumper Aging',
          description:
            'Hard backplate stays clear, while flexible TPU side edges can warm in color after months of hand oils.',
        },
        {
          id: 'rf_pc_2',
          severity: 'LOW',
          title: 'Peel Dual Protective Films on Arrival',
          description:
            'Several 3-star reviews mistook the factory protective plastic sheet for scratches before peeling both sides.',
        },
      ],
    },
    finalSummary: {
      verdictTitle: 'Safe to Buy: Fair Local Price & Verified Fit',
      verdictSubtitle:
        'Established Valenzuela seller with 1,100+ real buyer photos confirming exact Galaxy S24 camera and port alignment.',
      checkedAndVerified: [
        'DTI-registered local store with 99.4% on-time dispatch',
        '1,100+ customer photos confirm camera lip clearance and magnet hold',
        'Fair local price (save P50 to P134 on Temu if not urgent)',
      ],
      needsVerification: [
        'Double-check S24 vs. S24 Plus vs. S24 Ultra variant before tapping Buy',
        'Peel both inner and outer protective films upon unboxing',
      ],
    },
  },
  {
    id: 'chk_shoes_005',
    sourceUrl: 'https://www.lazada.com.ph/catalog/?q=Breathable%20Mesh%20Running%20Shoes',
    platformName: 'Lazada',
    productTitle: 'CloudStride Breathable Mesh Daily Running Shoes',
    listedPricePhp: 1499.0,
    originalPricePhp: 3299.0,
    soldCountText: '5.4K sold',
    shippingNote: 'Ships from Cross-Border Consolidation Hub (6-10 days)',
    variants: ['EU 40 / 25.0cm', 'EU 41 / 25.5cm', 'EU 42 / 26.0cm', 'EU 43 / 26.5cm'],
    illustrationKey: 'shoes',
    imageUrls: [
      '/catalog/shoes-lz-cloudstride.jpg',
      '/catalog/shoes-sp-xtep.jpg',
      '/catalog/shoes-lz-worldbalance.jpg',
      '/catalog/shoes-tm-mesh.jpg',
    ],
    categoryLabel: 'Footwear and Sports',
    aboutText:
      'Lightweight knit-mesh athletic sneakers marketed as carbon-plated marathon trainers at a steep flash-sale discount.',
    highlights: [
      'Engineered knit mesh upper for airflow',
      'Compression-molded EVA foam midsole (no carbon plate)',
      'Runs 0.5 size narrow: measure foot length in centimeters',
      'Compare unbranded OEM equivalents before paying P1,499',
    ],
    checkedAt: '2026-10-28T11:40:00Z',
    overview: {
      material: 'Polyester Knit Upper + Molded EVA Foam Outsole',
      pattern: 'White / Lime Racing Stripe',
      quantity: '1 Pair in Polybag (Shoebox Extra)',
      claims: [
        {
          label: 'First',
          text: 'Advertises "Pro Carbon-Plate Energy Return" in hero banner graphics.',
        },
        {
          label: 'Second',
          text: 'Flash sale -55% markdown from P3,299 mall retail benchmark.',
        },
      ],
      contradictionWarning:
        'Banner graphic mentions "Carbon Plate Propulsion", while specification table lists standard EVA foam sole with no propulsion plate and polybag-only shipping.',
    },
    seller: {
      storeName: 'Verified Seller on Lazada PH',
      storeAge: '8 Months',
      storeLocation: 'Quanzhou Cross-Border Hub',
      responseRate: '82% (within 4 hours)',
      fulfillmentRate: '93.5%',
      cancellationRate: '3.1%',
      certificateId: 'Cross-Border Marketplace Seller',
      rating: 4.5,
      reviewCountText: '3.1K reviews',
      checklist: {
        verifiedSeller: true,
        customerRating: true,
        productInfoConfirmed: false,
        returnPolicy: true,
      },
      unverifiedNote:
        'Cross-border size exchanges require full return-and-reorder cycle; measure insole length in cm carefully.',
    },
    reviewSummary: {
      productReviewsCount: 612,
      productAverageRating: 4.4,
      storeReviewsCountText: '3.1K',
      filterCounts: {
        visuals: '215',
        star5: '410',
        star4: '112',
        star3: '54',
        critical: '36',
      },
    },
    reviews: [
      {
        id: 'rev_sh_1',
        checkId: 'chk_shoes_005',
        maskedUsername: 'p**o',
        starRating: 4,
        variantPurchased: 'Item: EU 42 / 26.0cm',
        comment:
          'Magaan sa paa pang-jogging at walking, pero walang carbon plate sa loob, malambot na EVA foam lang. Mag-add ng +1 size kung malapad ang paa.',
        photoLabels: ['Side Profile', 'Outsole Flex', 'Insole 26cm'],
        hasVisuals: true,
        isVerifiedPurchase: true,
      },
      {
        id: 'rev_sh_2',
        checkId: 'chk_shoes_005',
        maskedUsername: 'e**a',
        starRating: 2,
        variantPurchased: 'Item: EU 41 / 25.5cm',
        comment:
          'Dumating na naka-pouch lang walang box kaya nayupi yung heel counter. Same exact OEM sapatos sa Shopee na P599 lang.',
        photoLabels: ['Creased Heel', 'Polybag Packaging'],
        hasVisuals: true,
        isVerifiedPurchase: true,
      },
    ],
    similarProducts: [
      {
        id: 'sim_sh_1',
        title: 'XTEP 2000km 2.0 Official Running Shoes',
        salePricePhp: 1899.0,
        originalPricePhp: 2999.0,
        discountPercentage: 37,
        promoBadge: 'Official Brand Store',
        starRating: 4.9,
        soldCountText: '15.6K sold',
        illustrationType: 'shoes',
        thumbnailUrl: '/catalog/shoes-sp-xtep.jpg',
      },
      {
        id: 'sim_sh_2',
        title: '361 Degrees Flame Knit Daily Trainer',
        salePricePhp: 1549.0,
        originalPricePhp: 2599.0,
        discountPercentage: 40,
        promoBadge: 'Boxed + Authentic',
        starRating: 4.9,
        soldCountText: '8.9K sold',
        illustrationType: 'shoes',
        thumbnailUrl: '/catalog/shoes-tt-361.jpg',
      },
      {
        id: 'sim_sh_3',
        title: 'OEM Breathable Mesh Walking Sneakers',
        salePricePhp: 589.0,
        originalPricePhp: 999.0,
        discountPercentage: 41,
        promoBadge: 'Same Factory Mold',
        starRating: 4.6,
        soldCountText: '11.2K sold',
        illustrationType: 'shoes',
        thumbnailUrl: '/catalog/shoes-tm-mesh.jpg',
      },
      {
        id: 'sim_sh_4',
        title: 'World Balance Invictus Mens Running',
        salePricePhp: 1699.0,
        originalPricePhp: 1999.0,
        discountPercentage: 15,
        promoBadge: 'Local PH Brand',
        starRating: 4.8,
        soldCountText: '4.3K sold',
        illustrationType: 'shoes',
        thumbnailUrl: '/catalog/shoes-lz-worldbalance.jpg',
      },
    ],
    comparisons: [
      {
        id: 'cmp_sh_temu',
        platformName: 'Temu',
        productTitle: 'Breathable Knit EVA Running Sneakers (Same OEM)',
        pricePhp: 549.0,
        shippingPerk: 'Free Shipping + Price Adjustment Guarantee',
        starRating: 4.6,
        isBestPrice: true,
      },
      {
        id: 'cmp_sh_shopee',
        platformName: 'Shopee',
        productTitle: 'CloudStride Mesh Running Sneakers Unisex',
        pricePhp: 629.0,
        shippingPerk: 'COD + Free Shipping Voucher',
        starRating: 4.6,
        isBestPrice: false,
      },
    ],
    marketing: {
      hypeScoreLabel: 'High Hype: Spec Exaggeration & Rebrand Markup',
      summary:
        'Rebrands a P550-P650 generic EVA sneaker at P1,499 using pro marathon buzzwords.',
      tactics: [
        {
          id: 'mkt_sh_1',
          type: 'Technical Buzzword Dressing',
          badgeText: '"Carbon Plate" Graphic',
          severity: 'high',
          description:
            'Uses cutaway graphics implying a carbon-fiber plate while delivering standard flexible EVA foam.',
        },
        {
          id: 'mkt_sh_2',
          type: 'Private-Label Price Double',
          badgeText: '2.4x OEM Price',
          severity: 'high',
          description:
            'Identical outsole mold sells for P549 to P629 on Temu and Shopee.',
        },
      ],
    },
    redFlags: {
      riskScore: 68,
      riskLabel: 'Moderate-High Risk (68/100)',
      items: [
        {
          id: 'rf_sh_1',
          severity: 'HIGH',
          title: 'Misleading Carbon-Plate Banner Claim',
          description:
            'Buyer flex-test photos confirm no rigid plate inside the midsole.',
        },
        {
          id: 'rf_sh_2',
          severity: 'MEDIUM',
          title: '2.4x Markup Over Identical OEM Listing',
          description:
            'At P1,499 you can buy genuine XTEP, 361 Degrees, or World Balance trainers instead, or pay P549-P629 for the same OEM shoe.',
        },
      ],
    },
    finalSummary: {
      verdictTitle: 'Overpriced OEM Rebrand: Compare Alternatives First',
      verdictSubtitle:
        'Comfortable as a P580 casual walking shoe, but poor value at P1,499 due to exaggerated carbon-plate claims.',
      checkedAndVerified: [
        '215 buyer photos confirm breathable mesh upper for casual walking',
        '7-day platform return protection active on Lazada',
      ],
      needsVerification: [
        'Buy the identical OEM pair for P549-P629 in Compare to Buy, or pick an official XTEP / 361 Degrees / World Balance trainer in Similar',
        'Size up by 0.5 to 1 EU size if you have wide feet',
      ],
    },
  },
];

let seeded = false;

export function ensureDatabaseSeeded(): void {
  if (seeded) return;

  ensureAuthTablesAndSeedPasswords();
  ensureMarketplaceCatalogSeeded();

  const pool = getDbPool();

  pool.withWriteTransaction((db) => {
    db.prepare(
      "DELETE FROM product_checks WHERE platform_name = 'TikTok Shop' OR id = 'chk_cupmat_001' OR id LIKE 'chk_cat_cat_%_tt_%'"
    ).run();
    db.prepare(
      "DELETE FROM platform_comparisons WHERE platform_name = 'TikTok Shop'"
    ).run();
    db.prepare(
      "UPDATE seller_stores SET platform_name = 'Shopee' WHERE platform_name = 'TikTok Shop'"
    ).run();
    db.prepare(
      "UPDATE admin_queue SET platform = 'Temu' WHERE platform = 'TikTok Shop'"
    ).run();
    db.prepare(
      "UPDATE users SET connected_shop_account = 'Lazada & Shopee Connected' WHERE connected_shop_account LIKE '%TikTok%'"
    ).run();
    db.prepare(
      "UPDATE OR IGNORE saved_items SET check_id = 'chk_wm02_001' WHERE check_id = 'chk_cupmat_001'"
    ).run();
    db.prepare(
      "DELETE FROM saved_items WHERE check_id = 'chk_cupmat_001'"
    ).run();

    prepareCached(
      db,
      `DELETE FROM product_checks
       WHERE id LIKE 'chk_live_%'
         AND (
           source_url LIKE 'https://shopee.ph/search?keyword=%'
           OR id IN (
             SELECT check_id FROM check_modules_result
             WHERE seller_check_json LIKE '%PrimeHub%'
                OR seller_check_json LIKE '%UrbanDepot%'
                OR seller_check_json LIKE '%EverydayCraft%'
                OR seller_check_json LIKE '%MetroDirect%'
                OR seller_check_json LIKE '%SelectGoods%'
                OR seller_check_json LIKE '%NorthStar%'
           )
         )`
    ).run();
  });

  const existingCount = pool.withRead((db) => {
    const row = prepareCached(
      db,
      'SELECT COUNT(*) AS count FROM product_checks'
    ).get() as { count: number };
    return row.count;
  });

  const allSeedChecks = [...SHOWCASE_CHECKS, ...EXTRA_SEEDED_CHECKS];
  for (const check of allSeedChecks) {
    upsertProductCheckRecord(check, 'usr_daisy_001');
  }

  const existingCatalogChecks = pool.withRead((db) => {
    return prepareCached(
      db,
      "SELECT id FROM product_checks WHERE id LIKE 'chk_cat_%'"
    ).all() as Array<{ id: string }>;
  });
  for (const row of existingCatalogChecks) {
    const catalogId = row.id.replace(/^chk_cat_/, '');
    const catItem = findCatalogItemById(catalogId);
    if (catItem) {
      const refreshed = synthesizeCheckFromCatalogItem(catItem);
      upsertProductCheckRecord(refreshed);
    }
  }

  const nowIso = new Date().toISOString();

  pool.withWriteTransaction((db) => {
    const upsertStore = prepareCached(
      db,
      `INSERT INTO seller_stores (
        id, owner_user_id, store_name, platform_name, seller_rating, review_count,
        is_verified_seller, is_customer_rating_confirmed, is_product_info_confirmed,
        has_return_policy, store_location, shop_description, phone_number, platforms_json,
        certificate_id, transparency_score, store_url, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        owner_user_id = excluded.owner_user_id,
        store_url = CASE WHEN seller_stores.store_url = '' THEN excluded.store_url ELSE seller_stores.store_url END,
        store_name = CASE WHEN seller_stores.store_name = 'TrendHouse Official Store' THEN excluded.store_name ELSE seller_stores.store_name END,
        shop_description = CASE WHEN seller_stores.shop_description = '' THEN excluded.shop_description ELSE seller_stores.shop_description END`
    );

    upsertStore.run(
      SELLER_PROFILE_PRESET.id,
      'usr_zavina_006',
      SELLER_PROFILE_PRESET.shopName,
      'Shopee',
      SELLER_PROFILE_PRESET.sellerRating,
      SELLER_PROFILE_PRESET.reviewCount,
      1,
      1,
      1,
      1,
      SELLER_PROFILE_PRESET.storeLocation,
      SELLER_PROFILE_PRESET.shopDescription,
      SELLER_PROFILE_PRESET.phoneNumber,
      JSON.stringify(SELLER_PROFILE_PRESET.platforms),
      SELLER_PROFILE_PRESET.certificateId,
      SELLER_PROFILE_PRESET.transparencyScore,
      SELLER_PROFILE_PRESET.storeUrl ?? 'https://shopee.ph/shop/39104821',
      nowIso
    );

    upsertStore.run(
      'str_trendhouse_001',
      'usr_seller_001',
      SELLER_PROFILE_PRESET.shopName,
      'Shopee',
      4.9,
      12400,
      1,
      1,
      1,
      1,
      SELLER_PROFILE_PRESET.storeLocation,
      SELLER_PROFILE_PRESET.shopDescription,
      SELLER_PROFILE_PRESET.phoneNumber,
      JSON.stringify(SELLER_PROFILE_PRESET.platforms),
      SELLER_PROFILE_PRESET.certificateId,
      SELLER_PROFILE_PRESET.transparencyScore,
      SELLER_PROFILE_PRESET.storeUrl ?? 'https://shopee.ph/shop/39104821',
      nowIso
    );

    const insertSellerProduct = prepareCached(
      db,
      `INSERT INTO seller_products (
        id, owner_user_id, title, price_php, status, platform, image_url, illustration_key, spec_note, source_url, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        source_url = CASE WHEN seller_products.source_url = '' THEN excluded.source_url ELSE seller_products.source_url END`
    );
    for (const prod of SELLER_PRODUCTS_PRESETS) {
      insertSellerProduct.run(
        prod.id,
        'usr_zavina_006',
        prod.title,
        prod.pricePhp,
        prod.status,
        prod.platform,
        prod.imageUrl,
        prod.illustrationKey,
        prod.specNote ?? '',
        prod.sourceUrl ?? '',
        prod.updatedAt
      );
    }

    const insertTip = prepareCached(
      db,
      `INSERT OR IGNORE INTO tips_and_guides (
        id, category, title, summary, body_markdown, display_order, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, 1)`
    );
    TIPS_AND_GUIDES_PRESETS.forEach((tip, index) => {
      insertTip.run(
        tip.id,
        tip.category,
        tip.title,
        tip.summary,
        JSON.stringify(tip.steps),
        index + 1
      );
    });

    const upsertAdminItem = prepareCached(
      db,
      `INSERT INTO admin_queue (
        id, product_title, subtitle, reported_date, report_category, thumbnail_url,
        illustration_key, platform, flag_reason, reports_count, price_anomaly, source_url, status, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        product_title = excluded.product_title,
        subtitle = excluded.subtitle,
        reported_date = excluded.reported_date,
        report_category = excluded.report_category,
        thumbnail_url = excluded.thumbnail_url,
        illustration_key = excluded.illustration_key,
        platform = excluded.platform,
        flag_reason = excluded.flag_reason,
        reports_count = excluded.reports_count,
        price_anomaly = excluded.price_anomaly,
        source_url = CASE WHEN admin_queue.source_url = '' THEN excluded.source_url ELSE admin_queue.source_url END`
    );
    for (const item of ADMIN_QUEUE_PRESETS) {
      upsertAdminItem.run(
        item.id,
        item.productTitle,
        item.subtitle ?? item.flagReason,
        item.reportedDate ?? 'Reported on November 2, 2026',
        item.reportCategory ?? 'report',
        item.thumbnailUrl ?? '',
        item.illustrationKey ?? 'shoes',
        item.platform,
        item.flagReason,
        item.reportsCount,
        item.priceAnomaly,
        item.sourceUrl ?? '',
        item.status,
        nowIso
      );
    }
  });

  if (existingCount > 0) {
    seeded = true;
    return;
  }

  pool.withWriteTransaction((db) => {
    const fiveHoursAgo = new Date(Date.now() - 5 * 3_600_000).toISOString();
    const thirtyHoursAgo = new Date(Date.now() - 30 * 3_600_000).toISOString();

    const insertSaved = prepareCached(
      db,
      'INSERT OR IGNORE INTO saved_items (id, user_id, check_id, saved_at) VALUES (?, ?, ?, ?)'
    );
    insertSaved.run('sav_default_1', 'usr_daisy_001', 'chk_wm02_001', fiveHoursAgo);
    insertSaved.run('sav_default_2', 'usr_daisy_001', 'chk_serum_003', thirtyHoursAgo);

    prepareCached(
      db,
      "UPDATE product_checks SET is_saved = 1 WHERE id IN ('chk_wm02_001', 'chk_serum_003')"
    ).run();
  });

  seeded = true;
}
