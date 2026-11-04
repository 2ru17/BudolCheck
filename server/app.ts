import compression from 'compression';
import express, { NextFunction, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { z, ZodError } from 'zod';
import { getDbPool } from './db/pool.ts';
import { ensureDatabaseSeeded } from './db/seed.ts';
import {
  AuthError,
  changeUserPassword,
  confirmPasswordReset,
   getAuthenticatedUserFromRequest,
  GOOGLE_CLIENT_ID,
  loginUserAccount,
  loginViaShopConnect,
  loginWithGoogleCredential,
  logoutSessionFromRequest,
  registerUserAccount,
  requestPasswordReset,
  serializeClearSessionCookie,
  serializeSessionCookie,
  updateAuthenticatedUserProfile,
} from './lib/auth.ts';
import {
  getCacheStats,
  invalidateCachePrefix,
  respondWithCache,
} from './lib/cache.ts';
import {
  checkRecordToNormalizedListing,
  synthesizeCheckFromCatalogItem,
  synthesizeCheckFromScraped,
  synthesizeKeywordCheck,
} from './lib/heuristics.ts';
import { fetchDistinctProductGalleryUrls } from './lib/liveWebSearch.ts';
import { scrapeMarketplaceOrSocialUrl } from './lib/scraper.ts';
import {
  parseAndValidateAllowedUrl,
  SsrfValidationError,
} from './lib/security.ts';
import {
  findCatalogItemById,
  findCatalogItemByUrl,
  searchMarketplaceCatalog,
} from './repositories/catalogRepository.ts';
import {
  createAdminQueueItemInDb,
  createSellerProductInDb,
  deleteSellerProductInDb,
  getAdminOverviewFromDb,
  getCheckByIdBatched,
  getCheckBySourceUrlBatched,
  getPaginatedReviewsFromDb,
  getSellerDashboardFromDb,
  listAdminQueueFromDb,
  listAllChecksBatched,
  listHistoryChecksPaginated,
  listSavedItemsForUser,
  listTipsFromDb,
  searchCheckByKeywordBatched,
  toggleSavedItemInDb,
  updateAdminQueueItemStatusInDb,
  updateAdminUserRoleInDb,
  updateSellerProductStatusInDb,
  updateSellerProfileInDb,
  upsertProductCheckRecord,
} from './repositories/checkRepository.ts';

ensureDatabaseSeeded();

export const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        fontSrc: ["'self'", 'data:'],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        frameSrc: ["'self'", 'https://accounts.google.com'],
        imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
        objectSrc: ["'none'"],
        scriptSrc: ["'self'", 'https://accounts.google.com', 'https://va.vercel-scripts.com'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://accounts.google.com'],
        connectSrc: [
          "'self'",
          'https:',
          'https://accounts.google.com',
          'https://oauth2.googleapis.com',
          'https://va.vercel-scripts.com',
        ],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    frameguard: { action: 'deny' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    strictTransportSecurity: {
      maxAge: 31_536_000,
      includeSubDomains: true,
      preload: true,
    },
  })
);

app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=()'
  );
  next();
});

app.use(
  compression({
    threshold: 256,
  })
);

app.use(express.json({ limit: '512kb' }));

const generalApiLimiter = rateLimit({
  windowMs: 60_000,
  limit: 180,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Rate limit exceeded. Please wait a moment and try again.' },
});

const scraperEndpointLimiter = rateLimit({
  windowMs: 60_000,
  limit: 40,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many link analysis requests. Please wait before checking more links.' },
});

const authEndpointLimiter = rateLimit({
  windowMs: 60_000,
  limit: 40,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please wait a moment and try again.' },
});

app.use('/api', generalApiLimiter);

