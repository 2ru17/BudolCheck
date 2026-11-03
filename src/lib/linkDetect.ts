export type LinkKind = 'marketplace' | 'social' | 'keyword' | 'invalid';

export interface LinkDetection {
  kind: LinkKind;
  label: string;
}

const MARKETPLACE_HOSTS: Array<{ match: string; label: string }> = [
  { match: 'shopee.', label: 'Shopee' },
  { match: 'lazada.', label: 'Lazada' },
  { match: 'temu.', label: 'Temu' },
  { match: 'shop.tiktok.com', label: 'TikTok Shop' },
];

const SOCIAL_HOSTS: Array<{ match: string; label: string }> = [
  { match: 'tiktok.com', label: 'TikTok' },
  { match: 'instagram.com', label: 'Instagram' },
  { match: 'facebook.com', label: 'Facebook' },
  { match: 'fb.com', label: 'Facebook' },
  { match: 'fb.watch', label: 'Facebook' },
  { match: 'youtube.com', label: 'YouTube' },
  { match: 'youtu.be', label: 'YouTube' },
  { match: 'pinterest.com', label: 'Pinterest' },
  { match: 'pin.it', label: 'Pinterest' },
  { match: 'twitter.com', label: 'X' },
  { match: 'x.com', label: 'X' },
];

export const INVALID_LINK_MESSAGE =
  'Unable to retrieve content from this link. Please check the URL or upload the image manually.';

export function detectLink(raw: string): LinkDetection {
  const value = raw.trim();
  if (!value) return { kind: 'invalid', label: '' };

  const looksLikeUrl = /^https?:\/\//i.test(value) || /^[\w-]+(\.[\w-]+)+(\/|$)/.test(value);
  if (!looksLikeUrl) {
    return { kind: 'keyword', label: 'Search' };
  }

  let host = '';
  try {
    const parsed = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return { kind: 'invalid', label: '' };
    }
    host = parsed.hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return { kind: 'invalid', label: '' };
  }

  const marketplace = MARKETPLACE_HOSTS.find((item) => host.includes(item.match));
  if (marketplace) return { kind: 'marketplace', label: marketplace.label };

  const social = SOCIAL_HOSTS.find(
    (item) => host === item.match || host.endsWith(`.${item.match}`)
  );
  if (social) return { kind: 'social', label: social.label };

  return { kind: 'invalid', label: '' };
}
