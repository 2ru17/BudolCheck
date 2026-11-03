import React, { useState } from 'react';
import { useBudolStore } from '../store/useBudolStore.ts';
import { AnimatedCheckCircle } from '../components/visuals/AnimeCheckmark.tsx';
import {
  AlertIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  BookIcon,
  HeartIcon,
  PlatformBadgeSvg,
  ProductIllustrationSvg,
  SearchIcon,
  ShieldIcon,
} from '../components/icons/SvgIcons.tsx';
import { formatCurrency } from '../lib/formatters.ts';
import { ShoppingBagMascotSvg } from '../components/icons/SvgIcons.tsx';

const highlightMatch = (text: string, query: string): React.ReactNode => {
  const q = query.trim();
  if (!q) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded bg-gold/60 px-0.5 text-ink">
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  );
};

const EmptyState: React.FC<{ title: string; body: string }> = ({ title, body }) => (
  <div className="flex flex-col items-center rounded-xl border-[1.5px] border-dashed border-ink/40 bg-cream px-4 py-6 text-center">
    <ShoppingBagMascotSvg size={56} />
    <p className="font-editorial mt-2 text-base font-bold text-ink">{title}</p>
    <p className="mt-0.5 text-xs text-ink-muted">{body}</p>
  </div>
);

