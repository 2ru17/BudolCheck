import dns from 'node:dns/promises';
import net from 'node:net';

export class SsrfValidationError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode = 422) {
    super(message);
    this.name = 'SsrfValidationError';
    this.statusCode = statusCode;
  }
}

export const ALLOWED_DOMAINS: ReadonlyArray<string> = [
  'shopee.ph',
  'shopee.sg',
  'shopee.com',
  'shopee.com.my',
  'shopee.co.th',
  'shopee.vn',
  'shopee.tw',
  'shp.ee',
  'lazada.com.ph',
  'lazada.sg',
  'lazada.com',
  'lazada.com.my',
  'lazada.co.th',
  'lazada.vn',
  'temu.com',
  'temu.to',
  'instagram.com',
  'facebook.com',
  'fb.com',
  'fb.watch',
  'youtube.com',
  'youtu.be',
  'pinterest.com',
  'pin.it',
  'twitter.com',
  'x.com',
];

export function isPrivateOrReservedIp(ip: string): boolean {
  const normalized = ip.trim().toLowerCase();

  if (normalized.startsWith('::ffff:')) {
    const mappedV4 = normalized.slice('::ffff:'.length);
    if (net.isIPv4(mappedV4)) {
      return isPrivateOrReservedIp(mappedV4);
    }
  }

  if (net.isIPv4(normalized)) {
    const parts = normalized.split('.').map((octet) => Number(octet));
    if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) {
      return true;
    }
    const [a, b] = parts;
    if (a === 0) return true;
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    if (a === 198 && (b === 18 || b === 19)) return true;
    if (a >= 224) return true;
    return false;
  }

  if (net.isIPv6(normalized)) {
    if (normalized === '::' || normalized === '::1') return true;
    if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;
    if (
      normalized.startsWith('fe8') ||
      normalized.startsWith('fe9') ||
      normalized.startsWith('fea') ||
      normalized.startsWith('feb')
    ) {
      return true;
    }
    if (normalized.startsWith('ff')) return true;
    if (normalized.startsWith('2001:db8:')) return true;
    return false;
  }

  return true;
}

export function isDomainAllowlisted(hostname: string): boolean {
  const cleanHost = hostname.trim().toLowerCase().replace(/\.$/, '');
  if (!cleanHost) return false;
  if (net.isIP(cleanHost) !== 0) return false;
  if (
    cleanHost === 'localhost' ||
    cleanHost.endsWith('.localhost') ||
    cleanHost.endsWith('.local') ||
    cleanHost.endsWith('.internal')
  ) {
    return false;
  }

  return ALLOWED_DOMAINS.some(
    (domain) => cleanHost === domain || cleanHost.endsWith(`.${domain}`)
  );
}

export function parseAndValidateAllowedUrl(rawInput: string): URL {
  const trimmed = rawInput.trim();
  if (!trimmed || trimmed.length > 2048) {
    throw new SsrfValidationError('Invalid or excessively long URL.', 400);
  }

  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let parsed: URL;
  try {
    parsed = new URL(withScheme);
  } catch {
    throw new SsrfValidationError('Malformed URL syntax.', 400);
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new SsrfValidationError('Only HTTP and HTTPS product links are permitted.', 422);
  }

  if (parsed.username || parsed.password) {
    throw new SsrfValidationError('URLs containing embedded credentials are blocked.', 422);
  }

  if (parsed.port && parsed.port !== '80' && parsed.port !== '443') {
    throw new SsrfValidationError('Non-standard network ports are blocked.', 422);
  }

  if (net.isIP(parsed.hostname) !== 0 || isPrivateOrReservedIp(parsed.hostname.replace(/^\[|\]$/g, ''))) {
    if (net.isIP(parsed.hostname.replace(/^\[|\]$/g, '')) !== 0) {
      throw new SsrfValidationError('Direct IP address targets are blocked by SSRF policy.', 422);
    }
  }

  if (!isDomainAllowlisted(parsed.hostname)) {
    throw new SsrfValidationError(
      'Domain is not on the supported marketplace or social allowlist.',
      422
    );
  }

  return parsed;
}

export async function verifyPublicDnsResolution(hostname: string): Promise<void> {
  const records = await dns.lookup(hostname, { all: true, verbatim: true });
  if (!records || records.length === 0) {
    throw new Error('DNS lookup returned zero addresses');
  }
  for (const record of records) {
    if (isPrivateOrReservedIp(record.address)) {
      throw new SsrfValidationError(
        'Resolved address points to a private or reserved network range.',
        422
      );
    }
  }
}

export interface SafeFetchResult {
  finalUrl: string;
  status: number;
  contentType: string;
  bodyText: string;
}

export async function safeFetchText(
  rawUrl: string,
  options?: {
    timeoutMs?: number;
    maxBytes?: number;
    maxRedirects?: number;
    accept?: string;
  }
): Promise<SafeFetchResult> {
  const timeoutMs = options?.timeoutMs ?? 4500;
  const maxBytes = options?.maxBytes ?? 1024 * 1024;
  const maxRedirects = options?.maxRedirects ?? 3;

  let currentUrl = parseAndValidateAllowedUrl(rawUrl);

  for (let hop = 0; hop <= maxRedirects; hop += 1) {
    await verifyPublicDnsResolution(currentUrl.hostname);

    const response = await fetch(currentUrl.toString(), {
      method: 'GET',
      redirect: 'manual',
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        Accept:
          options?.accept ??
          'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-PH,en-US;q=0.9,en;q=0.8',
        'User-Agent':
          'Mozilla/5.0 (X11; Fedora; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      },
    });

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      if (!location) {
        throw new Error('Redirect response missing Location header');
      }
      if (hop === maxRedirects) {
        throw new Error('Exceeded maximum safe redirect hops');
      }
      const nextResolved = new URL(location, currentUrl).toString();
      currentUrl = parseAndValidateAllowedUrl(nextResolved);
      continue;
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (!response.body) {
      return {
        finalUrl: currentUrl.toString(),
        status: response.status,
        contentType,
        bodyText: '',
      };
    }

    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let totalBytes = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        totalBytes += value.byteLength;
        if (totalBytes > maxBytes) {
          await reader.cancel();
          chunks.push(value.subarray(0, Math.max(0, value.byteLength - (totalBytes - maxBytes))));
          break;
        }
        chunks.push(value);
      }
    }

    const combined = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));
    return {
      finalUrl: currentUrl.toString(),
      status: response.status,
      contentType,
      bodyText: combined.toString('utf8'),
    };
  }

  throw new Error('Unreachable redirect termination');
}

export function sanitizeScrapedImageUrl(rawImageUrl: string | undefined | null): string | null {
  if (!rawImageUrl) return null;
  try {
    const trimmed = rawImageUrl.trim();
    const normalizedInput = trimmed.startsWith('//') ? `https:${trimmed}` : trimmed;
    const parsed = new URL(normalizedInput);
    if (parsed.protocol !== 'https:') return null;
    if (parsed.username || parsed.password) return null;
    const host = parsed.hostname.toLowerCase();
    if (net.isIP(host) !== 0) return null;
    if (host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}
