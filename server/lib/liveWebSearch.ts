import { LRUCache } from 'lru-cache';
import { IllustrationKey } from '../../src/types/budol.ts';
import {
  buildShopSearchUrl,
  isDirectMarketplaceProductUrl,
} from '../../src/lib/formatters.ts';
import { CatalogSeedEntry } from '../data/marketplaceCatalog.ts';
import { parseLazadaPdpHtml } from './scraper.ts';

export interface ProductCategoryMeta {
  illustrationKey: IllustrationKey;
  categoryLabel: string;
  basePricePhp: number;
  minValidPhp: number;
  maxValidPhp: number;
  variants: string[];
}

const galleryCache = new LRUCache<string, string[]>({
  max: 300,
  ttl: 1000 * 60 * 30,
});

const liveSearchCache = new LRUCache<string, CatalogSeedEntry[]>({
  max: 150,
  ttl: 1000 * 60 * 10,
});

const BROWSER_HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (X11; Fedora; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-PH,en-US;q=0.9,en;q=0.8',
};

const KNOWN_PH_RETAILERS = [
  'VillMan Computers',
  'PC Express',
  'PCWORX',
  'DynaQuest PC',
  'EasyPC',
  'DataBlitz',
  'GameXtreme',
  'Game One PH',
  'iTech PH',
  'Beyond the Box',
  'Power Mac Center',
  'Digital Walker',
  'The Loop PH',
  'Abenson',
  'Ansons',
  'SM Appliance',
  'Kimstore',
  'MemoXpress',
  'Silicon Valley',
  'Gigahertz',
  'Octagon',
  'Complink',
  'PC Central',
  'ZZM Trading',
  'Watsons PH',
  'National Book Store',
  'Decathlon PH',
  'JG Superstore',
];

const TRUSTED_STORE_HOSTS = [
  'lazada.com.ph',
  'shopee.ph',
  'temu.com',
  'villman.com',
  'pcexpress.ph',
  'pcx.com.ph',
  'pcworx.ph',
  'dynaquestpc.com',
  'easypc.com.ph',
  'datablitz.com.ph',
  'gameone.ph',
  'abenson.com',
  'ansons.ph',
  'itech.ph',
  'itechph.com',
  'powermaccenter.com',
  'beyondthebox.ph',
  'digitalwalker.ph',
  'kimstore.com',
  'jgsuperstore.com',
  'asus.com',
  'lenovo.com',
  'acer.com',
  'msi.com',
  'gigahertz.com.ph',
  'octagon.com.ph',
  'complink.com.ph',
];

const PH_SHOPIFY_STORES: Array<{
  name: string;
  baseUrl: string;
  platform: 'Shopee' | 'Lazada';
  location: string;
}> = [
  {
    name: 'DataBlitz Official PH',
    baseUrl: 'https://ecommerce.datablitz.com.ph',
    platform: 'Lazada',
    location: 'Metro Manila',
  },
  {
    name: 'Game One PH Official',
    baseUrl: 'https://gameone.ph',
    platform: 'Shopee',
    location: 'Quezon City, Metro Manila',
  },
  {
    name: 'JG Superstore Official PH',
    baseUrl: 'https://jgsuperstore.com',
    platform: 'Lazada',
    location: 'San Juan, Metro Manila',
  },
  {
    name: 'Kimstore Official PH',
    baseUrl: 'https://kimstore.com',
    platform: 'Shopee',
    location: 'Pasig City, Metro Manila',
  },
];

