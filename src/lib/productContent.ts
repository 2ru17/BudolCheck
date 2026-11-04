import { IllustrationKey, ProductCheckRecord } from '../types/budol.ts';

export interface GallerySlide {
  id: string;
  label: string;
  caption: string;
  bgClass: string;
  scale: number;
  rotate: number;
  imageUrl?: string;
}

export interface ProductDetailContent {
  about: string;
  highlights: string[];
  specs: Array<{ label: string; value: string }>;
}

const PHOTO_ANGLES = [
  { host: 'tse1.mm.bing.net', label: 'Studio Front View', suffix: 'official product photo white background' },
  { host: 'tse2.mm.bing.net', label: 'Angled Product View', suffix: 'product front angle studio photo' },
  { host: 'tse3.mm.bing.net', label: 'Close-Up Detail View', suffix: 'product close up detail photo' },
  { host: 'tse4.mm.bing.net', label: 'Packaging & Retail Box', suffix: 'product retail box packaging photo' },
];

export function sanitizeProductTitleForImageQuery(productTitle: string): string {
  const cleaned = productTitle
    .replace(/\[.*?\]|\(.*?\)|【.*?】/g, ' ')
    .replace(/\b(LazMall|Shopee\s*Mall|Official\s*Store|Flagship\s*Store|Mall\s*Pullout|100%\s*Original|Authentic|COD|Free\s*Shipping)\b/gi, ' ')
    .replace(/[^a-zA-Z0-9\s.-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 75);
  return cleaned || 'Consumer Product';
}

export function buildLiveProductThumbUrl(productTitle: string, angleIndex = 0): string {
  const cleanTitle = sanitizeProductTitleForImageQuery(productTitle);
  const angle = PHOTO_ANGLES[Math.abs(angleIndex) % PHOTO_ANGLES.length];
  return `https://${angle.host}/th?q=${encodeURIComponent(`${cleanTitle} ${angle.suffix}`)}&w=720&h=720&c=7&rs=1&p=0`;
}

export function buildLiveProductGalleryUrls(productTitle: string): string[] {
  return PHOTO_ANGLES.map((_, idx) => buildLiveProductThumbUrl(productTitle, idx));
}

export function resolveCleanProductImageUrl(
  rawUrl: string | undefined,
  productTitle: string,
  angleIndex = 0
): string {
  if (
    rawUrl &&
    rawUrl.trim().length > 0 &&
    !rawUrl.startsWith('/catalog/') &&
    !rawUrl.includes('images.unsplash.com')
  ) {
    return rawUrl.trim();
  }
  return buildLiveProductThumbUrl(productTitle, angleIndex);
}

export function buildGallery(check: ProductCheckRecord): GallerySlide[] {
  if (check.uploadedImageUrl) {
    return [
      {
        id: `${check.id}-upload`,
        label: 'Uploaded photo',
        caption: check.productTitle,
        bgClass: 'bg-white',
        scale: 1,
        rotate: 0,
        imageUrl: check.uploadedImageUrl,
      },
    ];
  }

  const rawPhotos = (check.imageUrls || []).filter(
    (url) =>
      Boolean(url && url.trim()) &&
      !url.startsWith('/catalog/') &&
      !url.includes('images.unsplash.com')
  );

  const mergedUrls: string[] = Array.from(new Set(rawPhotos));
  if (mergedUrls.length === 0) {
    mergedUrls.push(buildLiveProductThumbUrl(check.productTitle, 0));
  }

  return mergedUrls.slice(0, 4).map((url, index) => ({
    id: `${check.id}-photo-${index}`,
    label: PHOTO_ANGLES[index]?.label || `Photo ${index + 1}`,
    caption: `${check.productTitle} - ${PHOTO_ANGLES[index]?.label || `Photo ${index + 1}`}`,
    bgClass: 'bg-white',
    scale: 1,
    rotate: 0,
    imageUrl: url,
  }));
}

const ABOUT: Record<IllustrationKey, { about: string; highlights: string[]; category: string }> = {
  cupmat: {
    category: 'Home and Kitchen',
    about:
      'A cartoon-patterned silicone cup mat sold as a heat-resistant coaster for mugs, pans and hot dishes. The listing leans on factory-direct pricing and a local dispatch promise.',
    highlights: [
      'Food-grade silicone surface, washable',
      'Non-slip base',
      'Heat insulation claim of up to 220 degrees Celsius',
      'Single piece per order',
    ],
  },
  earbuds: {
    category: 'Electronics and Audio',
    about:
      'Wireless earbuds with active noise cancellation and a charging case. Listings in this category are commonly copied, so brand claims and battery figures deserve a closer look.',
    highlights: [
      'Active noise cancellation claim',
      'Charging case included',
      'Bluetooth pairing with phones and laptops',
      'Brand and warranty terms should be confirmed with the seller',
    ],
  },
  serum: {
    category: 'Beauty and Skincare',
    about:
      'A vitamin C face serum marketed with a brightening claim. Skincare listings are best checked against the official brand store, batch codes and expiry dates.',
    highlights: [
      '20 percent vitamin C concentration claim',
      'Dropper bottle packaging',
      'Brightening and glow claims',
      'Check expiry and batch code on arrival',
    ],
  },
  phonecase: {
    category: 'Mobile Accessories',
    about:
      'A protective smartphone case with raised camera lens edges and shock-absorbing TPU corners. Verify exact phone model cutouts (Base, Plus, or Ultra) before ordering.',
    highlights: [
      'Raised bezel around camera island and screen',
      'Shock-absorbing TPU bumper frame',
      'Verify exact phone model variant in selector',
      'Check buyer photos for yellowing and magnet strength',
    ],
  },
  shoes: {
    category: 'Footwear and Sports',
    about:
      'Everyday athletic and casual footwear marketed with lightweight breathable mesh and cushioned EVA soles. Sizing charts vary widely across cross-border shops, so measure foot length in centimeters.',
    highlights: [
      'Breathable knit or mesh upper construction',
      'Cushioned midsole for daily walking',
      'Check centimeter (cm) insole chart against EU size',
      'Inspect buyer photos for sole glue finish and box condition',
    ],
  },
  bag: {
    category: 'Bags and Everyday Carry',
    about:
      'A structured everyday tote or crossbody bag marketed for school, commute, and travel carry. Studio photos often appear larger than actual dimensions, so check width and strap drop.',
    highlights: [
      'Reinforced shoulder or crossbody strap stitching',
      'Zipper or magnetic top closure',
      'Verify width, height, and laptop clearance in centimeters',
      'Check fabric weight (GSM) in buyer unboxing photos',
    ],
  },
  dress: {
    category: 'Apparel and Fashion',
    about:
      'Casual or occasion apparel where studio lighting and pinning can hide thin fabric weight. Compare flat-lay bust, waist, and length measurements against your own clothes.',
    highlights: [
      'Check fabric blend and lining opacity in visual reviews',
      'Compare bust and length in centimeters (not S/M/L labels)',
      'Inspect seam stitching and zipper placement',
      'Confirm return eligibility for sizing mismatches',
    ],
  },
  watch: {
    category: 'Watches and Accessories',
    about:
      'Wristwatch or smart wearable listing. High-discount luxury lookalikes and unbranded smartwatches frequently exaggerate water-resistance and battery standby claims.',
    highlights: [
      'Check case diameter in millimeters and strap width',
      'Verify ATM water-resistance rating before swimming',
      'Confirm movement type or companion app support',
      'Look for official distributor warranty coverage',
    ],
  },
  umbrella: {
    category: 'Weather and Outdoor Gear',
    about:
      'Windproof rain and UV sun umbrella listing. Verify rib count, fiberglass frame flexibility, black interior UV backing, and open canopy span in inches.',
    highlights: [
      'Black interior vinyl coating for UV and heat blocking',
      'Check rib count (8-rib, 16-rib, or 24-rib) and frame build',
      'Confirm canopy arc size (30-inch golf span vs. foldable)',
      'Inspect handle lock and protective shipping tube on delivery',
    ],
  },
  mouse: {
    category: 'Computer and Office Peripherals',
    about:
      'Ergonomic wireless or vertical computer mouse listing. Compare connectivity modes (2.4GHz USB dongle, Bluetooth, or wired), rechargeable battery vs. AA cell, and silent switch specs.',
    highlights: [
      'Confirm connectivity mode (Bluetooth, 2.4GHz receiver, or wired)',
      'Check rechargeable USB-C battery vs. AA battery requirement',
      'Verify hand orientation and grip dimensions',
      'Compare official brand store warranty coverage',
    ],
  },
  massager: {
    category: 'Fitness and Recovery Gear',
    about:
      'Percussion muscle massage gun listing. Compare brushless motor stall force, battery capacity in mAh, USB-C charging support, and included interchangeable head attachments.',
    highlights: [
      'Check battery capacity and USB-C charging voltage',
      'Confirm number of included massage head attachments',
      'Compare stall force vs. surface vibration specs',
      'Verify seller return and motor warranty terms',
    ],
  },
  coaster: {
    category: 'General Merchandise',
    about:
      'Marketplace product listing cross-checked for seller reputation, pricing fairness, and customer photo review availability.',
    highlights: [
      'Confirm exact variation and piece count in selector',
      'Verify dimensions in centimeters or millimeters',
      'Inspect real buyer unboxing photos before checkout',
      'Compare cross-platform pricing including shipping',
    ],
  },
  cat: {
    category: 'Home and Lifestyle',
    about:
      'Novelty lifestyle item verified across local and cross-border marketplaces for fair pricing and accurate material specs.',
    highlights: [
      'Verify dimensions and piece count',
      'Compare prices across Shopee, Lazada, and Temu',
      'Inspect customer unboxing photos',
      'Confirm seller return window',
    ],
  },
  rabbit: {
    category: 'Home and Lifestyle',
    about:
      'Soft-touch lifestyle accessory analyzed for price parity, seller credibility, and verified customer review visuals.',
    highlights: [
      'Verify material composition in spec table',
      'Check unit vs. set pricing',
      'Read 2-to-4 star buyer reviews for sizing notes',
      'Confirm 7-day return protection',
    ],
  },
  car: {
    category: 'Auto and Everyday Gear',
    about:
      'Practical utility accessory checked against wholesale benchmark pricing so you avoid steep reseller markups.',
    highlights: [
      'Compare single-item vs. wholesale pricing',
      'Check compatibility dimensions before ordering',
      'Verify dispatch warehouse location',
      'Review buyer fitment photos',
    ],
  },
};

export function buildProductDetails(check: ProductCheckRecord): ProductDetailContent {
  const base = ABOUT[check.illustrationKey] || ABOUT.coaster;
  const category = check.categoryLabel || base.category;
  const about = check.aboutText || base.about;
  const highlights =
    check.highlights && check.highlights.length > 0 ? check.highlights : base.highlights;

  return {
    about,
    highlights,
    specs: [
      { label: 'Platform', value: check.platformName },
      { label: 'Category', value: category },
      { label: 'Seller', value: check.seller.storeName },
      { label: 'Ships from', value: check.seller.storeLocation },
      { label: 'Seller rating', value: `${check.seller.rating} / 5 (${check.seller.reviewCountText})` },
    ],
  };
}
