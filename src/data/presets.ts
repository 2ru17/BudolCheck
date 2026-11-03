import {
  AdminQueueItem,
  ProductCheckRecord,
  TipGuideItem,
} from '../types/budol.ts';

export const SHOWCASE_CHECKS: ProductCheckRecord[] = [
  {
    id: 'chk_cupmat_001',
    sourceUrl: 'https://shop.tiktok.com/view/product/172948290184',
    platformName: 'TikTok Shop',
    productTitle: 'Cup mat',
    listedPricePhp: 1234.56,
    originalPricePhp: 2469.12,
    soldCountText: '38.5K sold',
    shippingNote: 'Free shipping over P500, ships from Metro Manila',
    variants: ['Bear', 'Rabbit', 'Dog'],
    illustrationKey: 'cupmat',
    checkedAt: '2026-10-27T10:30:00Z',
    overview: {
      material: 'silica gel',
      pattern: 'Cartoon',
      quantity: '1pcs',
      claims: [
        {
          label: 'First',
          text: 'High temperature heat insulation up to 220 degrees Celsius for mugs and pans.',
        },
        {
          label: 'Second',
          text: 'Fast shipping: local shop in Manila, dispatched within 24 hours.',
        },
        {
          label: 'Third',
          text: 'Benefits: washable, non-slip base, and food-grade soft silicone surface.',
        },
        {
          label: 'Fourth',
          text: 'Price and quality: factory direct wholesale pricing with cooperation from overseas factories (2-9 days arrival).',
        },
      ],
      contradictionWarning:
        'Listing claims local Manila 24-hour dispatch while also stating 2-to-9 day delivery from overseas factory cooperation. Exact thickness in millimeters (mm) is not specified.',
    },
    seller: {
      storeName: 'TrendHouse Official Store',
      storeAge: '2 Years, 8 Months',
      storeLocation: 'Metro Manila Hub (Registered)',
      responseRate: '98% (within 15 minutes)',
      fulfillmentRate: '99.1% on-time dispatch',
      cancellationRate: '0.4%',
      certificateId: 'DTI-2948-2024-NCR',
      rating: 4.8,
      reviewCountText: '12.4K reviews',
      checklist: {
        verifiedSeller: true,
        customerRating: true,
        productInfoConfirmed: true,
        returnPolicy: true,
      },
      unverifiedNote:
        'Confirm with seller whether return shipping is free if a different cartoon variant is delivered.',
    },
    reviewSummary: {
      productReviewsCount: 950,
      productAverageRating: 4.9,
      storeReviewsCountText: '172.1K',
      filterCounts: {
        visuals: '38.5K',
        star5: '147.3K',
        star4: '14.7K',
        star3: '5.7K',
        critical: '18',
      },
    },
    reviews: [
      {
        id: 'rev_001',
        checkId: 'chk_cupmat_001',
        maskedUsername: 'c**y',
        starRating: 5,
        variantPurchased: 'Item: Bear',
        comment:
          'Cute naman siya at makapal yung silicone! Medyo na-distort lang ng konti yung bear face pero baka sa art style lang. Hindi dumudulas sa glass table.',
        photoLabels: ['Parcel Wrap', 'Bear Front', 'Mug Test', 'Side Edge'],
        hasVisuals: true,
        isVerifiedPurchase: true,
      },
      {
        id: 'rev_002',
        checkId: 'chk_cupmat_001',
        maskedUsername: 'a**o',
        starRating: 5,
        variantPurchased: 'Item: Rabbit',
        comment:
          'Mabilis dumating at maayos ang packaging. Maganda pang-patong ng mainit na coffee mug sa office desk. Walang matapang na amoy goma.',
        photoLabels: ['Rabbit Coaster', 'Desk Setup', 'Back Grip', 'Package'],
        hasVisuals: true,
        isVerifiedPurchase: true,
      },
      {
        id: 'rev_003',
        checkId: 'chk_cupmat_001',
        maskedUsername: 'j**n',
        starRating: 4,
        variantPurchased: 'Item: Bear',
        comment:
          'Good quality for daily use, though it took 6 days to arrive instead of the 24-hour local promise. Still functional and easy to wash.',
        photoLabels: ['Delivered Item', 'Thickness Check'],
        hasVisuals: true,
        isVerifiedPurchase: true,
      },
      {
        id: 'rev_004',
        checkId: 'chk_cupmat_001',
        maskedUsername: 'm**z',
        starRating: 2,
        variantPurchased: 'Item: Bear',
        comment:
          'Manipis kumpara sa inaasahan ko base sa studio photo. Kailangan hugasan muna gamit ang dishwashing liquid bago gamitin.',
        photoLabels: [],
        hasVisuals: false,
        isVerifiedPurchase: true,
      },
      {
        id: 'rev_005',
        checkId: 'chk_cupmat_001',
        maskedUsername: 'k**l',
        starRating: 5,
        variantPurchased: 'Item: Rabbit',
        comment:
          'Ordered 4 pieces for the dining table. Colors are vibrant and heat protection works well for hot bowls.',
        photoLabels: ['Set of 4', 'Dining Table'],
        hasVisuals: true,
        isVerifiedPurchase: true,
      },
      {
        id: 'rev_006',
        checkId: 'chk_cupmat_001',
        maskedUsername: 'r**s',
        starRating: 3,
        variantPurchased: 'Item: Dog',
        comment:
          'Okay lang yung item pero sobrang mahal sa listing na ito kumpara sa ibang shops na 50 pesos lang.',
        photoLabels: [],
        hasVisuals: false,
        isVerifiedPurchase: true,
      },
    ],
    similarProducts: [
      {
        id: 'sim_001',
        title: 'Cure Mat Coaster Diatomite',
        salePricePhp: 53.44,
        originalPricePhp: 75.0,
        discountPercentage: 29,
        promoBadge: 'Buy 2 get 3% off',
        starRating: 4.8,
        soldCountText: '3,952 sold',
        illustrationType: 'coaster',
      },
      {
        id: 'sim_002',
        title: 'Oumi coaster family',
        salePricePhp: 45.0,
        originalPricePhp: 112.5,
        discountPercentage: 60,
        promoBadge: 'Free next-day',
        starRating: 4.9,
        soldCountText: '11.4K sold',
        illustrationType: 'cat',
      },
      {
        id: 'sim_003',
        title: 'Lovely cushion silicone mat',
        salePricePhp: 88.92,
        originalPricePhp: 178.0,
        discountPercentage: 50,
        promoBadge: 'COD Available',
        starRating: 4.7,
        soldCountText: '820 sold',
        illustrationType: 'rabbit',
      },
      {
        id: 'sim_004',
        title: 'Auto Parts Zone Non-Slip Coaster',
        salePricePhp: 9.9,
        originalPricePhp: 23.78,
        discountPercentage: 58,
        promoBadge: 'Wholesale Deal',
        starRating: 4.6,
        soldCountText: '5,120 sold',
        illustrationType: 'car',
      },
    ],
    comparisons: [
      {
        id: 'cmp_shopee',
        platformName: 'Shopee',
        productTitle: 'Cup mat (Cartoon Silicone)',
        pricePhp: 49.0,
        shippingPerk: 'Free Shipping Voucher + COD',
        starRating: 4.9,
        isBestPrice: false,
      },
      {
        id: 'cmp_temu',
        platformName: 'Temu',
        productTitle: 'Cup mat (Cartoon Silicone)',
        pricePhp: 38.5,
        shippingPerk: '20% Bundle Discount Applied',
        starRating: 4.7,
        isBestPrice: true,
      },
      {
        id: 'cmp_lazada',
        platformName: 'Lazada',
        productTitle: 'Cup mat (Cartoon Silicone)',
        pricePhp: 55.0,
        shippingPerk: 'LazMall 15-Day Return Guarantee',
        starRating: 4.8,
        isBestPrice: false,
      },
    ],
    marketing: {
      hypeScoreLabel: 'Moderate-High Promo Pressure',
      summary:
        'This listing combines store-follow freebie hooks, bulk-order nudges, and steep anchor discounts on related recommendations.',
      tactics: [
        {
          id: 'mkt_1',
          type: 'Follow and Attention Gift Hook',
          badgeText: 'Store Follower Nudge',
          severity: 'info',
          description:
            'Seller uses "Focus on us, Receive attention gifts" to boost store follower metrics in exchange for minor voucher perks.',
        },
        {
          id: 'mkt_2',
          type: 'Anchor Pricing Discrepancy',
          badgeText: '-29% to -60% Anchor',
          severity: 'high',
          description:
            'Main listing price (1,234.56) is drastically inflated compared to identical silicone cup mats selling between 9.90 and 88.92.',
        },
        {
          id: 'mkt_3',
          type: 'Bulk Purchase Nudge',
          badgeText: 'Buy 2 Get 3% Off',
          severity: 'medium',
          description:
            'Encourages multi-unit cart additions even when single-unit pricing on competing platforms is lower.',
        },
      ],
    },
    redFlags: {
      riskScore: 65,
      riskLabel: 'Moderate Risk (65/100)',
      items: [
        {
          id: 'rf_1',
          severity: 'HIGH',
          title: 'Severe Price Markup vs. Market Benchmark',
          description:
            'Listed at 1,234.56 while identical Cartoon Silicone Cup Mats on Shopee, Temu, and Lazada sell for 9.90 to 55.00.',
        },
        {
          id: 'rf_2',
          severity: 'MEDIUM',
          title: 'Contradictory Local vs. Overseas Warehouse Claim',
          description:
            'Description promises 24-hour local Manila dispatch but simultaneously cites 2-to-9 day delivery from overseas factories.',
        },
        {
          id: 'rf_3',
          severity: 'LOW',
          title: 'Exact Thickness and Diameter Omitted',
          description:
            'Overview lists material and piece count (1pcs) but omits millimeter thickness; buyer reviews note the mat is thinner than studio photos suggest.',
        },
      ],
    },
    finalSummary: {
      verdictTitle: 'Proceed with Caution: Compare Price Before Buying',
      verdictSubtitle:
        'The seller and product are legitimate with 38.5K visual store reviews, but this specific listing is heavily overpriced compared to Shopee, Temu, and Lazada.',
      checkedAndVerified: [
        'Verified Seller status confirmed on TikTok Shop (4.8/5 across 12.4K reviews)',
        'Active 7-day return policy and responsive customer chat (98%)',
        '38,500+ store reviews include real customer unboxing photos',
        'Silica gel heat resistance confirmed by verified buyers',
      ],
      needsVerification: [
        'Purchase from the Compare to Buy tab (38.50 to 55.00) instead of paying 1,234.56',
        'Confirm exact millimeter thickness with seller before ordering bulk sets',
        'Verify whether stock ships from Manila or overseas if needed urgently',
      ],
    },
  },
  {
    id: 'chk_earbuds_002',
    sourceUrl: 'https://shopee.ph/product/99812312/28491023',
    platformName: 'Shopee',
    productTitle: 'Pro ANC Wireless Earbuds Gen 3',
    listedPricePhp: 299.0,
    originalPricePhp: 899.0,
    soldCountText: '12.4K sold',
    shippingNote: 'Free shipping voucher, COD available',
    variants: ['White ANC', 'Black ANC'],
    illustrationKey: 'earbuds',
    checkedAt: '2026-10-26T15:10:00Z',
    overview: {
      material: 'ABS Plastic',
      pattern: 'Glossy White',
      quantity: '1 Pair + Charging Case',
      claims: [
        {
          label: 'First',
          text: 'Claims "100% Original Mall Pullout" with Active Noise Cancellation.',
        },
        {
          label: 'Second',
          text: 'Flash sale discount of -92% off from crossed-out price of 3,999.00.',
        },
      ],
      contradictionWarning:
        'Serial numbers shown in buyer photos are identical across all units, indicating an uncertified clone product.',
    },
    seller: {
      storeName: 'GadgetSuperSaver99',
      storeAge: '3 Weeks',
      storeLocation: 'Unverified Warehouse',
      responseRate: '41%',
      fulfillmentRate: '78%',
      cancellationRate: '14.2%',
      certificateId: 'Unregistered',
      rating: 3.9,
      reviewCountText: '142 reviews',
      checklist: {
        verifiedSeller: false,
        customerRating: false,
        productInfoConfirmed: true,
        returnPolicy: false,
      },
      unverifiedNote: 'Store has no registered business permit and high order cancellation rate.',
    },
    reviewSummary: {
      productReviewsCount: 64,
      productAverageRating: 3.6,
      storeReviewsCountText: '142',
      filterCounts: {
        visuals: '19',
        star5: '34',
        star4: '6',
        star3: '8',
        critical: '16',
      },
    },
    reviews: [
      {
        id: 'rev_eb_1',
        checkId: 'chk_earbuds_002',
        maskedUsername: 'd**v',
        starRating: 1,
        variantPurchased: 'Item: White ANC',
        comment:
          'Fake ANC functionality. Left earbud stopped charging after 2 days and seller does not reply to return requests.',
        photoLabels: ['Box Serial', 'Charging Issue'],
        hasVisuals: true,
        isVerifiedPurchase: true,
      },
    ],
    similarProducts: [
      {
        id: 'sim_eb_1',
        title: 'Soundcore A20i Official True Wireless',
        salePricePhp: 795.0,
        originalPricePhp: 1299.0,
        discountPercentage: 39,
        promoBadge: '18-Month Warranty',
        starRating: 4.9,
        soldCountText: '42.1K sold',
        illustrationType: 'coaster',
      },
    ],
    comparisons: [
      {
        id: 'cmp_eb_laz',
        platformName: 'Lazada',
        productTitle: 'Official Entry Wireless Earbuds (Certified)',
        pricePhp: 699.0,
        shippingPerk: 'LazMall 1-Year Official Warranty',
        starRating: 4.9,
        isBestPrice: true,
      },
    ],
    marketing: {
      hypeScoreLabel: 'Extreme Urgency & Anchor Trap',
      summary: 'Uses a fake looping countdown timer and an artificial -92% discount.',
      tactics: [
        {
          id: 'mkt_eb_1',
          type: 'Fake Anchor Price',
          badgeText: '-92% Markdown',
          severity: 'high',
          description: 'Crossed-out 3,999.00 reference price is used to disguise a low-grade clone.',
        },
      ],
    },
    redFlags: {
      riskScore: 88,
      riskLabel: 'High Budol Risk (88/100)',
      items: [
        {
          id: 'rf_eb_1',
          severity: 'HIGH',
          title: 'Counterfeit "Mall Pullout" Claim',
          description: 'Cloned serial numbers and non-functional noise cancellation reported by buyers.',
        },
      ],
    },
    finalSummary: {
      verdictTitle: 'High Budol Risk: Avoid This Listing',
      verdictSubtitle: 'Unverified 3-week-old seller with no return warranty and high defect rate.',
      checkedAndVerified: ['Product photos uploaded by 19 buyers'],
      needsVerification: [
        'Choose an official brand store with a valid 1-year warranty instead',
      ],
    },
  },
  {
    id: 'chk_serum_003',
    sourceUrl: 'https://www.lazada.com.ph/products/k-beauty-vit-c-i1928374.html',
    platformName: 'Lazada',
    productTitle: 'K-Beauty Pure Vitamin C 20% Serum',
    listedPricePhp: 485.0,
    originalPricePhp: 970.0,
    soldCountText: '8.1K sold',
    shippingNote: 'Free shipping, official flagship store',
    variants: ['30ml Sealed Box'],
    illustrationKey: 'serum',
    checkedAt: '2026-10-25T08:45:00Z',
    overview: {
      material: 'Ascorbic Acid 20% + Hyaluronic Acid (30ml Glass Dropper)',
      pattern: 'Amber UV-Protected Bottle',
      quantity: '1 Bottle (30ml)',
      claims: [
        {
          label: 'First',
          text: 'FDA Cosmetic Notification Number (NN-10000084921) printed on packaging.',
        },
        {
          label: 'Second',
          text: 'Shipped directly from temperature-controlled LazMall warehouse in Laguna.',
        },
      ],
      contradictionWarning:
        'No contradictory claims found. Batch expiration date (2028-04) is clearly stated in description.',
    },
    seller: {
      storeName: 'SeoulGlow Official Flagship PH',
      storeAge: '5 Years, 2 Months',
      storeLocation: 'Cabuyao, Laguna (LazMall Hub)',
      responseRate: '99%',
      fulfillmentRate: '99.8%',
      cancellationRate: '0.1%',
      certificateId: 'FDA-NN-10000084921',
      rating: 4.9,
      reviewCountText: '84.2K reviews',
      checklist: {
        verifiedSeller: true,
        customerRating: true,
        productInfoConfirmed: true,
        returnPolicy: true,
      },
      unverifiedNote: 'Perform a 24-hour patch test on your forearm before full facial application.',
    },
    reviewSummary: {
      productReviewsCount: 4120,
      productAverageRating: 4.9,
      storeReviewsCountText: '84.2K',
      filterCounts: {
        visuals: '19.4K',
        star5: '78.1K',
        star4: '4.9K',
        star3: '1.1K',
        critical: '4',
      },
    },
    reviews: [
      {
        id: 'rev_sr_1',
        checkId: 'chk_serum_003',
        maskedUsername: 'l**a',
        starRating: 5,
        variantPurchased: 'Item: 30ml Sealed Box',
        comment:
          'Authentic with hologram sticker and clear pale yellow color (not oxidized). Sealed properly with bubble wrap.',
        photoLabels: ['Hologram Seal', 'Dropper Bottle', 'Expiry Stamp'],
        hasVisuals: true,
        isVerifiedPurchase: true,
      },
    ],
    similarProducts: [
      {
        id: 'sim_sr_1',
        title: 'DermaNatufian Niacinamide 10% Serum',
        salePricePhp: 420.0,
        originalPricePhp: 499.0,
        discountPercentage: 16,
        promoBadge: 'FDA Verified',
        starRating: 4.9,
        soldCountText: '18.3K sold',
        illustrationType: 'rabbit',
      },
    ],
    comparisons: [
      {
        id: 'cmp_sr_laz',
        platformName: 'Lazada',
        productTitle: 'K-Beauty Pure Vitamin C 20% Serum',
        pricePhp: 485.0,
        shippingPerk: 'LazMall Official Flagship + Free Shipping',
        starRating: 4.9,
        isBestPrice: true,
      },
      {
        id: 'cmp_sr_shp',
        platformName: 'Shopee',
        productTitle: 'K-Beauty Pure Vitamin C 20% Serum',
        pricePhp: 495.0,
        shippingPerk: 'Shopee Mall Official Store',
        starRating: 4.9,
        isBestPrice: false,
      },
    ],
    marketing: {
      hypeScoreLabel: 'Low Hype: Transparent Pricing',
      summary: 'Consistent pricing across official flagship stores without artificial markdowns.',
      tactics: [
        {
          id: 'mkt_sr_1',
          type: 'Standard Bundle Saver',
          badgeText: '2-Pack 5% Off',
          severity: 'info',
          description: 'Modest 5% discount for two bottles with transparent unit pricing.',
        },
      ],
    },
    redFlags: {
      riskScore: 18,
      riskLabel: 'Low Risk (18/100)',
      items: [
        {
          id: 'rf_sr_1',
          severity: 'LOW',
          title: 'Vitamin C Oxidation Sensitivity',
          description: 'Store in a cool, dark place after opening to prevent natural oxidation.',
        },
      ],
    },
    finalSummary: {
      verdictTitle: 'Safe to Buy: Verified Flagship Store',
      verdictSubtitle: 'FDA cosmetic notification, hologram seal, and fair market price confirmed.',
      checkedAndVerified: [
        'FDA notification number and hologram authenticity seal verified',
        '5-year flagship store with 99.8% fulfillment rate',
        'Consistent pricing across Lazada and Shopee official stores',
      ],
      needsVerification: [
        'Check bottle seal and pale straw color upon delivery',
      ],
    },
  },
];