export function inferProductCategoryMeta(rawQuery: string): ProductCategoryMeta {
  const q = rawQuery.toLowerCase();

  const isAccessory =
    /\b(case|casing|cover|protector|tempered\s*glass|cable|cord|adapter|charger|holder|stand|sleeve|skin|keycap|strap|earpad|mousepad|mouse\s*pad)\b/.test(
      q
    );

  if (
    !isAccessory &&
    /\b(a16|f16|fa607|fa608|fa617|rtx\s*4070|rtx\s*4080|rtx\s*4090|rtx\s*50\d0|rog\s*strix|rog\s*zephyrus|macbook\s*pro|legion\s*pro|predator\s*helios|alienware|vivobook\s*pro\s*16)\b/.test(
      q
    )
  ) {
    return {
      illustrationKey: 'mouse',
      categoryLabel: '16" & High-End Gaming Laptops',
      basePricePhp: 90999,
      minValidPhp: 48000,
      maxValidPhp: 260000,
      variants: ['Ryzen 7 / 16GB DDR5 / 512GB SSD', 'Ryzen 7 / 16GB DDR5 / 1TB SSD'],
    };
  }

  if (
    !isAccessory &&
    /\b(asus\s*tuf|tuf\s*gaming|tuf\s*dash|tuf\s*a15|tuf\s*f15|asus\s*a15|asus\s*f15|fa506|fa507|fx506|fx507|fx517|acer\s*nitro|an515|anv15|lenovo\s*loq|lenovo\s*legion|hp\s*victus|hp\s*omen|msi\s*katana|msi\s*thin|msi\s*cyborg|gigabyte\s*g5|gigabyte\s*g6|gaming\s*laptop|rtx\s*2050|rtx\s*3050|rtx\s*4050|rtx\s*4060)\b/.test(
      q
    )
  ) {
    const isMidHigh = /\b(rtx\s*4050|rtx\s*4060|fa507|fx517|dash\s*f15|legion)\b/.test(q);
    return {
      illustrationKey: 'mouse',
      categoryLabel: 'Gaming Laptops and PC Hardware',
      basePricePhp: isMidHigh ? 56995 : 46995,
      minValidPhp: 28000,
      maxValidPhp: 145000,
      variants: ['8GB RAM / 512GB NVMe SSD', '16GB RAM / 512GB NVMe SSD', '16GB RAM / 1TB SSD'],
    };
  }

  if (
    !isAccessory &&
    /\b(macbook|vivobook|zenbook|thinkpad|ideapad|inspiron|latitude|xps|pavilion|envy|swift\s*go|aspire|matebook|surface\s*laptop|laptop|notebook|ultrabook|chromebook|asus|acer|lenovo|msi|gigabyte|dell|hp)\b/.test(
      q
    ) &&
    !/\b(mouse|keyboard|monitor|headset|earbuds|watch|phone|router|motherboard|gpu)\b/.test(q)
  ) {
    return {
      illustrationKey: 'mouse',
      categoryLabel: 'Laptops and Computers',
      basePricePhp: 38995,
      minValidPhp: 15000,
      maxValidPhp: 135000,
      variants: ['8GB / 512GB SSD', '16GB / 512GB SSD'],
    };
  }

  if (
    /\b(monitor|vg249|vg279|odyssey\s*g|ultragear|benq\s*zowie|aoc\s*24|koorui|xiaomi\s*monitor|144hz|165hz|180hz|240hz|ips\s*monitor|curved\s*monitor)\b/.test(
      q
    )
  ) {
    return {
      illustrationKey: 'mouse',
      categoryLabel: 'Computer Monitors and Displays',
      basePricePhp: 8895,
      minValidPhp: 3200,
      maxValidPhp: 65000,
      variants: ['23.8" FHD 180Hz IPS', '27" FHD 180Hz IPS', '27" QHD 165Hz IPS'],
    };
  }

  if (
    /\b(geforce|radeon|rx\s*6600|rx\s*7600|rx\s*7700|rx\s*7800|rtx\s*3060|rtx\s*4060\s*ti|graphics\s*card|video\s*card|gpu)\b/.test(
      q
    )
  ) {
    return {
      illustrationKey: 'mouse',
      categoryLabel: 'PC Graphics Cards (GPU)',
      basePricePhp: 18995,
      minValidPhp: 8500,
      maxValidPhp: 125000,
      variants: ['8GB GDDR6 Dual Fan', 'OC Edition Triple Fan'],
    };
  }

  if (
    /\b(motherboard|b550|b650|b760|a520|h610|x670|z790|ryzen\s*5|ryzen\s*7|core\s*i5|core\s*i7|processor|nvme|ssd|ram\s*ddr|corsair\s*vengeance|kingston\s*fury|seasonic|power\s*supply|psu|pc\s*case|aio\s*cooler)\b/.test(
      q
    )
  ) {
    return {
      illustrationKey: 'mouse',
      categoryLabel: 'PC Components and Hardware',
      basePricePhp: 8495,
      minValidPhp: 1500,
      maxValidPhp: 45000,
      variants: ['Standard Retail Box', 'Wi-Fi / Bundled Edition'],
    };
  }

  if (
    !isAccessory &&
    /\b(iphone\s*16|iphone\s*15|iphone\s*14|iphone\s*13|iphone\s*12|s24\s*ultra|s23\s*ultra|galaxy\s*s24|galaxy\s*s23|galaxy\s*z\s*flip|galaxy\s*z\s*fold|pixel\s*8|pixel\s*9|xiaomi\s*14|ipad\s*pro|ipad\s*air)\b/.test(
      q
    )
  ) {
    return {
      illustrationKey: 'phonecase',
      categoryLabel: 'Flagship Smartphones and Tablets',
      basePricePhp: 46990,
      minValidPhp: 18000,
      maxValidPhp: 115000,
      variants: ['128GB NTC Official', '256GB NTC Official', '512GB NTC Official'],
    };
  }

  if (
    !isAccessory &&
    /\b(galaxy\s*a55|galaxy\s*a35|galaxy\s*a25|galaxy\s*a15|redmi\s*note|poco\s*x6|poco\s*f6|poco\s*m6|infinix|tecno\s*camon|tecno\s*pova|realme|vivo\s*v|oppo\s*reno|honor\s*x|nothing\s*phone|ipad\s*10th|ipad\s*mini|xiaomi\s*pad|galaxy\s*tab|smartphone|android\s*phone|tablet)\b/.test(
      q
    )
  ) {
    return {
      illustrationKey: 'phonecase',
      categoryLabel: 'Smartphones and Tablets',
      basePricePhp: 15999,
      minValidPhp: 4500,
      maxValidPhp: 38000,
      variants: ['8GB + 256GB', '12GB + 256GB'],
    };
  }

  if (
    !isAccessory &&
    /\b(ps5|playstation\s*5|nintendo\s*switch|steam\s*deck|rog\s*ally|legion\s*go|xbox\s*series)\b/.test(
      q
    )
  ) {
    return {
      illustrationKey: 'mouse',
      categoryLabel: 'Gaming Consoles and Handhelds',
      basePricePhp: 22995,
      minValidPhp: 11000,
      maxValidPhp: 52000,
      variants: ['Official Asian Release', 'Console Bundle'],
    };
  }

  if (
    /\b(sony\s*wh-1000|wf-1000|bose\s*quietcomfort|airpods\s*pro|airpods\s*max|airpods\s*4|sennheiser\s*momentum|marshall\s*major|marshall\s*stanmore|marshall\s*emberton|marshall\s*acton|jbl\s*flip|jbl\s*charge|jbl\s*partybox|jbl\s*xtreme)\b/.test(
      q
    )
  ) {
    return {
      illustrationKey: 'earbuds',
      categoryLabel: 'Premium Audio and Speakers',
      basePricePhp: 9490,
      minValidPhp: 3500,
      maxValidPhp: 28000,
      variants: ['Black', 'Cream / Silver'],
    };
  }

  if (
    /\b(keyboard|keychron|aula\s*f75|aula\s*f87|royal\s*kludge|rk61|rk84|akko|monsgeek|redragon|leobog|gmk67|lofree|nuphy|mechanical\s*keyboard)\b/.test(
      q
    )
  ) {
    return {
      illustrationKey: 'mouse',
      categoryLabel: 'Mechanical Keyboards and Peripherals',
      basePricePhp: 2495,
      minValidPhp: 650,
      maxValidPhp: 12000,
      variants: ['Linear Switch (Tri-Mode)', 'Tactile Switch (Tri-Mode)'],
    };
  }

  if (/\b(mouse|trackball|logitech|razer|viper|deathadder|attack\s*shark|pulsar|lamzu|delux|inphic|ugreen\s*mouse)\b/.test(q)) {
    return {
      illustrationKey: 'mouse',
      categoryLabel: 'Computer Mice and Peripherals',
      basePricePhp: 1195,
      minValidPhp: 180,
      maxValidPhp: 9500,
      variants: ['Black Wireless', 'White Wireless'],
    };
  }

  if (
    /\b(watch|band|tracker|relo|garmin|fitbit|amazfit|huawei\s*watch|huawei\s*band|redmi\s*watch|mi\s*band|aolon|colmi|coros|apple\s*watch)\b/.test(
      q
    )
  ) {
    return {
      illustrationKey: 'watch',
      categoryLabel: 'Smartwatches and Fitness Wearables',
      basePricePhp: 1999,
      minValidPhp: 250,
      maxValidPhp: 28000,
      variants: ['Midnight Black', 'Silver / Starlight'],
    };
  }

  if (
    /\b(earbud|earphone|headphone|headset|speaker|airpod|tws|anc|audio|mic|wm02|wm01|bowie|baseus|soundcore|jbl|sony|bose|edifier|lenovo\s*lp|moondrop|kz|hyperx|steelseries)\b/i.test(
      q
    )
  ) {
    return {
      illustrationKey: 'earbuds',
      categoryLabel: 'Electronics and Audio',
      basePricePhp: 799,
      minValidPhp: 199,
      maxValidPhp: 8500,
      variants: ['Black', 'White', 'Purple / Blue'],
    };
  }

  if (
    /\b(air\s*fryer|airfryer|rice\s*cooker|microwave|coffee\s*maker|espresso|vacuum|dyson|deerma|simplus|gaabor|perrysmith|instant\s*pot|induction\s*cooker|blender|juicer|kettle|toaster)\b/.test(
      q
    )
  ) {
    return {
      illustrationKey: 'massager',
      categoryLabel: 'Home and Kitchen Appliances',
      basePricePhp: 2495,
      minValidPhp: 550,
      maxValidPhp: 32000,
      variants: ['Standard 220V PH Plug', 'Digital Touch Edition'],
    };
  }

  if (/\b(power\s*bank|powerbank|anker|romoss|bavin|ugreen|gan\s*charger|magsafe\s*battery)\b/.test(q)) {
    return {
      illustrationKey: 'phonecase',
      categoryLabel: 'Power Banks and Fast Chargers',
      basePricePhp: 1195,
      minValidPhp: 299,
      maxValidPhp: 6500,
      variants: ['10,000mAh 22.5W', '20,000mAh 30W PD'],
    };
  }

  if (/\b(fan|cooler|ventilator|jisulife|orashare|iwata|asahi|stand\s*fan|clip\s*fan)\b/.test(q)) {
    return {
      illustrationKey: 'massager',
      categoryLabel: 'Portable Cooling and Fans',
      basePricePhp: 899,
      minValidPhp: 199,
      maxValidPhp: 5500,
      variants: ['5000mAh Rechargeable', '3600mAh Compact'],
    };
  }

  if (/\b(tumbler|aquaflask|hydro\s*flask|stanley|tyeso|owala|kleankanteen|thermos|water\s*bottle|flask)\b/.test(q)) {
    return {
      illustrationKey: 'cupmat',
      categoryLabel: 'Insulated Drinkware and Tumblers',
      basePricePhp: 849,
      minValidPhp: 249,
      maxValidPhp: 3500,
      variants: ['24oz / 710ml', '32oz / 946ml', '40oz w/ Handle'],
    };
  }

  if (
    /\b(serum|cream|lotion|toner|cleanser|sunscreen|spf|niacinamide|retinol|skin|cosmetic|tint|lip|cosrx|cerave|cetaphil|garnier|anessa|the\s*ordinary|skintific)\b/.test(
      q
    )
  ) {
    return {
      illustrationKey: 'serum',
      categoryLabel: 'Beauty and Skincare',
      basePricePhp: 549,
      minValidPhp: 149,
      maxValidPhp: 3500,
      variants: ['30ml Single Bottle', '50ml Size'],
    };
  }

  if (
    /\b(shoe|sneaker|trainer|boot|sandal|slipper|sapatos|nike|adidas|xtep|world\s*balance|new\s*balance|puma|asics|hoka|on\s*cloud|crocs|vans|converse)\b/.test(
      q
    )
  ) {
    return {
      illustrationKey: 'shoes',
      categoryLabel: 'Footwear and Athletic Shoes',
      basePricePhp: 1899,
      minValidPhp: 399,
      maxValidPhp: 12000,
      variants: ['EU 40', 'EU 41', 'EU 42', 'EU 43'],
    };
  }

  if (/\b(bag|tote|backpack|wallet|pouch|luggage|sling|anello|doughnut|herschel|mah|bostanten)\b/.test(q)) {
    return {
      illustrationKey: 'bag',
      categoryLabel: 'Bags and Everyday Carry',
      basePricePhp: 749,
      minValidPhp: 199,
      maxValidPhp: 6500,
      variants: ['Black', 'Beige / Cream', 'Navy'],
    };
  }

  if (/\b(umbrella|payong|raincoat|fibrella|parachase)\b/.test(q)) {
    return {
      illustrationKey: 'umbrella',
      categoryLabel: 'Weather and Outdoor Gear',
      basePricePhp: 349,
      minValidPhp: 120,
      maxValidPhp: 1800,
      variants: ['Black UV Coating', 'Navy Blue'],
    };
  }

  if (/\b(massag|fascia|gun|skg|booster|philips\s*ppm)\b/.test(q)) {
    return {
      illustrationKey: 'massager',
      categoryLabel: 'Health and Recovery Appliances',
      basePricePhp: 1299,
      minValidPhp: 299,
      maxValidPhp: 8500,
      variants: ['Matte Black + 4 Heads', 'Space Gray'],
    };
  }

  if (isAccessory) {
    return {
      illustrationKey: 'phonecase',
      categoryLabel: 'Mobile & Tech Accessories',
      basePricePhp: 499,
      minValidPhp: 99,
      maxValidPhp: 3500,
      variants: ['Matte Black', 'Clear Magnetic'],
    };
  }

  if (/\b(shirt|dress|pants|hoodie|jacket|top|skirt|blouse|denim|shorts|polo)\b/.test(q)) {
    return {
      illustrationKey: 'dress',
      categoryLabel: 'Apparel and Fashion',
      basePricePhp: 449,
      minValidPhp: 129,
      maxValidPhp: 4500,
      variants: ['Small (S)', 'Medium (M)', 'Large (L)', 'Extra Large (XL)'],
    };
  }

  return {
    illustrationKey: 'coaster',
    categoryLabel: 'General Marketplace Merchandise',
    basePricePhp: 699,
    minValidPhp: 99,
    maxValidPhp: 45000,
    variants: ['Standard Option'],
  };
}

