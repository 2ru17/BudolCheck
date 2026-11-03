import React, { memo, useRef, useState } from 'react';
import { useDebouncedValue } from '@mantine/hooks';
import { useBudolStore } from '../store/useBudolStore.ts';
import { ScreenId } from '../types/budol.ts';
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
  HeartIcon,
  PlatformBadgeSvg,
  ProductIllustrationSvg,
  SearchIcon,
  ShieldIcon,
  StarIcon,
  TagIcon,
  UploadIcon,
} from '../components/icons/SvgIcons.tsx';
import { formatCurrency } from '../lib/formatters.ts';
import { Reveal, Stagger, StaggerItem } from '../components/visuals/Motion.tsx';

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Paste the product link',
    body: 'Drop a listing URL or upload a screenshot from Shopee, Lazada, TikTok Shop, or Temu.',
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
  const userName = useBudolStore((s) => s.userName);
  const activeCheck = useBudolStore((s) => s.activeCheck);
  const historyChecks = useBudolStore((s) => s.historyChecks);
  const isLoadingCheck = useBudolStore((s) => s.isLoadingCheck);
  const navigateTo = useBudolStore((s) => s.navigateTo);
  const runLinkAnalysis = useBudolStore((s) => s.runLinkAnalysis);
  const loadProductCheck = useBudolStore((s) => s.loadProductCheck);
  const showToast = useBudolStore((s) => s.showToast);
  const hasListing = useBudolStore((s) => s.hasListing);
  const linkError = useBudolStore((s) => s.linkError);
  const dismissLinkError = useBudolStore((s) => s.dismissLinkError);
  const runImageAnalysis = useBudolStore((s) => s.runImageAnalysis);
  const clearListing = useBudolStore((s) => s.clearListing);
  const toggleSavedCheck = useBudolStore((s) => s.toggleSavedCheck);
  const isSaved = useBudolStore((s) => s.savedCheckIds.includes(s.activeCheck.id));
  const userEmail = useBudolStore((s) => s.userEmail);
  const updateUserProfile = useBudolStore((s) => s.updateUserProfile);

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(userName);

  const [inputQuery, setInputQuery] = useState(activeCheck.sourceUrl);
  const [debouncedQuery] = useDebouncedValue(inputQuery, 300);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredQuickChecks = historyChecks.filter((item) => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q || q.startsWith('http')) return true;
    return (
      item.productTitle.toLowerCase().includes(q) ||
      item.platformName.toLowerCase().includes(q)
    );
  });

  const handleAnalyzeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await runLinkAnalysis(inputQuery || activeCheck.sourceUrl);
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
        setInputQuery('');
        void runImageAnalysis(reader.result, file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveName = () => {
    updateUserProfile(nameDraft, userEmail);
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
      <ShaderHeroBanner userName={userName} onClick={() => navigateTo('tips')} />

      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        {isEditingName ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveName();
            }}
            className="flex items-center gap-2"
          >
            <input
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              aria-label="Your name"
              maxLength={24}
              autoFocus
              className="min-h-[44px] w-40 rounded-full border-[1.5px] border-ink bg-white px-4 text-sm font-semibold text-ink focus:outline-none"
            />
            <button type="submit" aria-label="Save name" className="budol-btn-primary !min-h-[44px] !px-3.5 text-xs">
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
        )}
        <span className="text-xs font-medium text-ink-muted">
          Tip: pasting a link starts the check automatically
        </span>
      </div>

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
                placeholder="Paste a link from Shopee, Lazada, TikTok, Instagram, Facebook, YouTube, Pinterest or X"
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
                  aria-label="Clear link"
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
                disabled={isLoadingCheck}
                className="budol-btn-primary col-span-2 text-xs sm:col-span-1"
              >
                <span>{isLoadingCheck ? 'Checking...' : 'Check Now'}</span>
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
                    Upload a screenshot or photo of the product and we will build a limited check from it.
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
            <span className="section-label mr-1">Sample Checks:</span>
            {filteredQuickChecks.map((item) => {
              const isSelected = item.id === activeCheck.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={async () => {
                    setInputQuery(item.sourceUrl);
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

      {!hasListing && (
        <div className="budol-card bg-white p-8 text-center" data-testid="ready-state">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-[1.5px] border-ink bg-mint shadow-crisp">
            <ShieldIcon size={24} />
          </span>
          <h2 className="font-editorial mt-4 text-xl font-bold text-ink">
            Ready to check a product
          </h2>
          <p className="mx-auto mt-1 max-w-md text-pretty text-sm font-normal text-ink-muted">
            Paste a link from Shopee, Lazada, TikTok, Instagram, Facebook, YouTube, Pinterest or X, or upload a screenshot, and your 6-point check starts right away.
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
                  {activeCheck.uploadedImageUrl ? (
                    <img
                      src={activeCheck.uploadedImageUrl}
                      alt={activeCheck.productTitle}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ProductIllustrationSvg
                      variant={activeCheck.illustrationKey}
                      size={62}
                    />
                  )}
                </button>
                <div>
                  <h2 className="font-editorial text-xl font-bold text-ink">
                    {activeCheck.productTitle}
                  </h2>
                  <p className="mt-0.5 text-lg font-bold tabular-nums text-flag">
                    {formatCurrency(activeCheck.listedPricePhp)}
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-ink-muted">
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
