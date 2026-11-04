import React, { memo, useState } from 'react';
import { motion } from 'motion/react';
import { useBudolStore } from '../store/useBudolStore.ts';
import {
  ProductSubTab,
  ReviewFilterType,
  SimilarProductItem,
} from '../types/budol.ts';
import {
  AlertIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ExternalLinkIcon,
  HeartIcon,
  PlatformBadgeSvg,
  ProductIllustrationSvg,
  StarIcon,
} from '../components/icons/SvgIcons.tsx';
import {
  ProductOverviewSkeleton,
  ReviewListSkeleton,
} from '../components/visuals/BudolSkeletons.tsx';
import {
  buildStorefrontSearchUrl,
  formatCurrency,
  inferPlatformFromUrlOrBadge,
  resolveListingExternalUrl,
} from '../lib/formatters.ts';
import { buildProductDetails, resolveCleanProductImageUrl } from '../lib/productContent.ts';
import { ProductGallery } from '../components/visuals/ProductGallery.tsx';

const SimilarCard = memo<{
  item: SimilarProductItem;
  platformName: 'Shopee' | 'Lazada' | 'Temu';
}>(({ item, platformName }) => {
  const [thumbFailed, setThumbFailed] = useState(false);
  const resolvedThumbUrl = resolveCleanProductImageUrl(item.thumbnailUrl, item.title, 0);
  const itemPlatform = inferPlatformFromUrlOrBadge(item.sourceUrl, item.promoBadge, platformName);

  return (
    <div className="budol-card flex flex-col justify-between p-4">
      <div>
        <div className="relative flex h-28 w-full items-center justify-center overflow-hidden rounded-xl border-[1.5px] border-ink bg-white">
          {resolvedThumbUrl && !thumbFailed ? (
            <img
              src={resolvedThumbUrl}
              alt={item.title}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              onError={() => setThumbFailed(true)}
              className="h-full w-full object-contain p-1"
            />
          ) : (
            <ProductIllustrationSvg variant={item.illustrationType} size={68} />
          )}
          <span className="absolute right-2 top-2 rounded-full border border-ink bg-flag px-2 py-0.5 text-[11px] font-semibold tabular-nums text-white shadow-crisp">
            -{item.discountPercentage}%
          </span>
        </div>

        <h4 className="mt-3 line-clamp-1 text-sm font-semibold text-ink">
          {item.title}
        </h4>

        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-base font-bold tabular-nums text-flag">
            {formatCurrency(item.salePricePhp)}
          </span>
          <span className="text-xs font-normal tabular-nums text-ink-muted line-through">
            {formatCurrency(item.originalPricePhp)}
          </span>
        </div>

        <div className="mt-2">
          <span className="sticker bg-butter text-ink">
            {item.promoBadge}
          </span>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-ink/15 pt-2.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold tabular-nums text-ink">
          <StarIcon size={13} filled />
          <span>{item.starRating}</span>
          <span className="font-normal text-ink-muted">({item.soldCountText})</span>
        </div>

        <a
          href={resolveListingExternalUrl(item.sourceUrl, itemPlatform, item.title)}
          target="_blank"
          rel="noopener noreferrer"
          className="budol-btn-secondary !min-h-[40px] !px-3.5 !py-1 text-xs"
        >
          <span>Open Listing</span>
          <ArrowRightIcon size={13} />
        </a>
      </div>
    </div>
  );
});

SimilarCard.displayName = 'SimilarCard';