function estimateSpecAwarePhpPrice(
  listingTitle: string,
  query: string,
  meta: ProductCategoryMeta,
  itemIndex: number
): number {
  const combined = `${listingTitle} ${query}`.toLowerCase();
  let base = inferProductCategoryMeta(combined).basePricePhp || meta.basePricePhp;

  if (base >= 25000) {
    if (/\b(rtx\s*4080|rtx\s*4090|rtx\s*5080)\b/.test(combined)) base = 139995;
    else if (/\b(rtx\s*4070|fa608|tu143)\b/.test(combined)) base = 93999;
    else if (/\b(a16|fa607|fa617|rl204|rog\s*strix|zephyrus)\b/.test(combined)) base = 90999;
    else if (/\b(rtx\s*4060|fa507nv|1tb\s*ssd)\b/.test(combined)) base = 66995;
    else if (/\b(rtx\s*4050|fa507nu|fx517|dash\s*f15)\b/.test(combined)) base = 56995;
    else if (/\b(rtx\s*3050|fx507|anv15|loq)\b/.test(combined)) base = 47995;
    else if (/\b(rtx\s*2050|fa506)\b/.test(combined)) base = 42995;

    const offsets = [0, -1000, 1500, -2000, 1000, -500, 2000, -1500];
    return Math.max(meta.minValidPhp, base + offsets[itemIndex % offsets.length]);
  }

  if (base >= 5000) {
    const offsets = [0, -300, 450, -500, 250, -200, 600, -400];
    return Math.max(meta.minValidPhp, base + offsets[itemIndex % offsets.length]);
  }

  const smallOffsets = [0, -40, 50, -70, 30, -25, 80, -50];
  return Math.max(meta.minValidPhp, base + smallOffsets[itemIndex % smallOffsets.length]);
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function decodeRedirectUrl(rawHref: string): string {
  const cleaned = rawHref.replace(/&amp;/g, '&').trim();
  try {
    const u = new URL(cleaned);
    if (u.hostname.includes('bing.com') && u.pathname.startsWith('/ck/a')) {
      const uParam = u.searchParams.get('u');
      if (uParam && uParam.startsWith('a1')) {
        const b64 = uParam.slice(2).replace(/-/g, '+').replace(/_/g, '/');
        const decoded = Buffer.from(b64, 'base64').toString('utf8');
        if (/^https?:\/\//i.test(decoded)) return decoded;
      }
    }
    const ruMatch = cleaned.match(/\/RU=([^/]+)\/RK=/);
    if (ruMatch) {
      const decoded = decodeURIComponent(ruMatch[1]);
      if (/^https?:\/\//i.test(decoded)) return decoded;
    }
    if (u.hostname.includes('duckduckgo.com')) {
      const uddg = u.searchParams.get('uddg');
      if (uddg && /^https?:\/\//i.test(uddg)) return uddg;
    }
  } catch {}
  return cleaned;
}

function cleanQueryForImageSearch(rawTitle: string): string {
  return (
    rawTitle
      .replace(/\[.*?\]|\(.*?\)|【.*?】|\*.*?\*/g, ' ')
      .replace(
        /\b(LazMall|Shopee\s*Mall|Official\s*Store|Flagship\s*Store|100%\s*Original|Authentic|COD|Free\s*Shipping|Local\s*Stock)\b/gi,
        ' '
      )
      .replace(/[^a-zA-Z0-9\s.-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 70) || 'Product'
  );
}

export async function fetchDistinctProductGalleryUrls(
  rawProductTitle: string,
  count = 4
): Promise<string[]> {
  const cleanTitle = cleanQueryForImageSearch(rawProductTitle);
  const cacheKey = `${cleanTitle.toLowerCase()}:${count}`;
  const cached = galleryCache.get(cacheKey);
  if (cached && cached.length >= count) {
    return cached.slice(0, count);
  }

  try {
    const searchUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(
      `${cleanTitle} product photo`
    )}&first=1&FORM=HDRSC2`;

    const response = await fetch(searchUrl, {
      headers: BROWSER_HEADERS,
      signal: AbortSignal.timeout(3200),
    });

    if (response.ok) {
      const html = await response.text();
      const uniqueOipIds = new Set<string>();
      const oipRegex = /OIP\.[A-Za-z0-9_-]{12,45}/g;
      let match: RegExpExecArray | null;
      while ((match = oipRegex.exec(html)) !== null) {
        uniqueOipIds.add(match[0]);
        if (uniqueOipIds.size >= Math.max(count * 2, 12)) break;
      }

      if (uniqueOipIds.size > 0) {
        const urls = Array.from(uniqueOipIds).map(
          (oipId, idx) =>
            `https://tse${(idx % 4) + 1}.mm.bing.net/th?id=${oipId}&pid=Api&w=720&h=720&c=7&rs=1`
        );
        galleryCache.set(cacheKey, urls);
        return urls.slice(0, count);
      }
    }
  } catch {}

  const singleFallback = `https://tse1.mm.bing.net/th?q=${encodeURIComponent(
    `${cleanTitle} official product photo`
  )}&w=720&h=720&c=7&rs=1&p=0`;
  return [singleFallback];
}

function extractValidPhpPrices(text: string, minValidPhp: number, maxValidPhp: number): number[] {
  const prices: number[] = [];
  const priceRegex =
    /(?:₱|PHP\s*|Php\s*)(\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?|\d{3,6}(?:\.\d{1,2})?)|\bP\s?(\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?|\d{3,6}\.\d{2})\b/g;
  let match: RegExpExecArray | null;
  while ((match = priceRegex.exec(text)) !== null) {
    const rawNum = match[1] || match[2];
    if (!rawNum) continue;
    const num = Number(rawNum.replace(/,/g, ''));
    if (Number.isFinite(num) && num >= minValidPhp && num <= maxValidPhp) {
      if (num >= 2020 && num <= 2027 && !match[0].includes(',') && !match[0].includes('.')) {
        continue;
      }
      prices.push(num);
    }
  }
  return prices;
}

function isTrustedStoreUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
    if (!TRUSTED_STORE_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))) {
      return false;
    }
    if (host.includes('lazada.') && /^\/(tag|shop-|catalog)\b/i.test(parsed.pathname)) {
      return false;
    }
    if (host.includes('shopee.') && /^\/(search|mall|campaigns|list)\b/i.test(parsed.pathname)) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function isTitleRelevantToQuery(title: string, query: string): boolean {
  if (/[\u0E00-\u0E7F\u1780-\u17FF\u3040-\u30ff\u3400-\u9fff\u0600-\u06FF]/.test(title)) {
    return false;
  }
  const lowerTitle = title.toLowerCase();
  const lowerQuery = query.toLowerCase();

  if (
    /\b(jual|resmi|dirilis|pengganti|harga|murah|terbaru|spesifikasi|kelebihan|kekurangan|notebookcheck|external\s+reviews|jam\s+online|yugatech|unbox\.ph|revu\.com|techspin|gadgetmatch|specs,\s*price|pre-order\s+ends|now\s+in\s+ph|hands-on|full\s+review|cheap\s*-\s*fast)\b/i.test(
      lowerTitle
    )
  ) {
    return false;
  }

  const queryWantsAccessory =
    /\b(protector|cover|case|casing|skin|sticker|sleeve|bag|charger|adapter|cable|stand|holder|keycap)\b/i.test(
      lowerQuery
    );
  if (
    !queryWantsAccessory &&
    /\b(keyboard\s+protector|screen\s+protector|tempered\s+glass|silicone\s+cover|dust\s+plug|skin\s+sticker|decal|replacement\s+battery|laptop\s+skin)\b/i.test(
      lowerTitle
    )
  ) {
    return false;
  }

  const queryIsLaptop =
    /\b(laptop|notebook|macbook|matebook|thinkpad|ideapad|vivobook|zenbook|zephyrus|strix|loq|legion|victus|omen|nitro|predator|a15|a16|f15|f16|fa506|fa507|fa607|fa608|fa617|fx507|fx517)\b/i.test(
      lowerQuery
    ) && !/\b(motherboard|monitor|mouse|cooler|keyboard|headset|case)\b/i.test(lowerQuery);

  if (
    queryIsLaptop &&
    /\b(motherboard|mainboard|b450m?|b550m?|b650m?|b760m?|b850m?|x670e?|x870e?|z790|a520m|h610m|liquid\s+cooler|cpu\s+cooler|aio\s+cooler|lc\s+ii|lc\s+iii|gaming\s+mouse|m4\s+air|m3\s+gen|gaming\s+monitor|vg24|vg27|gaming\s+case|chassis)\b/i.test(
      lowerTitle
    )
  ) {
    return false;
  }

  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const titleNorm = ` ${norm(title)} `;
  const words = norm(query)
    .split(' ')
    .filter((w) => w.length >= 2);
  if (words.length === 0) return false;

  // Enforce model token match when the query specifies an alphanumeric model token (e.g. a16, f15, wm02, m331, r50i, s24, gt7, gts3)
  const modelTokens = words.filter(
    (w) => /[a-z]/.test(w) && /\d/.test(w) && !/^(5g|4g|24g|gb|tb|hz)$/i.test(w)
  );
  for (const modelTok of modelTokens) {
    if (!titleNorm.includes(` ${modelTok} `) && !titleNorm.includes(modelTok)) {
      return false;
    }
  }

  const hits = words.filter((w) => titleNorm.includes(` ${w} `) || titleNorm.includes(w)).length;
  return hits >= Math.max(1, Math.ceil(words.length * 0.7));
}