export const TIPS_AND_GUIDES_PRESETS: TipGuideItem[] = [
  {
    id: 'tip_001',
    category: 'Product Check',
    title: 'How to Inspect Product Descriptions and Photos',
    summary:
      'Spot missing dimensions, contradictory shipping promises, and studio-only product photos before checking out.',
    steps: [
      'Look for exact numerical units (millimeters, grams, milliliters) instead of vague adjectives like "thick" or "large".',
      'Compare the shipping promise in the banner against the warehouse origin listed in the specification table.',
      'Check if product photos show the actual item from multiple angles rather than heavily edited 3D renders.',
    ],
  },
  {
    id: 'tip_002',
    category: 'Seller Check',
    title: 'How to Verify if an Online Seller is Legit',
    summary:
      'Evaluate store age, chat response rates, return guarantees, and business registration badges.',
    steps: [
      'Check how long the store has been operating; newly created shops offering steep discounts on electronics carry higher risk.',
      'Verify that all 4 SellerCheck criteria (Verified Seller, Customer Rating >= 4.5, Confirmed Specs, and Return Policy) are present.',
      'Look for DTI, BIR, or FDA notification numbers on regulated health, beauty, and electrical products.',
    ],
  },
  {
    id: 'tip_003',
    category: 'Review Check',
    title: 'How to Spot Fake or Scripted Bot Reviews',
    summary:
      'Filter by customer-uploaded photos and inspect 1-to-3 star reviews to see real product flaws.',
    steps: [
      'Always click the "Includes visuals" filter first to inspect unedited photos taken by real buyers at home.',
      'Read 2-star and 3-star reviews to uncover recurring complaints about material thickness, sizing, or packaging.',
      'Be cautious when dozens of 5-star reviews are posted on the exact same date using repetitive phrasing.',
    ],
  },
  {
    id: 'tip_004',
    category: 'Marketing & Ads',
    title: 'How Online Shop Promos and Flash Sales Influence Decisions',
    summary:
      'Understand anchor pricing, looping countdown timers, and commissioned affiliate livestream links.',
    steps: [
      'Ignore the discount percentage badge (-60% or -80%) and compare the final Peso price in the Similar and Compare to Buy tabs.',
      'Remember that affiliate livestreamers earn a commission on each sale; verify the product specs independently.',
      'Use BudolCheck as a 60-second pause button before tapping Buy Now during flash sales.',
    ],
  },
];

export const ADMIN_QUEUE_PRESETS: AdminQueueItem[] = [
  {
    id: 'adm_001',
    productTitle: 'Pro ANC Wireless Earbuds Gen 3 (Mall Pullout)',
    platform: 'Shopee',
    flagReason: 'Cloned serial numbers and artificial -92% anchor price',
    reportsCount: 42,
    priceAnomaly: '₱3,999 crossed out to ₱299',
    status: 'pending',
  },
  {
    id: 'adm_002',
    productTitle: 'Miracle 7-Day Whitening Glutathione Capsules',
    platform: 'TikTok Shop',
    flagReason: 'Unverified FDA registration number and medical claims',
    reportsCount: 29,
    priceAnomaly: '₱1,800 crossed out to ₱195',
    status: 'pending',
  },
  {
    id: 'adm_003',
    productTitle: '2TB High-Speed USB 3.2 Metal Flash Drive',
    platform: 'Lazada',
    flagReason: 'Firmware capacity spoofing reported in 1-star reviews',
    reportsCount: 64,
    priceAnomaly: '₱2,500 crossed out to ₱149',
    status: 'pending',
  },
];
