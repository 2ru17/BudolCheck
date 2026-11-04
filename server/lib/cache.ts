import crypto from 'node:crypto';
import type { Request, Response } from 'express';
import { LRUCache } from 'lru-cache';

interface CachedResponseEntry {
  payloadJson: string;
  etag: string;
  cachedAt: number;
}

const responseCache = new LRUCache<string, CachedResponseEntry>({
  max: 250,
  ttl: 120_000,
  allowStale: false,
});

let cacheHits = 0;
let cacheMisses = 0;
let cacheWrites = 0;
let cacheInvalidations = 0;

function computeWeakEtag(jsonPayload: string): string {
  const digest = crypto.createHash('sha1').update(jsonPayload).digest('hex').slice(0, 20);
  return `W/"${digest}"`;
}

export interface CacheResponseOptions {
  key: string;
  ttlMs?: number;
  cacheControl?: string;
}

export async function respondWithCache<T>(
  req: Request,
  res: Response,
  options: CacheResponseOptions,
  compute: () => T | Promise<T>
): Promise<void> {
  const cacheControl =
    options.cacheControl ?? 'public, max-age=30, s-maxage=120, stale-while-revalidate=300';
  const existing = responseCache.get(options.key);

  if (existing) {
    cacheHits += 1;
    res.setHeader('X-Cache', 'HIT');
    res.setHeader('ETag', existing.etag);
    res.setHeader('Cache-Control', cacheControl);

    const ifNoneMatch = req.headers['if-none-match'];
    if (ifNoneMatch && ifNoneMatch === existing.etag) {
      res.status(304).end();
      return;
    }

    res.status(200).type('application/json').send(existing.payloadJson);
    return;
  }

  cacheMisses += 1;
  const freshData = await compute();
  const payloadJson = JSON.stringify(freshData);
  const etag = computeWeakEtag(payloadJson);

  responseCache.set(
    options.key,
    {
      payloadJson,
      etag,
      cachedAt: Date.now(),
    },
    { ttl: options.ttlMs ?? 120_000 }
  );
  cacheWrites += 1;

  res.setHeader('X-Cache', 'MISS');
  res.setHeader('ETag', etag);
  res.setHeader('Cache-Control', cacheControl);

  const ifNoneMatch = req.headers['if-none-match'];
  if (ifNoneMatch && ifNoneMatch === etag) {
    res.status(304).end();
    return;
  }

  res.status(200).type('application/json').send(payloadJson);
}

export function invalidateCachePrefix(prefix: string): number {
  let removed = 0;
  for (const key of responseCache.keys()) {
    if (key.startsWith(prefix)) {
      responseCache.delete(key);
      removed += 1;
    }
  }
  if (removed > 0) {
    cacheInvalidations += removed;
  }
  return removed;
}

export function getCacheStats() {
  const totalLookups = cacheHits + cacheMisses;
  return {
    entries: responseCache.size,
    maxEntries: responseCache.max,
    hits: cacheHits,
    misses: cacheMisses,
    writes: cacheWrites,
    invalidations: cacheInvalidations,
    hitRatio: totalLookups > 0 ? Number((cacheHits / totalLookups).toFixed(4)) : 0,
  };
}