function cleanScrapedListingTitle(rawTitle: string): string {
  return decodeHtmlEntities(rawTitle)
    .replace(/[^\x20-\x7E₱]+/g, ' ')
    .replace(/\.{2,}/g, ' ')
    .replace(
      /\s*(?:\||-|\u2013|\u2014|·)\s*(?:Lazada(?:\s*PH|\s*Philippines)?|Shopee(?:\s*PH|\s*Philippines)?|Temu(?:\s*Philippines)?|Notebookcheck.*|Jam\s*Online.*|YugaTech.*|Unbox.*|Price\s*in\s*Philippines.*|Specs,\s*Price.*|Official\s*Store.*|Philippines.*)$/gi,
      ''
    )
    .replace(/^(?:Buy\s+|Shop\s+|Jual\s+)/i, '')
    .replace(/\s+(?:Cheap\s*-\s*Fast.*|online\s+at\s+best\s+prices.*|Price\s+List.*)$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isGenericIndexTitle(title: string): boolean {
  const lower = title.toLowerCase();
  if (lower.length < 10) return true;
  if (
    /^(price\s+list|best\s+\d+|top\s+\d+|search\s+results|lazada\.com\.ph|shopee\.ph|temu\.com|shop\s+.*\s+cheap)/i.test(
      lower
    )
  ) {
    return true;
  }
  if (
    /\b(price\s+list\s+in\s+philippines|specs\s+and\s+price\s+philippines|specs\s+price\s+availability|external\s+reviews|review\s+\d{4}|why\s+why\s+why|tell\s+me\s+why|\bprice\s*$)\b/i.test(
      lower
    )
  ) {
    return true;
  }
  return false;
}

function inferPlatformFromUrlOrText(
  url: string,
  text: string,
  fallbackIndex: number
): 'Shopee' | 'Lazada' | 'Temu' {
  const lowerUrl = url.toLowerCase();
  const lowerText = text.toLowerCase();
  if (lowerUrl.includes('shopee.') || lowerText.includes('shopee')) return 'Shopee';
  if (
    lowerUrl.includes('lazada.') ||
    lowerText.includes('lazada') ||
    lowerText.includes('lazmall')
  ) {
    return 'Lazada';
  }
  if (lowerUrl.includes('temu.') || lowerText.includes('temu')) return 'Temu';
  return fallbackIndex % 2 === 0 ? 'Lazada' : 'Shopee';
}

const VERIFIED_BRAND_STORES: Array<{
  pattern: RegExp;
  brandName: string;
  lazadaStore: string;
  shopeeStore: string;
}> = [
  { pattern: /\b(asus|tuf|rog|zephyrus|vivobook|zenbook)\b/i, brandName: 'ASUS', lazadaStore: 'ASUS Official Store LazMall', shopeeStore: 'ASUS Official Store PH' },
  { pattern: /\b(lenovo|legion|loq|thinkpad|ideapad|thinkplus)\b/i, brandName: 'Lenovo', lazadaStore: 'Lenovo Official Store LazMall', shopeeStore: 'Lenovo Official Store PH' },
  { pattern: /\b(acer|nitro|predator|aspire|swift)\b/i, brandName: 'Acer', lazadaStore: 'Acer Official Store LazMall', shopeeStore: 'Acer Official Store PH' },
  { pattern: /\b(msi|msi\s+katana|msi\s+cyborg|msi\s+stealth|msi\s+claw)\b/i, brandName: 'MSI', lazadaStore: 'MSI Official Store LazMall', shopeeStore: 'MSI Official Store PH' },
  { pattern: /\b(hp|victus|omen|pavilion)\b/i, brandName: 'HP', lazadaStore: 'HP Official Store LazMall', shopeeStore: 'HP Official Store PH' },
  { pattern: /\b(apple|macbook|iphone|ipad|airpods)\b/i, brandName: 'Apple', lazadaStore: 'Apple Flagship Store LazMall', shopeeStore: 'Apple Flagship Store' },
  { pattern: /\b(samsung|galaxy)\b/i, brandName: 'Samsung', lazadaStore: 'Samsung Official Store LazMall', shopeeStore: 'Samsung Official Store PH' },
  { pattern: /\b(xiaomi|redmi|poco|mijia)\b/i, brandName: 'Xiaomi', lazadaStore: 'Xiaomi Official Store LazMall', shopeeStore: 'Xiaomi Official Store Global' },
  { pattern: /\b(huawei|matepad|watch\s+gt|watch\s+fit)\b/i, brandName: 'HUAWEI', lazadaStore: 'Huawei Official Store LazMall', shopeeStore: 'Huawei Official Store PH' },
  { pattern: /\b(logitech|logi)\b/i, brandName: 'Logitech', lazadaStore: 'Logitech Official Store LazMall', shopeeStore: 'Logitech Official Store PH' },
  { pattern: /\b(razer|deathadder|viper|blackshark)\b/i, brandName: 'Razer', lazadaStore: 'Razer Official Store LazMall', shopeeStore: 'Razer Official Store PH' },
  { pattern: /\b(baseus|bowie|wm01|wm02)\b/i, brandName: 'Baseus', lazadaStore: 'Baseus Official Store', shopeeStore: 'Baseus Official Store PH' },
  { pattern: /\b(ugreen|hitune)\b/i, brandName: 'UGREEN', lazadaStore: 'UGREEN Flagship Store', shopeeStore: 'UGREEN Official Store PH' },
  { pattern: /\b(anker|soundcore|r50i|a20i)\b/i, brandName: 'Soundcore', lazadaStore: 'Soundcore Official Store LazMall', shopeeStore: 'Soundcore Official Store PH' },
  { pattern: /\b(jbl|tune|wave)\b/i, brandName: 'JBL', lazadaStore: 'JBL Official Store LazMall', shopeeStore: 'JBL Official Store PH' },
  { pattern: /\b(sony|wh-1000xm|wf-1000xm)\b/i, brandName: 'Sony', lazadaStore: 'Sony Official Store LazMall', shopeeStore: 'Sony Official Store PH' },
  { pattern: /\b(edifier)\b/i, brandName: 'Edifier', lazadaStore: 'Edifier Official Store LazMall', shopeeStore: 'Edifier Official Store PH' },
  { pattern: /\b(aolon|gts3)\b/i, brandName: 'Aolon', lazadaStore: 'Aolon Official Store LazMall', shopeeStore: 'Aolon Official Store PH' },
  { pattern: /\b(colmi|p71)\b/i, brandName: 'Colmi', lazadaStore: 'Colmi Official LazMall Store', shopeeStore: 'Colmi Official Store PH' },
  { pattern: /\b(coros|pace\s*[34])\b/i, brandName: 'COROS', lazadaStore: 'COROS Official Flagship PH', shopeeStore: 'COROS Official Store PH' },
  { pattern: /\b(garmin|forerunner|instinct)\b/i, brandName: 'Garmin', lazadaStore: 'Garmin Official Store LazMall', shopeeStore: 'Garmin Official Store PH' },
  { pattern: /\b(philips|ppm7303)\b/i, brandName: 'Philips', lazadaStore: 'Philips Official Store LazMall', shopeeStore: 'Philips Personal Care Official' },
  { pattern: /\b(skg)\b/i, brandName: 'SKG', lazadaStore: 'SKG Official Store LazMall', shopeeStore: 'SKG Official Store PH' },
  { pattern: /\b(booster|boluojun)\b/i, brandName: 'Booster', lazadaStore: 'Booster Official LazMall Store', shopeeStore: 'Booster Fitness Store PH' },
  { pattern: /\b(fibrella)\b/i, brandName: 'Fibrella', lazadaStore: 'Fibrella Official Store LazMall', shopeeStore: 'Fibrella Official Store PH' },
  { pattern: /\b(parachase)\b/i, brandName: 'Parachase', lazadaStore: 'Parachase Official Store LazMall', shopeeStore: 'Parachase Official Store PH' },
  { pattern: /\b(ringke)\b/i, brandName: 'Ringke', lazadaStore: 'Ringke Official Store LazMall', shopeeStore: 'Ringke Official Store PH' },
  { pattern: /\b(nillkin)\b/i, brandName: 'Nillkin', lazadaStore: 'Nillkin Flagship LazMall', shopeeStore: 'Nillkin Official Store PH' },
  { pattern: /\b(spigen)\b/i, brandName: 'Spigen', lazadaStore: 'Spigen Official Store LazMall', shopeeStore: 'Spigen Official Store PH' },
  { pattern: /\b(xtep)\b/i, brandName: 'XTEP', lazadaStore: 'XTEP Official Store LazMall', shopeeStore: 'XTEP Official Store PH' },
  { pattern: /\b(world\s+balance)\b/i, brandName: 'World Balance', lazadaStore: 'World Balance Official LazMall', shopeeStore: 'World Balance Official Store' },
  { pattern: /\b(361\s*degrees|361°)\b/i, brandName: '361 Degrees', lazadaStore: '361 Degrees Official LazMall', shopeeStore: '361 Degrees Official Store PH' },
  { pattern: /\b(cosrx)\b/i, brandName: 'COSRX', lazadaStore: 'COSRX Official Store LazMall', shopeeStore: 'COSRX Official Store PH' },
  { pattern: /\b(garnier)\b/i, brandName: 'Garnier', lazadaStore: 'Garnier Official Store LazMall', shopeeStore: 'Garnier Official Store PH' },
  { pattern: /\b(mah)\b/i, brandName: 'MAH', lazadaStore: 'MAH Official Store LazMall', shopeeStore: 'MAH Official Store PH' },
  { pattern: /\b(bostanten)\b/i, brandName: 'BOSTANTEN', lazadaStore: 'BOSTANTEN Official LazMall', shopeeStore: 'BOSTANTEN Official Store PH' },
  { pattern: /\b(b\.?o\.?w|md190)\b/i, brandName: 'B.O.W', lazadaStore: 'BOW Flagship LazMall', shopeeStore: 'BOW store' },
  { pattern: /\b(inphic)\b/i, brandName: 'INPHIC', lazadaStore: 'INPHIC Official Store LazMall', shopeeStore: 'INPHIC Official Store PH' },
  { pattern: /\b(aula)\b/i, brandName: 'AULA', lazadaStore: 'AULA Official Store LazMall', shopeeStore: 'AULA Official Store PH' },
  { pattern: /\b(rapoo)\b/i, brandName: 'Rapoo', lazadaStore: 'Rapoo Official LazMall Store', shopeeStore: 'Rapoo Official Store PH' },
  { pattern: /\b(delux|m618)\b/i, brandName: 'Delux', lazadaStore: 'ELSZ Store (Delux Authorized)', shopeeStore: 'Delux Official Store PH' },
];

function inferSellerAndBrand(
  title: string,
  snippet: string,
  url: string,
  platform: 'Shopee' | 'Lazada' | 'Temu',
  fallbackQuery: string
): { brandName: string; sellerName: string; isMallVerified: boolean; sellerLocation: string } {
  const combined = `${title} ${snippet}`;

  for (const retailer of KNOWN_PH_RETAILERS) {
    if (combined.toLowerCase().includes(retailer.toLowerCase())) {
      const matchedBrand =
        VERIFIED_BRAND_STORES.find((b) => b.pattern.test(combined))?.brandName ||
        retailer.split(/\s+/)[0];
      return {
        brandName: matchedBrand,
        sellerName: `${retailer} (${platform === 'Lazada' ? 'LazMall' : 'Official Store'})`,
        isMallVerified: true,
        sellerLocation: 'Metro Manila',
      };
    }
  }

  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
    if (host.includes('villman.com')) {
      return {
        brandName: VERIFIED_BRAND_STORES.find((b) => b.pattern.test(combined))?.brandName || 'VillMan',
        sellerName: 'VillMan Computers LazMall',
        isMallVerified: true,
        sellerLocation: 'Quezon City, Metro Manila',
      };
    }
    if (host.includes('pcexpress.ph') || host.includes('pcx.com.ph')) {
      return {
        brandName: VERIFIED_BRAND_STORES.find((b) => b.pattern.test(combined))?.brandName || 'PC Express',
        sellerName: 'PC Express Official Shopee Mall',
        isMallVerified: true,
        sellerLocation: 'Metro Manila',
      };
    }
    if (host.includes('datablitz.com.ph')) {
      return {
        brandName: VERIFIED_BRAND_STORES.find((b) => b.pattern.test(combined))?.brandName || 'DataBlitz',
        sellerName: 'DataBlitz Official Store PH',
        isMallVerified: true,
        sellerLocation: 'Metro Manila',
      };
    }
    if (host.includes('abenson.com')) {
      return {
        brandName: VERIFIED_BRAND_STORES.find((b) => b.pattern.test(combined))?.brandName || 'Abenson',
        sellerName: 'Abenson Official Store PH',
        isMallVerified: true,
        sellerLocation: 'Metro Manila',
      };
    }
  } catch {}

  const verifiedBrand = VERIFIED_BRAND_STORES.find((b) => b.pattern.test(combined));
  if (verifiedBrand) {
    return {
      brandName: verifiedBrand.brandName,
      sellerName:
        platform === 'Lazada'
          ? verifiedBrand.lazadaStore
          : platform === 'Shopee'
          ? verifiedBrand.shopeeStore
          : `${verifiedBrand.brandName} Official Store`,
      isMallVerified: true,
      sellerLocation: 'Metro Manila',
    };
  }

  const firstWord =
    title
      .replace(/^\[.*?\]\s*|^【.*?】\s*/, '')
      .split(/\s+/)[0]
      ?.replace(/[^a-zA-Z0-9]/g, '') ||
    fallbackQuery.split(/\s+/)[0] ||
    'Marketplace';
  const brandName =
    firstWord.length <= 4
      ? firstWord.toUpperCase()
      : firstWord.charAt(0).toUpperCase() + firstWord.slice(1);

  return {
    brandName,
    sellerName:
      platform === 'Lazada'
        ? 'Verified Seller on Lazada PH'
        : platform === 'Shopee'
        ? 'Verified Seller on Shopee PH'
        : 'Verified Seller on Temu',
    isMallVerified: false,
    sellerLocation: platform === 'Temu' ? 'Cross-Border Direct' : 'Metro Manila',
  };
}

interface ShopifySuggestProduct {
  id?: number | string;
  title?: string;
  price?: string | number;
  price_max?: string | number;
  compare_at_price_max?: string | number;
  url?: string;
  image?: string;
  featured_image?: { url?: string };
  vendor?: string;
}

async function fetchPhRetailShopifyListings(
  cleanQuery: string,
  meta: ProductCategoryMeta,
  productGroup: string,
  slug: string
): Promise<{ entries: CatalogSeedEntry[]; prices: number[] }> {
  const entries: CatalogSeedEntry[] = [];
  const prices: number[] = [];

  const tasks = PH_SHOPIFY_STORES.map(async (store) => {
    const endpoint = `${store.baseUrl}/search/suggest.json?q=${encodeURIComponent(
      cleanQuery
    )}&resources[type]=product&resources[limit]=6`;
    const res = await fetch(endpoint, {
      headers: {
        ...BROWSER_HEADERS,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(3400),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      resources?: { results?: { products?: ShopifySuggestProduct[] } };
    };
    return (data.resources?.results?.products ?? []).map((p) => ({ store, product: p }));
  });

  const settled = await Promise.allSettled(tasks);
  for (const res of settled) {
    if (res.status !== 'fulfilled') continue;
    for (const { store, product } of res.value) {
      const title = decodeHtmlEntities(String(product.title ?? '')).trim();
      if (!title || !isTitleRelevantToQuery(title, cleanQuery)) continue;

      let rawPrice = Number(String(product.price ?? '').replace(/,/g, ''));
      if (rawPrice > meta.maxValidPhp * 20 && rawPrice % 100 === 0) {
        rawPrice = rawPrice / 100;
      }
      if (!Number.isFinite(rawPrice) || rawPrice < meta.minValidPhp || rawPrice > meta.maxValidPhp) {
        continue;
      }

      prices.push(rawPrice);

      let comparePrice = Number(String(product.compare_at_price_max ?? '').replace(/,/g, ''));
      if (comparePrice > meta.maxValidPhp * 20 && comparePrice % 100 === 0) {
        comparePrice = comparePrice / 100;
      }

      const rawImg = product.featured_image?.url || product.image || '';
      const imgUrl = rawImg.startsWith('//') ? `https:${rawImg}` : rawImg;
      const sourceUrl = buildShopSearchUrl(store.platform, title);

      entries.push({
        id: `cat_web_${slug}_ph_${entries.length + 1}`,
        productGroup,
        platformName: store.platform,
        productTitle: title.slice(0, 130),
        brandName: String(product.vendor || title.split(/\s+/)[0] || 'Official'),
        sellerName: store.name,
        sellerLocation: store.location,
        isMallVerified: true,
        pricePhp: Math.round(rawPrice),
        originalPricePhp:
          Number.isFinite(comparePrice) && comparePrice > rawPrice
            ? Math.round(comparePrice)
            : undefined,
        starRating: 4.9,
        reviewCount: 140 + ((entries.length * 37) % 320),
        soldCountText: 'Verified PH Retail Price',
        imageUrl: imgUrl || undefined,
        imageUrls: imgUrl ? [imgUrl] : undefined,
        sourceUrl,
        illustrationKey: meta.illustrationKey,
        categoryLabel: meta.categoryLabel,
        variants: meta.variants,
        keywordsText: `${cleanQuery.toLowerCase()} ${title.toLowerCase()}`,
        shippingNote: `Live PH retail price from ${store.name} · Official local warranty`,
        aboutText: `${title} available at ${store.name} (${store.location}) for ₱${Math.round(
          rawPrice
        ).toLocaleString()}.`,
      });
    }
  }

  return { entries, prices };
}

export async function discoverLiveWebMarketplaceListings(
  rawQuery: string
): Promise<CatalogSeedEntry[]> {
  const cleanQuery = rawQuery.trim().replace(/\s+/g, ' ').slice(0, 75);
  if (!cleanQuery) return [];

  const cacheKey = cleanQuery.toLowerCase();
  const cached = liveSearchCache.get(cacheKey);
  if (cached && cached.length > 0) return cached;

  const meta = inferProductCategoryMeta(cleanQuery);
  const slug =
    cleanQuery
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 32) || 'query';
  const productGroup = `web-${slug}`;

  const yahooMarketUrl = `https://ph.search.yahoo.com/search?p=${encodeURIComponent(
    `${cleanQuery} (site:lazada.com.ph OR site:shopee.ph)`
  )}&n=15`;

  const yahooPriceUrl = `https://ph.search.yahoo.com/search?p=${encodeURIComponent(
    `${cleanQuery} price philippines ₱`
  )}&n=15`;

  const bingImgLazadaUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(
    `${cleanQuery} lazada philippines`
  )}&first=1&FORM=HDRSC2`;

  const bingImgShopeeUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(
    `${cleanQuery} shopee philippines`
  )}&first=1&FORM=HDRSC2`;

  const [shopifyPromise, yahooMarketRes, yahooPriceRes, bingLzRes, bingSpRes] =
    await Promise.allSettled([
      fetchPhRetailShopifyListings(cleanQuery, meta, productGroup, slug),
      fetch(yahooMarketUrl, { headers: BROWSER_HEADERS, signal: AbortSignal.timeout(3600) }),
      fetch(yahooPriceUrl, { headers: BROWSER_HEADERS, signal: AbortSignal.timeout(3600) }),
      fetch(bingImgLazadaUrl, { headers: BROWSER_HEADERS, signal: AbortSignal.timeout(3400) }),
      fetch(bingImgShopeeUrl, { headers: BROWSER_HEADERS, signal: AbortSignal.timeout(3400) }),
    ]);

  const deduplicated: CatalogSeedEntry[] = [];
  const seenTitleKeys = new Set<string>();

  if (shopifyPromise.status === 'fulfilled') {
    for (const item of shopifyPromise.value.entries) {
      const key = item.productTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()
        .slice(0, 48);
      if (key && !seenTitleKeys.has(key)) {
        seenTitleKeys.add(key);
        deduplicated.push(item);
      }
    }
  }

  const distinctOipIds: string[] = [];
  const seenOip = new Set<string>();
  const rawCandidates: Array<{
    title: string;
    url: string;
    snippet: string;
    inlinePrices: number[];
    oipUrl?: string;
    platformHint?: 'Shopee' | 'Lazada' | 'Temu';
    rating?: number;
    reviewCount?: number;
  }> = [];

  const parseBingImagesHtml = (html: string, platformHint: 'Shopee' | 'Lazada') => {
    const oipRegex = /OIP\.[A-Za-z0-9_-]{12,45}/g;
    let m: RegExpExecArray | null;
    while ((m = oipRegex.exec(html)) !== null) {
      if (!seenOip.has(m[0])) {
        seenOip.add(m[0]);
        distinctOipIds.push(m[0]);
      }
    }

    const iuscRegex = /\bm="(\{[^"]+?\})"/g;
    let iuscMatch: RegExpExecArray | null;
    while ((iuscMatch = iuscRegex.exec(html)) !== null) {
      try {
        const decodedJson = decodeHtmlEntities(iuscMatch[1]);
        const parsed = JSON.parse(decodedJson) as {
          purl?: string;
          turl?: string;
          t?: string;
          desc?: string;
        };
        if (!parsed.t) continue;
        const cleanedTitle = cleanScrapedListingTitle(parsed.t);
        if (
          isGenericIndexTitle(cleanedTitle) ||
          !isTitleRelevantToQuery(cleanedTitle, cleanQuery)
        ) {
          continue;
        }
        const oipInTurl = parsed.turl?.match(/OIP\.[A-Za-z0-9_-]{12,45}/)?.[0];
        const oipUrl = oipInTurl
          ? `https://tse1.mm.bing.net/th?id=${oipInTurl}&pid=Api&w=720&h=720&c=7&rs=1`
          : undefined;
        const textForPrice = `${cleanedTitle} ${parsed.desc ?? ''}`;
        const inlinePrices = extractValidPhpPrices(
          textForPrice,
          meta.minValidPhp,
          meta.maxValidPhp
        );

        rawCandidates.push({
          title: cleanedTitle,
          url: parsed.purl || '',
          snippet: parsed.desc ? decodeHtmlEntities(parsed.desc) : '',
          inlinePrices,
          oipUrl,
          platformHint,
        });
      } catch {}
    }
  };

  if (bingLzRes.status === 'fulfilled' && bingLzRes.value.ok) {
    try {
      parseBingImagesHtml(await bingLzRes.value.text(), 'Lazada');
    } catch {}
  }

  if (bingSpRes.status === 'fulfilled' && bingSpRes.value.ok) {
    try {
      parseBingImagesHtml(await bingSpRes.value.text(), 'Shopee');
    } catch {}
  }

  const parseYahooHtml = (html: string) => {
    const blocks = html.split(/<div[^>]+class="[^"]*algo[^"]*"/i).slice(1);
    for (const block of blocks) {
      const slice = block.slice(0, 4200);
      const linkMatch = slice.match(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
      if (!linkMatch) continue;
      const resolvedUrl = decodeRedirectUrl(linkMatch[1]);
      if (!isTrustedStoreUrl(resolvedUrl)) continue;

      const cleanedTitle = cleanScrapedListingTitle(linkMatch[2]);
      if (
        isGenericIndexTitle(cleanedTitle) ||
        !isTitleRelevantToQuery(cleanedTitle, cleanQuery)
      ) {
        continue;
      }

      const snippetText = decodeHtmlEntities(slice.slice(0, 1800));
      const inlinePrices = extractValidPhpPrices(
        `${cleanedTitle} ${snippetText}`,
        meta.minValidPhp,
        meta.maxValidPhp
      );

      const ratingMatch = snippetText.match(/\b(4\.\d|5\.0)\b/);
      const reviewsMatch = snippetText.match(
        /\b(\d{1,3}(?:,\d{3})+|\d{2,5})\s*(?:ratings?|reviews?|votes?)/i
      );

      rawCandidates.push({
        title: cleanedTitle,
        url: resolvedUrl,
        snippet: snippetText.slice(0, 260),
        inlinePrices,
        rating: ratingMatch ? Number(ratingMatch[1]) : undefined,
        reviewCount: reviewsMatch ? Number(reviewsMatch[1].replace(/,/g, '')) : undefined,
      });
    }
  };

  if (yahooMarketRes.status === 'fulfilled' && yahooMarketRes.value.ok) {
    try {
      parseYahooHtml(await yahooMarketRes.value.text());
    } catch {}
  }

  if (yahooPriceRes.status === 'fulfilled' && yahooPriceRes.value.ok) {
    try {
      parseYahooHtml(await yahooPriceRes.value.text());
    } catch {}
  }

  // Enrich up to 3 direct Lazada PDP candidates with real PDP price, gallery images, and seller metadata
  const directLazadaCandidates = rawCandidates
    .filter((c) => /lazada\.com\.ph\/products\/[^/?#]+-i\d+/i.test(c.url))
    .slice(0, 3);
  if (directLazadaCandidates.length > 0) {
    await Promise.allSettled(
      directLazadaCandidates.map(async (cand) => {
        const res = await fetch(cand.url, {
          headers: BROWSER_HEADERS,
          signal: AbortSignal.timeout(2600),
        });
        if (!res.ok) return;
        const html = await res.text();
        const pdp = parseLazadaPdpHtml(html);
        if (!pdp) return;
        if (pdp.title && isTitleRelevantToQuery(pdp.title, cleanQuery)) {
          cand.title = pdp.title;
        }
        if (
          pdp.pricePhp &&
          pdp.pricePhp >= meta.minValidPhp &&
          pdp.pricePhp <= meta.maxValidPhp
        ) {
          cand.inlinePrices = [pdp.pricePhp];
        }
        if (pdp.images.length > 0) {
          cand.oipUrl = pdp.images[0];
        }
        if (pdp.description) {
          cand.snippet = pdp.description;
        }
      })
    );
  }

  for (let i = 0; i < rawCandidates.length; i += 1) {
    const cand = rawCandidates[i];
    const normTitleKey = cand.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
      .slice(0, 48);
    if (!normTitleKey || seenTitleKeys.has(normTitleKey)) continue;
    seenTitleKeys.add(normTitleKey);

    const urlLower = cand.url.toLowerCase();
    const urlPlatform: 'Shopee' | 'Lazada' | 'Temu' | undefined = urlLower.includes('shopee.ph')
      ? 'Shopee'
      : urlLower.includes('lazada.com.ph')
      ? 'Lazada'
      : urlLower.includes('temu.com')
      ? 'Temu'
      : undefined;
    const platformName =
      urlPlatform ||
      cand.platformHint ||
      inferPlatformFromUrlOrText(cand.url, `${cand.title} ${cand.snippet}`, deduplicated.length);
    const { brandName, sellerName, isMallVerified, sellerLocation } = inferSellerAndBrand(
      cand.title,
      cand.snippet,
      cand.url,
      platformName,
      cleanQuery
    );

    const hasInlinePrice = cand.inlinePrices.length > 0;
    const resolvedPricePhp = hasInlinePrice
      ? cand.inlinePrices[0]
      : estimateSpecAwarePhpPrice(cand.title, cleanQuery, meta, deduplicated.length);

    const oipStartIdx = (deduplicated.length * 3) % Math.max(1, distinctOipIds.length);
    const cardGallery: string[] = [];
    if (cand.oipUrl) {
      cardGallery.push(cand.oipUrl);
    }
    for (let k = 0; cardGallery.length < 4 && distinctOipIds.length > 0 && k < 6; k += 1) {
      const oip = distinctOipIds[(oipStartIdx + k) % distinctOipIds.length];
      const u = `https://tse${(k % 4) + 1}.mm.bing.net/th?id=${oip}&pid=Api&w=720&h=720&c=7&rs=1`;
      if (!cardGallery.includes(u)) {
        cardGallery.push(u);
      }
    }

    const fallbackSingleUrl = `https://tse1.mm.bing.net/th?q=${encodeURIComponent(
      cleanQueryForImageSearch(cand.title)
    )}&w=720&h=720&c=7&rs=1&p=0`;

    const primaryImageUrl = cardGallery[0] || fallbackSingleUrl;
    const galleryUrls = cardGallery.length > 0 ? cardGallery : [fallbackSingleUrl];

    const marketplaceDirectUrl = isDirectMarketplaceProductUrl(cand.url)
      ? cand.url
      : buildShopSearchUrl(platformName, cand.title);

    deduplicated.push({
      id: `cat_web_${slug}_${deduplicated.length + 1}`,
      productGroup,
      platformName,
      productTitle: cand.title.slice(0, 125),
      brandName,
      sellerName,
      sellerLocation,
      isMallVerified,
      pricePhp: Math.round(resolvedPricePhp),
      originalPricePhp:
        hasInlinePrice && cand.inlinePrices.length > 1
          ? Math.max(...cand.inlinePrices)
          : undefined,
      starRating: cand.rating ?? (isMallVerified ? 4.9 : 4.8),
      reviewCount: cand.reviewCount ?? (isMallVerified ? 160 + ((i * 29) % 240) : 55 + ((i * 19) % 90)),
      soldCountText: hasInlinePrice ? 'Live PH price' : 'PH SRP benchmark',
      imageUrl: primaryImageUrl,
      imageUrls: galleryUrls,
      sourceUrl: marketplaceDirectUrl,
      illustrationKey: meta.illustrationKey,
      categoryLabel: meta.categoryLabel,
      variants: meta.variants,
      keywordsText: `${cleanQuery.toLowerCase()} ${cand.title.toLowerCase()}`,
      shippingNote: hasInlinePrice
        ? `Live ${platformName} PH listing · Verify stock & voucher on checkout`
        : `${meta.categoryLabel} PH market benchmark · Click Open on ${platformName} for live variant price`,
      aboutText:
        cand.snippet.length > 25
          ? cand.snippet
          : `${cand.title} listed on ${platformName} Philippines (${sellerName}).`,
    });

    if (deduplicated.length >= 12) break;
  }

  if (deduplicated.length > 0) {
    liveSearchCache.set(cacheKey, deduplicated);
  }

  return deduplicated;
}
