

export function buildShopSearchUrl(platform: string, title: string): string {
  const q = encodeURIComponent(title);
  switch (platform) {
    case 'Shopee':
      return `https://shopee.ph/search?keyword=${q}`;
    case 'Lazada':
      return `https://www.lazada.com.ph/catalog/?q=${q}`;
    case 'Temu':
      return `https://www.temu.com/search_result.html?search_key=${q}`;
    case 'TikTok Shop':
      return `https://www.tiktok.com/search?q=${q}`;
    default:
      return `https://www.google.com/search?q=${q}`;
  }
}

export function formatCurrency(amountPhp: number): string {
  return `₱${amountPhp.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