app.use('/api', (req: Request, res: Response, next: NextFunction) => {
  if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method.toUpperCase())) {
    next();
    return;
  }
  const originHeader = req.headers.origin;
  if (!originHeader) {
    next();
    return;
  }
  try {
    const parsedOrigin = new URL(originHeader);
    const expectedHost = (
      (req.headers['x-forwarded-host'] as string | undefined) ||
      req.headers.host ||
      ''
    )
      .split(',')[0]
      .trim()
      .toLowerCase();

    if (expectedHost && parsedOrigin.host.toLowerCase() !== expectedHost) {
      res.status(403).json({
        error: 'Cross-origin state-changing request blocked by CSRF policy.',
      });
      return;
    }
  } catch {
    res.status(403).json({
      error: 'Malformed Origin header blocked by CSRF policy.',
    });
    return;
  }
  next();
});

const CheckIdParamSchema = z.object({
  id: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .regex(/^[a-zA-Z0-9_-]+$/),
});

const ReviewsQuerySchema = z.object({
  filter: z
    .enum(['all', 'visuals', '5star', '4star', '3star', 'critical'])
    .default('all'),
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(20).default(2),
});

const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

const AnalyzeBodySchema = z.object({
  input: z.string().max(2048).default(''),
});

const FromCatalogBodySchema = z.object({
  catalogId: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .regex(/^[a-zA-Z0-9_-]+$/),
});

const SearchQuerySchema = z.object({
  q: z.string().max(200).default(''),
  platform: z.enum(['all', 'Shopee', 'Lazada', 'Temu']).default('all'),
});

const ListingQuerySchema = z.object({
  url: z.string().trim().min(4).max(2048),
});

const AdminPatchBodySchema = z.object({
  status: z.enum([
    'pending',
    'under_review',
    'investigating',
    'resolved',
    'flagged',
    'dismissed',
  ]),
});

const AdminUserRolePatchSchema = z.object({
  role: z.enum(['user', 'shopper', 'seller', 'admin']),
});

const SellerCreateProductSchema = z.object({
  title: z.string().trim().min(2).max(160),
  pricePhp: z.coerce.number().min(1).max(1_000_000),
  platform: z.enum(['Shopee', 'Lazada', 'Temu']).default('Shopee'),
  status: z.enum(['active', 'pending']).optional().default('pending'),
  illustrationKey: z
    .enum([
      'earbuds',
      'serum',
      'cupmat',
      'watch',
      'shoes',
      'bag',
      'dress',
      'coaster',
      'umbrella',
      'mouse',
      'massager',
      'phonecase',
    ])
    .optional(),
  thumbnailUrl: z.string().trim().max(2048).optional(),
  specNote: z.string().trim().max(300).optional(),
  sourceUrl: z.string().trim().max(2048).optional(),
});

const SellerUpdateProductSchema = z.object({
  status: z.enum(['active', 'pending']).optional(),
  pricePhp: z.coerce.number().min(1).max(1_000_000).optional(),
  title: z.string().trim().min(2).max(160).optional(),
  platform: z.enum(['Shopee', 'Lazada', 'Temu']).optional(),
  specNote: z.string().trim().max(300).optional(),
  sourceUrl: z.string().trim().max(2048).optional(),
  illustrationKey: z
    .enum([
      'earbuds',
      'serum',
      'cupmat',
      'watch',
      'shoes',
      'bag',
      'dress',
      'coaster',
      'umbrella',
      'mouse',
      'massager',
      'phonecase',
    ])
    .optional(),
});

const AdminCreateQueueSchema = z.object({
  productTitle: z.string().trim().min(2).max(160),
  subtitle: z.string().trim().max(240).optional(),
  platform: z.enum(['Shopee', 'Lazada', 'Temu']).default('Shopee'),
  flagReason: z.string().trim().min(3).max(400),
  reportCategory: z.enum(['report', 'complaint']).optional().default('report'),
  priceAnomaly: z.string().trim().max(120).optional(),
  sourceUrl: z.string().trim().max(2048).optional(),
  illustrationKey: z
    .enum([
      'earbuds',
      'serum',
      'cupmat',
      'watch',
      'shoes',
      'bag',
      'dress',
      'coaster',
      'umbrella',
      'mouse',
      'massager',
      'phonecase',
    ])
    .optional(),
  thumbnailUrl: z.string().trim().max(2048).optional(),
});

