import React, { memo, useEffect, useRef, useState } from 'react';
import { useDebouncedValue } from '@mantine/hooks';
import { useBudolStore, SearchPlatformFilter } from '../store/useBudolStore.ts';
import { MarketplaceSearchItem, ScreenId } from '../types/budol.ts';
import { ShaderHeroBanner } from '../components/visuals/ShaderHeroBanner.tsx';
import {
  AlertIcon,
  ArrowRightIcon,
  BookIcon,
  CheckIcon,
  ChecklistIcon,
  ClipboardIcon,
  CloseIcon,
  EditIcon,
  ExternalLinkIcon,
  HeartIcon,
  PlatformBadgeSvg,
  ProductIllustrationSvg,
  SearchIcon,
  ShieldIcon,
  StarIcon,
  TagIcon,
  UploadIcon,
  UserIcon,
} from '../components/icons/SvgIcons.tsx';
import {
  formatCurrency,
  resolveListingExternalUrl,
} from '../lib/formatters.ts';
import { resolveCleanProductImageUrl } from '../lib/productContent.ts';
import { Reveal, Stagger, StaggerItem } from '../components/visuals/Motion.tsx';

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Search across stores or paste a link',
    body: 'Compare multiple real listings across Shopee, Lazada, and Temu, or drop a direct product URL.',
    tint: 'bg-peach',
  },
  {
    step: '02',
    title: 'Run the 6-point verification',
    body: 'We inspect product specs, seller history, buyer photos, marketing claims, red flags, and price parity.',
    tint: 'bg-mint',
  },
  {
    step: '03',
    title: 'Decide with clarity',
    body: 'Review a clear scorecard of verified facts versus items needing caution before checking out.',
    tint: 'bg-butter',
  },
];

const QUICK_SEARCH_KEYWORDS = [
  'ergonomic mouse',
  'smartwatch',
  'massage gun',
  'golf umbrella',
  'wireless earbuds',
];

const PLATFORM_FILTER_TABS: Array<{ id: SearchPlatformFilter; label: string }> = [
  { id: 'all', label: 'All Stores' },
  { id: 'Shopee', label: 'Shopee' },
  { id: 'Lazada', label: 'Lazada' },
  { id: 'Temu', label: 'Temu' },
];

