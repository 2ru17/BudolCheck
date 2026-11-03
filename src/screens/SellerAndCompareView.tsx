import React, { useState } from 'react';
import { Modal } from '@mantine/core';
import { useBudolStore } from '../store/useBudolStore.ts';
import { AnimatedCheckCircle } from '../components/visuals/AnimeCheckmark.tsx';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  PlatformBadgeSvg,
  ProductIllustrationSvg,
  ShieldIcon,
  StarIcon,
} from '../components/icons/SvgIcons.tsx';
import { buildShopSearchUrl, formatCurrency } from '../lib/formatters.ts';
import { Stagger, StaggerItem } from '../components/visuals/Motion.tsx';

export const SellerCheckView: React.FC = () => {
  const activeCheck = useBudolStore((s) => s.activeCheck);
  const navigateTo = useBudolStore((s) => s.navigateTo);
  const [dossierOpen, setDossierOpen] = useState(false);

  const checklistRows = [
    {
      label: 'Verified Seller',
      description: `Store identity and platform badge checked (${activeCheck.seller.storeName})`,
      passed: activeCheck.seller.checklist.verifiedSeller,
    },
    {
      label: 'Customer Rating',
      description: `${activeCheck.seller.rating} / 5 average across ${activeCheck.seller.reviewCountText}`,
      passed: activeCheck.seller.checklist.customerRating,
    },
    {
      label: 'Product Info Confirmed',
      description: 'Core material and package quantity attributes present in listing',
      passed: activeCheck.seller.checklist.productInfoConfirmed,
    },
    {
      label: 'Return Policy',
      description: '7-day platform return and refund protection active',
      passed: activeCheck.seller.checklist.returnPolicy,
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

        <button
          type="button"
          onClick={() => navigateTo('compare')}
          className="budol-btn-primary px-4 py-2 text-xs"
        >
          <span>Compare to Buy</span>
          <ArrowRightIcon size={15} />
        </button>
      </div>

      <div className="budol-card bg-butter p-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-[1.5px] border-ink bg-cream shadow-crisp">
              <ProductIllustrationSvg
                variant={activeCheck.illustrationKey}
                size={64}
              />
            </div>
            <div>
              <PlatformBadgeSvg platform={activeCheck.platformName} />
              <h1 className="font-editorial mt-1.5 text-2xl font-bold text-ink">
                {activeCheck.productTitle}
              </h1>
              <p className="text-base font-bold tabular-nums text-flag">
                {formatCurrency(activeCheck.listedPricePhp)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setDossierOpen(true)}
            className="budol-btn-secondary text-xs"
          >
            <ShieldIcon size={16} />
            <span>View Seller Info</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="budol-card p-5">
            <h2 className="font-editorial text-lg font-bold text-ink">
              Seller Verification Checklist
            </h2>
            <p className="mt-0.5 text-xs text-ink-muted">
              4-point credibility check for {activeCheck.seller.storeName}
            </p>

            <div className="mt-4 space-y-3">
              {checklistRows.map((row, idx) => (
                <div
                  key={row.label}
                  className={`flex items-center justify-between gap-3 rounded-xl border-[1.5px] border-ink p-3.5 shadow-crisp ${
                    row.passed ? 'bg-mint' : 'bg-blush'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <AnimatedCheckCircle passed={row.passed} delayMs={idx * 90} />
                    <div>
                      <h3 className="text-sm font-semibold text-ink">
                        {row.label}
                      </h3>
                      <p className="text-xs font-normal text-ink-muted">
                        {row.description}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`rounded-full border border-ink px-2.5 py-0.5 text-[11px] font-semibold ${
                      row.passed
                        ? 'bg-white text-verified'
                        : 'bg-white text-flag'
                    }`}
                  >
                    {row.passed ? 'Passed' : 'Failed'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4 lg:col-span-5">
          <div className="budol-card p-5">
            <h2 className="font-editorial text-lg font-bold text-ink">
              Store Metrics Snapshot
            </h2>
            <dl className="mt-3 divide-y divide-ink/15 text-sm">
              <div className="flex items-center justify-between py-2.5">
                <dt className="font-medium text-ink-muted">Store Name</dt>
                <dd className="font-semibold text-ink">
                  {activeCheck.seller.storeName}
                </dd>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <dt className="font-medium text-ink-muted">Store Age</dt>
                <dd className="font-semibold tabular-nums text-ink">
                  {activeCheck.seller.storeAge}
                </dd>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <dt className="font-medium text-ink-muted">Response Rate</dt>
                <dd className="font-semibold tabular-nums text-ink">
                  {activeCheck.seller.responseRate}
                </dd>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <dt className="font-medium text-ink-muted">Fulfillment</dt>
                <dd className="font-semibold tabular-nums text-ink">
                  {activeCheck.seller.fulfillmentRate}
                </dd>
              </div>
            </dl>

            <div className="mt-4 rounded-xl border-[1.5px] border-ink bg-butter p-3 text-xs font-normal leading-relaxed text-ink shadow-crisp">
              <strong className="font-semibold text-caution">Verification Note: </strong>
              {activeCheck.seller.unverifiedNote}
            </div>
          </div>

          <div className="budol-card flex flex-col justify-between gap-3 p-5">
            <div>
              <h3 className="font-editorial text-base font-bold text-ink">
                Still Unsure? Inspect Real Buyer Photos
              </h3>
              <p className="mt-0.5 text-xs text-ink-muted">
                Read verified customer reviews and filter by uploaded unboxing visuals.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigateTo('product', 'reviews')}
              className="budol-btn-primary w-full text-xs"
            >
              <span>Read Reviews</span>
              <ArrowRightIcon size={15} />
            </button>
          </div>
        </div>
      </div>

      <Modal
        opened={dossierOpen}
        onClose={() => setDossierOpen(false)}
        title={
          <span className="font-editorial text-base font-bold text-ink">
            Seller Dossier: {activeCheck.seller.storeName}
          </span>
        }
        centered
        radius="lg"
      >
        <div className="space-y-3 text-sm">
          <div className="rounded-xl border-[1.5px] border-ink bg-cream p-3.5">
            <div className="flex items-center justify-between py-1">
              <span className="font-medium text-ink-muted">Permit / Registration</span>
              <span className="font-semibold tabular-nums text-ink">
                {activeCheck.seller.certificateId}
              </span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="font-medium text-ink-muted">Dispatch Hub</span>
              <span className="font-semibold text-ink">
                {activeCheck.seller.storeLocation}
              </span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="font-medium text-ink-muted">Cancellation Rate</span>
              <span className="font-semibold tabular-nums text-ink">
                {activeCheck.seller.cancellationRate}
              </span>
            </div>
          </div>

          <p className="text-xs leading-relaxed text-ink-muted">
            {activeCheck.seller.unverifiedNote}
          </p>

          <button
            type="button"
            onClick={() => setDossierOpen(false)}
            className="budol-btn-primary w-full text-xs"
          >
            Close Seller Dossier
          </button>
        </div>
      </Modal>
    </div>
  );
};

export const CompareToBuyView: React.FC = () => {
  const activeCheck = useBudolStore((s) => s.activeCheck);
  const navigateTo = useBudolStore((s) => s.navigateTo);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigateTo('product', 'overview')}
          className="budol-btn-secondary px-3.5 py-2 text-xs"
        >
          <ArrowLeftIcon size={15} />
          <span>Back to Product Check</span>
        </button>

        <button
          type="button"
          onClick={() => navigateTo('summary')}
          className="budol-btn-primary px-4 py-2 text-xs"
        >
          <span>View Final Summary</span>
          <ArrowRightIcon size={15} />
        </button>
      </div>

      <div className="budol-card bg-sky p-5">
        <h1 className="font-editorial text-2xl font-bold text-ink md:text-3xl">
          Compare to Buy
        </h1>
        <p className="mt-1 text-sm font-normal text-ink-muted">
          Side-by-side price comparison for{' '}
          <strong className="font-semibold text-ink">
            {activeCheck.productTitle}
          </strong>{' '}
          (Current listing:{' '}
          <span className="font-bold tabular-nums text-flag">
            {formatCurrency(activeCheck.listedPricePhp)}
          </span>{' '}
          on {activeCheck.platformName})
        </p>
      </div>

      <div className="budol-card bg-white p-5">
        <h2 className="font-editorial text-lg font-bold text-ink">Price Comparison</h2>
        <p className="mt-0.5 text-xs text-ink-muted">
          Each bar is scaled to the current listing price.
        </p>
        <div className="mt-4 space-y-3">
          {[
            {
              key: 'current',
              label: `${activeCheck.platformName} (this listing)`,
              price: activeCheck.listedPricePhp,
              tone: 'bg-flag',
            },
            ...activeCheck.comparisons.map((cmp) => ({
              key: cmp.id,
              label: cmp.platformName,
              price: cmp.pricePhp,
              tone: cmp.isBestPrice ? 'bg-verified' : 'bg-sage',
            })),
          ].map((row) => {
            const pct = Math.max(
              3,
              Math.round((row.price / Math.max(activeCheck.listedPricePhp, 1)) * 100)
            );
            return (
              <div key={row.key}>
                <div className="flex items-center justify-between text-xs font-semibold text-ink">
                  <span>{row.label}</span>
                  <span className="tabular-nums">{formatCurrency(row.price)}</span>
                </div>
                <div className="mt-1 h-3 w-full overflow-hidden rounded-full border-[1.5px] border-ink bg-cream">
                  <div
                    className={`h-full rounded-full ${row.tone}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Stagger className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {activeCheck.comparisons.map((cmp) => {
          const savingsPhp = Math.max(0, activeCheck.listedPricePhp - cmp.pricePhp);
          return (
            <StaggerItem key={cmp.id} className="h-full">
            <div
              className={`budol-card flex h-full flex-col justify-between p-5 ${
                cmp.isBestPrice
                  ? 'bg-mint md:-translate-y-2 md:shadow-brutal-lg'
                  : 'bg-white'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <PlatformBadgeSvg platform={cmp.platformName} />
                  {cmp.isBestPrice && (
                    <span className="sticker bg-verified text-white">
                      Best Value
                    </span>
                  )}
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border-[1.5px] border-ink bg-cream shadow-crisp">
                    <ProductIllustrationSvg
                      variant={activeCheck.illustrationKey}
                      size={50}
                    />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-ink">
                      {cmp.productTitle}
                    </h2>
                    <div className="mt-1 flex items-center gap-1 text-xs font-semibold tabular-nums text-ink">
                      <StarIcon size={13} filled />
                      <span>{cmp.starRating} / 5</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border-[1.5px] border-ink bg-cream p-3.5 shadow-crisp">
                  <span className="text-xs font-medium text-ink-muted">
                    Platform Price
                  </span>
                  <p className="text-2xl font-bold tabular-nums text-forest">
                    {formatCurrency(cmp.pricePhp)}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-verified">
                    {cmp.shippingPerk}
                  </p>
                  {savingsPhp > 0 && (
                    <p className="mt-1 text-xs font-semibold tabular-nums text-flag">
                      Save {formatCurrency(savingsPhp)} vs. current listing
                    </p>
                  )}
                </div>
              </div>

              <a
                href={buildShopSearchUrl(cmp.platformName, cmp.productTitle)}
                target="_blank"
                rel="noopener noreferrer"
                className="budol-btn-primary mt-4 w-full text-xs"
              >
                <span>Open on {cmp.platformName}</span>
                <ArrowRightIcon size={15} />
              </a>
            </div>
            </StaggerItem>
          );
        })}
      </Stagger>
    </div>
  );
};