const SellerProfilePatchSchema = z.object({
  storeName: z.string().trim().min(2).max(120).optional(),
  shopDescription: z.string().trim().min(4).max(500).optional(),
  phoneNumber: z.string().trim().min(7).max(30).optional(),
  platforms: z.array(z.enum(['Shopee', 'Lazada', 'Temu'])).optional(),
  storeUrl: z.string().trim().max(2048).optional(),
});

const SavedToggleBodySchema = z.object({
  checkId: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .regex(/^[a-zA-Z0-9_-]+$/),
});

const SellerSpecAuditBodySchema = z.object({
  checkId: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .regex(/^[a-zA-Z0-9_-]+$/),
  specAttribute: z.string().trim().min(3).max(240),
});

const AuthLoginBodySchema = z.object({
  email: z.string().trim().email().max(180),
  password: z.string().min(4).max(128),
});

const AuthRegisterBodySchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(180),
  password: z.string().min(6).max(128),
  role: z.enum(['user', 'seller']).optional().default('user'),
});

const AuthShopConnectBodySchema = z.object({
  platform: z.enum(['Shopee', 'Lazada', 'Temu']),
  shopName: z.string().trim().max(120).optional(),
  storeUrl: z.string().trim().max(2048).optional(),
  email: z.string().trim().email().max(180).optional(),
  password: z.string().min(4).max(128).optional(),
});

const AuthProfilePatchSchema = z.object({
  fullName: z.string().trim().min(2).max(100).optional(),
  email: z.string().trim().email().max(180).optional(),
  connectedShop: z.string().trim().min(2).max(120).optional(),
});

const AuthGoogleBodySchema = z.object({
  credential: z.string().trim().min(20).max(4096),
  role: z.enum(['user', 'seller']).optional().default('user'),
});

const AuthForgotPasswordBodySchema = z.object({
  email: z.string().trim().email().max(180),
});

const AuthResetPasswordBodySchema = z.object({
  email: z.string().trim().email().max(180),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Verification code must be a 6-digit number.'),
  newPassword: z.string().min(6).max(128),
});

const AuthChangePasswordBodySchema = z.object({
  currentPassword: z.string().min(4).max(128),
  newPassword: z.string().min(6).max(128),
});

function isSecureRequest(req: Request): boolean {
  return req.secure || req.headers['x-forwarded-proto'] === 'https';
}

function looksLikeUrlCandidate(value: string): boolean {
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(value)) return true;
  if (/^(localhost|\d{1,3}(?:\.\d{1,3}){3}|\[[0-9a-fA-F:]+\])(?::\d+)?(\/|$)/i.test(value)) {
    return true;
  }
  return /^[\w-]+(\.[\w-]+)+(?::\d+)?(\/|$)/.test(value);
}

app.get('/api/health', (_req: Request, res: Response) => {
  const pool = getDbPool();
  const reviewsQueryPlan = pool.explainQueryPlan(
    'SELECT id FROM product_reviews WHERE check_id = ? AND has_visuals = 1 ORDER BY star_rating DESC LIMIT 2 OFFSET 0',
    ['chk_wm02_001']
  );
  const historyQueryPlan = pool.explainQueryPlan(
    'SELECT id FROM product_checks WHERE user_id = ? ORDER BY checked_at DESC LIMIT 10 OFFSET 0',
    ['usr_daisy_001']
  );

  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    db: pool.getHealthStats(),
    cache: getCacheStats(),
    queryPlans: {
      reviewsIndexPlan: reviewsQueryPlan,
      historyIndexPlan: historyQueryPlan,
    },
  });
});

app.get('/api/auth/me', (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = getAuthenticatedUserFromRequest(req);
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({
      authenticated: Boolean(user),
      user,
    });
  } catch (err) {
    next(err);
  }
});

app.post(
  '/api/auth/login',
  authEndpointLimiter,
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = AuthLoginBodySchema.parse(req.body ?? {});
      const { user, token } = loginUserAccount(body);
      res.setHeader('Set-Cookie', serializeSessionCookie(token, isSecureRequest(req)));
      res.setHeader('Cache-Control', 'no-store');
      res.status(200).json({
        authenticated: true,
        user,
        token,
      });
    } catch (err) {
      next(err);
    }
  }
);