export const TipsAndGuidesView: React.FC = () => {
  const tipsList = useBudolStore((s) => s.tipsList);
  const navigateTo = useBudolStore((s) => s.navigateTo);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    'All',
    'Product Check',
    'Seller Check',
    'Review Check',
    'Marketing & Ads',
  ];

  const filteredTips = tipsList.filter((tip) => {
    const matchesCategory =
      selectedCategory === 'All' || tip.category === selectedCategory;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      tip.title.toLowerCase().includes(q) ||
      tip.summary.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

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

      <div className="budol-card bg-white p-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="sticker bg-cream text-forest">
              <BookIcon size={14} />
              <span>Smart Buyer Knowledge Base</span>
            </div>
            <h1 className="font-editorial mt-2.5 text-2xl font-bold text-ink">
              Tips and Guides
            </h1>
            <p className="mt-0.5 text-sm font-normal text-ink-muted">
              Practical checklists to verify online listings before you check out
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <SearchIcon
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search buyer guides..."
              aria-label="Search buyer guides"
              className="min-h-[40px] w-full rounded-full border-[1.5px] border-ink bg-cream py-2 pl-9 pr-3 text-xs font-medium text-ink focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {categories.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`sticker min-h-[40px] px-4 py-1.5 transition-all duration-150 ${
                  active
                    ? 'bg-forest text-white'
                    : 'bg-cream text-ink hover:bg-peach'
                }`}
              >
                {cat === 'All' ? 'All Guides' : cat}
              </button>
            );
          })}
        </div>
      </div>

      {filteredTips.length === 0 && (
        <EmptyState
          title="No guides match your search"
          body="Try a different keyword or switch back to All Guides."
        />
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {filteredTips.map((tip) => (
          <div
            key={tip.id}
            className={`budol-card flex flex-col justify-between p-5 ${
              tip.category === 'Product Check'
                ? 'bg-mint'
                : tip.category === 'Seller Check'
                ? 'bg-sky'
                : tip.category === 'Review Check'
                ? 'bg-butter'
                : 'bg-blush'
            }`}
          >
            <div>
              <span className="sticker bg-white text-ink">
                {tip.category}
              </span>
              <h2 className="font-editorial mt-3 text-lg font-bold text-ink">
                {highlightMatch(tip.title, searchQuery)}
              </h2>
              <p className="mt-1 text-xs font-normal text-ink-muted">
                {highlightMatch(tip.summary, searchQuery)}
              </p>

              <ul className="mt-4 space-y-2.5 border-t border-ink/15 pt-3.5">
                {tip.steps.map((step, i) => (
                  <li
                    key={step}
                    className="flex items-start gap-3 rounded-xl border-[1.5px] border-ink bg-white p-3 text-xs font-normal leading-relaxed text-ink shadow-crisp"
                  >
                    <span className="mt-0.5 inline-flex shrink-0 items-center justify-center rounded-md border border-ink bg-butter px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider tabular-nums text-ink">
                      Step 0{i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const COOLING_OFF_HOURS = 24;

export const SavedChecksView: React.FC = () => {
  const savedCheckIds = useBudolStore((s) => s.savedCheckIds);
  const savedAt = useBudolStore((s) => s.savedAt);
  const historyChecks = useBudolStore((s) => s.historyChecks);
  const loadProductCheck = useBudolStore((s) => s.loadProductCheck);
  const navigateTo = useBudolStore((s) => s.navigateTo);
  const toggleSavedCheck = useBudolStore((s) => s.toggleSavedCheck);

  const savedItems = historyChecks.filter((item) =>
    savedCheckIds.includes(item.id)
  );
  const now = Date.now();

  return (
    <div className="space-y-5">
      <div className="budol-card bg-butter p-5">
        <span className="section-label">Cooling-off rule</span>
        <h1 className="font-editorial mt-1 text-2xl font-bold text-ink">
          Saved Product Checks ({savedItems.length})
        </h1>
        <p className="mt-1 max-w-2xl text-pretty text-sm font-medium text-ink">
          Wait 24 hours before buying. Most impulse budols lose their appeal overnight, and your saved report will still be here.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {savedItems.length === 0 && (
          <div className="md:col-span-2">
            <EmptyState
              title="Nothing saved yet"
              body="Tap Save on any product to keep it here."
            />
          </div>
        )}
        {savedItems.map((item) => {
          const savedTime = savedAt[item.id] ?? now;
          const hoursLeft = Math.max(
            0,
            Math.ceil(COOLING_OFF_HOURS - (now - savedTime) / 3_600_000)
          );
          const ready = hoursLeft === 0;
          return (
            <div key={item.id} className="budol-card flex flex-col gap-3 bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border-[1.5px] border-ink bg-peach shadow-crisp">
                  {item.uploadedImageUrl ? (
                    <img
                      src={item.uploadedImageUrl}
                      alt={item.productTitle}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ProductIllustrationSvg variant={item.illustrationKey} size={48} />
                  )}
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-semibold text-ink">
                    {item.productTitle}
                  </h2>
                  <p className="text-xs font-semibold tabular-nums text-flag">
                    {formatCurrency(item.listedPricePhp)} ({item.platformName})
                  </p>
                  <span
                    className={`sticker mt-1 tabular-nums ${
                      ready ? 'bg-mint text-verified' : 'bg-butter text-caution'
                    }`}
                  >
                    {ready ? 'Ready to decide' : `Decide in ${hoursLeft}h`}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => toggleSavedCheck(item.id)}
                  aria-label={`Remove ${item.productTitle} from saved`}
                  className="flex h-11 w-11 items-center justify-center rounded-full border-[1.5px] border-ink bg-white shadow-crisp"
                >
                  <HeartIcon size={15} filled />
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await loadProductCheck(item.id);
                    navigateTo('product', 'overview');
                  }}
                  className="budol-btn-primary text-xs"
                >
                  <span>Reopen report</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const ProfileAndRolesView: React.FC = () => {
  const userName = useBudolStore((s) => s.userName);
  const userEmail = useBudolStore((s) => s.userEmail);
  const connectedShop = useBudolStore((s) => s.connectedShop);
  const savedCheckIds = useBudolStore((s) => s.savedCheckIds);
  const historyChecks = useBudolStore((s) => s.historyChecks);

  const loadProductCheck = useBudolStore((s) => s.loadProductCheck);
  const navigateTo = useBudolStore((s) => s.navigateTo);

  const savedItems = historyChecks.filter((item) =>
    savedCheckIds.includes(item.id)
  );

  return (
    <div className="space-y-5">
      <div className="budol-card p-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-[1.5px] border-ink bg-forest font-editorial text-2xl font-bold text-white shadow-crisp">
              {userName.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <h1 className="font-editorial text-2xl font-bold text-ink">
                {userName}
              </h1>
              <p className="text-xs font-normal text-ink-muted">{userEmail}</p>
              <span className="sticker mt-1 bg-mint text-verified">
                {connectedShop}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => navigateTo('auth')}
              className="budol-btn-secondary px-3.5 py-2 text-xs"
            >
              <span>Switch Account</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="budol-card flex flex-col justify-between p-5">
          <div>
            <h2 className="font-editorial text-lg font-bold text-ink">
              Saved Product Checks ({savedItems.length})
            </h2>
            <p className="mt-1 text-sm font-normal text-ink-muted">
              Items you saved wait out a 24 hour cooling-off period before you decide.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigateTo('saved')}
            className="budol-btn-primary mt-4 self-start text-xs"
          >
            <span>Open Saved List</span>
          </button>
        </div>

        <div className="budol-card p-5">
          <h2 className="font-editorial text-lg font-bold text-ink">
            Recent Verification History ({historyChecks.length})
          </h2>
          <div className="mt-3 space-y-2.5">
            {historyChecks.length === 0 && (
              <EmptyState
                title="No checks yet"
                body="Paste a product link on Home to run your first check."
              />
            )}
            {historyChecks.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-xl border-[1.5px] border-ink bg-cream p-3 shadow-crisp"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <PlatformBadgeSvg platform={item.platformName} />
                    <span className="text-sm font-semibold text-ink">
                      {item.productTitle}
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-normal text-ink-muted">
                    {item.redFlags.riskLabel}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    await loadProductCheck(item.id);
                    navigateTo('product', 'overview');
                  }}
                  className="budol-btn-secondary px-3.5 py-1.5 text-xs"
                >
                  <span>Inspect</span>
                  <ArrowRightIcon size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const SellerDashboardView: React.FC = () => {
  const activeCheck = useBudolStore((s) => s.activeCheck);
  const navigateTo = useBudolStore((s) => s.navigateTo);
  const showToast = useBudolStore((s) => s.showToast);
  const [thicknessValue, setThicknessValue] = useState('4.5mm Food-Grade Silicone');
  const [specUpdated, setSpecUpdated] = useState(false);

  return (
    <div className="space-y-5">
      <div className="budol-card p-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <span className="sticker bg-mint text-forest">
              <ShieldIcon size={14} />
              <span>Seller Self-Audit Portal</span>
            </span>
            <h1 className="font-editorial mt-2 text-2xl font-bold text-ink">
              {activeCheck.seller.storeName}
            </h1>
            <p className="text-xs font-normal text-ink-muted">
              Permit: {activeCheck.seller.certificateId} | Location:{' '}
              {activeCheck.seller.storeLocation}
            </p>
          </div>

          <div className="rounded-2xl border-[1.5px] border-ink bg-cream px-5 py-3 text-right shadow-crisp">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
              Transparency Score
            </span>
            <p className="text-2xl font-bold tabular-nums text-verified">
              {specUpdated ? '99 / 100' : '96 / 100'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <div className="budol-card p-5">
            <h2 className="font-editorial text-lg font-bold text-ink">
              4-Criterion Store Compliance
            </h2>
            <div className="mt-4 space-y-3">
              {[
                {
                  title: 'Verified Business Permit',
                  detail: activeCheck.seller.certificateId,
                  passed: true,
                },
                {
                  title: 'Customer Rating Above 4.5 Stars',
                  detail: `${activeCheck.seller.rating} / 5 (${activeCheck.seller.reviewCountText})`,
                  passed: true,
                },
                {
                  title: 'Complete Specification Attributes',
                  detail: specUpdated
                    ? 'Material, Pattern, Quantity, and 4.5mm Thickness verified'
                    : 'Missing exact millimeter (mm) thickness attribute',
                  passed: specUpdated,
                },
                {
                  title: '7-Day Easy Return Guarantee',
                  detail: 'Active return protection enabled',
                  passed: true,
                },
              ].map((item, idx) => (
                <div
                  key={item.title}
                  className="flex items-center justify-between rounded-xl border-[1.5px] border-ink bg-cream p-3.5 shadow-crisp"
                >
                  <div className="flex items-center gap-3">
                    <AnimatedCheckCircle passed={item.passed} delayMs={idx * 80} />
                    <div>
                      <h3 className="text-sm font-semibold text-ink">
                        {item.title}
                      </h3>
                      <p className="text-xs text-ink-muted">{item.detail}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-6">
          <div className="budol-card p-5">
            <h2 className="font-editorial text-lg font-bold text-ink">
              Listing Spec Completeness Auditor
            </h2>
            <p className="mt-1 text-xs text-ink-muted">
              Resolve buyer questions by publishing missing dimension and dispatch
              details on <strong className="font-semibold text-ink">{activeCheck.productTitle}</strong>.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label
                  htmlFor="spec-thickness-input"
                  className="mb-1 block text-xs font-semibold text-ink"
                >
                  Exact Thickness & Diameter Attribute
                </label>
                <input
                  id="spec-thickness-input"
                  type="text"
                  value={thicknessValue}
                  onChange={(e) => setThicknessValue(e.target.value)}
                  className="min-h-[42px] w-full rounded-xl border-[1.5px] border-ink bg-cream px-3.5 py-2 text-sm font-medium text-ink focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSpecUpdated(true);
                    showToast('Published updated thickness spec to SellerCheck index');
                  }}
                  className="budol-btn-primary text-xs"
                >
                  <span>Publish Verified Spec</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigateTo('seller')}
                  className="budol-btn-secondary text-xs"
                >
                  <span>Preview Buyer SellerCheck</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const AdminDashboardView: React.FC = () => {
  const adminQueue = useBudolStore((s) => s.adminQueue);
  const updateAdminQueueStatus = useBudolStore((s) => s.updateAdminQueueStatus);

  return (
    <div className="space-y-5">
      <div className="budol-card bg-blush p-5">
        <span className="sticker bg-flag text-white">
          <AlertIcon size={14} />
          <span>Trust & Safety Moderation Console</span>
        </span>
        <h1 className="font-editorial mt-2 text-2xl font-bold text-ink">
          Community Scam Alert & Price Anomaly Queue
        </h1>
        <p className="mt-0.5 text-sm font-normal text-ink-muted">
          Review high-markup listings and counterfeit product reports submitted by
          BudolCheck shoppers.
        </p>
      </div>

      <div className="space-y-3.5">
        {adminQueue.map((item) => (
          <div
            key={item.id}
            className="budol-card flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center"
          >
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="sticker bg-cream text-ink">
                  {item.platform}
                </span>
                <span className="sticker bg-blush tabular-nums text-flag">
                  {item.reportsCount} Buyer Reports
                </span>
                <span className="sticker bg-white uppercase text-ink-muted">
                  Status: {item.status}
                </span>
              </div>

              <h2 className="font-editorial mt-2 text-base font-bold text-ink">
                {item.productTitle}
              </h2>
              <p className="mt-0.5 text-xs font-normal text-ink-muted">
                Reason: {item.flagReason} | Anomaly:{' '}
                <strong className="font-semibold tabular-nums text-ink">
                  {item.priceAnomaly}
                </strong>
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => updateAdminQueueStatus(item.id, 'flagged')}
                className="budol-btn-primary px-3.5 py-2 text-xs"
              >
                Confirm Flag
              </button>
              <button
                type="button"
                onClick={() => updateAdminQueueStatus(item.id, 'dismissed')}
                className="budol-btn-secondary px-3.5 py-2 text-xs"
              >
                Dismiss
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
