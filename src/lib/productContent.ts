import { ProductCheckRecord } from '../types/budol.ts';

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

const SLIDE_CAPTIONS: Record<ProductCheckRecord['illustrationKey'], string[]> = {
  cupmat: [
    'Front view of the listed mat',
    'Surface detail: check the print edges and silicone finish',
    'In use under a hot mug',
    'Size reference: thickness is not stated in the listing',
  ],
  earbuds: [
    'Charging case and earbuds as listed',
    'Detail: check the logo print and seam quality',
    'In ear fit and stem design',
    'Box contents: verify the included cable and tips',
  ],
  serum: [
    'Bottle front with label',
    'Label detail: check batch code and ingredient list',
    'Dropper and cap close-up',
    'Packaging: compare seal and box print with official photos',
  ],
};

const SLIDE_LABELS = ['Front', 'Detail', 'In use', 'Packaging'];
const SLIDE_BACKGROUNDS = ['bg-peach', 'bg-butter', 'bg-mint', 'bg-sky'];
const SLIDE_SCALE = [1, 1.35, 0.8, 0.95];
const SLIDE_ROTATE = [0, -8, 6, 0];

export function buildGallery(check: ProductCheckRecord): GallerySlide[] {
  const captions = SLIDE_CAPTIONS[check.illustrationKey];
  const slides: GallerySlide[] = SLIDE_LABELS.map((label, index) => ({
    id: `${check.id}-slide-${index}`,
    label,
    caption: captions[index],
    bgClass: SLIDE_BACKGROUNDS[index],
    scale: SLIDE_SCALE[index],
    rotate: SLIDE_ROTATE[index],
  }));

  if (check.uploadedImageUrl) {
    return [
      {
        id: `${check.id}-upload`,
        label: 'Your photo',
        caption: 'Image you uploaded for this check',
        bgClass: 'bg-cream',
        scale: 1,
        rotate: 0,
        imageUrl: check.uploadedImageUrl,
      },
    ];
  }

  return slides;
}

const ABOUT: Record<ProductCheckRecord['illustrationKey'], { about: string; highlights: string[]; category: string }> = {
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
};

export function buildProductDetails(check: ProductCheckRecord): ProductDetailContent {
  const base = ABOUT[check.illustrationKey];
  return {
    about: base.about,
    highlights: base.highlights,
    specs: [
      { label: 'Platform', value: check.platformName },
      { label: 'Category', value: base.category },
      { label: 'Seller', value: check.seller.storeName },
      { label: 'Ships from', value: check.seller.storeLocation },
      { label: 'Seller rating', value: `${check.seller.rating} / 5 (${check.seller.reviewCountText})` },
    ],
  };
}