app.post(
  '/api/auth/register',
  authEndpointLimiter,
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = AuthRegisterBodySchema.parse(req.body ?? {});
      const { user, token } = registerUserAccount(body);
      res.setHeader('Set-Cookie', serializeSessionCookie(token, isSecureRequest(req)));
      res.setHeader('Cache-Control', 'no-store');
      res.status(201).json({
        authenticated: true,
        user,
        token,
      });
    } catch (err) {
      next(err);
    }
  }
);

app.post(
  '/api/auth/shop-connect',
  authEndpointLimiter,
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = AuthShopConnectBodySchema.parse(req.body ?? {});
      const sessionUser = getAuthenticatedUserFromRequest(req);
      const { user, token } = loginViaShopConnect({
        ...body,
        existingUserId: sessionUser?.id,
      });
      res.setHeader('Set-Cookie', serializeSessionCookie(token, isSecureRequest(req)));
      res.setHeader('Cache-Control', 'no-store');
      invalidateCachePrefix('seller:');
      invalidateCachePrefix('admin:');
      res.status(200).json({
        authenticated: true,
        user,
        token,
      });
    } catch (err) {
      next(err);
    }
  }
);

app.post('/api/auth/logout', (req: Request, res: Response, next: NextFunction) => {
  try {
    logoutSessionFromRequest(req);
    res.setHeader('Set-Cookie', serializeClearSessionCookie(isSecureRequest(req)));
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({
      authenticated: false,
      user: null,
    });
  } catch (err) {
    next(err);
  }
});

app.patch('/api/auth/profile', (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUser = getAuthenticatedUserFromRequest(req);
    if (!currentUser) {
      throw new AuthError('Please log in to update your profile.', 401);
    }
    const updates = AuthProfilePatchSchema.parse(req.body ?? {});
    const user = updateAuthenticatedUserProfile(currentUser.id, updates);
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({
      authenticated: true,
      user,
    });
  } catch (err) {
    next(err);
  }
});

app.get('/api/auth/config', (_req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.status(200).json({
    googleClientId: GOOGLE_CLIENT_ID,
  });
});

app.post(
  '/api/auth/google',
  authEndpointLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = AuthGoogleBodySchema.parse(req.body ?? {});
      const { user, token } = await loginWithGoogleCredential(body);
      res.setHeader('Set-Cookie', serializeSessionCookie(token, isSecureRequest(req)));
      res.setHeader('Cache-Control', 'no-store');
      res.status(200).json({
        authenticated: true,
        user,
        token,
      });
    } catch (err) {
      next(err);
    }
  }
);

app.post(
  '/api/auth/forgot-password',
  authEndpointLimiter,
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = AuthForgotPasswordBodySchema.parse(req.body ?? {});
      const result = requestPasswordReset(email);
      res.setHeader('Cache-Control', 'no-store');
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
);

app.post(
  '/api/auth/reset-password',
  authEndpointLimiter,
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = AuthResetPasswordBodySchema.parse(req.body ?? {});
      const { user, token } = confirmPasswordReset(body);
      res.setHeader('Set-Cookie', serializeSessionCookie(token, isSecureRequest(req)));
      res.setHeader('Cache-Control', 'no-store');
      res.status(200).json({
        authenticated: true,
        user,
        token,
        message: 'Your password has been reset and you are now signed in.',
      });
    } catch (err) {
      next(err);
    }
  }
);

app.post(
  '/api/auth/change-password',
  authEndpointLimiter,
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const currentUser = getAuthenticatedUserFromRequest(req);
      if (!currentUser) {
        throw new AuthError('Please log in to change your password.', 401);
      }
      const body = AuthChangePasswordBodySchema.parse(req.body ?? {});
      changeUserPassword({
        userId: currentUser.id,
        currentPassword: body.currentPassword,
        newPassword: body.newPassword,
      });
      res.setHeader('Cache-Control', 'no-store');
      res.status(200).json({
        updated: true,
        message: 'Your password has been updated.',
      });
    } catch (err) {
      next(err);
    }
  }
);