export const ProductDetailsView: React.FC = () => {
  const activeCheck = useBudolStore((s) => s.activeCheck);
  const role = useBudolStore((s) => s.role);
  const currentSubTab = useBudolStore((s) => s.currentSubTab);
  const isLoadingCheck = useBudolStore((s) => s.isLoadingCheck);
  const reviewsFilter = useBudolStore((s) => s.reviewsFilter);
  const paginatedReviews = useBudolStore((s) => s.paginatedReviews);
  const isLoadingReviews = useBudolStore((s) => s.isLoadingReviews);
  const savedCheckIds = useBudolStore((s) => s.savedCheckIds);

  const navigateTo = useBudolStore((s) => s.navigateTo);
  const setSubTab = useBudolStore((s) => s.setSubTab);
  const setReviewsQuery = useBudolStore((s) => s.setReviewsQuery);
  const toggleSavedCheck = useBudolStore((s) => s.toggleSavedCheck);
  const setSellerPortalTab = useBudolStore((s) => s.setSellerPortalTab);
  const setAdminConsoleTab = useBudolStore((s) => s.setAdminConsoleTab);
  const submitReportToAdminQueue = useBudolStore((s) => s.submitReportToAdminQueue);

  const isSaved = savedCheckIds.includes(activeCheck.id);
  const [selectedVariant, setSelectedVariant] = useState('');
  const details = buildProductDetails(activeCheck);

  if (isLoadingCheck) {
    return <ProductOverviewSkeleton />;
  }

  const subTabs: Array<{ id: ProductSubTab; label: string }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'similar', label: 'Similar' },
  ];

  const filterChips: Array<{ id: ReviewFilterType; label: string }> = [
    { id: 'all', label: 'All' },
    {
      id: 'visuals',
      label: `Includes visuals (${activeCheck.reviewSummary.filterCounts.visuals})`,
    },
    { id: '5star', label: `5 Stars (${activeCheck.reviewSummary.filterCounts.star5})` },
    { id: '4star', label: `4 Stars (${activeCheck.reviewSummary.filterCounts.star4})` },
    { id: '3star', label: `3 Stars (${activeCheck.reviewSummary.filterCounts.star3})` },
    {
      id: 'critical',
      label: `Critical (${activeCheck.reviewSummary.filterCounts.critical})`,
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigateTo('home')}
          className="budol-btn-secondary px-3.5 py-2 text-xs"
        >
          <ArrowLeftIcon size={15} />
          <span>Back to Home</span>
        </button>

      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <ProductGallery check={activeCheck} />
        </div>

        <div className="space-y-4 lg:col-span-7">
          <div className="budol-card bg-white p-5">
            <div className="flex flex-wrap items-center gap-2">
              <PlatformBadgeSvg platform={activeCheck.platformName} />
              {activeCheck.importedFrom && (
                <span className="sticker bg-sky text-ink">
                  From {activeCheck.importedFrom}
                </span>
              )}
              <span className="sticker bg-blush text-flag">
                {activeCheck.redFlags.riskLabel}
              </span>
            </div>

            <h1 className="font-editorial mt-2 text-balance text-2xl font-bold text-ink">
              {activeCheck.productTitle}
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm tabular-nums text-ink">
              {activeCheck.reviewSummary.productReviewsCount > 0 ? (
                <>
                  <span className="inline-flex items-center gap-1 font-semibold">
                    <StarIcon size={15} filled />
                    {activeCheck.reviewSummary.productAverageRating}
                  </span>
                  <span className="text-ink-muted">
                    {activeCheck.reviewSummary.productReviewsCount.toLocaleString()} ratings
                  </span>
                </>
              ) : (
                <span className="text-xs font-medium text-ink-muted">
                  Open live listing to inspect current buyer rating count
                </span>
              )}
              {activeCheck.soldCountText && (
                <span className="text-ink-muted">{activeCheck.soldCountText}</span>
              )}
            </div>

            <div className="mt-3 rounded-xl border-[1.5px] border-ink bg-cream px-4 py-3">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-3xl font-bold tabular-nums text-flag">
                  {formatCurrency(activeCheck.listedPricePhp)}
                </span>
                {activeCheck.isPriceEstimated && (
                  <span className="sticker bg-butter text-ink">
                    Category Benchmark Est.
                  </span>
                )}
                {!activeCheck.isPriceEstimated &&
                  activeCheck.originalPricePhp &&
                  activeCheck.originalPricePhp > activeCheck.listedPricePhp && (
                    <>
                      <span className="text-sm font-normal tabular-nums text-ink-muted line-through">
                        {formatCurrency(activeCheck.originalPricePhp)}
                      </span>
                      <span className="sticker bg-flag text-white tabular-nums">
                        -
                        {Math.round(
                          (1 -
                            activeCheck.listedPricePhp /
                              activeCheck.originalPricePhp) *
                            100
                        )}
                        %
                      </span>
                    </>
                  )}
              </div>
              {activeCheck.isPriceEstimated && (
                <p className="mt-1.5 text-xs font-normal leading-relaxed text-ink-muted">
                  Exact live variation price is gated by {activeCheck.platformName} browser protection. Figure shown is the typical Philippine market benchmark for this category. Click Open on {activeCheck.platformName} below to confirm live checkout price.
                </p>
              )}
            </div>

            {activeCheck.shippingNote && (
              <p className="mt-3 text-xs font-medium text-ink-muted">
                <span className="font-semibold text-ink">Shipping: </span>
                {activeCheck.shippingNote}
              </p>
            )}

            {activeCheck.variants && activeCheck.variants.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-semibold text-ink">Variation</p>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {activeCheck.variants.map((variant) => {
                    const active =
                      (activeCheck.variants?.includes(selectedVariant)
                        ? selectedVariant
                        : activeCheck.variants?.[0]) === variant;
                    return (
                      <button
                        key={variant}
                        type="button"
                        onClick={() => setSelectedVariant(variant)}
                        aria-pressed={active}
                        className={`sticker min-h-[44px] px-4 transition-colors duration-150 ${
                          active ? 'bg-forest text-white' : 'bg-cream text-ink hover:bg-peach'
                        }`}
                      >
                        {variant}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => toggleSavedCheck(activeCheck.id)}
                className="budol-btn-secondary text-xs"
              >
                <HeartIcon size={15} filled={isSaved} />
                <span>{isSaved ? 'Saved' : 'Save Check'}</span>
              </button>
              <button
                type="button"
                onClick={() => navigateTo('compare')}
                className="budol-btn-primary text-xs"
              >
                <span>Compare to Buy</span>
                <ArrowRightIcon size={15} />
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
                <span>
                  {`Open on ${activeCheck.importedFrom || activeCheck.platformName}`}
                </span>
                <ExternalLinkIcon size={14} />
              </a>
              {role === 'admin' && (
                <button
                  type="button"
                  onClick={() => {
                    void submitReportToAdminQueue({
                      productTitle: activeCheck.productTitle,
                      subtitle: `${activeCheck.seller.storeName} • Spec & Price Audit`,
                      platform: activeCheck.platformName,
                      flagReason:
                        activeCheck.overview.contradictionWarning ||
                        'Flagged by Moderator during Product Check',
                      reportCategory: 'report',
                      priceAnomaly: `${formatCurrency(activeCheck.listedPricePhp)} (${activeCheck.redFlags.riskLabel})`,
                      illustrationKey: activeCheck.illustrationKey,
                      thumbnailUrl: activeCheck.imageUrls?.[0],
                      sourceUrl: activeCheck.sourceUrl,
                    });
                    setAdminConsoleTab('reports');
                  }}
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border-[1.5px] border-ink bg-flag px-4 py-2 text-xs font-bold text-white shadow-crisp"
                >
                  <AlertIcon size={14} />
                  <span>Flag Listing in Queue</span>
                </button>
              )}
              {role === 'seller' && (
                <button
                  type="button"
                  onClick={() => setSellerPortalTab('guidelines')}
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border-[1.5px] border-ink bg-[#D7E6D0] px-4 py-2 text-xs font-bold text-ink shadow-crisp hover:bg-mint"
                >
                  <span>Audit Spec in Seller Hub</span>
                  <ArrowRightIcon size={14} />
                </button>
              )}
            </div>

            {/^https?:\/\//i.test(activeCheck.sourceUrl) && (
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-ink/15 bg-cream/60 px-3 py-2 text-xs text-ink-muted">
                <span className="shrink-0 font-semibold text-ink">Reference URL:</span>
                <a
                  href={activeCheck.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate underline decoration-ink/30 underline-offset-2 hover:text-ink"
                >
                  {activeCheck.sourceUrl}
                </a>
              </div>
            )}
          </div>

          <div className="budol-card flex flex-wrap items-center justify-between gap-3 bg-white p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full border-[1.5px] border-ink bg-mint font-editorial text-base font-bold text-ink shadow-crisp">
                {activeCheck.seller.storeName.slice(0, 1).toUpperCase()}
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">
                  {activeCheck.seller.storeName}
                </p>
                <p className="text-xs tabular-nums text-ink-muted">
                  {activeCheck.seller.rating} / 5 - {activeCheck.seller.storeAge} -{' '}
                  {activeCheck.seller.responseRate}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={buildStorefrontSearchUrl(
                  activeCheck.platformName,
                  activeCheck.seller.storeName,
                  activeCheck.productTitle
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="budol-btn-secondary text-xs"
              >
                <span>Visit Store on {activeCheck.platformName}</span>
                <ExternalLinkIcon size={13} />
              </a>
              <button
                type="button"
                onClick={() => navigateTo('seller')}
                className="budol-btn-primary text-xs"
              >
                <span>View Seller Check</span>
                <ArrowRightIcon size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        role="tablist"
        aria-label="Product details tabs"
        className="budol-card flex bg-white p-0"
      >
        {subTabs.map((tab) => {
          const active = currentSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setSubTab(tab.id)}
              className={`relative min-h-[48px] flex-1 px-4 py-2 text-sm font-semibold transition-colors duration-150 ${
                active ? 'text-forest' : 'text-ink-muted hover:text-ink'
              }`}
            >
              <span>{tab.label}</span>
              {active && (
                <motion.div
                  layoutId="product-subtab"
                  className="absolute bottom-0 left-0 right-0 h-1 rounded-t-full bg-forest"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {currentSubTab === 'overview' && (
        <div className="space-y-5">
        {activeCheck.uploadedImageUrl && (
          <div className="budol-card bg-butter p-4" role="note">
            <p className="text-sm font-semibold text-ink">
              Image-only check, lower confidence
            </p>
            <p className="mt-0.5 text-xs font-normal text-ink">
              We could not read a listing from this photo, so figures below are placeholders. Confirm the price, seller and specs on the original listing before buying.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="grid grid-cols-1 gap-4 lg:col-span-12 lg:grid-cols-2">
            <div className="budol-card p-5">
              <h2 className="font-editorial text-lg font-bold text-ink">
                About this product
              </h2>
              <p className="mt-2 text-pretty text-sm font-normal leading-relaxed text-ink">
                {details.about}
              </p>
              <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {details.highlights.map((item) => (
                  <li
                    key={item}
                    className="rounded-xl border-[1.5px] border-ink bg-mint px-3 py-2 text-xs font-medium text-ink shadow-crisp"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="budol-card p-5">
              <h2 className="font-editorial text-lg font-bold text-ink">
                Product details
              </h2>
              <dl className="mt-3 divide-y divide-ink/15 text-sm">
                {details.specs.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-start justify-between gap-4 py-2.5"
                  >
                    <dt className="font-medium text-ink-muted">{row.label}</dt>
                    <dd className="text-right font-semibold tabular-nums text-ink">
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-5">
            <div className="budol-card p-5">
              <h2 className="font-editorial text-lg font-bold text-ink">
                Specification Table
              </h2>
              <p className="mt-0.5 text-xs text-ink-muted">
                Extracted from seller product attributes
              </p>

              <dl className="mt-4 divide-y divide-ink/15 text-sm">
                <div className="flex items-center justify-between py-2.5">
                  <dt className="font-medium text-ink-muted">Material</dt>
                  <dd className="font-semibold text-ink">
                    {activeCheck.overview.material}
                  </dd>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <dt className="font-medium text-ink-muted">Pattern</dt>
                  <dd className="font-semibold text-ink">
                    {activeCheck.overview.pattern}
                  </dd>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <dt className="font-medium text-ink-muted">Quantity</dt>
                  <dd className="font-semibold tabular-nums text-ink">
                    {activeCheck.overview.quantity}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="budol-card bg-butter p-5">
              <div className="flex items-start gap-3.5">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-[1.5px] border-ink bg-flag text-white shadow-crisp">
                  <AlertIcon size={17} />
                </span>
                <div>
                  <span className="inline-block rounded-full border border-ink bg-white px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-flag">
                    Attention Required
                  </span>
                  <h3 className="mt-1.5 text-sm font-bold text-ink">
                    Spec Contradiction & Omission Alert
                  </h3>
                  <p className="mt-1 text-xs font-normal leading-relaxed text-ink">
                    {activeCheck.overview.contradictionWarning}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="budol-card p-5">
              <h2 className="font-editorial text-lg font-bold text-ink">
                Seller Description Claims Breakdown
              </h2>
              <p className="mt-0.5 text-xs text-ink-muted">
                Structured verification of promotional statements in the listing copy
              </p>

              <div className="mt-4 space-y-3">
                {activeCheck.overview.claims.map((claim, index) => (
                  <div
                    key={claim.label}
                    className={`flex items-start gap-3.5 rounded-xl border-[1.5px] border-ink p-3.5 shadow-crisp ${
                      ['bg-mint', 'bg-butter', 'bg-sky', 'bg-blush'][index % 4]
                    }`}
                  >
                    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-[1.5px] border-ink bg-white text-xs font-bold tabular-nums text-ink shadow-crisp">
                      0{index + 1}
                    </span>
                    <div>
                      <span className="inline-block rounded-md border border-ink/25 bg-white/90 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-ink">
                        {claim.label} Claim
                      </span>
                      <p className="mt-1 text-sm font-medium text-ink">
                        {claim.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        </div>
      )}

      {currentSubTab === 'reviews' && (
        <div className="space-y-4">
          <div className="budol-card p-5">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="font-editorial text-lg font-bold text-ink">
                  Customer Reviews ({activeCheck.reviewSummary.productReviewsCount})
                </h2>
                <div className="mt-1 flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <StarIcon key={n} size={15} filled />
                    ))}
                  </div>
                  <span className="text-sm font-bold tabular-nums text-ink">
                    {activeCheck.reviewSummary.productAverageRating} / 5
                  </span>
                </div>
              </div>

              <div className="rounded-xl border-[1.5px] border-ink bg-cream px-4 py-2.5 shadow-crisp">
                <span className="text-xs font-medium text-ink-muted">
                  Store-Wide Reviews
                </span>
                <p className="text-base font-bold tabular-nums text-ink">
                  {activeCheck.reviewSummary.storeReviewsCountText} Total Reviews
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {filterChips.map((chip) => {
                const active = reviewsFilter === chip.id;
                return (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => setReviewsQuery(chip.id, 1)}
                    className={`sticker min-h-[40px] tabular-nums transition-colors duration-150 ${
                      active
                        ? 'bg-forest text-white'
                        : 'bg-cream text-ink hover:bg-peach'
                    }`}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>
          </div>

          {isLoadingReviews ? (
            <ReviewListSkeleton />
          ) : (
            <div className="space-y-3.5">
              {paginatedReviews.items.map((review) => (
                <div key={review.id} className="budol-card p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full border-[1.5px] border-ink bg-cream text-xs font-bold text-ink">
                        {review.maskedUsername.slice(0, 1).toUpperCase()}
                      </span>
                      <div>
                        <span className="text-sm font-semibold text-ink">
                          {review.maskedUsername}
                        </span>
                        <span className="ml-2 rounded-full border border-ink/25 bg-mint px-2.5 py-0.5 text-[11px] font-semibold text-verified">
                          Verified Purchase
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <StarIcon
                          key={star}
                          size={13}
                          filled={star <= review.starRating}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="mt-1.5 text-xs font-medium text-ink-muted">
                    {review.variantPurchased}
                  </p>

                  <p className="mt-2 text-sm font-normal leading-relaxed text-ink">
                    {review.comment}
                  </p>

                  {review.photoLabels.length > 0 && (
                    <div className="mt-3.5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                      {review.photoLabels.map((label) => (
                        <div
                          key={label}
                          className="flex h-20 flex-col items-center justify-center rounded-xl border-[1.5px] border-ink bg-cream p-2 text-center shadow-crisp"
                        >
                          <ProductIllustrationSvg
                            variant={activeCheck.illustrationKey}
                            size={34}
                          />
                          <span className="mt-1 text-[11px] font-medium text-ink">
                            {label}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              <div className="budol-card flex flex-wrap items-center justify-between gap-3 p-4">
                <span className="text-xs font-medium tabular-nums text-ink-muted">
                  Showing page {paginatedReviews.page} of{' '}
                  {paginatedReviews.totalPages} ({paginatedReviews.total} matching
                  reviews)
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={paginatedReviews.page <= 1}
                    onClick={() =>
                      setReviewsQuery(reviewsFilter, paginatedReviews.page - 1)
                    }
                    className="budol-btn-secondary px-3.5 py-1.5 text-xs disabled:opacity-40"
                  >
                    Prev Page
                  </button>
                  <button
                    type="button"
                    disabled={paginatedReviews.page >= paginatedReviews.totalPages}
                    onClick={() =>
                      setReviewsQuery(reviewsFilter, paginatedReviews.page + 1)
                    }
                    className="budol-btn-secondary px-3.5 py-1.5 text-xs disabled:opacity-40"
                  >
                    Next Page
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {currentSubTab === 'similar' && (
        <div className="space-y-4">
          <div className="budol-card bg-mint p-4">
            <p className="text-sm font-medium text-ink">
              <strong className="font-semibold text-verified">
                Price Reality Benchmark:
              </strong>{' '}
              {activeCheck.similarProducts.length > 0 ? (
                <>
                  Competing stores offer similar alternatives between{' '}
                  {formatCurrency(
                    Math.min(...activeCheck.similarProducts.map((item) => item.salePricePhp))
                  )}{' '}
                  and{' '}
                  {formatCurrency(
                    Math.max(...activeCheck.similarProducts.map((item) => item.salePricePhp))
                  )}{' '}
                  compared to this listing at{' '}
                  {formatCurrency(activeCheck.listedPricePhp)}.
                </>
              ) : (
                <>
                  Compare this listing at {formatCurrency(activeCheck.listedPricePhp)} against
                  other marketplace sellers before checking out.
                </>
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {activeCheck.similarProducts.map((item) => (
              <SimilarCard
                key={item.id}
                item={item}
                platformName={activeCheck.platformName}
              />
            ))}
          </div>
        </div>
      )}

      <div className="budol-card flex flex-wrap items-center justify-between gap-3 p-4">
        <button
          type="button"
          onClick={() => navigateTo('seller')}
          className="budol-btn-secondary text-xs"
        >
          <ArrowLeftIcon size={15} />
          <span>Seller Check</span>
        </button>

        <button
          type="button"
          onClick={() => navigateTo('compare')}
          className="budol-btn-primary text-xs"
        >
          <span>Compare to Buy</span>
          <ArrowRightIcon size={15} />
        </button>
      </div>
    </div>
  );
};

export default ProductDetailsView;