const CatalogResultCard = memo<{
  item: MarketplaceSearchItem;
  isChecking: boolean;
  onSelectForCheck: (catalogId: string) => void;
}>(({ item, isChecking, onSelectForCheck }) => {
  const [imgFailed, setImgFailed] = useState(false);
  const resolvedImageUrl = resolveCleanProductImageUrl(
    item.imageUrl,
    `${item.brandName} ${item.productTitle}`,
    item.platformName === 'Shopee' ? 0 : item.platformName === 'Lazada' ? 1 : 2
  );
  const hasDiscount = Boolean(
    item.originalPricePhp && item.originalPricePhp > item.pricePhp
  );
  const discountPct = hasDiscount
    ? Math.round((1 - item.pricePhp / (item.originalPricePhp as number)) * 100)
    : 0;

  return (
    <article
      data-testid={`search-result-card-${item.id}`}
      className="budol-card flex h-full flex-col justify-between bg-white p-4"
    >
      <div>
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <PlatformBadgeSvg platform={item.platformName} />
          {item.isMallVerified ? (
            <span className="sticker bg-mint text-verified">Official Mall</span>
          ) : (
            <span className="sticker bg-cream text-ink-muted">{item.sellerLocation}</span>
          )}
        </div>

        <div className="mt-3 flex items-start gap-3">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border-[1.5px] border-ink bg-white shadow-crisp">
            {resolvedImageUrl && !imgFailed ? (
              <img
                src={resolvedImageUrl}
                alt={item.productTitle}
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                onError={() => setImgFailed(true)}
                className="h-full w-full bg-white object-contain p-1"
              />
            ) : (
              <ProductIllustrationSvg variant={item.illustrationKey} size={52} />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 text-sm font-bold leading-snug text-ink">
              {item.productTitle}
            </h3>
            <p className="mt-1 truncate text-xs font-medium text-ink-muted">
              {item.sellerName}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs tabular-nums text-ink">
              <span className="inline-flex items-center gap-1 font-semibold">
                <StarIcon size={12} filled />
                {item.starRating.toFixed(1)}
              </span>
              <span className="text-ink-muted">
                ({item.reviewCount.toLocaleString()})
              </span>
              {item.soldCountText && (
                <span className="text-ink-muted">{item.soldCountText}</span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-baseline gap-2 rounded-xl border border-ink/20 bg-cream/70 px-3 py-2">
          <span className="text-lg font-bold tabular-nums text-flag">
            {formatCurrency(item.pricePhp)}
          </span>
          {hasDiscount && (
            <>
              <span className="text-xs tabular-nums text-ink-muted line-through">
                {formatCurrency(item.originalPricePhp as number)}
              </span>
              <span className="rounded-full border border-ink bg-flag px-2 py-0.5 text-[10px] font-bold tabular-nums text-white">
                -{discountPct}%
              </span>
            </>
          )}
        </div>

        {item.variants.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1">
            {item.variants.slice(0, 3).map((v) => (
              <span
                key={v}
                className="rounded-full border border-ink/25 bg-white px-2 py-0.5 text-[11px] font-medium text-ink-muted"
              >
                {v}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mt-3.5 flex flex-wrap items-center gap-2 border-t border-ink/15 pt-3">
        <button
          type="button"
          disabled={isChecking}
          onClick={() => onSelectForCheck(item.id)}
          className="budol-btn-primary !min-h-[40px] flex-1 !px-3 text-xs"
        >
          <span>Run 6-Point Check</span>
          <ArrowRightIcon size={14} />
        </button>

        <a
          href={resolveListingExternalUrl(
            item.sourceUrl,
            item.platformName,
            item.productTitle
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="budol-btn-secondary !min-h-[40px] !px-3 text-xs"
          aria-label={`Open ${item.productTitle} on ${item.platformName}`}
        >
          <span>Open on {item.platformName}</span>
          <ExternalLinkIcon size={13} />
        </a>
      </div>
    </article>
  );
});

CatalogResultCard.displayName = 'CatalogResultCard';

interface BentoCardProps {
  title: string;
  subtitle: string;
  badgeText: string;
  badgeVariant: 'forest' | 'verified' | 'caution' | 'flag';
  icon: React.ReactNode;
  onClick: () => void;
  testId: string;
}

const BentoModuleCard = memo<BentoCardProps>(
  ({ title, subtitle, badgeText, badgeVariant, icon, onClick, testId }) => {
    const iconBoxClasses: Record<BentoCardProps['badgeVariant'], string> = {
      forest: 'bg-mint text-forest',
      verified: 'bg-sky text-verified',
      caution: 'bg-butter text-caution',
      flag: 'bg-blush text-flag',
    };

    const pillClasses: Record<BentoCardProps['badgeVariant'], string> = {
      forest: 'bg-mint text-forest',
      verified: 'bg-mint text-verified',
      caution: 'bg-butter text-caution',
      flag: 'bg-blush text-flag',
    };

    return (
      <button
        type="button"
        onClick={onClick}
        data-testid={testId}
        className="budol-card budol-card-interactive group flex min-h-[164px] w-full flex-col justify-between bg-white text-left"
      >
        <div className="flex w-full items-start justify-between gap-2">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-[1.5px] border-ink shadow-crisp transition-transform duration-200 group-hover:-translate-y-0.5 ${iconBoxClasses[badgeVariant]}`}
          >
            {icon}
          </div>
          <span
            className={`sticker tabular-nums ${pillClasses[badgeVariant]}`}
          >
            {badgeText}
          </span>
        </div>

        <div className="mt-3.5">
          <div className="flex items-center justify-between gap-1">
            <h3 className="font-editorial text-lg font-bold text-ink">{title}</h3>
            <ArrowRightIcon
              size={15}
              className="text-ink-muted transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-olive"
            />
          </div>
          <p className="mt-1 text-xs font-normal leading-relaxed text-ink-muted">
            {subtitle}
          </p>
        </div>
      </button>
    );
  }
);

BentoModuleCard.displayName = 'BentoModuleCard';

export const HomeDashboardView: React.FC = () => {
  const isAuthenticated = useBudolStore((s) => s.isAuthenticated);
  const role = useBudolStore((s) => s.role);
  const userName = useBudolStore((s) => s.userName);
  const userEmail = useBudolStore((s) => s.userEmail);
  const activeCheck = useBudolStore((s) => s.activeCheck);
  const historyChecks = useBudolStore((s) => s.historyChecks);
  const isLoadingCheck = useBudolStore((s) => s.isLoadingCheck);
  const searchResults = useBudolStore((s) => s.searchResults);
  const searchQuery = useBudolStore((s) => s.searchQuery);
  const searchPlatformFilter = useBudolStore((s) => s.searchPlatformFilter);
  const isSearchingCatalog = useBudolStore((s) => s.isSearchingCatalog);

  const navigateTo = useBudolStore((s) => s.navigateTo);
  const setSellerPortalTab = useBudolStore((s) => s.setSellerPortalTab);
  const setAdminConsoleTab = useBudolStore((s) => s.setAdminConsoleTab);
  const submitReportToAdminQueue = useBudolStore((s) => s.submitReportToAdminQueue);
  const runLinkAnalysis = useBudolStore((s) => s.runLinkAnalysis);
  const runKeywordSearch = useBudolStore((s) => s.runKeywordSearch);
  const setSearchPlatformFilter = useBudolStore((s) => s.setSearchPlatformFilter);
  const clearSearchResults = useBudolStore((s) => s.clearSearchResults);
  const selectCatalogListingForCheck = useBudolStore(
    (s) => s.selectCatalogListingForCheck
  );
  const loadProductCheck = useBudolStore((s) => s.loadProductCheck);
  const showToast = useBudolStore((s) => s.showToast);
  const hasListing = useBudolStore((s) => s.hasListing);
  const linkError = useBudolStore((s) => s.linkError);
  const dismissLinkError = useBudolStore((s) => s.dismissLinkError);
  const runImageAnalysis = useBudolStore((s) => s.runImageAnalysis);
  const clearListing = useBudolStore((s) => s.clearListing);
  const toggleSavedCheck = useBudolStore((s) => s.toggleSavedCheck);
  const isSaved = useBudolStore((s) => s.savedCheckIds.includes(s.activeCheck.id));
  const updateUserProfile = useBudolStore((s) => s.updateUserProfile);

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(userName);
  const [heroImgFailed, setHeroImgFailed] = useState(false);

  const [inputQuery, setInputQuery] = useState(searchQuery);
  const [debouncedInputQuery] = useDebouncedValue(inputQuery, 300);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setHeroImgFailed(false);
  }, [activeCheck.id]);

  useEffect(() => {
    const trimmed = debouncedInputQuery.trim();
    if (
      searchResults &&
      trimmed.length >= 3 &&
      !/^https?:\/\//i.test(trimmed) &&
      trimmed.toLowerCase() !== searchResults.query.toLowerCase()
    ) {
      void runKeywordSearch(trimmed, searchPlatformFilter);
    }
  }, [debouncedInputQuery, runKeywordSearch, searchPlatformFilter, searchResults]);

  const handleAnalyzeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await runLinkAnalysis(inputQuery);
  };

  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text.trim()) {
          setInputQuery(text.trim());
          await runLinkAnalysis(text.trim());
          return;
        }
      }
    } catch {
      showToast('Clipboard access is blocked. Press Ctrl+V inside the box instead.');
      return;
    }
    showToast('Nothing to paste yet. Copy a product link first.');
  };

  const handleInputPaste = async (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text').trim();
    if (!pasted) return;
    const isDirectUrl = /^https?:\/\//i.test(pasted);
    if (!isDirectUrl) return;
    e.preventDefault();
    setInputQuery(pasted);
    await runLinkAnalysis(pasted);
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please choose an image file (PNG, JPG or WEBP).');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      showToast('That image is larger than 8 MB. Please choose a smaller one.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const rawDataUrl = reader.result;
        const img = new Image();
        img.onload = () => {
          const maxDim = 960;
          const scale = Math.min(1, maxDim / Math.max(img.width || 1, img.height || 1));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          const ctx = canvas.getContext('2d');
          const compressedUrl = ctx
            ? (ctx.drawImage(img, 0, 0, canvas.width, canvas.height),
              canvas.toDataURL('image/jpeg', 0.78))
            : rawDataUrl;
          setInputQuery('');
          void runImageAnalysis(compressedUrl, file.name);
        };
        img.onerror = () => {
          setInputQuery('');
          void runImageAnalysis(rawDataUrl, file.name);
        };
        img.src = rawDataUrl;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveName = async () => {
    await updateUserProfile(nameDraft, userEmail);
    setIsEditingName(false);
  };

  const handleClearListing = () => {
    setInputQuery('');
    clearListing();
  };

  const bentoModules: Array<{
    title: string;
    subtitle: string;
    badgeText: string;
    badgeVariant: 'forest' | 'verified' | 'caution' | 'flag';
    icon: React.ReactNode;
    screen: ScreenId;
    subTab?: 'overview' | 'reviews' | 'similar';
    testId: string;
  }> = [
    {
      title: 'Product Check',
      subtitle: 'Inspect material specs, claims & price parity',
      badgeText: formatCurrency(activeCheck.listedPricePhp),
      badgeVariant: 'forest',
      icon: <TagIcon size={18} />,
      screen: 'product',
      subTab: 'overview',
      testId: 'bento-product-check',
    },
    {
      title: 'Seller Check',
      subtitle: `${activeCheck.seller.storeName} (${activeCheck.seller.storeAge})`,
      badgeText: `${activeCheck.seller.rating}/5 Rating`,
      badgeVariant: activeCheck.seller.checklist.verifiedSeller ? 'verified' : 'flag',
      icon: <ShieldIcon size={18} />,
      screen: 'seller',
      testId: 'bento-seller-check',
    },
    {
      title: 'Review Check',
      subtitle: `${activeCheck.reviewSummary.productReviewsCount} product reviews analyzed`,
      badgeText: `${activeCheck.reviewSummary.filterCounts.visuals} Visuals`,
      badgeVariant: 'verified',
      icon: <StarIcon size={18} filled />,
      screen: 'product',
      subTab: 'reviews',
      testId: 'bento-review-check',
    },
    {
      title: 'Marketing Check',
      subtitle: 'Detect anchor discounts & promo urgency traps',
      badgeText: `${activeCheck.marketing.tactics.length} Tactics`,
      badgeVariant: 'caution',
      icon: <BookIcon size={18} />,
      screen: 'marketing',
      testId: 'bento-marketing-check',
    },
    {
      title: 'Budol Red Flags',
      subtitle: 'Automated price markup & spec contradiction scan',
      badgeText: `Risk ${activeCheck.redFlags.riskScore}/100`,
      badgeVariant: activeCheck.redFlags.riskScore >= 60 ? 'flag' : 'verified',
      icon: <AlertIcon size={18} />,
      screen: 'redflags',
      testId: 'bento-redflags-check',
    },
    {
      title: 'Final Summary',
      subtitle: 'Verified checklist vs. items needing verification',
      badgeText: `${activeCheck.finalSummary.checkedAndVerified.length} Verified`,
      badgeVariant: 'forest',
      icon: <ChecklistIcon size={18} />,
      screen: 'summary',
      testId: 'bento-final-summary',
    },
  ];

  return (
    <div className="space-y-6">
      <ShaderHeroBanner
        userName={isAuthenticated ? userName : 'Smart Shopper'}
        onClick={() => navigateTo('tips')}
      />

      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        {isAuthenticated ? (
          isEditingName ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleSaveName();
              }}
              className="flex items-center gap-2"
            >
              <input
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                aria-label="Your name"
                maxLength={40}
                autoFocus
                className="min-h-[44px] w-48 rounded-full border-[1.5px] border-ink bg-white px-4 text-sm font-semibold text-ink focus:outline-none"
              />
              <button
                type="submit"
                aria-label="Save name"
                className="budol-btn-primary !min-h-[44px] !px-3.5 text-xs"
              >
                <CheckIcon size={14} />
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => {
                setNameDraft(userName);
                setIsEditingName(true);
              }}
              className="inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-ink"
            >
              <span>Shopping as {userName}</span>
              <EditIcon size={14} className="text-ink-muted" />
            </button>
          )
        ) : (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold text-ink">Browsing as Guest</span>
            <button
              type="button"
              onClick={() => navigateTo('auth')}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-ink/30 bg-white px-3 py-1 text-xs font-semibold text-forest hover:border-ink hover:bg-peach/40"
            >
              <UserIcon size={13} />
              <span>Log in to sync saved checks</span>
            </button>
          </div>
        )}
        <span className="text-xs font-medium text-ink-muted">
          Search any product across Shopee, Lazada, and Temu or paste a direct product URL
        </span>
      </div>

      {isAuthenticated && role === 'admin' && (
        <div className="budol-card flex flex-wrap items-center justify-between gap-3 bg-blush/50 px-4 py-3">
          <div className="flex items-center gap-2 text-xs font-bold text-ink">
            <ShieldIcon size={15} className="text-flag" />
            <span>Moderator Inspector Mode: Inspecting live marketplace listings</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                void submitReportToAdminQueue({
                  productTitle: activeCheck.productTitle,
                  subtitle: `${activeCheck.seller.storeName} • ${activeCheck.redFlags.riskLabel}`,
                  platform: activeCheck.platformName,
                  flagReason:
                    activeCheck.redFlags.items[0]?.title ||
                    'Flagged by Moderator from Inspector',
                  reportCategory: 'report',
                  priceAnomaly: `${formatCurrency(activeCheck.listedPricePhp)} (${activeCheck.redFlags.riskLabel})`,
                  illustrationKey: activeCheck.illustrationKey,
                  thumbnailUrl: activeCheck.imageUrls?.[0],
                  sourceUrl: activeCheck.sourceUrl,
                });
              }}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border-[1.5px] border-ink bg-flag px-3.5 py-1 text-xs font-bold text-white shadow-crisp"
            >
              <AlertIcon size={13} />
              <span>Flag Active Listing to Queue</span>
            </button>
            <button
              type="button"
              onClick={() => setAdminConsoleTab('reports')}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border-[1.5px] border-ink bg-white px-3.5 py-1 text-xs font-semibold text-ink shadow-crisp hover:bg-cream"
            >
              <span>Open Moderation Queue</span>
              <ArrowRightIcon size={13} />
            </button>
          </div>
        </div>
      )}

      {isAuthenticated && role === 'seller' && (
        <div className="budol-card flex flex-wrap items-center justify-between gap-3 bg-mint/60 px-4 py-3">
          <div className="flex items-center gap-2 text-xs font-bold text-ink">
            <ShieldIcon size={15} className="text-forest" />
            <span>Merchant Inspector Mode: Benchmark competitor listings &amp; audit specs</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSellerPortalTab('guidelines')}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border-[1.5px] border-ink bg-forest px-3.5 py-1 text-xs font-bold text-white shadow-crisp"
            >
              <span>Run Seller Self-Audit</span>
            </button>
            <button
              type="button"
              onClick={() => setSellerPortalTab('products')}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border-[1.5px] border-ink bg-white px-3.5 py-1 text-xs font-semibold text-ink shadow-crisp hover:bg-cream"
            >
              <span>Manage My Products</span>
              <ArrowRightIcon size={13} />
            </button>
          </div>
        </div>
      )}

      <div className="budol-card-elevated bg-white">
        <form onSubmit={handleAnalyzeSubmit} className="space-y-3">
          <div className="flex flex-col gap-2.5 lg:flex-row">
            <div className="relative flex-1">
              <SearchIcon
                size={17}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted"
              />
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => {
                  setInputQuery(e.target.value);
                  if (linkError) dismissLinkError();
                }}
                onPaste={handleInputPaste}
                placeholder="Search a product across stores (e.g. ergonomic mouse, smartwatch) or paste a listing link"
                aria-label="Paste product link or search product"
                className="min-h-[44px] w-full rounded-full border-[1.5px] border-ink bg-cream py-2.5 pl-11 pr-11 text-sm font-medium text-ink placeholder:text-ink-muted focus:bg-white focus:outline-none"
              />
              {inputQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setInputQuery('');
                    dismissLinkError();
                  }}
                  aria-label="Clear search or link"
                  className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-ink-muted hover:bg-peach/60 hover:text-ink"
                >
                  <CloseIcon size={15} />
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
              <button
                type="button"
                onClick={handlePasteClipboard}
                className="budol-btn-secondary text-xs"
              >
                <ClipboardIcon size={15} />
                <span>Paste Link</span>
              </button>

              <button
                type="button"
                onClick={handleImportClick}
                className="budol-btn-secondary text-xs"
              >
                <UploadIcon size={15} />
                <span>Upload Photo</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                aria-label="Upload product screenshot"
              />

              <button
                type="submit"
                disabled={isLoadingCheck || isSearchingCatalog}
                className="budol-btn-primary col-span-2 text-xs sm:col-span-1"
              >
                <span>
                  {isSearchingCatalog
                    ? 'Searching...'
                    : isLoadingCheck
                    ? 'Checking...'
                    : 'Search / Check'}
                </span>
                <ArrowRightIcon size={15} />
              </button>
            </div>
          </div>

          {linkError && (
            <div
              role="alert"
              className="rounded-xl border-[1.5px] border-ink bg-blush p-3.5 shadow-crisp"
            >
              <div className="flex items-start gap-2.5">
                <AlertIcon size={17} className="mt-0.5 shrink-0 text-flag" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">{linkError}</p>
                  <p className="mt-0.5 text-xs font-normal text-ink-muted">
                    Paste a valid Shopee, Lazada, Temu, or social URL, search by product keyword, or upload a screenshot.
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleImportClick}
                      className="budol-btn-primary !min-h-[40px] text-xs"
                    >
                      <UploadIcon size={14} />
                      <span>Upload Image Manually</span>
                    </button>
                    <button
                      type="button"
                      onClick={dismissLinkError}
                      className="budol-btn-secondary !min-h-[40px] text-xs"
                    >
                      <span>Dismiss</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="section-label mr-1">Compare Across Stores:</span>
            {QUICK_SEARCH_KEYWORDS.map((kw) => {
              const active =
                searchResults?.query.toLowerCase() === kw.toLowerCase();
              return (
                <button
                  key={kw}
                  type="button"
                  onClick={() => {
                    setInputQuery(kw);
                    void runKeywordSearch(kw, 'all');
                  }}
                  className={`sticker cursor-pointer transition-transform duration-150 hover:-translate-y-0.5 ${
                    active
                      ? 'bg-forest text-white'
                      : 'bg-butter/70 text-ink hover:bg-peach'
                  }`}
                >
                  <SearchIcon size={11} />
                  <span>{kw}</span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-ink/10 pt-2.5">
            <span className="section-label mr-1">Recent Reports:</span>
            {historyChecks.slice(0, 4).map((item) => {
              const isSelected = item.id === activeCheck.id && !searchResults;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={async () => {
                    clearSearchResults();
                    await loadProductCheck(item.id);
                  }}
                  className={`sticker cursor-pointer transition-transform duration-150 hover:-translate-y-0.5 ${
                    isSelected
                      ? 'bg-olive text-white'
                      : 'bg-cream text-ink hover:bg-peach'
                  }`}
                >
                  {item.productTitle} ({item.platformName})
                </button>
              );
            })}
          </div>
        </form>
      </div>

      {(searchResults || isSearchingCatalog) && (
        <section
          aria-label="Multi-store marketplace search results"
          data-testid="marketplace-search-results"
          className="budol-card-elevated space-y-4 bg-white"
        >
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-ink/15 pb-3.5">
            <div>
              <span className="section-label">Multi-Store Marketplace Search</span>
              <h2 className="font-editorial mt-1 text-2xl font-bold text-ink">
                {isSearchingCatalog
                  ? `Searching online stores for "${searchQuery}"...`
                  : `Listings for "${searchResults?.query ?? searchQuery}" (${searchResults?.total ?? 0})`}
              </h2>
              <p className="mt-0.5 text-xs text-ink-muted">
                Compare listings across Shopee, Lazada, and Temu. Run a 6-point check on any listing or open the live store search directly.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                clearSearchResults();
                setInputQuery('');
              }}
              className="budol-btn-secondary !min-h-[40px] !px-3.5 text-xs"
            >
              <CloseIcon size={14} />
              <span>Close Search</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div
              role="tablist"
              aria-label="Filter results by store"
              className="flex flex-wrap items-center gap-1.5"
            >
              {PLATFORM_FILTER_TABS.map((tab) => {
                const active = searchPlatformFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => void setSearchPlatformFilter(tab.id)}
                    className={`min-h-[40px] rounded-full border-[1.5px] border-ink px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                      active
                        ? 'bg-olive text-white shadow-crisp'
                        : 'bg-cream text-ink hover:bg-peach'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {searchResults?.storeSearchLinks && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                  Live Store Search:
                </span>
                {searchResults.storeSearchLinks
                  .filter((link) => !link.platform.toLowerCase().includes('tiktok'))
                  .map((link) => (
                    <a
                      key={link.platform}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-[38px] items-center gap-1 rounded-full border-[1.5px] border-ink bg-butter/80 px-3 py-1 text-xs font-semibold text-ink shadow-crisp transition-transform hover:-translate-y-0.5"
                    >
                      <span>{link.platform}</span>
                      <ExternalLinkIcon size={12} />
                    </a>
                  ))}
              </div>
            )}
          </div>

          {searchResults && searchResults.items.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {searchResults.items.map((item) => (
                <CatalogResultCard
                  key={item.id}
                  item={item}
                  isChecking={isLoadingCheck}
                  onSelectForCheck={(catalogId) =>
                    void selectCatalogListingForCheck(catalogId)
                  }
                />
              ))}
            </div>
          ) : (
            !isSearchingCatalog && (
              <div className="rounded-2xl border-[1.5px] border-dashed border-ink/35 bg-cream p-6 text-center">
                <h3 className="font-editorial text-lg font-bold text-ink">
                  No listings found for "{searchResults?.query}"
                </h3>
                <p className="mx-auto mt-1 max-w-xl text-xs leading-relaxed text-ink-muted">
                  Try another product keyword or switch the store filter tab to All Stores to compare listings across Shopee, Lazada, and Temu.
                </p>
              </div>
            )
          )}
        </section>
      )}

      {!hasListing && (
        <div className="budol-card bg-white p-8 text-center" data-testid="ready-state">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-[1.5px] border-ink bg-mint shadow-crisp">
            <ShieldIcon size={24} />
          </span>
          <h2 className="font-editorial mt-4 text-xl font-bold text-ink">
            Ready to check a product
          </h2>
          <p className="mx-auto mt-1 max-w-md text-pretty text-sm font-normal text-ink-muted">
            Paste a link from Shopee, Lazada, Temu, Instagram, Facebook, YouTube, Pinterest or X, search any product keyword, or upload a screenshot, and your 6-point check starts right away.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <button type="button" onClick={handlePasteClipboard} className="budol-btn-primary text-xs">
              <ClipboardIcon size={15} />
              <span>Paste Link</span>
            </button>
            <button type="button" onClick={handleImportClick} className="budol-btn-secondary text-xs">
              <UploadIcon size={15} />
              <span>Upload Photo</span>
            </button>
          </div>
        </div>
      )}

      {hasListing && (
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <Reveal className="lg:col-span-4">
          <div className="budol-card flex h-full flex-col justify-between bg-white">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="section-label">Active Target Listing</span>
                <PlatformBadgeSvg platform={activeCheck.platformName} />
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="sticker inline-flex items-center gap-1 bg-mint text-verified">
                  <CheckIcon size={12} />
                  {activeCheck.importedFrom
                    ? `Imported from ${activeCheck.importedFrom}`
                    : 'Imported from your link'}
                </span>
                <button
                  type="button"
                  onClick={() => toggleSavedCheck(activeCheck.id)}
                  className="inline-flex min-h-[44px] items-center gap-1 px-1 text-xs font-semibold text-ink hover:text-olive"
                >
                  <HeartIcon size={14} filled={isSaved} />
                  {isSaved ? 'Saved' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={handleClearListing}
                  className="inline-flex min-h-[44px] items-center gap-1 px-1 text-xs font-semibold text-ink-muted hover:text-flag"
                >
                  <CloseIcon size={13} />
                  Clear
                </button>
              </div>

              <div className="mt-4 flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => navigateTo('product', 'overview')}
                  aria-label="Open product photos"
                  className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-[1.5px] border-ink bg-peach shadow-crisp"
                >
                  {(activeCheck.uploadedImageUrl || activeCheck.imageUrls?.[0]) && !heroImgFailed ? (
                    <img
                      src={activeCheck.uploadedImageUrl || activeCheck.imageUrls?.[0]}
                      alt={activeCheck.productTitle}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      onError={() => setHeroImgFailed(true)}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ProductIllustrationSvg
                      variant={activeCheck.illustrationKey}
                      size={62}
                    />
                  )}
                </button>
                <div className="min-w-0">
                  <h2 className="font-editorial line-clamp-2 text-xl font-bold text-ink">
                    {activeCheck.productTitle}
                  </h2>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2">
                    <p className="text-lg font-bold tabular-nums text-flag">
                      {formatCurrency(activeCheck.listedPricePhp)}
                    </p>
                    {activeCheck.isPriceEstimated && (
                      <span className="sticker bg-butter text-ink">
                        Benchmark Est.
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-xs font-medium text-ink-muted">
                    Seller: {activeCheck.seller.storeName}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-xl border-[1.5px] border-ink bg-butter p-3.5 shadow-crisp">
                <div className="flex items-center justify-between text-xs font-semibold text-ink">
                  <span className="text-ink-muted">Verdict Status</span>
                  <span className="font-bold tabular-nums text-caution">
                    {activeCheck.redFlags.riskLabel}
                  </span>
                </div>
                <p className="mt-1 text-xs font-semibold leading-relaxed text-ink">
                  {activeCheck.finalSummary.verdictTitle}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => navigateTo('product', 'overview')}
                className="budol-btn-primary flex-1 text-xs"
              >
                <span>Inspect Product</span>
                <ArrowRightIcon size={15} />
              </button>
              <button
                type="button"
                onClick={() => navigateTo('compare')}
                className="budol-btn-secondary text-xs"
              >
                <span>Compare Prices</span>
              </button>
              <a
                href={resolveListingExternalUrl(
                  activeCheck.sourceUrl,
                  activeCheck.platformName,
                  activeCheck.productTitle
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="budol-btn-secondary text-xs"
              >
                <span>Visit Store on {activeCheck.platformName}</span>
                <ExternalLinkIcon size={13} />
              </a>
            </div>
          </div>
        </Reveal>

        <div className="lg:col-span-8">
          <Stagger className="grid h-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {bentoModules.map((mod) => (
              <StaggerItem key={mod.title}>
                <BentoModuleCard
                  title={mod.title}
                  subtitle={mod.subtitle}
                  badgeText={mod.badgeText}
                  badgeVariant={mod.badgeVariant}
                  icon={mod.icon}
                  testId={mod.testId}
                  onClick={() => navigateTo(mod.screen, mod.subTab)}
                />
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </div>
      )}

      <section aria-labelledby="how-it-works" className="pt-2">
        <Reveal>
          <span className="section-label">How It Works</span>
          <h2 id="how-it-works" className="font-editorial mt-1 text-2xl font-bold text-ink md:text-3xl">
            Three steps between you and an impulse budol
          </h2>
        </Reveal>

        <Stagger className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          {HOW_IT_WORKS.map((item) => (
            <StaggerItem key={item.step}>
              <div className={`budol-card h-full ${item.tint}`}>
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border-[1.5px] border-ink bg-white text-xs font-bold tabular-nums text-ink shadow-crisp">
                  {item.step}
                </span>
                <h3 className="font-editorial mt-3 text-base font-bold text-ink">
                  {item.title}
                </h3>
                <p className="mt-1 text-xs font-normal leading-relaxed text-ink-muted">
                  {item.body}
                </p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>
    </div>
  );
};

export default HomeDashboardView;