app.get('/api/legal', (_req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
  res.status(200).json({
    lastUpdated: '2026-11-03',
    privacyPolicy: {
      title: 'BudolCheck Privacy Policy',
      complianceFramework: 'Republic Act No. 10173 (Philippine Data Privacy Act of 2012)',
      sections: [
        'Minimal Personal Data Collection: Name, email address, and optional Google OAuth 2.0 profile identifiers (sub, email, name) when you sign in.',
        'Product Verification History: Saved checks and analyzed marketplace URLs are stored to power your History and Saved items.',
        'Strict Security Controls: Passwords are encrypted using salted scrypt key derivation, sessions use HttpOnly SameSite cookies, and external fetches enforce strict SSRF domain allowlists.',
      ],
    },
    termsOfService: {
      title: 'BudolCheck Terms of Service',
      jurisdiction: 'Republic of the Philippines',
      sections: [
        'Independent Decision-Support Tool: BudolCheck is an independent verification companion and is not affiliated with Shopee, Lazada, or Temu.',
        'Live Marketplace Verification: Prices, stock levels, and seller metrics can change in real time; always confirm final checkout details on the destination marketplace.',
        'Acceptable Use: Automated scraping abuse, unauthorized security probing, or submitting fabricated scam reports is prohibited.',
      ],
    },
  });
});

const handleCatalogSearch = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { q, platform } = SearchQuerySchema.parse(req.query);
    const cacheKey = `search:${platform}:${q.trim().toLowerCase()}`;
    await respondWithCache(
      req,
      res,
      { key: cacheKey, ttlMs: 120_000 },
      () => searchMarketplaceCatalog(q, platform)
    );
  } catch (err) {
    next(err);
  }
};

app.get('/api/search', handleCatalogSearch);
app.get('/api/checks/search', handleCatalogSearch);

app.get('/api/images/gallery', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawQ = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const checkId = typeof req.query.checkId === 'string' ? req.query.checkId.trim() : '';
    if (!rawQ) {
      res.status(400).json({ error: 'Query parameter q is required.' });
      return;
    }

    const urls = await fetchDistinctProductGalleryUrls(rawQ, 4);

    if (checkId && /^[a-zA-Z0-9_-]{3,120}$/.test(checkId) && urls.length > 1) {
      try {
        getDbPool().withWriteTransaction((db) => {
          db.prepare('UPDATE product_checks SET image_urls_json = ? WHERE id = ?').run(
            JSON.stringify(urls),
            checkId
          );
        });
        invalidateCachePrefix('checks:');
      } catch {}
    }

    res.setHeader('Cache-Control', 'public, max-age=1800, s-maxage=3600');
    res.status(200).json({ urls });
  } catch (err) {
    next(err);
  }
});

app.post(
  '/api/checks/from-catalog',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { catalogId } = FromCatalogBodySchema.parse(req.body ?? {});
      const item = findCatalogItemById(catalogId);
      if (!item) {
        res.status(404).json({ error: 'Marketplace catalog listing not found.' });
        return;
      }

      const existingDistinctOips = (item.imageUrls || []).filter((u) => u.includes('id=OIP.'));
      const distinctGallery =
        existingDistinctOips.length >= 2
          ? existingDistinctOips
          : await fetchDistinctProductGalleryUrls(`${item.brandName} ${item.productTitle}`, 4);

      const sessionUser = getAuthenticatedUserFromRequest(req);
      const synthesized = synthesizeCheckFromCatalogItem(item, {
        imageUrls: distinctGallery,
      });
      const saved = upsertProductCheckRecord(
        synthesized,
        sessionUser?.id ?? 'usr_daisy_001'
      );

      invalidateCachePrefix('checks:');
      invalidateCachePrefix('history:');

      res.status(200).json(saved);
    } catch (err) {
      next(err);
    }
  }
);

app.get('/api/checks', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await respondWithCache(
      req,
      res,
      { key: 'checks:all', ttlMs: 120_000 },
      () => listAllChecksBatched()
    );
  } catch (err) {
    next(err);
  }
});

app.get('/api/history', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = PaginationQuerySchema.parse(req.query);
    await respondWithCache(
      req,
      res,
      { key: `history:p${page}:l${limit}`, ttlMs: 90_000 },
      () => listHistoryChecksPaginated(page, limit)
    );
  } catch (err) {
    next(err);
  }
});

app.get('/api/checks/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = CheckIdParamSchema.parse(req.params);
    const exists = getCheckByIdBatched(id);
    if (!exists) {
      res.status(404).json({ error: 'Verification report not found.' });
      return;
    }
    await respondWithCache(
      req,
      res,
      { key: `checks:detail:${id}`, ttlMs: 120_000 },
      () => getCheckByIdBatched(id) ?? exists
    );
  } catch (err) {
    next(err);
  }
});

app.get(
  '/api/checks/:id/reviews',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = CheckIdParamSchema.parse(req.params);
      const { filter, page, limit } = ReviewsQuerySchema.parse(req.query);

      await respondWithCache(
        req,
        res,
        {
          key: `checks:reviews:${id}:${filter}:p${page}:l${limit}`,
          ttlMs: 120_000,
        },
        () => getPaginatedReviewsFromDb(id, filter, page, limit)
      );
    } catch (err) {
      next(err);
    }
  }
);

app.post(
  '/api/checks/analyze',
  scraperEndpointLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { input } = AnalyzeBodySchema.parse(req.body ?? {});
      const trimmed = input.trim();
      const sessionUser = getAuthenticatedUserFromRequest(req);
      const targetUserId = sessionUser?.id ?? 'usr_daisy_001';

      if (!trimmed) {
        const fallback = getCheckByIdBatched('chk_wm02_001') ?? listAllChecksBatched()[0];
        res.status(200).json(fallback);
        return;
      }

      if (looksLikeUrlCandidate(trimmed)) {
        const validatedUrl = parseAndValidateAllowedUrl(trimmed);
        const normalizedHref = validatedUrl.toString();
        const withoutTrailingSlash = normalizedHref.replace(/\/+$/, '');

        const existingDirect =
          getCheckBySourceUrlBatched(trimmed) ||
          getCheckBySourceUrlBatched(normalizedHref) ||
          getCheckBySourceUrlBatched(withoutTrailingSlash);

        const catalogMatch = findCatalogItemByUrl(normalizedHref);
        const needsRefresh =
          existingDirect &&
          ((catalogMatch && existingDirect.isPriceEstimated) ||
            ((!existingDirect.imageUrls || existingDirect.imageUrls.length === 0) &&
              (Boolean(catalogMatch?.imageUrl) || normalizedHref.includes('image_ids='))));

        if (existingDirect && !needsRefresh) {
          res.setHeader('X-Cache', 'HIT');
          res.status(200).json(existingDirect);
          return;
        }

        const scraped = await scrapeMarketplaceOrSocialUrl(normalizedHref);
        const synthesized = synthesizeCheckFromScraped(scraped);
        const saved = upsertProductCheckRecord(synthesized, targetUserId);

        invalidateCachePrefix('checks:');
        invalidateCachePrefix('history:');

        res.setHeader('X-Cache', 'MISS');
        res.status(200).json(saved);
        return;
      }

      const matchedSeed = searchCheckByKeywordBatched(trimmed);
      if (matchedSeed) {
        res.setHeader('X-Cache', 'HIT');
        res.status(200).json(matchedSeed);
        return;
      }

      const keywordCheck = await synthesizeKeywordCheck(trimmed);
      const persisted = upsertProductCheckRecord(keywordCheck, targetUserId);

      invalidateCachePrefix('checks:');
      invalidateCachePrefix('history:');

      res.setHeader('X-Cache', 'MISS');
      res.status(200).json(persisted);
    } catch (err) {
      next(err);
    }
  }
);

app.get(
  '/api/listings',
  scraperEndpointLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { url } = ListingQuerySchema.parse(req.query);
      const validated = parseAndValidateAllowedUrl(url);

      await respondWithCache(
        req,
        res,
        { key: `listings:${validated.toString()}`, ttlMs: 180_000 },
        async () => {
          const existing =
            getCheckBySourceUrlBatched(url.trim()) ||
            getCheckBySourceUrlBatched(validated.toString());
          if (existing) {
            return checkRecordToNormalizedListing(existing);
          }
          const scraped = await scrapeMarketplaceOrSocialUrl(validated.toString());
          const synthesized = synthesizeCheckFromScraped(scraped);
          const stored = upsertProductCheckRecord(synthesized);
          invalidateCachePrefix('checks:');
          invalidateCachePrefix('history:');
          return checkRecordToNormalizedListing(stored);
        }
      );
    } catch (err) {
      next(err);
    }
  }
);

app.get('/api/tips', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await respondWithCache(
      req,
      res,
      {
        key: 'tips:active',
        ttlMs: 300_000,
        cacheControl: 'public, max-age=120, s-maxage=600, stale-while-revalidate=86400',
      },
      () => listTipsFromDb()
    );
  } catch (err) {
    next(err);
  }
});

app.get('/api/admin/overview', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await respondWithCache(
      req,
      res,
      {
        key: 'admin:overview',
        ttlMs: 30_000,
        cacheControl: 'private, max-age=10',
      },
      () => getAdminOverviewFromDb()
    );
  } catch (err) {
    next(err);
  }
});

app.patch(
  '/api/admin/users/:id',
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = CheckIdParamSchema.parse(req.params);
      const { role } = AdminUserRolePatchSchema.parse(req.body ?? {});
      const dbRole = role === 'shopper' ? 'user' : role;
      const updated = updateAdminUserRoleInDb(id, dbRole);
      if (!updated) {
        res.status(404).json({ error: 'User account not found.' });
        return;
      }
      invalidateCachePrefix('admin:');
      res.status(200).json(updated);
    } catch (err) {
      next(err);
    }
  }
);

app.get('/api/admin/queue', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await respondWithCache(
      req,
      res,
      {
        key: 'admin:queue',
        ttlMs: 30_000,
        cacheControl: 'private, max-age=10',
      },
      () => listAdminQueueFromDb()
    );
  } catch (err) {
    next(err);
  }
});

app.post('/api/admin/queue', (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = AdminCreateQueueSchema.parse(req.body ?? {});
    const created = createAdminQueueItemInDb(body);
    invalidateCachePrefix('admin:');
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

app.patch(
  '/api/admin/queue/:id',
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const sessionUser = getAuthenticatedUserFromRequest(req);
      if (!sessionUser) {
        res.status(401).json({ error: 'Authentication required to moderate queue items.' });
        return;
      }
      if (sessionUser.role !== 'admin') {
        res.status(403).json({ error: 'Moderator privileges required.' });
        return;
      }

      const { id } = CheckIdParamSchema.parse(req.params);
      const { status } = AdminPatchBodySchema.parse(req.body ?? {});

      const updated = updateAdminQueueItemStatusInDb(id, status);
      if (!updated) {
        res.status(404).json({ error: 'Moderation queue item not found.' });
        return;
      }

      invalidateCachePrefix('admin:');
      res.status(200).json(updated);
    } catch (err) {
      next(err);
    }
  }
);

app.get('/api/seller/dashboard', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionUser = getAuthenticatedUserFromRequest(req);
    const sellerUserId = sessionUser?.id ?? 'usr_zavina_006';

    await respondWithCache(
      req,
      res,
      {
        key: `seller:dashboard:${sellerUserId}`,
        ttlMs: 30_000,
        cacheControl: 'private, max-age=10',
      },
      () => getSellerDashboardFromDb(sellerUserId)
    );
  } catch (err) {
    next(err);
  }
});

app.post('/api/seller/products', (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionUser = getAuthenticatedUserFromRequest(req);
    const sellerUserId = sessionUser?.id ?? 'usr_zavina_006';
    const body = SellerCreateProductSchema.parse(req.body ?? {});
    const created = createSellerProductInDb(body, sellerUserId);
    invalidateCachePrefix('seller:');
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

app.patch(
  '/api/seller/products/:id',
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = CheckIdParamSchema.parse(req.params);
      const updates = SellerUpdateProductSchema.parse(req.body ?? {});
      const updated = updateSellerProductStatusInDb(id, updates);
      if (!updated) {
        res.status(404).json({ error: 'Seller product not found.' });
        return;
      }
      invalidateCachePrefix('seller:');
      res.status(200).json(updated);
    } catch (err) {
      next(err);
    }
  }
);

app.delete(
  '/api/seller/products/:id',
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = CheckIdParamSchema.parse(req.params);
      const deleted = deleteSellerProductInDb(id);
      if (!deleted) {
        res.status(404).json({ error: 'Seller product not found.' });
        return;
      }
      invalidateCachePrefix('seller:');
      res.status(200).json({ deleted: true, id });
    } catch (err) {
      next(err);
    }
  }
);

app.patch('/api/seller/profile', (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionUser = getAuthenticatedUserFromRequest(req);
    const sellerUserId = sessionUser?.id ?? 'usr_zavina_006';
    const updates = SellerProfilePatchSchema.parse(req.body ?? {});
    const profile = updateSellerProfileInDb(updates, sellerUserId);
    invalidateCachePrefix('seller:');
    res.status(200).json({ profile });
  } catch (err) {
    next(err);
  }
});

app.get('/api/saved', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionUser = getAuthenticatedUserFromRequest(req);
    if (!sessionUser) {
      res.setHeader('Cache-Control', 'private, no-store');
      res.status(200).json({ savedCheckIds: [], savedAt: {} });
      return;
    }

    await respondWithCache(
      req,
      res,
      {
        key: `saved:${sessionUser.id}`,
        ttlMs: 30_000,
        cacheControl: 'private, no-cache',
      },
      () => listSavedItemsForUser(sessionUser.id)
    );
  } catch (err) {
    next(err);
  }
});

app.post('/api/saved/toggle', (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionUser = getAuthenticatedUserFromRequest(req);
    const { checkId } = SavedToggleBodySchema.parse(req.body ?? {});
    if (!sessionUser) {
      res.setHeader('Cache-Control', 'private, no-store');
      res.status(200).json({ saved: true, savedAtMs: Date.now() });
      return;
    }
    const result = toggleSavedItemInDb(checkId, sessionUser.id);
    invalidateCachePrefix(`saved:${sessionUser.id}`);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

app.post('/api/seller/spec-audit', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { checkId, specAttribute } = SellerSpecAuditBodySchema.parse(req.body ?? {});
    const existing = getCheckByIdBatched(checkId);
    if (!existing) {
      res.status(404).json({ error: 'Product check record not found.' });
      return;
    }

    const updatedRecord = {
      ...existing,
      overview: {
        ...existing.overview,
        material: specAttribute,
        contradictionWarning:
          'All product specification attributes and warehouse dispatch details have been verified via Seller Self-Audit.',
      },
      seller: {
        ...existing.seller,
        checklist: {
          ...existing.seller.checklist,
          productInfoConfirmed: true,
        },
      },
    };

    const sessionUser = getAuthenticatedUserFromRequest(req);
    const saved = upsertProductCheckRecord(
      updatedRecord,
      sessionUser?.id ?? 'usr_daisy_001'
    );
    invalidateCachePrefix('checks:');
    invalidateCachePrefix('history:');

    res.status(200).json(saved);
  } catch (err) {
    next(err);
  }
});

app.use('/api', (_req: Request, res: Response) => {
  res.status(404).json({ error: 'API endpoint not found.' });
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Invalid request parameters.',
      issues: err.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
    return;
  }

  if (err instanceof AuthError) {
    res.status(err.statusCode).json({
      error: err.message,
    });
    return;
  }

  if (err instanceof SsrfValidationError) {
    res.status(err.statusCode).json({
      error: err.message,
    });
    return;
  }

  if (
    err &&
    typeof err === 'object' &&
    'type' in err &&
    (err as { type?: string }).type === 'entity.parse.failed'
  ) {
    res.status(400).json({ error: 'Malformed JSON request body.' });
    return;
  }

  console.error('Unhandled API error:', err instanceof Error ? err.message : 'Unknown error');
  res.status(500).json({
    error: 'An unexpected server error occurred. Please try again.',
  });
});

export default app;
