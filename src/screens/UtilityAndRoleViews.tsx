import React, { useEffect, useState } from 'react';
import { useDebouncedValue } from '@mantine/hooks';
import {
  AdminConsoleTabId,
  SellerPortalTabId,
  useBudolStore,
} from '../store/useBudolStore.ts';
import {
  AlertIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  BookIcon,
  CheckIcon,
  ChecklistIcon,
  EditIcon,
  ExternalLinkIcon,
  HeartIcon,
  LogOutIcon,
  PlatformBadgeSvg,
  ProductIllustrationSvg,
  SearchIcon,
  ShieldIcon,
  ShoppingBagMascotSvg,
  StarIcon,
  UserIcon,
} from '../components/icons/SvgIcons.tsx';
import {
  buildShopSearchUrl,
  formatCurrency,
  resolveListingExternalUrl,
} from '../lib/formatters.ts';
import { resolveCleanProductImageUrl } from '../lib/productContent.ts';
import {
  createSellerProductOnServer,
  deleteSellerProductOnServer,
  fetchAdminOverview,
  fetchSellerDashboard,
  fetchSystemHealthTelemetry,
  patchAdminUserRole,
  patchSellerProductOnServer,
  patchSellerProfileOnServer,
  publishSellerSpecAuditOnServer,
  SystemHealthTelemetry,
} from '../lib/apiClient.ts';
import {
  ADMIN_ACTIVITIES_PRESETS,
  ADMIN_USERS_PRESETS,
  SELLER_PRODUCTS_PRESETS,
  SELLER_PROFILE_PRESET,
} from '../data/presets.ts';
import {
  AdminActivityItem,
  AdminReportStatus,
  AdminUserRecord,
  IllustrationKey,
  SellerProductItem,
  SellerShopProfile,
} from '../types/budol.ts';

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

const SafeProductThumbnail: React.FC<{
  rawUrl?: string;
  title: string;
  illustrationKey?: IllustrationKey;
}> = ({ rawUrl, title, illustrationKey = 'bag' }) => {
  const [imgFailed, setImgFailed] = useState(false);
  const resolved = resolveCleanProductImageUrl(rawUrl, title, 0);
  if (!resolved || imgFailed) {
    return <ProductIllustrationSvg variant={illustrationKey} size={52} />;
  }
  return (
    <img
      src={resolved}
      alt={title}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setImgFailed(true)}
      className="h-full w-full object-contain p-1"
    />
  );
};

export const TipsAndGuidesView: React.FC = () => {
  const tipsList = useBudolStore((s) => s.tipsList);
  const navigateTo = useBudolStore((s) => s.navigateTo);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery] = useDebouncedValue(searchQuery, 300);

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
    const q = debouncedSearchQuery.trim().toLowerCase();
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
              body="Tap Save on any product report to start a 24-hour cooling-off timer here."
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
          const listingHref = resolveListingExternalUrl(
            item.sourceUrl,
            item.platformName,
            item.productTitle
          );

          return (
            <div key={item.id} className="budol-card flex flex-col justify-between gap-3 bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border-[1.5px] border-ink bg-white shadow-crisp">
                  {resolveCleanProductImageUrl(
                    item.uploadedImageUrl || item.imageUrls?.[0],
                    item.productTitle,
                    0
                  ) ? (
                    <img
                      src={resolveCleanProductImageUrl(
                        item.uploadedImageUrl || item.imageUrls?.[0],
                        item.productTitle,
                        0
                      )}
                      alt={item.productTitle}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-contain p-1"
                    />
                  ) : (
                    <ProductIllustrationSvg variant={item.illustrationKey} size={48} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <PlatformBadgeSvg platform={item.platformName} />
                    <span
                      className={`sticker tabular-nums ${
                        ready ? 'bg-mint text-verified' : 'bg-butter text-caution'
                      }`}
                    >
                      {ready ? 'Ready to decide' : `Decide in ${hoursLeft}h`}
                    </span>
                  </div>
                  <h2 className="mt-1 truncate text-sm font-semibold text-ink">
                    {item.productTitle}
                  </h2>
                  <p className="text-xs font-semibold tabular-nums text-flag">
                    {formatCurrency(item.listedPricePhp)} • {item.seller.storeName}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-ink/15 pt-2.5">
                <button
                  type="button"
                  onClick={() => toggleSavedCheck(item.id)}
                  aria-label={`Remove ${item.productTitle} from saved`}
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border-[1.5px] border-ink bg-white px-3 text-xs font-semibold text-ink shadow-crisp hover:bg-blush/40"
                >
                  <HeartIcon size={14} filled />
                  <span>Remove</span>
                </button>
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={listingHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="budol-btn-secondary !min-h-[40px] !px-3 text-xs"
                  >
                    <span>Visit Store</span>
                    <ExternalLinkIcon size={13} />
                  </a>
                  <button
                    type="button"
                    onClick={async () => {
                      await loadProductCheck(item.id);
                      navigateTo('product', 'overview');
                    }}
                    className="budol-btn-primary !min-h-[40px] !px-3.5 text-xs"
                  >
                    <span>Reopen Report</span>
                    <ArrowRightIcon size={13} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ILLUSTRATION_OPTIONS: Array<{ key: IllustrationKey; label: string }> = [
  { key: 'shoes', label: 'Footwear / Sneakers' },
  { key: 'bag', label: 'Bags / Totes' },
  { key: 'phonecase', label: 'Phone Cases & Tech' },
  { key: 'earbuds', label: 'Audio / Earbuds' },
  { key: 'watch', label: 'Smartwatches' },
  { key: 'mouse', label: 'Computer Peripherals' },
  { key: 'serum', label: 'Skincare & Beauty' },
  { key: 'dress', label: 'Apparel & Fashion' },
  { key: 'umbrella', label: 'Umbrellas & Outdoor' },
  { key: 'massager', label: 'Wellness & Massagers' },
];

export const ProfileAndRolesView: React.FC = () => {
  const isAuthenticated = useBudolStore((s) => s.isAuthenticated);
  const authUser = useBudolStore((s) => s.authUser);
  const authLoading = useBudolStore((s) => s.authLoading);
  const userName = useBudolStore((s) => s.userName);
  const userEmail = useBudolStore((s) => s.userEmail);
  const connectedShop = useBudolStore((s) => s.connectedShop);
  const savedCheckIds = useBudolStore((s) => s.savedCheckIds);
  const savedAt = useBudolStore((s) => s.savedAt);
  const historyChecks = useBudolStore((s) => s.historyChecks);
  const adminQueue = useBudolStore((s) => s.adminQueue);

  const loadProductCheck = useBudolStore((s) => s.loadProductCheck);
  const navigateTo = useBudolStore((s) => s.navigateTo);
  const logout = useBudolStore((s) => s.logout);
  const connectShop = useBudolStore((s) => s.connectShop);
  const updateUserProfile = useBudolStore((s) => s.updateUserProfile);
  const changePassword = useBudolStore((s) => s.changePassword);
  const toggleSavedCheck = useBudolStore((s) => s.toggleSavedCheck);
  const submitReportToAdminQueue = useBudolStore((s) => s.submitReportToAdminQueue);

  const [activeTab, setActiveTab] = useState<'overview' | 'saved' | 'reports' | 'settings'>('overview');
  const [nameInput, setNameInput] = useState(userName);
  const [emailInput, setEmailInput] = useState(userEmail);
  const [shopInput, setShopInput] = useState(connectedShop);
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [reportCategory, setReportCategory] = useState<'report' | 'complaint'>('report');
  const [reportTitle, setReportTitle] = useState('');
  const [reportUrl, setReportUrl] = useState('');
  const [reportPlatform, setReportPlatform] = useState<'Shopee' | 'Lazada' | 'Temu'>('Shopee');
  const [reportReason, setReportReason] = useState('');
  const [reportAnomaly, setReportAnomaly] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  useEffect(() => {
    setNameInput(userName);
    setEmailInput(userEmail);
    setShopInput(connectedShop);
  }, [userName, userEmail, connectedShop]);

  const savedItems = historyChecks.filter((item) =>
    savedCheckIds.includes(item.id)
  );

  const highRiskAvoidedCount = historyChecks.filter(
    (c) => c.redFlags.riskScore >= 45
  ).length;

  const estimatedSavingsPhp = historyChecks.reduce((sum, item) => {
    const cheapest = item.comparisons.reduce(
      (min, cmp) => Math.min(min, cmp.pricePhp),
      item.listedPricePhp
    );
    return sum + Math.max(0, item.listedPricePhp - cheapest);
  }, 0);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateUserProfile(nameInput, emailInput, shopInput);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentPasswordInput.length < 4 || newPasswordInput.length < 6) {
      setPasswordError(
        'Enter your current password and a new password of at least 6 characters.'
      );
      return;
    }
    setPasswordError(null);
    try {
      await changePassword(currentPasswordInput, newPasswordInput);
      setCurrentPasswordInput('');
      setNewPasswordInput('');
    } catch (err) {
      setPasswordError(
        err instanceof Error ? err.message : 'Unable to update password.'
      );
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reportTitle.trim().length < 2 || reportReason.trim().length < 3) return;
    setSubmittingReport(true);
    try {
      await submitReportToAdminQueue({
        productTitle: reportTitle.trim(),
        subtitle: reportReason.trim(),
        platform: reportPlatform,
        flagReason: reportReason.trim(),
        reportCategory,
        priceAnomaly:
          reportAnomaly.trim() ||
          (reportCategory === 'complaint'
            ? 'Buyer Order / Delivery Complaint'
            : 'Shopper Flagged Listing'),
        sourceUrl: reportUrl.trim() || undefined,
      });
      setReportTitle('');
      setReportUrl('');
      setReportReason('');
      setReportAnomaly('');
    } finally {
      setSubmittingReport(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="budol-card bg-white p-5">
        {isAuthenticated && authUser ? (
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-[1.5px] border-ink bg-forest font-editorial text-2xl font-bold text-white shadow-crisp">
                {authUser.fullName.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-editorial text-2xl font-bold text-ink">
                    {authUser.fullName}
                  </h1>
                  <span className="sticker bg-butter capitalize text-ink">
                    {authUser.role === 'user' ? 'Verified Shopper' : authUser.role}
                  </span>
                </div>
                <p className="text-xs font-normal text-ink-muted">{authUser.email}</p>
                <span className="sticker mt-1 bg-mint text-verified">
                  {authUser.connectedShop}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {authUser.role === 'seller' && (
                <button
                  type="button"
                  onClick={() => navigateTo('seller-dash')}
                  className="budol-btn-primary px-3.5 py-2 text-xs"
                >
                  <ShieldIcon size={14} />
                  <span>Open Seller Portal</span>
                </button>
              )}
              {authUser.role === 'admin' && (
                <button
                  type="button"
                  onClick={() => navigateTo('admin-dash')}
                  className="budol-btn-primary px-3.5 py-2 text-xs"
                >
                  <ShieldIcon size={14} />
                  <span>Open Admin Console</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => navigateTo('home')}
                className="budol-btn-secondary px-3.5 py-2 text-xs"
              >
                <SearchIcon size={14} />
                <span>6-Point Inspector</span>
              </button>
              <button
                type="button"
                disabled={authLoading}
                onClick={() => void logout()}
                className="budol-btn-secondary px-3.5 py-2 text-xs"
              >
                <LogOutIcon size={14} />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-[1.5px] border-ink bg-peach font-editorial text-2xl font-bold text-ink shadow-crisp">
                <UserIcon size={26} />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-editorial text-2xl font-bold text-ink">
                    Guest Shopper Session
                  </h1>
                  <span className="sticker bg-cream text-ink-muted">Not Signed In</span>
                </div>
                <p className="mt-1 text-xs font-normal text-ink-muted">
                  Sign in or create a BudolCheck account to sync your 24-hour cooling-off items, submit scam reports, or manage a Seller storefront.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => navigateTo('auth')}
                className="budol-btn-primary px-4 py-2.5 text-xs"
              >
                <UserIcon size={14} />
                <span>Log In / Create Account</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <div
        role="tablist"
        aria-label="Shopper account sections"
        className="grid grid-cols-2 gap-2 rounded-2xl border-[1.5px] border-ink bg-white p-2 shadow-crisp sm:grid-cols-4"
      >
        {[
          { id: 'overview', label: 'Overview & History' },
          { id: 'saved', label: `Cooling-Off (${savedItems.length})` },
          { id: 'reports', label: 'Report a Listing / Issue' },
          { id: 'settings', label: 'Account Settings' },
        ].map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`min-h-[42px] rounded-xl px-3 py-2 text-xs font-bold transition-colors ${
                active
                  ? 'border-[1.5px] border-ink bg-[#D7E6D0] text-ink shadow-crisp'
                  : 'text-ink-muted hover:bg-cream hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
            <div className="budol-card bg-mint p-4">
              <span className="section-label">Verified Checks</span>
              <p className="font-editorial mt-1 text-3xl font-bold tabular-nums text-ink">
                {historyChecks.length}
              </p>
              <p className="mt-0.5 text-xs text-ink-muted">
                Shopee, Lazada &amp; Temu reports
              </p>
            </div>
            <div className="budol-card bg-butter p-4">
              <span className="section-label">24h Cooling-Off</span>
              <p className="font-editorial mt-1 text-3xl font-bold tabular-nums text-ink">
                {savedItems.length}
              </p>
              <p className="mt-0.5 text-xs text-ink-muted">
                Saved for impulse protection
              </p>
            </div>
            <div className="budol-card bg-sky p-4">
              <span className="section-label">Cross-Store Savings</span>
              <p className="font-editorial mt-1 text-3xl font-bold tabular-nums text-verified">
                {formatCurrency(Math.max(estimatedSavingsPhp, 420))}
              </p>
              <p className="mt-0.5 text-xs text-ink-muted">
                Found via Compare to Buy
              </p>
            </div>
            <div className="budol-card bg-blush p-4">
              <span className="section-label">Risk Alerts Flagged</span>
              <p className="font-editorial mt-1 text-3xl font-bold tabular-nums text-flag">
                {highRiskAvoidedCount}
              </p>
              <p className="mt-0.5 text-xs text-ink-muted">
                Spec or promo contradictions
              </p>
            </div>
          </div>

          <div className="budol-card bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/15 pb-3">
              <div>
                <h2 className="font-editorial text-xl font-bold text-ink">
                  Recent Verification History ({historyChecks.length})
                </h2>
                <p className="text-xs text-ink-muted">
                  Reopen any 6-point verification report or jump directly to the live store listing.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigateTo('home')}
                className="budol-btn-primary !min-h-[40px] px-3.5 text-xs"
              >
                <SearchIcon size={14} />
                <span>Check Another Product</span>
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              {historyChecks.map((item) => {
                const listingHref = resolveListingExternalUrl(
                  item.sourceUrl,
                  item.platformName,
                  item.productTitle
                );

                return (
                  <div
                    key={item.id}
                    className="flex flex-col justify-between gap-3 rounded-2xl border-[1.5px] border-ink bg-cream p-3.5 shadow-crisp"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border-[1.5px] border-ink bg-white">
                        {resolveCleanProductImageUrl(
                          item.uploadedImageUrl || item.imageUrls?.[0],
                          item.productTitle,
                          0
                        ) ? (
                          <img
                            src={resolveCleanProductImageUrl(
                              item.uploadedImageUrl || item.imageUrls?.[0],
                              item.productTitle,
                              0
                            )}
                            alt={item.productTitle}
                            loading="lazy"
                            decoding="async"
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-contain p-1"
                          />
                        ) : (
                          <ProductIllustrationSvg variant={item.illustrationKey} size={44} />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <PlatformBadgeSvg platform={item.platformName} />
                          <span className="sticker bg-white text-[10px] text-ink">
                            {item.redFlags.riskLabel}
                          </span>
                        </div>
                        <p className="mt-1 line-clamp-1 text-sm font-bold text-ink">
                          {item.productTitle}
                        </p>
                        <p className="text-xs font-semibold tabular-nums text-flag">
                          {formatCurrency(item.listedPricePhp)} • {item.seller.storeName}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-ink/10 pt-2.5">
                      <a
                        href={listingHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="budol-btn-secondary !min-h-[38px] !px-3 text-xs"
                      >
                        <span>Visit Store on {item.platformName}</span>
                        <ExternalLinkIcon size={12} />
                      </a>
                      <button
                        type="button"
                        onClick={async () => {
                          await loadProductCheck(item.id);
                          navigateTo('product', 'overview');
                        }}
                        className="budol-btn-primary !min-h-[38px] !px-3.5 text-xs"
                      >
                        <span>Open 6-Point Report</span>
                        <ArrowRightIcon size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'saved' && (
        <div className="budol-card bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/15 pb-3">
            <div>
              <h2 className="font-editorial text-xl font-bold text-ink">
                Saved Cooling-Off Watchlist ({savedItems.length})
              </h2>
              <p className="text-xs text-ink-muted">
                Wait 24 hours before checking out so flash-sale urgency wears off.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigateTo('saved')}
              className="budol-btn-secondary !min-h-[38px] px-3 text-xs"
            >
              <span>Full Saved View</span>
              <ArrowRightIcon size={13} />
            </button>
          </div>

          {savedItems.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                title="No saved items in your cooling-off list"
                body="Tap Save Check on any product report to start a 24-hour cooling-off timer."
              />
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-3.5 md:grid-cols-2">
              {savedItems.map((item) => {
                const savedTime = savedAt[item.id] ?? Date.now();
                const hoursLeft = Math.max(
                  0,
                  Math.ceil(COOLING_OFF_HOURS - (Date.now() - savedTime) / 3_600_000)
                );
                const listingHref = resolveListingExternalUrl(
                  item.sourceUrl,
                  item.platformName,
                  item.productTitle
                );

                return (
                  <div
                    key={item.id}
                    className="flex flex-col justify-between gap-3 rounded-2xl border-[1.5px] border-ink bg-cream p-4 shadow-crisp"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <PlatformBadgeSvg platform={item.platformName} />
                      <span
                        className={`sticker tabular-nums ${
                          hoursLeft === 0 ? 'bg-mint text-verified' : 'bg-butter text-caution'
                        }`}
                      >
                        {hoursLeft === 0 ? 'Ready to decide' : `Cooling off: ${hoursLeft}h left`}
                      </span>
                    </div>
                    <div>
                      <p className="font-bold text-ink">{item.productTitle}</p>
                      <p className="mt-0.5 text-sm font-bold tabular-nums text-flag">
                        {formatCurrency(item.listedPricePhp)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-ink/10 pt-2.5">
                      <button
                        type="button"
                        onClick={() => toggleSavedCheck(item.id)}
                        className="text-xs font-semibold text-flag underline"
                      >
                        Remove
                      </button>
                      <div className="flex items-center gap-2">
                        <a
                          href={listingHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="budol-btn-secondary !min-h-[38px] !px-3 text-xs"
                        >
                          <span>Visit Store</span>
                          <ExternalLinkIcon size={12} />
                        </a>
                        <button
                          type="button"
                          onClick={async () => {
                            await loadProductCheck(item.id);
                            navigateTo('product', 'overview');
                          }}
                          className="budol-btn-primary !min-h-[38px] !px-3 text-xs"
                        >
                          <span>Inspect</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="budol-card bg-white p-5 lg:col-span-6">
            <span className="sticker bg-blush text-flag">
              <AlertIcon size={13} />
              <span>Community Trust &amp; Safety</span>
            </span>
            <h2 className="font-editorial mt-2 text-xl font-bold text-ink">
              Submit a Suspicious Listing or Order Complaint
            </h2>
            <p className="mt-1 text-xs text-ink-muted">
              Reports go directly to the BudolCheck Trust &amp; Safety Moderation Queue to warn other shoppers.
            </p>

            <form onSubmit={handleReportSubmit} className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setReportCategory('report')}
                  className={`min-h-[40px] rounded-xl border-[1.5px] border-ink px-3 py-2 text-xs font-bold ${
                    reportCategory === 'report'
                      ? 'bg-forest text-white shadow-crisp'
                      : 'bg-cream text-ink'
                  }`}
                >
                  Suspicious Listing Report
                </button>
                <button
                  type="button"
                  onClick={() => setReportCategory('complaint')}
                  className={`min-h-[40px] rounded-xl border-[1.5px] border-ink px-3 py-2 text-xs font-bold ${
                    reportCategory === 'complaint'
                      ? 'bg-forest text-white shadow-crisp'
                      : 'bg-cream text-ink'
                  }`}
                >
                  Order / Delivery Complaint
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-bold text-ink">
                    Product or Store Name
                  </label>
                  <input
                    type="text"
                    required
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    placeholder="e.g., Counterfeit Powerbank 50000mAh"
                    className="min-h-[42px] w-full rounded-xl border-[1.5px] border-ink bg-cream/60 px-3 py-2 text-xs text-ink focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-ink">
                    Marketplace
                  </label>
                  <select
                    value={reportPlatform}
                    onChange={(e) =>
                      setReportPlatform(e.target.value as 'Shopee' | 'Lazada' | 'Temu')
                    }
                    className="min-h-[42px] w-full rounded-xl border-[1.5px] border-ink bg-cream/60 px-3 py-2 text-xs font-semibold text-ink focus:bg-white focus:outline-none"
                  >
                    <option value="Shopee">Shopee</option>
                    <option value="Lazada">Lazada</option>
                    <option value="Temu">Temu</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-ink">
                  Store or Product Listing Link (URL)
                </label>
                <input
                  type="url"
                  value={reportUrl}
                  onChange={(e) => setReportUrl(e.target.value)}
                  placeholder="https://shopee.ph/... or https://www.lazada.com.ph/..."
                  className="min-h-[42px] w-full rounded-xl border-[1.5px] border-ink bg-cream/60 px-3 py-2 text-xs text-ink focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-ink">
                  What red flag or issue did you encounter?
                </label>
                <textarea
                  rows={3}
                  required
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Describe fake reviews, misleading original claims, bait-and-switch variant pricing, or non-delivery..."
                  className="w-full rounded-xl border-[1.5px] border-ink bg-cream/60 p-3 text-xs text-ink focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-ink">
                  Price Anomaly / Order Reference (Optional)
                </label>
                <input
                  type="text"
                  value={reportAnomaly}
                  onChange={(e) => setReportAnomaly(e.target.value)}
                  placeholder="e.g., Listed at P199 vs P2,499 Official Mall price"
                  className="min-h-[42px] w-full rounded-xl border-[1.5px] border-ink bg-cream/60 px-3 py-2 text-xs text-ink focus:bg-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submittingReport}
                className="budol-btn-primary w-full text-xs"
              >
                <AlertIcon size={14} />
                <span>
                  {submittingReport
                    ? 'Submitting to Trust & Safety...'
                    : 'Submit to Moderation Queue'}
                </span>
              </button>
            </form>
          </div>

          <div className="budol-card bg-white p-5 lg:col-span-6">
            <h2 className="font-editorial text-xl font-bold text-ink">
              Live Community Moderation Tracker ({adminQueue.length})
            </h2>
            <p className="mt-1 text-xs text-ink-muted">
              Track the status of reported listings and buyer complaints across Shopee, Lazada, and Temu.
            </p>

            <div className="mt-4 space-y-3">
              {adminQueue.map((item) => {
                const targetUrl = resolveListingExternalUrl(
                  item.sourceUrl,
                  (item.platform as 'Shopee' | 'Lazada' | 'Temu') || 'Shopee',
                  item.productTitle
                );
                return (
                  <div
                    key={item.id}
                    className="rounded-2xl border-[1.5px] border-ink bg-cream p-3.5 shadow-crisp"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <PlatformBadgeSvg
                          platform={
                            (item.platform as 'Shopee' | 'Lazada' | 'Temu') || 'Shopee'
                          }
                        />
                        <span className="sticker bg-white text-[10px] font-bold uppercase text-ink">
                          {item.status.replace('_', ' ')}
                        </span>
                      </div>
                      <a
                        href={targetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-forest underline"
                      >
                        <span>Visit Store Listing</span>
                        <ExternalLinkIcon size={12} />
                      </a>
                    </div>
                    <p className="mt-1.5 text-sm font-bold text-ink">{item.productTitle}</p>
                    <p className="mt-0.5 text-xs text-ink-muted">
                      {item.subtitle || item.flagReason}
                    </p>
                    <p className="mt-1 text-[11px] font-semibold text-flag">
                      {item.priceAnomaly} • {item.reportedDate}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="budol-card bg-white p-5 lg:col-span-6">
            <h2 className="font-editorial text-xl font-bold text-ink">
              Profile &amp; Connected Marketplace Accounts
            </h2>
            <p className="mt-1 text-xs text-ink-muted">
              Update your display name, email address, and linked marketplace accounts.
            </p>

            <form onSubmit={handleSaveProfile} className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-ink">Full Name</label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="min-h-[42px] w-full rounded-xl border-[1.5px] border-ink bg-cream/60 px-3 py-2 text-sm text-ink focus:bg-white focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-ink">Email Address</label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="min-h-[42px] w-full rounded-xl border-[1.5px] border-ink bg-cream/60 px-3 py-2 text-sm text-ink focus:bg-white focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-ink">
                  Connected Marketplace Label
                </label>
                <input
                  type="text"
                  value={shopInput}
                  onChange={(e) => setShopInput(e.target.value)}
                  className="min-h-[42px] w-full rounded-xl border-[1.5px] border-ink bg-cream/60 px-3 py-2 text-sm text-ink focus:bg-white focus:outline-none"
                />
              </div>

              <button type="submit" className="budol-btn-primary text-xs">
                <CheckIcon size={14} />
                <span>Save Profile Changes</span>
              </button>
            </form>

            {isAuthenticated && (
              <div className="mt-5 border-t border-ink/15 pt-4">
                <p className="text-xs font-bold text-ink">
                  Link Additional Marketplace Account to Your Profile:
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(['Shopee', 'Lazada', 'Temu'] as const).map((plat) => (
                    <button
                      key={plat}
                      type="button"
                      disabled={authLoading}
                      onClick={() => void connectShop(plat)}
                      className="budol-btn-secondary !min-h-[38px] !px-3.5 text-xs"
                    >
                      <span>Link {plat}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="budol-card bg-white p-5 lg:col-span-6">
            <h2 className="font-editorial text-xl font-bold text-ink">
              Password &amp; Session Security
            </h2>
            <p className="mt-1 text-xs text-ink-muted">
              Update your account password or manage your active session.
            </p>

            {isAuthenticated ? (
              <form onSubmit={handleChangePassword} className="mt-4 space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-bold text-ink">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPasswordInput}
                    onChange={(e) => setCurrentPasswordInput(e.target.value)}
                    placeholder="Enter current password"
                    className="min-h-[42px] w-full rounded-xl border-[1.5px] border-ink bg-cream/60 px-3 py-2 text-sm text-ink focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-ink">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    placeholder="At least 6 characters"
                    className="min-h-[42px] w-full rounded-xl border-[1.5px] border-ink bg-cream/60 px-3 py-2 text-sm text-ink focus:bg-white focus:outline-none"
                  />
                </div>
                {passwordError && (
                  <p className="rounded-xl border border-flag bg-blush px-3 py-2 text-xs font-semibold text-flag">
                    {passwordError}
                  </p>
                )}
                <button type="submit" className="budol-btn-primary text-xs">
                  <ShieldIcon size={14} />
                  <span>Update Password</span>
                </button>
              </form>
            ) : (
              <div className="mt-4 rounded-2xl border-[1.5px] border-ink bg-cream p-4">
                <p className="text-xs text-ink-muted">
                  You are currently browsing as a Guest. Sign in to manage password security and persistent sessions.
                </p>
                <button
                  type="button"
                  onClick={() => navigateTo('auth')}
                  className="budol-btn-primary mt-3 text-xs"
                >
                  <span>Go to Login / Sign Up</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface SellerFeedbackItem {
  id: string;
  productTitle: string;
  platform: 'Shopee' | 'Lazada' | 'Temu';
  buyerHandle: string;
  rating: number;
  dateLabel: string;
  comment: string;
  illustrationKey: IllustrationKey;
  sellerReply?: string;
}

const INITIAL_SELLER_FEEDBACK: SellerFeedbackItem[] = [
  {
    id: 'fb_01',
    productTitle: 'Breathable Mesh Daily Running Shoes',
    platform: 'Lazada',
    buyerHandle: 'm***a',
    rating: 5,
    dateLabel: 'November 2, 2026',
    comment: 'Exact EU 42 fit and cushioned EVA sole. Fast dispatch from Quezon City warehouse!',
    illustrationKey: 'shoes',
    sellerReply: 'Thank you for verifying with BudolCheck! Glad the EU 42 sizing fit well.',
  },
  {
    id: 'fb_02',
    productTitle: 'Structured Canvas Everyday Tote Bag',
    platform: 'Shopee',
    buyerHandle: 'k***r',
    rating: 5,
    dateLabel: 'November 1, 2026',
    comment: 'Thick 16oz canvas and clean stitching. Fits my 14-inch laptop plus charger.',
    illustrationKey: 'bag',
  },
  {
    id: 'fb_03',
    productTitle: 'Shockproof MagSafe Clear Hybrid Phone Case',
    platform: 'Shopee',
    buyerHandle: 'j***s',
    rating: 4,
    dateLabel: 'October 30, 2026',
    comment: 'Strong magnet ring hold. Remember to peel both protective films on arrival.',
    illustrationKey: 'phonecase',
  },
];

export const SellerDashboardView: React.FC = () => {
  const activeCheck = useBudolStore((s) => s.activeCheck);
  const historyChecks = useBudolStore((s) => s.historyChecks);
  const sellerPortalTab = useBudolStore((s) => s.sellerPortalTab);
  const setSellerPortalTab = useBudolStore((s) => s.setSellerPortalTab);
  const navigateTo = useBudolStore((s) => s.navigateTo);
  const logout = useBudolStore((s) => s.logout);
  const showToast = useBudolStore((s) => s.showToast);
  const runLinkAnalysis = useBudolStore((s) => s.runLinkAnalysis);
  const loadProductCheck = useBudolStore((s) => s.loadProductCheck);

  const [profile, setProfile] = useState<SellerShopProfile>(SELLER_PROFILE_PRESET);
  const [products, setProducts] = useState<SellerProductItem[]>(SELLER_PRODUCTS_PRESETS);
  const [productFilter, setProductFilter] = useState<'all' | 'active' | 'pending'>('all');
  const [productSearch, setProductSearch] = useState('');
  const [debouncedProductSearch] = useDebouncedValue(productSearch, 300);

  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [prodTitleInput, setProdTitleInput] = useState('');
  const [prodPriceInput, setProdPriceInput] = useState('499');
  const [prodPlatformInput, setProdPlatformInput] = useState<'Shopee' | 'Lazada' | 'Temu'>('Shopee');
  const [prodSourceUrlInput, setProdSourceUrlInput] = useState('');
  const [prodSpecNoteInput, setProdSpecNoteInput] = useState('');
  const [prodIllustrationInput, setProdIllustrationInput] = useState<IllustrationKey>('bag');
  const [prodStatusInput, setProdStatusInput] = useState<'active' | 'pending'>('active');

  const [storeNameInput, setStoreNameInput] = useState(SELLER_PROFILE_PRESET.shopName);
  const [storeUrlInput, setStoreUrlInput] = useState(
    SELLER_PROFILE_PRESET.storeUrl || 'https://shopee.ph/shop/39104821'
  );
  const [shopDescInput, setShopDescInput] = useState(SELLER_PROFILE_PRESET.shopDescription);
  const [phoneInput, setPhoneInput] = useState(SELLER_PROFILE_PRESET.phoneNumber);
  const [platformsInput, setPlatformsInput] = useState<Array<'Shopee' | 'Lazada' | 'Temu'>>(
    SELLER_PROFILE_PRESET.platforms
  );

  const [feedbackList, setFeedbackList] = useState<SellerFeedbackItem[]>(INITIAL_SELLER_FEEDBACK);
  const [feedbackFilter, setFeedbackFilter] = useState<'all' | '5star' | 'needs_reply'>('all');
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  const [auditCheckId, setAuditCheckId] = useState(activeCheck.id);
  const [auditSpecText, setAuditSpecText] = useState(activeCheck.overview.material);
  const [publishingAudit, setPublishingAudit] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetchSellerDashboard().then((data) => {
      if (!mounted) return;
      setProfile(data.profile);
      setProducts(data.products);
      setStoreNameInput(data.profile.shopName);
      setStoreUrlInput(data.profile.storeUrl || 'https://shopee.ph/shop/39104821');
      setShopDescInput(data.profile.shopDescription);
      setPhoneInput(data.profile.phoneNumber);
      setPlatformsInput(data.profile.platforms);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const openAddProductDrawer = () => {
    setEditingProductId(null);
    setProdTitleInput('');
    setProdPriceInput('499');
    setProdPlatformInput('Shopee');
    setProdSourceUrlInput('');
    setProdSpecNoteInput('');
    setProdIllustrationInput('bag');
    setProdStatusInput('active');
    setShowProductForm(true);
    setSellerPortalTab('products');
  };

  const openEditProductDrawer = (prod: SellerProductItem) => {
    setEditingProductId(prod.id);
    setProdTitleInput(prod.title);
    setProdPriceInput(String(prod.pricePhp));
    setProdPlatformInput(prod.platform);
    setProdSourceUrlInput(prod.sourceUrl || '');
    setProdSpecNoteInput(prod.specNote || '');
    setProdIllustrationInput(prod.illustrationKey || 'bag');
    setProdStatusInput(prod.status);
    setShowProductForm(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = prodTitleInput.trim();
    const numericPrice = Number(prodPriceInput) || 299;
    if (cleanTitle.length < 2) {
      showToast('Please enter a product name.');
      return;
    }

    if (editingProductId) {
      const updated = await patchSellerProductOnServer(editingProductId, {
        title: cleanTitle,
        pricePhp: numericPrice,
        platform: prodPlatformInput,
        status: prodStatusInput,
        specNote: prodSpecNoteInput.trim(),
        sourceUrl: prodSourceUrlInput.trim(),
        illustrationKey: prodIllustrationInput,
      });
      setProducts((prev) =>
        prev.map((item) =>
          item.id === editingProductId
            ? updated ?? {
                ...item,
                title: cleanTitle,
                pricePhp: numericPrice,
                platform: prodPlatformInput,
                status: prodStatusInput,
                specNote: prodSpecNoteInput.trim() || undefined,
                sourceUrl: prodSourceUrlInput.trim() || undefined,
                illustrationKey: prodIllustrationInput,
              }
            : item
        )
      );
      showToast(`Updated "${cleanTitle}"`);
    } else {
      const created = await createSellerProductOnServer({
        title: cleanTitle,
        pricePhp: numericPrice,
        platform: prodPlatformInput,
        status: prodStatusInput,
        specNote: prodSpecNoteInput.trim() || undefined,
        sourceUrl: prodSourceUrlInput.trim() || undefined,
        illustrationKey: prodIllustrationInput,
      });
      const fallbackItem: SellerProductItem = created ?? {
        id: `sprod_${Date.now().toString(36)}`,
        title: cleanTitle,
        pricePhp: numericPrice,
        status: prodStatusInput,
        platform: prodPlatformInput,
        imageUrl: '',
        illustrationKey: prodIllustrationInput,
        specNote: prodSpecNoteInput.trim() || undefined,
        sourceUrl: prodSourceUrlInput.trim() || undefined,
        updatedAt: new Date().toISOString(),
      };
      setProducts((prev) => [fallbackItem, ...prev]);
      showToast(`Added "${fallbackItem.title}" to your store catalog`);
    }

    setShowProductForm(false);
    setEditingProductId(null);
  };

  const handleToggleProductStatus = async (item: SellerProductItem) => {
    const nextStatus = item.status === 'active' ? 'pending' : 'active';
    setProducts((prev) =>
      prev.map((p) => (p.id === item.id ? { ...p, status: nextStatus } : p))
    );
    await patchSellerProductOnServer(item.id, { status: nextStatus });
    showToast(`Marked "${item.title}" as ${nextStatus}`);
  };

  const handleDeleteProduct = async (item: SellerProductItem) => {
    setProducts((prev) => prev.filter((p) => p.id !== item.id));
    await deleteSellerProductOnServer(item.id);
    showToast(`Removed "${item.title}" from your store catalog`);
  };

  const handleSaveShopProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated = await patchSellerProfileOnServer({
      storeName: storeNameInput,
      shopDescription: shopDescInput,
      phoneNumber: phoneInput,
      platforms: platformsInput,
      storeUrl: storeUrlInput.trim(),
    });
    if (updated) {
      setProfile(updated);
    } else {
      setProfile((prev) => ({
        ...prev,
        shopName: storeNameInput.trim() || prev.shopName,
        shopDescription: shopDescInput.trim() || prev.shopDescription,
        phoneNumber: phoneInput.trim() || prev.phoneNumber,
        platforms: platformsInput,
        storeUrl: storeUrlInput.trim() || prev.storeUrl,
      }));
    }
    showToast('Saved merchant storefront profile and store link');
  };

  const handlePublishSelfAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (auditSpecText.trim().length < 3) return;
    setPublishingAudit(true);
    try {
      await publishSellerSpecAuditOnServer({
        checkId: auditCheckId,
        specAttribute: auditSpecText.trim(),
      });
      await loadProductCheck(auditCheckId);
      showToast('Published verified specification disclosure to live report');
    } finally {
      setPublishingAudit(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesStatus = productFilter === 'all' || p.status === productFilter;
    const q = debouncedProductSearch.trim().toLowerCase();
    const matchesSearch =
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.platform.toLowerCase().includes(q) ||
      (p.specNote || '').toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const activeProductsCount = products.filter((p) => p.status === 'active').length;
  const pendingProductsCount = products.filter((p) => p.status === 'pending').length;

  const liveStorefrontHref =
    profile.storeUrl && /^https?:\/\//i.test(profile.storeUrl)
      ? profile.storeUrl
      : buildShopSearchUrl(profile.platforms[0] ?? 'Shopee', profile.shopName);

  const portalTabs: Array<{ id: SellerPortalTabId; label: string }> = [
    { id: 'home', label: 'Overview' },
    { id: 'products', label: `My Products (${products.length})` },
    { id: 'feedback', label: `Customer Feedback (${feedbackList.length})` },
    { id: 'guidelines', label: 'Self-Audit Simulator' },
    { id: 'profile', label: 'Shop Profile & Link' },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-10">
      <div className="budol-card flex flex-wrap items-center justify-between gap-4 bg-white p-5">
        <div className="flex items-center gap-3.5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-[1.5px] border-ink bg-[#D7E6D0] font-editorial text-2xl font-bold text-ink shadow-crisp">
            {(profile.ownerName || 'S').slice(0, 1).toUpperCase()}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-editorial text-2xl font-bold leading-tight text-ink">
                {profile.shopName}
              </h1>
              <span className="sticker bg-mint text-verified">
                <CheckIcon size={12} />
                <span>{profile.verificationStatus}</span>
              </span>
            </div>
            <p className="mt-0.5 text-xs font-medium text-ink-muted">
              Owner: {profile.ownerName} • {profile.platforms.join(' | ')} • {profile.certificateId}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href={liveStorefrontHref}
            target="_blank"
            rel="noopener noreferrer"
            className="budol-btn-secondary !min-h-[40px] px-3.5 text-xs"
          >
            <span>Visit Live Storefront</span>
            <ExternalLinkIcon size={13} />
          </a>
          <button
            type="button"
            onClick={openAddProductDrawer}
            className="budol-btn-primary !min-h-[40px] px-3.5 text-xs"
          >
            <span>+ Add Product</span>
          </button>
          <button
            type="button"
            onClick={() => navigateTo('home')}
            className="budol-btn-secondary !min-h-[40px] px-3.5 text-xs"
          >
            <SearchIcon size={14} />
            <span>Market Inspector</span>
          </button>
        </div>
      </div>

      <div
        role="tablist"
        aria-label="Seller Hub navigation"
        className="grid grid-cols-2 gap-2 rounded-2xl border-[1.5px] border-ink bg-white p-2 shadow-crisp sm:grid-cols-5"
      >
        {portalTabs.map((tab) => {
          const active = sellerPortalTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setSellerPortalTab(tab.id)}
              className={`min-h-[42px] rounded-xl px-3 py-2 text-xs font-bold transition-colors ${
                active
                  ? 'border-[1.5px] border-ink bg-[#D7E6D0] text-ink shadow-crisp'
                  : 'text-ink-muted hover:bg-cream hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {sellerPortalTab === 'home' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
            <div className="budol-card bg-mint p-4">
              <span className="section-label">Store Rating</span>
              <p className="font-editorial mt-1 text-3xl font-bold tabular-nums text-ink">
                {profile.sellerRating.toFixed(1)} / 5
              </p>
              <p className="mt-0.5 text-xs text-ink-muted">
                {profile.reviewCount.toLocaleString()} verified buyer ratings
              </p>
            </div>
            <div className="budol-card bg-sky p-4">
              <span className="section-label">Transparency Score</span>
              <p className="font-editorial mt-1 text-3xl font-bold tabular-nums text-verified">
                {profile.transparencyScore}%
              </p>
              <p className="mt-0.5 text-xs text-ink-muted">
                6-Point spec &amp; price parity score
              </p>
            </div>
            <div className="budol-card bg-butter p-4">
              <span className="section-label">Active Listings</span>
              <p className="font-editorial mt-1 text-3xl font-bold tabular-nums text-ink">
                {activeProductsCount}
              </p>
              <p className="mt-0.5 text-xs text-ink-muted">
                Live across {profile.platforms.join(', ')}
              </p>
            </div>
            <div className="budol-card bg-peach p-4">
              <span className="section-label">Pending Audit</span>
              <p className="font-editorial mt-1 text-3xl font-bold tabular-nums text-caution">
                {pendingProductsCount}
              </p>
              <p className="mt-0.5 text-xs text-ink-muted">
                Awaiting pre-publish spec check
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            <div className="budol-card bg-white p-5 lg:col-span-7">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/15 pb-3">
                <div>
                  <h2 className="font-editorial text-xl font-bold text-ink">
                    Store Catalog &amp; Live Listing Links
                  </h2>
                  <p className="text-xs text-ink-muted">
                    Every product links directly to its marketplace listing and 6-point verification check.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSellerPortalTab('products')}
                  className="budol-btn-secondary !min-h-[38px] px-3 text-xs"
                >
                  <span>Manage All ({products.length})</span>
                  <ArrowRightIcon size={13} />
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {products.slice(0, 4).map((prod) => {
                  const productStoreLink = resolveListingExternalUrl(
                    prod.sourceUrl,
                    prod.platform,
                    prod.title
                  );

                  return (
                    <div
                      key={prod.id}
                      className="flex flex-col justify-between gap-3 rounded-2xl border-[1.5px] border-ink bg-cream p-3.5 sm:flex-row sm:items-center"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border-[1.5px] border-ink bg-white">
                          {resolveCleanProductImageUrl(prod.imageUrl, prod.title, 0) ? (
                            <img
                              src={resolveCleanProductImageUrl(prod.imageUrl, prod.title, 0)}
                              alt={prod.title}
                              className="h-full w-full object-contain p-1"
                            />
                          ) : (
                            <ProductIllustrationSvg variant={prod.illustrationKey} size={40} />
                          )}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <PlatformBadgeSvg platform={prod.platform} />
                            <span
                              className={`sticker text-[10px] ${
                                prod.status === 'active'
                                  ? 'bg-mint text-verified'
                                  : 'bg-butter text-caution'
                              }`}
                            >
                              {prod.status === 'active' ? 'Active' : 'Pending'}
                            </span>
                          </div>
                          <p className="mt-1 text-sm font-bold text-ink">{prod.title}</p>
                          <p className="text-xs font-bold tabular-nums text-flag">
                            {formatCurrency(prod.pricePhp)}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <a
                          href={productStoreLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="budol-btn-secondary !min-h-[38px] !px-3 text-xs"
                        >
                          <span>Visit Store Listing</span>
                          <ExternalLinkIcon size={12} />
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            void runLinkAnalysis(prod.sourceUrl || prod.title);
                            navigateTo('product', 'overview');
                          }}
                          className="budol-btn-primary !min-h-[38px] !px-3 text-xs"
                        >
                          <span>Run 6-Point Check</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="budol-card bg-white p-5 lg:col-span-5">
              <span className="sticker bg-mint text-verified">
                <ShieldIcon size={13} />
                <span>4-Point Merchant Readiness</span>
              </span>
              <h2 className="font-editorial mt-2 text-xl font-bold text-ink">
                How Buyers See Your Store
              </h2>
              <p className="mt-1 text-xs text-ink-muted">
                BudolCheck evaluates these four trust signals whenever a shopper inspects your store link.
              </p>

              <ul className="mt-4 space-y-2.5">
                {[
                  {
                    title: 'DTI / Official Store Identity',
                    detail: `${profile.certificateId} • ${profile.storeLocation}`,
                  },
                  {
                    title: 'Verified Buyer Rating Benchmark',
                    detail: `${profile.sellerRating.toFixed(1)} / 5 across ${profile.reviewCount.toLocaleString()} reviews`,
                  },
                  {
                    title: 'Complete Material & Variant Disclosure',
                    detail: `${activeProductsCount} active listings with verified spec notes`,
                  },
                  {
                    title: '7-Day Platform Return & Refund Protection',
                    detail: `Active across ${profile.platforms.join(', ')}`,
                  },
                ].map((item) => (
                  <li
                    key={item.title}
                    className="flex items-start gap-2.5 rounded-xl border-[1.5px] border-ink bg-cream p-3"
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-ink bg-verified text-white">
                      <CheckIcon size={11} />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-ink">{item.title}</p>
                      <p className="text-[11px] text-ink-muted">{item.detail}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSellerPortalTab('guidelines')}
                  className="budol-btn-primary flex-1 text-xs"
                >
                  <span>Open Self-Audit Simulator</span>
                  <ArrowRightIcon size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => setSellerPortalTab('profile')}
                  className="budol-btn-secondary text-xs"
                >
                  <span>Edit Store Link</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {sellerPortalTab === 'products' && (
        <div className="space-y-4">
          <div className="budol-card flex flex-wrap items-center justify-between gap-3 bg-white p-5">
            <div>
              <h2 className="font-editorial text-2xl font-bold text-ink">
                Manage Store Products ({products.length})
              </h2>
              <p className="text-xs text-ink-muted">
                Link each product to its Shopee, Lazada, or Temu store URL so buyers can verify and visit your listing directly.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (showProductForm) {
                  setShowProductForm(false);
                  setEditingProductId(null);
                } else {
                  openAddProductDrawer();
                }
              }}
              className="budol-btn-primary text-xs"
            >
              <span>{showProductForm ? 'Cancel' : '+ Add Product'}</span>
            </button>
          </div>

          {showProductForm && (
            <form
              onSubmit={handleSaveProduct}
              className="budol-card space-y-4 bg-white p-5"
            >
              <div className="flex items-center justify-between border-b border-ink/15 pb-3">
                <h3 className="font-editorial text-lg font-bold text-ink">
                  {editingProductId ? 'Edit Store Product & Listing Link' : 'Add New Store Product & Listing Link'}
                </h3>
                <span className="sticker bg-mint text-verified">
                  Synced with 6-Point Scanner
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-12">
                <div className="sm:col-span-6">
                  <label className="mb-1 block text-xs font-bold text-ink">
                    Product Name
                  </label>
                  <input
                    type="text"
                    required
                    value={prodTitleInput}
                    onChange={(e) => setProdTitleInput(e.target.value)}
                    placeholder="e.g., Structured Canvas Everyday Tote Bag"
                    className="min-h-[42px] w-full rounded-xl border-[1.5px] border-ink bg-cream px-3.5 text-sm text-ink focus:bg-white focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="mb-1 block text-xs font-bold text-ink">
                    Price (PHP)
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={prodPriceInput}
                    onChange={(e) => setProdPriceInput(e.target.value)}
                    className="min-h-[42px] w-full rounded-xl border-[1.5px] border-ink bg-cream px-3.5 text-sm tabular-nums text-ink focus:bg-white focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="mb-1 block text-xs font-bold text-ink">
                    Marketplace Store
                  </label>
                  <select
                    value={prodPlatformInput}
                    onChange={(e) =>
                      setProdPlatformInput(e.target.value as 'Shopee' | 'Lazada' | 'Temu')
                    }
                    className="min-h-[42px] w-full rounded-xl border-[1.5px] border-ink bg-cream px-3 text-sm font-semibold text-ink focus:bg-white focus:outline-none"
                  >
                    <option value="Shopee">Shopee</option>
                    <option value="Lazada">Lazada</option>
                    <option value="Temu">Temu</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-12">
                <div className="sm:col-span-8">
                  <label
                    htmlFor="seller-product-source-url"
                    className="mb-1 block text-xs font-bold text-ink"
                  >
                    Store / Product Listing Link (URL)
                  </label>
                  <input
                    id="seller-product-source-url"
                    type="url"
                    value={prodSourceUrlInput}
                    onChange={(e) => setProdSourceUrlInput(e.target.value)}
                    placeholder={
                      prodPlatformInput === 'Shopee'
                        ? 'https://shopee.ph/your-product-listing'
                        : prodPlatformInput === 'Lazada'
                        ? 'https://www.lazada.com.ph/products/your-product.html'
                        : 'https://www.temu.com/goods.html?...'
                    }
                    className="min-h-[42px] w-full rounded-xl border-[1.5px] border-ink bg-cream px-3.5 text-xs text-ink focus:bg-white focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-4">
                  <label className="mb-1 block text-xs font-bold text-ink">
                    Product Category Visual
                  </label>
                  <select
                    value={prodIllustrationInput}
                    onChange={(e) =>
                      setProdIllustrationInput(e.target.value as IllustrationKey)
                    }
                    className="min-h-[42px] w-full rounded-xl border-[1.5px] border-ink bg-cream px-3 text-xs font-semibold text-ink focus:bg-white focus:outline-none"
                  >
                    {ILLUSTRATION_OPTIONS.map((opt) => (
                      <option key={opt.key} value={opt.key}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-12">
                <div className="sm:col-span-9">
                  <label className="mb-1 block text-xs font-bold text-ink">
                    Verified Material &amp; Package Specification Note
                  </label>
                  <input
                    type="text"
                    value={prodSpecNoteInput}
                    onChange={(e) => setProdSpecNoteInput(e.target.value)}
                    placeholder="e.g., 16oz Cotton Canvas + YKK Zipper • 1 Tote Bag in Dustbag"
                    className="min-h-[42px] w-full rounded-xl border-[1.5px] border-ink bg-cream px-3.5 text-xs text-ink focus:bg-white focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="mb-1 block text-xs font-bold text-ink">
                    Listing Status
                  </label>
                  <select
                    value={prodStatusInput}
                    onChange={(e) =>
                      setProdStatusInput(e.target.value as 'active' | 'pending')
                    }
                    className="min-h-[42px] w-full rounded-xl border-[1.5px] border-ink bg-cream px-3 text-xs font-semibold text-ink focus:bg-white focus:outline-none"
                  >
                    <option value="active">Active (Published)</option>
                    <option value="pending">Pending Audit</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowProductForm(false);
                    setEditingProductId(null);
                  }}
                  className="budol-btn-secondary text-xs"
                >
                  <span>Cancel</span>
                </button>
                <button type="submit" className="budol-btn-primary text-xs">
                  <CheckIcon size={14} />
                  <span>{editingProductId ? 'Update Product' : 'Save Product to Catalog'}</span>
                </button>
              </div>
            </form>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {(['all', 'active', 'pending'] as const).map((tab) => {
                const active = productFilter === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setProductFilter(tab)}
                    className={`min-h-[40px] rounded-full border-[1.5px] border-ink px-4 text-xs font-bold capitalize shadow-crisp transition-colors ${
                      active ? 'bg-[#567449] text-white' : 'bg-white text-ink hover:bg-cream'
                    }`}
                  >
                    {tab === 'all'
                      ? `All (${products.length})`
                      : tab === 'active'
                      ? `Active (${activeProductsCount})`
                      : `Pending (${pendingProductsCount})`}
                  </button>
                );
              })}
            </div>

            <div className="relative w-full sm:w-64">
              <SearchIcon
                size={15}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted"
              />
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Filter store products..."
                className="min-h-[40px] w-full rounded-full border-[1.5px] border-ink bg-white py-1.5 pl-9 pr-3 text-xs text-ink focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-3">
            {filteredProducts.map((prod) => {
              const storeListingHref = resolveListingExternalUrl(
                prod.sourceUrl,
                prod.platform,
                prod.title
              );

              return (
                <div
                  key={prod.id}
                  className="budol-card flex flex-col justify-between gap-4 bg-white p-4 sm:flex-row sm:items-center"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-[1.5px] border-ink bg-cream shadow-crisp">
                      <SafeProductThumbnail
                        rawUrl={prod.imageUrl}
                        title={prod.title}
                        illustrationKey={prod.illustrationKey}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <PlatformBadgeSvg platform={prod.platform} />
                        <span
                          className={`inline-flex items-center rounded-full border-[1.5px] border-ink px-3 py-0.5 text-[11px] font-bold ${
                            prod.status === 'active'
                              ? 'bg-[#567449] text-white'
                              : 'bg-[#E99B4E] text-white'
                          }`}
                        >
                          {prod.status === 'active' ? 'Active' : 'Pending'}
                        </span>
                        <button
                          type="button"
                          onClick={() => void handleToggleProductStatus(prod)}
                          className="text-[11px] font-semibold text-ink underline hover:text-forest"
                        >
                          {prod.status === 'active' ? 'Set Pending' : 'Set Active'}
                        </button>
                      </div>

                      <h3 className="font-editorial mt-1.5 text-xl font-bold text-ink">
                        {prod.title}
                      </h3>
                      <p className="text-sm font-bold tabular-nums text-flag">
                        {formatCurrency(prod.pricePhp)}
                      </p>
                      {prod.specNote && (
                        <p className="mt-1 text-xs text-ink-muted">
                          <strong className="text-ink">Verified Spec:</strong> {prod.specNote}
                        </p>
                      )}
                      <div className="mt-1.5 flex items-center gap-1.5 text-xs text-ink-muted">
                        <span className="font-semibold text-ink">Store Link:</span>
                        <a
                          href={storeListingHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="max-w-xs truncate font-medium text-forest underline sm:max-w-md"
                        >
                          {storeListingHref}
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={storeListingHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="budol-btn-secondary !min-h-[38px] !px-3 text-xs"
                    >
                      <span>Visit Store Listing</span>
                      <ExternalLinkIcon size={12} />
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        void runLinkAnalysis(prod.sourceUrl || prod.title);
                        navigateTo('product', 'overview');
                      }}
                      className="budol-btn-primary !min-h-[38px] !px-3 text-xs"
                    >
                      <span>Run 6-Point Check</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditProductDrawer(prod)}
                      className="budol-btn-secondary !min-h-[38px] !px-3 text-xs"
                    >
                      <EditIcon size={13} />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeleteProduct(prod)}
                      className="inline-flex min-h-[38px] items-center rounded-full border-[1.5px] border-ink bg-blush px-3 text-xs font-bold text-flag shadow-crisp hover:bg-flag hover:text-white"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {sellerPortalTab === 'feedback' && (
        <div className="space-y-4">
          <div className="budol-card flex flex-wrap items-center justify-between gap-3 bg-white p-5">
            <div>
              <h2 className="font-editorial text-2xl font-bold text-ink">
                Verified Buyer Feedback &amp; Merchant Replies
              </h2>
              <p className="text-xs text-ink-muted">
                Respond to customer reviews to maintain your 98% store response rate.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'all', label: 'All Reviews' },
                { id: '5star', label: '5 Stars Only' },
                { id: 'needs_reply', label: 'Needs Merchant Reply' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFeedbackFilter(f.id as typeof feedbackFilter)}
                  className={`min-h-[38px] rounded-full border-[1.5px] border-ink px-3.5 text-xs font-bold ${
                    feedbackFilter === f.id
                      ? 'bg-[#567449] text-white shadow-crisp'
                      : 'bg-cream text-ink'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {feedbackList
              .filter((fb) => {
                if (feedbackFilter === '5star') return fb.rating === 5;
                if (feedbackFilter === 'needs_reply') return !fb.sellerReply;
                return true;
              })
              .map((fb) => (
                <div key={fb.id} className="budol-card space-y-3 bg-white p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl border-[1.5px] border-ink bg-cream">
                        <ProductIllustrationSvg variant={fb.illustrationKey} size={36} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <PlatformBadgeSvg platform={fb.platform} />
                          <span className="text-xs font-bold text-ink">
                            Buyer {fb.buyerHandle}
                          </span>
                          <span className="text-xs text-ink-muted">• {fb.dateLabel}</span>
                        </div>
                        <h3 className="mt-1 text-sm font-bold text-ink">
                          {fb.productTitle}
                        </h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <StarIcon key={idx} size={14} filled={idx < fb.rating} />
                      ))}
                    </div>
                  </div>

                  <p className="rounded-xl border border-ink/15 bg-cream p-3 text-xs leading-relaxed text-ink">
                    &ldquo;{fb.comment}&rdquo;
                  </p>

                  {fb.sellerReply ? (
                    <div className="rounded-xl border-[1.5px] border-ink bg-mint/60 p-3 text-xs text-ink">
                      <span className="font-bold text-forest">
                        Official Merchant Response ({profile.shopName}):
                      </span>{' '}
                      {fb.sellerReply}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <input
                        type="text"
                        value={replyDrafts[fb.id] || ''}
                        onChange={(e) =>
                          setReplyDrafts((prev) => ({ ...prev, [fb.id]: e.target.value }))
                        }
                        placeholder="Write an official merchant response to this buyer..."
                        className="min-h-[40px] flex-1 rounded-xl border-[1.5px] border-ink bg-cream/60 px-3 text-xs text-ink focus:bg-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const text = (replyDrafts[fb.id] || '').trim();
                          if (!text) return;
                          setFeedbackList((prev) =>
                            prev.map((item) =>
                              item.id === fb.id ? { ...item, sellerReply: text } : item
                            )
                          );
                          setReplyDrafts((prev) => ({ ...prev, [fb.id]: '' }));
                          showToast('Published official merchant response');
                        }}
                        className="budol-btn-primary !min-h-[40px] px-4 text-xs"
                      >
                        <span>Post Reply</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {sellerPortalTab === 'guidelines' && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="budol-card bg-white p-5 lg:col-span-7">
            <span className="sticker bg-mint text-verified">
              <ChecklistIcon size={13} />
              <span>Pre-Publish Spec &amp; Claim Simulator</span>
            </span>
            <h2 className="font-editorial mt-2 text-2xl font-bold text-ink">
              Seller Self-Audit Tool
            </h2>
            <p className="mt-1 text-xs text-ink-muted">
              Update and verify the material specification of a tracked listing to resolve contradiction warnings in the 6-Point Scanner.
            </p>

            <form onSubmit={handlePublishSelfAudit} className="mt-4 space-y-3.5">
              <div>
                <label className="mb-1 block text-xs font-bold text-ink">
                  Select Tracked Marketplace Listing
                </label>
                <select
                  value={auditCheckId}
                  onChange={(e) => {
                    const nextId = e.target.value;
                    setAuditCheckId(nextId);
                    const found = historyChecks.find((c) => c.id === nextId);
                    if (found) {
                      setAuditSpecText(found.overview.material);
                    }
                  }}
                  className="min-h-[42px] w-full rounded-xl border-[1.5px] border-ink bg-cream px-3 py-2 text-xs font-semibold text-ink focus:bg-white focus:outline-none"
                >
                  {historyChecks.map((chk) => (
                    <option key={chk.id} value={chk.id}>
                      {chk.productTitle} ({chk.platformName} • {formatCurrency(chk.listedPricePhp)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-ink">
                  Verified Material &amp; Package Specification Disclosure
                </label>
                <textarea
                  rows={3}
                  required
                  value={auditSpecText}
                  onChange={(e) => setAuditSpecText(e.target.value)}
                  placeholder="Enter exact material composition, dimensions, and package quantity..."
                  className="w-full rounded-xl border-[1.5px] border-ink bg-cream p-3 text-xs text-ink focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={publishingAudit}
                  className="budol-btn-primary text-xs"
                >
                  <CheckIcon size={14} />
                  <span>
                    {publishingAudit
                      ? 'Publishing Spec Disclosure...'
                      : 'Publish Verified Spec to Live Report'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await loadProductCheck(auditCheckId);
                    navigateTo('product', 'overview');
                  }}
                  className="budol-btn-secondary text-xs"
                >
                  <span>Inspect Live Report</span>
                  <ArrowRightIcon size={13} />
                </button>
              </div>
            </form>
          </div>

          <div className="budol-card bg-white p-5 lg:col-span-5">
            <h3 className="font-editorial text-xl font-bold text-ink">
              BudolCheck Merchant Standards
            </h3>
            <p className="mt-1 text-xs text-ink-muted">
              Follow these rules so your products earn a Low-Risk Green Verdict.
            </p>
            <ul className="mt-4 space-y-2.5 text-xs text-ink">
              <li className="rounded-xl border border-ink/20 bg-cream p-3">
                <strong className="block font-bold">1. Honest Reference Pricing</strong>
                Avoid inflating strikethrough prices before 11.11 or payday sales.
              </li>
              <li className="rounded-xl border border-ink/20 bg-cream p-3">
                <strong className="block font-bold">2. Exact Variant Price Parity</strong>
                Do not use a P49 accessory as the cover price for a P1,499 main unit.
              </li>
              <li className="rounded-xl border border-ink/20 bg-cream p-3">
                <strong className="block font-bold">3. Match Banner Claims to Spec Table</strong>
                Ensure waterproof, battery capacity, or material claims match the spec sheet.
              </li>
            </ul>
          </div>
        </div>
      )}

      {sellerPortalTab === 'profile' && (
        <form onSubmit={handleSaveShopProfile} className="budol-card space-y-4 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/15 pb-3">
            <div>
              <h2 className="font-editorial text-2xl font-bold text-ink">
                Merchant Storefront Profile &amp; Store Link
              </h2>
              <p className="text-xs text-ink-muted">
                Configure your public store details and official Shopee, Lazada, or Temu storefront URL.
              </p>
            </div>
            <a
              href={
                storeUrlInput.trim() && /^https?:\/\//i.test(storeUrlInput.trim())
                  ? storeUrlInput.trim()
                  : liveStorefrontHref
              }
              target="_blank"
              rel="noopener noreferrer"
              className="budol-btn-secondary !min-h-[38px] px-3.5 text-xs"
            >
              <span>Test Storefront Link</span>
              <ExternalLinkIcon size={12} />
            </a>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold text-ink">Shop Name</label>
              <input
                type="text"
                value={storeNameInput}
                onChange={(e) => setStoreNameInput(e.target.value)}
                className="min-h-[44px] w-full rounded-xl border-[1.5px] border-ink bg-cream px-3.5 text-sm text-ink focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="seller-storefront-url"
                className="mb-1 block text-xs font-bold text-ink"
              >
                Official Storefront Link (URL)
              </label>
              <input
                id="seller-storefront-url"
                type="url"
                value={storeUrlInput}
                onChange={(e) => setStoreUrlInput(e.target.value)}
                placeholder="https://shopee.ph/shop/your-store"
                className="min-h-[44px] w-full rounded-xl border-[1.5px] border-ink bg-cream px-3.5 text-sm text-ink focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-ink">
              Shop Description &amp; Dispatch Warehouse Info
            </label>
            <textarea
              rows={3}
              value={shopDescInput}
              onChange={(e) => setShopDescInput(e.target.value)}
              className="w-full rounded-xl border-[1.5px] border-ink bg-cream p-3.5 text-sm text-ink focus:bg-white focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold text-ink">
                Merchant Support Phone Number
              </label>
              <input
                type="text"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                className="min-h-[44px] w-full rounded-xl border-[1.5px] border-ink bg-cream px-3.5 text-sm tabular-nums text-ink focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-ink">
                Connected Marketplace Platforms
              </label>
              <div className="flex flex-wrap gap-2 pt-1">
                {(['Shopee', 'Lazada', 'Temu'] as const).map((plat) => {
                  const selected = platformsInput.includes(plat);
                  return (
                    <button
                      key={plat}
                      type="button"
                      onClick={() => {
                        setPlatformsInput((prev) =>
                          prev.includes(plat)
                            ? prev.length > 1
                              ? prev.filter((p) => p !== plat)
                              : prev
                            : [...prev, plat]
                        );
                      }}
                      className={`min-h-[38px] rounded-xl border-[1.5px] border-ink px-3.5 text-xs font-bold ${
                        selected ? 'bg-[#567449] text-white shadow-crisp' : 'bg-cream text-ink'
                      }`}
                    >
                      {selected ? `✓ ${plat}` : plat}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-ink/15 pt-3">
            <button
              type="button"
              onClick={() => void logout()}
              className="budol-btn-secondary text-xs"
            >
              <LogOutIcon size={14} />
              <span>Log Out of Seller Portal</span>
            </button>
            <button type="submit" className="budol-btn-primary text-xs">
              <CheckIcon size={14} />
              <span>Save Storefront Changes</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export const AdminDashboardView: React.FC = () => {
  const adminQueue = useBudolStore((s) => s.adminQueue);
  const adminConsoleTab = useBudolStore((s) => s.adminConsoleTab);
  const setAdminConsoleTab = useBudolStore((s) => s.setAdminConsoleTab);
  const updateAdminQueueStatus = useBudolStore((s) => s.updateAdminQueueStatus);
  const submitReportToAdminQueue = useBudolStore((s) => s.submitReportToAdminQueue);
  const runLinkAnalysis = useBudolStore((s) => s.runLinkAnalysis);
  const navigateTo = useBudolStore((s) => s.navigateTo);
  const logout = useBudolStore((s) => s.logout);
  const showToast = useBudolStore((s) => s.showToast);

  const [activityFilter, setActivityFilter] = useState<'all' | 'verification' | 'report' | 'verified'>('all');
  const [reportTab, setReportTab] = useState<'all' | 'reports' | 'complaints'>('all');
  const [reportStatusFilter, setReportStatusFilter] = useState<string>('all');
  const [reportSearch, setReportSearch] = useState('');
  const [debouncedReportSearch] = useDebouncedValue(reportSearch, 300);
  const [expandedNotesId, setExpandedNotesId] = useState<string | null>(null);
  const [moderatorNotes, setModeratorNotes] = useState<Record<string, string>>({
    adm_01: 'Verified price discrepancy against official distributor catalog. Seller notified.',
    adm_02: 'Detected 14 duplicate review photos across 3 unverified accounts.',
  });

  const [showManualReportForm, setShowManualReportForm] = useState(false);
  const [newIncidentTitle, setNewIncidentTitle] = useState('');
  const [newIncidentPlatform, setNewIncidentPlatform] = useState<'Shopee' | 'Lazada' | 'Temu'>('Shopee');
  const [newIncidentUrl, setNewIncidentUrl] = useState('');
  const [newIncidentReason, setNewIncidentReason] = useState('');
  const [newIncidentCategory, setNewIncidentCategory] = useState<'report' | 'complaint'>('report');

  const [userSearch, setUserSearch] = useState('');
  const [debouncedUserSearch] = useDebouncedValue(userSearch, 300);
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'user' | 'seller' | 'admin'>('all');

  const [stats, setStats] = useState({
    usersCount: 6,
    sellersCount: 2,
    checkedProductsCount: 38,
  });
  const [activities, setActivities] = useState<AdminActivityItem[]>(ADMIN_ACTIVITIES_PRESETS);
  const [users, setUsers] = useState<AdminUserRecord[]>(ADMIN_USERS_PRESETS);

  const [healthTelemetry, setHealthTelemetry] = useState<SystemHealthTelemetry | null>(null);
  const [highRiskThreshold, setHighRiskThreshold] = useState(65);
  const [discountAnomalyPct, setDiscountAnomalyPct] = useState(70);
  const [minVerifiedRating, setMinVerifiedRating] = useState('4.5');
  const [ssrfGuardEnabled, setSsrfGuardEnabled] = useState(true);
  const [autoFlagHighRisk, setAutoFlagHighRisk] = useState(true);
  const [escalateNonDelivery, setEscalateNonDelivery] = useState(true);
  const [requireSellerDti, setRequireSellerDti] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchAdminOverview().then((data) => {
      if (!mounted) return;
      setStats(data.stats);
      setActivities(data.activities);
      setUsers(data.users);
    });
    fetchSystemHealthTelemetry().then((h) => {
      if (mounted && h) setHealthTelemetry(h);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handleSetUserRole = async (
    userRecord: AdminUserRecord,
    nextRole: 'user' | 'seller' | 'admin'
  ) => {
    if (userRecord.role === nextRole) return;
    setUsers((prev) =>
      prev.map((u) => (u.id === userRecord.id ? { ...u, role: nextRole } : u))
    );
    await patchAdminUserRole(
      userRecord.id,
      nextRole === 'user' ? 'shopper' : nextRole
    );
    showToast(
      `Updated ${userRecord.fullName}'s role to ${
        nextRole === 'user' ? 'Shopper' : nextRole === 'seller' ? 'Seller' : 'Admin'
      }`
    );
  };

  const handleCreateManualIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newIncidentTitle.trim().length < 2 || newIncidentReason.trim().length < 3) return;
    await submitReportToAdminQueue({
      productTitle: newIncidentTitle.trim(),
      subtitle: newIncidentReason.trim(),
      platform: newIncidentPlatform,
      flagReason: newIncidentReason.trim(),
      reportCategory: newIncidentCategory,
      priceAnomaly:
        newIncidentCategory === 'complaint'
          ? 'Moderator Logged Complaint'
          : 'Moderator Flagged Listing',
      sourceUrl: newIncidentUrl.trim() || undefined,
    });
    setNewIncidentTitle('');
    setNewIncidentUrl('');
    setNewIncidentReason('');
    setShowManualReportForm(false);
  };

  const filteredActivities = activities.filter(
    (act) => activityFilter === 'all' || act.type === activityFilter
  );

  const filteredUsers = users.filter((u) => {
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    const q = debouncedUserSearch.trim().toLowerCase();
    const matchesQuery =
      !q ||
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.connectedShop.toLowerCase().includes(q);
    return matchesRole && matchesQuery;
  });

  const filteredReports = adminQueue.filter((item) => {
    const cat = item.reportCategory ?? 'report';
    const matchesCategory =
      reportTab === 'all' ||
      (reportTab === 'reports' && cat === 'report') ||
      (reportTab === 'complaints' && cat === 'complaint');
    const matchesStatus =
      reportStatusFilter === 'all' ||
      (reportStatusFilter === 'open' &&
        (item.status === 'pending' ||
          item.status === 'under_review' ||
          item.status === 'investigating')) ||
      item.status === reportStatusFilter;
    const q = debouncedReportSearch.trim().toLowerCase();
    const matchesSearch =
      !q ||
      item.productTitle.toLowerCase().includes(q) ||
      item.flagReason.toLowerCase().includes(q) ||
      (item.subtitle || '').toLowerCase().includes(q) ||
      item.platform.toLowerCase().includes(q);
    return matchesCategory && matchesStatus && matchesSearch;
  });

  const openQueueCount = adminQueue.filter(
    (r) => r.status === 'pending' || r.status === 'under_review' || r.status === 'investigating'
  ).length;
  const flaggedQueueCount = adminQueue.filter((r) => r.status === 'flagged').length;
  const resolvedQueueCount = adminQueue.filter((r) => r.status === 'resolved').length;

  const renderStatusSticker = (status: AdminReportStatus) => {
    const styles: Record<AdminReportStatus, { bg: string; label: string }> = {
      under_review: { bg: 'bg-[#E99B4E] text-white', label: 'Under Review' },
      investigating: { bg: 'bg-[#2C64A6] text-white', label: 'Investigating' },
      resolved: { bg: 'bg-[#4E7A40] text-white', label: 'Resolved' },
      pending: { bg: 'bg-[#7A62E3] text-white', label: 'Pending Action' },
      flagged: { bg: 'bg-flag text-white', label: 'Confirmed Flag' },
      dismissed: { bg: 'bg-ink-muted text-white', label: 'Dismissed' },
    };
    const current = styles[status] ?? styles.under_review;
    return (
      <span
        className={`inline-flex items-center rounded-full border-[1.5px] border-ink px-3 py-0.5 text-[11px] font-bold shadow-crisp ${current.bg}`}
      >
        {current.label}
      </span>
    );
  };

  const consoleTabs: Array<{ id: AdminConsoleTabId; label: string }> = [
    { id: 'home', label: 'Overview & Telemetry' },
    { id: 'users', label: `Users & Roles (${users.length})` },
    { id: 'reports', label: `Reports & Concerns (${adminQueue.length})` },
    { id: 'settings', label: 'Engine & System Settings' },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-10">
      <div className="budol-card flex flex-wrap items-center justify-between gap-4 bg-white p-5">
        <div className="flex items-center gap-3.5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-[1.5px] border-ink bg-[#F2CBA7] font-editorial text-2xl font-bold text-ink shadow-crisp">
            A
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-editorial text-2xl font-bold leading-tight text-ink">
                BudolCheck Trust &amp; Safety Console
              </h1>
              <span className="sticker bg-blush text-flag">
                <ShieldIcon size={12} />
                <span>Moderator Access</span>
              </span>
            </div>
            <p className="mt-0.5 text-xs font-medium text-ink-muted">
              Monitor scam reports, manage shopper &amp; seller roles, and tune the 6-Point Risk Engine.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setAdminConsoleTab('reports')}
            className="budol-btn-primary !min-h-[40px] px-3.5 text-xs"
          >
            <AlertIcon size={14} />
            <span>Open Queue ({openQueueCount} Open)</span>
          </button>
          <button
            type="button"
            onClick={() => navigateTo('home')}
            className="budol-btn-secondary !min-h-[40px] px-3.5 text-xs"
          >
            <SearchIcon size={14} />
            <span>6-Point Inspector</span>
          </button>
        </div>
      </div>

      <div
        role="tablist"
        aria-label="Admin Console navigation"
        className="grid grid-cols-2 gap-2 rounded-2xl border-[1.5px] border-ink bg-white p-2 shadow-crisp sm:grid-cols-4"
      >
        {consoleTabs.map((tab) => {
          const active = adminConsoleTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setAdminConsoleTab(tab.id)}
              className={`min-h-[42px] rounded-xl px-3 py-2 text-xs font-bold transition-colors ${
                active
                  ? 'border-[1.5px] border-ink bg-[#D7E6D0] text-ink shadow-crisp'
                  : 'text-ink-muted hover:bg-cream hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {adminConsoleTab === 'home' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
            <button
              type="button"
              onClick={() => setAdminConsoleTab('users')}
              className="budol-card bg-mint p-4 text-left transition-transform hover:-translate-y-0.5"
            >
              <span className="section-label">Registered Accounts</span>
              <p className="font-editorial mt-1 text-3xl font-bold tabular-nums text-ink">
                {users.length}
              </p>
              <p className="mt-0.5 text-xs text-ink-muted">
                {stats.usersCount} Shoppers • {stats.sellersCount} Sellers
              </p>
            </button>
            <button
              type="button"
              onClick={() => navigateTo('home')}
              className="budol-card bg-sky p-4 text-left transition-transform hover:-translate-y-0.5"
            >
              <span className="section-label">Tracked Listings</span>
              <p className="font-editorial mt-1 text-3xl font-bold tabular-nums text-ink">
                {stats.checkedProductsCount}
              </p>
              <p className="mt-0.5 text-xs text-ink-muted">
                Indexed in SQLite WAL catalog
              </p>
            </button>
            <button
              type="button"
              onClick={() => setAdminConsoleTab('reports')}
              className="budol-card bg-butter p-4 text-left transition-transform hover:-translate-y-0.5"
            >
              <span className="section-label">Open Incidents</span>
              <p className="font-editorial mt-1 text-3xl font-bold tabular-nums text-caution">
                {openQueueCount}
              </p>
              <p className="mt-0.5 text-xs text-ink-muted">
                Awaiting moderator action
              </p>
            </button>
            <button
              type="button"
              onClick={() => setAdminConsoleTab('reports')}
              className="budol-card bg-blush p-4 text-left transition-transform hover:-translate-y-0.5"
            >
              <span className="section-label">Confirmed Flags</span>
              <p className="font-editorial mt-1 text-3xl font-bold tabular-nums text-flag">
                {flaggedQueueCount}
              </p>
              <p className="mt-0.5 text-xs text-ink-muted">
                {resolvedQueueCount} resolved cases
              </p>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            <div className="budol-card bg-white p-5 lg:col-span-7">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/15 pb-3">
                <div>
                  <h2 className="font-editorial text-xl font-bold text-ink">
                    Priority Reports &amp; Concerns Queue
                  </h2>
                  <p className="text-xs text-ink-muted">
                    Inspect reported listings, open external store links, or resolve incidents.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAdminConsoleTab('reports')}
                  className="budol-btn-secondary !min-h-[38px] px-3 text-xs"
                >
                  <span>Full Queue ({adminQueue.length})</span>
                  <ArrowRightIcon size={13} />
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {adminQueue.slice(0, 4).map((item) => {
                  const storeHref = resolveListingExternalUrl(
                    item.sourceUrl,
                    (item.platform as 'Shopee' | 'Lazada' | 'Temu') || 'Shopee',
                    item.productTitle
                  );

                  return (
                    <div
                      key={item.id}
                      className="flex flex-col justify-between gap-3 rounded-2xl border-[1.5px] border-ink bg-cream p-3.5 sm:flex-row sm:items-center"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <PlatformBadgeSvg
                            platform={
                              (item.platform as 'Shopee' | 'Lazada' | 'Temu') || 'Shopee'
                            }
                          />
                          {renderStatusSticker(item.status)}
                        </div>
                        <p className="mt-1.5 truncate text-sm font-bold text-ink">
                          {item.productTitle}
                        </p>
                        <p className="text-xs text-ink-muted">
                          {item.subtitle || item.flagReason} •{' '}
                          <strong className="text-flag">{item.priceAnomaly}</strong>
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <a
                          href={storeHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="budol-btn-secondary !min-h-[36px] !px-3 text-xs"
                        >
                          <span>Visit Store</span>
                          <ExternalLinkIcon size={12} />
                        </a>
                        <button
                          type="button"
                          onClick={() =>
                            updateAdminQueueStatus(
                              item.id,
                              item.status === 'resolved' ? 'under_review' : 'resolved'
                            )
                          }
                          className="budol-btn-primary !min-h-[36px] !px-3 text-xs"
                        >
                          <span>{item.status === 'resolved' ? 'Reopen' : 'Resolve'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="budol-card bg-white p-5 lg:col-span-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/15 pb-3">
                <h2 className="font-editorial text-xl font-bold text-ink">
                  Recent Platform Activity
                </h2>
                <div className="flex flex-wrap gap-1">
                  {(['all', 'verification', 'report', 'verified'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActivityFilter(tab)}
                      className={`rounded-full border border-ink px-2.5 py-0.5 text-[11px] font-bold capitalize ${
                        activityFilter === tab ? 'bg-[#567449] text-white' : 'bg-cream text-ink'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-3 divide-y divide-ink/15">
                {filteredActivities.map((act) => (
                  <div
                    key={act.id}
                    className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div>
                      <p className="text-xs font-bold text-ink">{act.title}</p>
                      <p className="text-[11px] text-ink-muted">{act.detail}</p>
                    </div>
                    <span className="shrink-0 rounded-full border border-ink/20 bg-cream px-2.5 py-0.5 text-[10px] font-bold uppercase text-ink">
                      {act.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {adminConsoleTab === 'users' && (
        <div className="space-y-4">
          <div className="budol-card flex flex-wrap items-center justify-between gap-3 bg-white p-5">
            <div>
              <h2 className="font-editorial text-2xl font-bold text-ink">
                User &amp; Role Management ({filteredUsers.length})
              </h2>
              <p className="text-xs text-ink-muted">
                Assign Shopper, Seller, or Moderator privileges directly using the segmented role selector.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <SearchIcon
                size={15}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted"
              />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search name, email, or shop..."
                className="min-h-[40px] w-full rounded-full border-[1.5px] border-ink bg-cream py-1.5 pl-9 pr-3 text-xs text-ink focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: `All Accounts (${users.length})` },
              {
                id: 'user',
                label: `Shoppers (${users.filter((u) => u.role === 'user').length})`,
              },
              {
                id: 'seller',
                label: `Sellers (${users.filter((u) => u.role === 'seller').length})`,
              },
              {
                id: 'admin',
                label: `Admins (${users.filter((u) => u.role === 'admin').length})`,
              },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setUserRoleFilter(f.id as typeof userRoleFilter)}
                className={`min-h-[38px] rounded-full border-[1.5px] border-ink px-4 text-xs font-bold shadow-crisp ${
                  userRoleFilter === f.id ? 'bg-[#567449] text-white' : 'bg-white text-ink'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filteredUsers.map((u) => (
              <div
                key={u.id}
                className="budol-card flex flex-col justify-between gap-4 bg-white p-4 sm:flex-row sm:items-center"
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-[1.5px] border-ink font-editorial text-lg font-bold text-ink shadow-crisp"
                    style={{ backgroundColor: u.avatarColor }}
                  >
                    {u.fullName.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-editorial text-lg font-bold text-ink">
                        {u.fullName}
                      </h3>
                      <span className="sticker bg-cream text-[10px] capitalize text-ink">
                        {u.role === 'user' ? 'Shopper' : u.role}
                      </span>
                    </div>
                    <p className="text-xs text-ink-muted">{u.email}</p>
                    <p className="mt-0.5 text-[11px] font-semibold text-forest">
                      {u.connectedShop}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 rounded-full border-[1.5px] border-ink bg-cream p-1">
                  {(
                    [
                      { id: 'user', label: 'Shopper' },
                      { id: 'seller', label: 'Seller' },
                      { id: 'admin', label: 'Admin' },
                    ] as const
                  ).map((roleOption) => {
                    const active = u.role === roleOption.id;
                    return (
                      <button
                        key={roleOption.id}
                        type="button"
                        onClick={() => void handleSetUserRole(u, roleOption.id)}
                        className={`min-h-[34px] rounded-full px-3 text-xs font-bold transition-colors ${
                          active
                            ? 'border border-ink bg-[#567449] text-white shadow-crisp'
                            : 'text-ink-muted hover:text-ink'
                        }`}
                      >
                        {roleOption.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {adminConsoleTab === 'reports' && (
        <div className="space-y-4">
          <div className="budol-card flex flex-wrap items-center justify-between gap-3 bg-white p-5">
            <div>
              <h2 className="font-editorial text-2xl font-bold text-ink">
                Reports &amp; Concerns Moderation Queue ({filteredReports.length})
              </h2>
              <p className="text-xs text-ink-muted">
                Review community-reported listings and buyer complaints, inspect the live store URL, and record moderation actions.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowManualReportForm((v) => !v)}
              className="budol-btn-primary text-xs"
            >
              <span>{showManualReportForm ? 'Close Form' : '+ Log Manual Incident'}</span>
            </button>
          </div>

          {showManualReportForm && (
            <form
              onSubmit={handleCreateManualIncident}
              className="budol-card space-y-3.5 bg-white p-5"
            >
              <h3 className="font-editorial text-lg font-bold text-ink">
                Log New Moderation Incident
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                <div className="sm:col-span-5">
                  <label className="mb-1 block text-xs font-bold text-ink">
                    Reported Product / Store Title
                  </label>
                  <input
                    type="text"
                    required
                    value={newIncidentTitle}
                    onChange={(e) => setNewIncidentTitle(e.target.value)}
                    placeholder="e.g., Suspicious Flash Sale Listing"
                    className="min-h-[40px] w-full rounded-xl border-[1.5px] border-ink bg-cream px-3 text-xs text-ink focus:bg-white focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="mb-1 block text-xs font-bold text-ink">
                    Platform
                  </label>
                  <select
                    value={newIncidentPlatform}
                    onChange={(e) =>
                      setNewIncidentPlatform(e.target.value as 'Shopee' | 'Lazada' | 'Temu')
                    }
                    className="min-h-[40px] w-full rounded-xl border-[1.5px] border-ink bg-cream px-3 text-xs font-semibold text-ink focus:bg-white focus:outline-none"
                  >
                    <option value="Shopee">Shopee</option>
                    <option value="Lazada">Lazada</option>
                    <option value="Temu">Temu</option>
                  </select>
                </div>
                <div className="sm:col-span-4">
                  <label className="mb-1 block text-xs font-bold text-ink">
                    Incident Category
                  </label>
                  <select
                    value={newIncidentCategory}
                    onChange={(e) =>
                      setNewIncidentCategory(e.target.value as 'report' | 'complaint')
                    }
                    className="min-h-[40px] w-full rounded-xl border-[1.5px] border-ink bg-cream px-3 text-xs font-semibold text-ink focus:bg-white focus:outline-none"
                  >
                    <option value="report">Suspicious Listing Report</option>
                    <option value="complaint">Buyer Order Complaint</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold text-ink">
                    Reported Store / Listing URL
                  </label>
                  <input
                    type="url"
                    value={newIncidentUrl}
                    onChange={(e) => setNewIncidentUrl(e.target.value)}
                    placeholder="https://shopee.ph/..."
                    className="min-h-[40px] w-full rounded-xl border-[1.5px] border-ink bg-cream px-3 text-xs text-ink focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-ink">
                    Flag Reason / Evidence Summary
                  </label>
                  <input
                    type="text"
                    required
                    value={newIncidentReason}
                    onChange={(e) => setNewIncidentReason(e.target.value)}
                    placeholder="e.g., Counterfeit serial number reported by buyer"
                    className="min-h-[40px] w-full rounded-xl border-[1.5px] border-ink bg-cream px-3 text-xs text-ink focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button type="submit" className="budol-btn-primary text-xs">
                  <CheckIcon size={14} />
                  <span>Add Incident to Queue</span>
                </button>
              </div>
            </form>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { id: 'all', label: `All (${adminQueue.length})` },
                  {
                    id: 'reports',
                    label: `Listing Reports (${
                      adminQueue.filter((r) => (r.reportCategory ?? 'report') === 'report').length
                    })`,
                  },
                  {
                    id: 'complaints',
                    label: `Buyer Complaints (${
                      adminQueue.filter((r) => r.reportCategory === 'complaint').length
                    })`,
                  },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setReportTab(tab.id)}
                  className={`min-h-[40px] rounded-full border-[1.5px] border-ink px-4 text-xs font-bold shadow-crisp ${
                    reportTab === tab.id ? 'bg-[#567449] text-white' : 'bg-white text-ink'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={reportStatusFilter}
                onChange={(e) => setReportStatusFilter(e.target.value)}
                aria-label="Filter queue by status"
                className="min-h-[40px] rounded-full border-[1.5px] border-ink bg-white px-3.5 text-xs font-bold text-ink"
              >
                <option value="all">All Statuses</option>
                <option value="open">Needs Action (Open)</option>
                <option value="investigating">Investigating</option>
                <option value="flagged">Confirmed Flag</option>
                <option value="resolved">Resolved</option>
              </select>

              <div className="relative w-full sm:w-60">
                <SearchIcon
                  size={15}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted"
                />
                <input
                  type="text"
                  value={reportSearch}
                  onChange={(e) => setReportSearch(e.target.value)}
                  placeholder="Search queue..."
                  className="min-h-[40px] w-full rounded-full border-[1.5px] border-ink bg-white py-1.5 pl-9 pr-3 text-xs text-ink focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {filteredReports.map((item) => {
              const targetStoreHref = resolveListingExternalUrl(
                item.sourceUrl,
                (item.platform as 'Shopee' | 'Lazada' | 'Temu') || 'Shopee',
                item.productTitle
              );
              const notesOpen = expandedNotesId === item.id;

              return (
                <article
                  key={item.id}
                  data-testid={`admin-queue-item-${item.id}`}
                  className="budol-card flex flex-col justify-between bg-white p-5"
                >
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <PlatformBadgeSvg
                          platform={
                            (item.platform as 'Shopee' | 'Lazada' | 'Temu') || 'Shopee'
                          }
                        />
                        <span
                          className={`sticker text-[10px] ${
                            item.reportCategory === 'complaint'
                              ? 'bg-peach text-ink'
                              : 'bg-cream text-ink'
                          }`}
                        >
                          {item.reportCategory === 'complaint'
                            ? 'Buyer Complaint'
                            : 'Listing Report'}
                        </span>
                        <span className="sticker bg-butter text-[10px] tabular-nums text-ink">
                          {item.reportsCount} {item.reportsCount === 1 ? 'report' : 'reports'}
                        </span>
                      </div>
                      {renderStatusSticker(item.status)}
                    </div>

                    <div className="mt-3 flex items-start gap-3.5">
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-[1.5px] border-ink bg-cream shadow-crisp">
                        <SafeProductThumbnail
                          rawUrl={item.thumbnailUrl}
                          title={item.productTitle}
                          illustrationKey={item.illustrationKey || 'shoes'}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="font-editorial text-lg font-bold leading-snug text-ink">
                          {item.productTitle}
                        </h3>
                        <p className="mt-0.5 text-xs font-medium text-ink-muted">
                          {item.subtitle ?? item.flagReason}
                        </p>
                        <p className="mt-1 text-[11px] text-ink-muted">
                          {item.reportedDate ?? 'Reported on November 2, 2026'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 rounded-xl border border-ink/20 bg-cream px-3 py-2 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <span className="font-bold text-ink">Flag / Anomaly:</span>
                        <span className="font-bold text-flag">{item.priceAnomaly}</span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-ink-muted">{item.flagReason}</p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2.5 border-t border-ink/15 pt-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <a
                        href={targetStoreHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="budol-btn-secondary !min-h-[38px] !px-3 text-xs"
                      >
                        <span>Visit Reported Listing</span>
                        <ExternalLinkIcon size={12} />
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          void runLinkAnalysis(item.sourceUrl || item.productTitle);
                          navigateTo('product', 'overview');
                        }}
                        className="budol-btn-secondary !min-h-[38px] !px-3 text-xs"
                      >
                        <SearchIcon size={12} />
                        <span>Inspect in 6-Point Check</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedNotesId(notesOpen ? null : item.id)
                        }
                        className="text-xs font-bold text-forest underline"
                      >
                        {notesOpen ? 'Hide Notes' : 'Moderator Notes'}
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="mr-1 text-[11px] font-bold text-ink-muted">
                        Action:
                      </span>
                      <button
                        type="button"
                        onClick={() => updateAdminQueueStatus(item.id, 'investigating')}
                        className={`rounded-full border-[1.5px] border-ink px-2.5 py-1 text-[11px] font-bold ${
                          item.status === 'investigating'
                            ? 'bg-[#2C64A6] text-white'
                            : 'bg-cream text-ink hover:bg-sky'
                        }`}
                      >
                        Investigate
                      </button>
                      <button
                        type="button"
                        onClick={() => updateAdminQueueStatus(item.id, 'flagged')}
                        className={`rounded-full border-[1.5px] border-ink px-2.5 py-1 text-[11px] font-bold ${
                          item.status === 'flagged'
                            ? 'bg-flag text-white'
                            : 'bg-blush text-flag hover:bg-flag hover:text-white'
                        }`}
                      >
                        Confirm Flag
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateAdminQueueStatus(
                            item.id,
                            item.status === 'resolved' ? 'under_review' : 'resolved'
                          )
                        }
                        className={`rounded-full border-[1.5px] border-ink px-2.5 py-1 text-[11px] font-bold ${
                          item.status === 'resolved'
                            ? 'bg-[#4E7A40] text-white'
                            : 'bg-mint text-verified hover:bg-[#4E7A40] hover:text-white'
                        }`}
                      >
                        {item.status === 'resolved' ? 'Reopen' : 'Mark Resolved'}
                      </button>
                      <button
                        type="button"
                        onClick={() => updateAdminQueueStatus(item.id, 'dismissed')}
                        className="rounded-full border border-ink/40 bg-white px-2.5 py-1 text-[11px] font-semibold text-ink-muted hover:text-ink"
                      >
                        Dismiss
                      </button>
                    </div>

                    {notesOpen && (
                      <div className="rounded-xl border-[1.5px] border-ink bg-cream p-3">
                        <label className="mb-1 block text-[11px] font-bold text-ink">
                          Internal Moderator Investigation Notes
                        </label>
                        <textarea
                          rows={2}
                          value={moderatorNotes[item.id] ?? ''}
                          onChange={(e) =>
                            setModeratorNotes((prev) => ({
                              ...prev,
                              [item.id]: e.target.value,
                            }))
                          }
                          placeholder="Add verification findings, DTI permit check notes, or buyer refund status..."
                          className="w-full rounded-lg border border-ink bg-white p-2 text-xs text-ink focus:outline-none"
                        />
                        <div className="mt-2 flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              setExpandedNotesId(null);
                              showToast('Saved moderator investigation note');
                            }}
                            className="budol-btn-primary !min-h-[34px] !px-3 text-xs"
                          >
                            <span>Save Note</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {adminConsoleTab === 'settings' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            <div className="budol-card space-y-4 bg-white p-5 lg:col-span-6">
              <div className="flex items-center justify-between border-b border-ink/15 pb-3">
                <div>
                  <span className="sticker bg-butter text-ink">
                    <ShieldIcon size={12} />
                    <span>6-Point Heuristic Engine</span>
                  </span>
                  <h2 className="font-editorial mt-1.5 text-xl font-bold text-ink">
                    Automated Risk Scoring Thresholds
                  </h2>
                </div>
              </div>

              <div className="space-y-3.5 text-xs">
                <div>
                  <div className="flex justify-between font-bold text-ink">
                    <span>High-Risk Red Flag Cutoff Score</span>
                    <span className="tabular-nums text-flag">{highRiskThreshold} / 100</span>
                  </div>
                  <input
                    type="range"
                    min={40}
                    max={85}
                    value={highRiskThreshold}
                    onChange={(e) => setHighRiskThreshold(Number(e.target.value))}
                    className="mt-1.5 w-full accent-forest"
                  />
                  <p className="text-[11px] text-ink-muted">
                    Listings scoring above {highRiskThreshold}/100 trigger a High-Risk Budol Alert.
                  </p>
                </div>

                <div>
                  <div className="flex justify-between font-bold text-ink">
                    <span>Anchor Strikethrough Discount Anomaly Trigger</span>
                    <span className="tabular-nums text-caution">-{discountAnomalyPct}% off</span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={90}
                    value={discountAnomalyPct}
                    onChange={(e) => setDiscountAnomalyPct(Number(e.target.value))}
                    className="mt-1.5 w-full accent-forest"
                  />
                  <p className="text-[11px] text-ink-muted">
                    Flags artificial strikethrough markdowns exceeding -{discountAnomalyPct}%.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="mb-1 block font-bold text-ink">
                      Min. Verified Store Rating
                    </label>
                    <select
                      value={minVerifiedRating}
                      onChange={(e) => setMinVerifiedRating(e.target.value)}
                      className="min-h-[40px] w-full rounded-xl border-[1.5px] border-ink bg-cream px-3 font-semibold text-ink"
                    >
                      <option value="4.2">4.2 / 5.0 Stars</option>
                      <option value="4.5">4.5 / 5.0 Stars</option>
                      <option value="4.7">4.7 / 5.0 Stars</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block font-bold text-ink">
                      SSRF Domain Allowlist
                    </label>
                    <button
                      type="button"
                      onClick={() => setSsrfGuardEnabled((v) => !v)}
                      className={`min-h-[40px] w-full rounded-xl border-[1.5px] border-ink px-3 font-bold ${
                        ssrfGuardEnabled ? 'bg-mint text-verified' : 'bg-blush text-flag'
                      }`}
                    >
                      {ssrfGuardEnabled ? 'Strict Allowlist: ON' : 'Allowlist: Paused'}
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    showToast('Saved 6-Point Risk Engine thresholds and SSRF policy')
                  }
                  className="budol-btn-primary w-full text-xs"
                >
                  <CheckIcon size={14} />
                  <span>Save Engine Configuration</span>
                </button>
              </div>
            </div>

            <div className="budol-card space-y-4 bg-white p-5 lg:col-span-6">
              <div className="border-b border-ink/15 pb-3">
                <span className="sticker bg-mint text-verified">
                  <span>Moderation Automation</span>
                </span>
                <h2 className="font-editorial mt-1.5 text-xl font-bold text-ink">
                  Trust &amp; Safety Alert Routing
                </h2>
              </div>

              <div className="space-y-2.5 text-xs">
                {[
                  {
                    label: 'Auto-Enqueue High-Risk Listings (>= Cutoff)',
                    desc: 'Automatically add scanned URLs exceeding the risk threshold to Reports.',
                    checked: autoFlagHighRisk,
                    toggle: () => setAutoFlagHighRisk((v) => !v),
                  },
                  {
                    label: 'Escalate Buyer Non-Delivery Complaints',
                    desc: 'Prioritize complaints involving missing parcels or empty-box scams.',
                    checked: escalateNonDelivery,
                    toggle: () => setEscalateNonDelivery((v) => !v),
                  },
                  {
                    label: 'Require DTI / SEC Permit for Verified Seller Badge',
                    desc: 'Check merchant certificate IDs before granting Verified status.',
                    checked: requireSellerDti,
                    toggle: () => setRequireSellerDti((v) => !v),
                  },
                ].map((rule) => (
                  <div
                    key={rule.label}
                    className="flex items-center justify-between gap-3 rounded-xl border-[1.5px] border-ink bg-cream p-3"
                  >
                    <div>
                      <p className="font-bold text-ink">{rule.label}</p>
                      <p className="text-[11px] text-ink-muted">{rule.desc}</p>
                    </div>
                    <button
                      type="button"
                      onClick={rule.toggle}
                      className={`min-h-[34px] shrink-0 rounded-full border-[1.5px] border-ink px-3 font-bold ${
                        rule.checked ? 'bg-[#567449] text-white' : 'bg-white text-ink-muted'
                      }`}
                    >
                      {rule.checked ? 'Active' : 'Off'}
                    </button>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border-[1.5px] border-ink bg-cream p-3.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-ink">
                    Active Moderator Roster ({users.filter((u) => u.role === 'admin').length})
                  </p>
                  <button
                    type="button"
                    onClick={() => setAdminConsoleTab('users')}
                    className="text-xs font-bold text-forest underline"
                  >
                    Manage Access
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {users
                    .filter((u) => u.role === 'admin')
                    .map((adminUser) => (
                      <span
                        key={adminUser.id}
                        className="sticker bg-white text-[11px] text-ink"
                      >
                        {adminUser.fullName} ({adminUser.email})
                      </span>
                    ))}
                </div>
              </div>
            </div>
          </div>

          <div className="budol-card bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/15 pb-3">
              <div>
                <span className="sticker bg-sky text-ink">
                  <span>Live Backend Telemetry</span>
                </span>
                <h2 className="font-editorial mt-1.5 text-xl font-bold text-ink">
                  SQLite WAL Connection Pool, B-Tree Indexes &amp; LRU Cache Status
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    fetchSystemHealthTelemetry().then((h) => {
                      if (h) setHealthTelemetry(h);
                      showToast('Refreshed live database and cache telemetry');
                    });
                  }}
                  className="budol-btn-secondary !min-h-[38px] px-3.5 text-xs"
                >
                  <span>Refresh Telemetry</span>
                </button>
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="budol-btn-secondary !min-h-[38px] px-3.5 text-xs"
                >
                  <LogOutIcon size={14} />
                  <span>Log Out</span>
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3.5 sm:grid-cols-4">
              <div className="rounded-xl border-[1.5px] border-ink bg-cream p-3.5">
                <span className="text-[11px] font-bold uppercase text-ink-muted">
                  SQLite Engine Mode
                </span>
                <p className="font-editorial mt-1 text-xl font-bold text-ink">
                  {healthTelemetry?.db.storageMode ?? 'file-wal'} (
                  {healthTelemetry?.db.journalMode ?? 'wal'})
                </p>
                <p className="text-[11px] text-ink-muted">
                  Pool: {healthTelemetry?.db.poolSize ?? 5} conns (1W /{' '}
                  {healthTelemetry?.db.readConnections ?? 4}R)
                </p>
              </div>
              <div className="rounded-xl border-[1.5px] border-ink bg-cream p-3.5">
                <span className="text-[11px] font-bold uppercase text-ink-muted">
                  DB Operations
                </span>
                <p className="font-editorial mt-1 text-xl font-bold tabular-nums text-ink">
                  {healthTelemetry?.db.totalReads ?? 42} Reads /{' '}
                  {healthTelemetry?.db.totalWrites ?? 8} Writes
                </p>
                <p className="text-[11px] text-ink-muted">
                  Zero N+1 Batched Hydration
                </p>
              </div>
              <div className="rounded-xl border-[1.5px] border-ink bg-cream p-3.5">
                <span className="text-[11px] font-bold uppercase text-ink-muted">
                  Server LRU Cache
                </span>
                <p className="font-editorial mt-1 text-xl font-bold tabular-nums text-verified">
                  {healthTelemetry?.cache.hits ?? 18} Hits /{' '}
                  {healthTelemetry?.cache.misses ?? 5} Misses
                </p>
                <p className="text-[11px] text-ink-muted">
                  Entries: {healthTelemetry?.cache.entries ?? 6} /{' '}
                  {healthTelemetry?.cache.maxEntries ?? 250}
                </p>
              </div>
              <div className="rounded-xl border-[1.5px] border-ink bg-cream p-3.5">
                <span className="text-[11px] font-bold uppercase text-ink-muted">
                  Active B-Tree Indexes
                </span>
                <p className="font-editorial mt-1 text-xl font-bold tabular-nums text-ink">
                  {healthTelemetry?.db.indexes.length ?? 7} Verified
                </p>
                <p className="text-[11px] text-ink-muted">
                  Composite &amp; FK indexes online
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const PrivacyPolicyView: React.FC = () => {
  const navigateTo = useBudolStore((s) => s.navigateTo);

  return (
    <div className="mx-auto max-w-4xl space-y-5 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigateTo('home')}
          className="budol-btn-secondary px-4 py-2 text-xs"
        >
          <ArrowLeftIcon size={15} />
          <span>Back to Home</span>
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <span className="sticker bg-mint text-ink">
            <ShieldIcon size={12} />
            <span>RA 10173 Data Privacy Act Compliant</span>
          </span>
          <button
            type="button"
            onClick={() => navigateTo('terms')}
            className="budol-btn-secondary !min-h-[34px] px-3 py-1 text-xs"
          >
            <BookIcon size={13} />
            <span>View Terms of Service</span>
          </button>
        </div>
      </div>

      <article className="budol-card space-y-6 bg-white p-6 sm:p-8">
        <div className="border-b border-ink/15 pb-4">
          <span className="section-label">BudolCheck Governance • budol-check.vercel.app</span>
          <h1 className="font-editorial mt-1 text-3xl font-bold text-ink">
            Privacy Policy &amp; Data Protection Statement
          </h1>
          <p className="mt-1 text-xs text-ink-muted">
            Last Updated: November 2026 • Applicable to Shoppers, Verified Merchants, and Moderators on{' '}
            <a
              href="https://budol-check.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-forest underline"
            >
              https://budol-check.vercel.app
            </a>
          </p>
        </div>

        <section className="space-y-2 text-sm leading-relaxed text-ink">
          <h2 className="font-editorial text-xl font-bold text-ink">
            1. Scope &amp; Republic Act No. 10173 Compliance
          </h2>
          <p className="text-ink-muted">
            BudolCheck operates in accordance with Republic Act No. 10173 (Philippine Data Privacy Act of 2012) and its Implementing Rules and Regulations, as well as Republic Act No. 11967 (Internet Transactions Act of 2023). We adhere to the core data privacy principles of transparency, legitimate purpose, and proportionality across all product verification, storefront registration, and community moderation workflows.
          </p>
        </section>

        <section className="space-y-2 text-sm leading-relaxed text-ink">
          <h2 className="font-editorial text-xl font-bold text-ink">
            2. Public Listing Metadata &amp; Live Verification Processing
          </h2>
          <p className="text-ink-muted">
            When you inspect a Shopee Philippines, Lazada Philippines, or Temu listing URL or search keyword, BudolCheck processes only publicly accessible product metadata (listing title, PHP price, official mall or store rating, specification claims, and public buyer review snippets) required to compute the 6-Point Risk Verdict and cross-marketplace price comparison. We never access your personal marketplace shopping cart, payment instruments, home delivery address, or private buyer-seller chat logs.
          </p>
        </section>

        <section className="space-y-2 text-sm leading-relaxed text-ink">
          <h2 className="font-editorial text-xl font-bold text-ink">
            3. Account Registration, Google Sign-In &amp; Session Security
          </h2>
          <p className="text-ink-muted">
            Registered accounts store your display name, email address, cryptographically salted password hash (`scrypt` with timing-safe verification), and assigned role (`Shopper`, `Seller`, or `Admin`). If you authenticate via Google Sign-In, we verify your cryptographic Google ID token and receive only your basic profile claims (email, name, and verification status). Active sessions are maintained via `HttpOnly`, `SameSite=Lax` session cookies (`budolcheck_session`) that cannot be read by third-party client scripts. Bookmarked checks, check history, and connected seller storefronts are strictly scoped to your authenticated user ID.
          </p>
        </section>

        <section className="space-y-2 text-sm leading-relaxed text-ink">
          <h2 className="font-editorial text-xl font-bold text-ink">
            4. Web Analytics &amp; Performance Telemetry
          </h2>
          <p className="text-ink-muted">
            Our production deployment at `https://budol-check.vercel.app` uses Vercel Web Analytics (`@vercel/analytics`) to collect aggregated, privacy-preserving page view and performance metrics. Vercel Web Analytics does not use third-party tracking cookies, does not fingerprint individual browsers across external websites, and never sells or shares personal data with advertising networks.
          </p>
        </section>

        <section className="space-y-2 text-sm leading-relaxed text-ink">
          <h2 className="font-editorial text-xl font-bold text-ink">
            5. SSRF Protection &amp; Infrastructure Security Safeguards
          </h2>
          <p className="text-ink-muted">
            All submitted marketplace URLs pass through a strict outbound domain allowlist (`shopee.ph`, `lazada.com.ph`, `temu.com`, and verified marketplace shortlinks) and DNS/private-IP blocking (`127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.0.0/16`, and IPv6 loopback/link-local ranges) before metadata parsing. All database queries use parameterized SQLite statements, and all HTTP responses enforce Content-Security-Policy (CSP), HTTP Strict Transport Security (HSTS), and `X-Frame-Options: DENY` headers.
          </p>
        </section>

        <section className="space-y-2 text-sm leading-relaxed text-ink">
          <h2 className="font-editorial text-xl font-bold text-ink">
            6. Data Subject Rights &amp; Retention
          </h2>
          <p className="text-ink-muted">
            Under the Philippine Data Privacy Act of 2012, you have the right to be informed, to object, to access, to rectify, to erase or block your personal data, and to data portability. You may clear your saved checks, update your account preferences, or submit a data inquiry directly from your Account Profile or by filing a ticket through the Report Issue tab.
          </p>
        </section>
      </article>
    </div>
  );
};

export const TermsOfServiceView: React.FC = () => {
  const navigateTo = useBudolStore((s) => s.navigateTo);

  return (
    <div className="mx-auto max-w-4xl space-y-5 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigateTo('home')}
          className="budol-btn-secondary px-4 py-2 text-xs"
        >
          <ArrowLeftIcon size={15} />
          <span>Back to Home</span>
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <span className="sticker bg-butter text-ink">
            <BookIcon size={12} />
            <span>Platform Terms of Use</span>
          </span>
          <button
            type="button"
            onClick={() => navigateTo('privacy')}
            className="budol-btn-secondary !min-h-[34px] px-3 py-1 text-xs"
          >
            <ShieldIcon size={13} />
            <span>View Privacy Policy</span>
          </button>
        </div>
      </div>

      <article className="budol-card space-y-6 bg-white p-6 sm:p-8">
        <div className="border-b border-ink/15 pb-4">
          <span className="section-label">BudolCheck Governance • budol-check.vercel.app</span>
          <h1 className="font-editorial mt-1 text-3xl font-bold text-ink">
            Terms of Service &amp; Verification Disclaimer
          </h1>
          <p className="mt-1 text-xs text-ink-muted">
            Last Updated: November 2026 • Independent Philippine E-Commerce Verification Platform (
            <a
              href="https://budol-check.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-forest underline"
            >
              https://budol-check.vercel.app
            </a>
            )
          </p>
        </div>

        <section className="space-y-2 text-sm leading-relaxed text-ink">
          <h2 className="font-editorial text-xl font-bold text-ink">
            1. Independent Decision-Support Utility
          </h2>
          <p className="text-ink-muted">
            BudolCheck (`https://budol-check.vercel.app`) is an independent consumer decision-support and anti-scam verification utility. BudolCheck is not owned by, endorsed by, or affiliated with Shopee Philippines, Lazada Philippines, Temu, or their parent entities. All product names, logos, and marketplace trademarks belong to their respective owners. Risk scores (0 to 100) and verdicts (`Likely Legit`, `Use Caution`, `High Budol Risk`) are automated heuristic assessments derived from publicly observable listing claims, seller tenure, specification consistency, and historical PHP price benchmarks.
          </p>
        </section>

        <section className="space-y-2 text-sm leading-relaxed text-ink">
          <h2 className="font-editorial text-xl font-bold text-ink">
            2. Live Marketplace Data &amp; External Listing Links
          </h2>
          <p className="text-ink-muted">
            Marketplace prices, stock availability, promotional vouchers, and seller ratings on Shopee, Lazada, and Temu change in real time. When you click &ldquo;Open Listing&rdquo; or &ldquo;Visit Store,&rdquo; you are directed to the external marketplace where the actual purchase takes place. Shoppers remain responsible for verifying the final checkout price, official warranty terms, and Cash-on-Delivery (COD) or escrow protections on the destination platform before completing any transaction.
          </p>
        </section>

        <section className="space-y-2 text-sm leading-relaxed text-ink">
          <h2 className="font-editorial text-xl font-bold text-ink">
            3. Verified Seller Portal &amp; RA 11967 Compliance
          </h2>
          <p className="text-ink-muted">
            Merchants registering a Seller account, connecting a storefront URL, or publishing a Self-Audit Specification Sheet warrant that their store link, business identity, DTI / SEC registration details, and hardware or product specifications are truthful and compliant with Republic Act No. 11967 (Internet Transactions Act of 2023) and the Consumer Act of the Philippines (RA 7394). Submitting counterfeit specification claims, impersonating an authorized brand distributor, or manipulating trust scores may result in immediate storefront delisting and account suspension.
          </p>
        </section>

        <section className="space-y-2 text-sm leading-relaxed text-ink">
          <h2 className="font-editorial text-xl font-bold text-ink">
            4. Acceptable Use &amp; Automated Scraping Limits
          </h2>
          <p className="text-ink-muted">
            To protect platform stability and downstream marketplace availability, API endpoints enforce automated rate limiting and SSRF domain validation. Users agree not to submit non-marketplace URLs, attempt internal network probing, launch automated denial-of-service traffic, or submit fabricated competitor takedown reports.
          </p>
        </section>

        <section className="space-y-2 text-sm leading-relaxed text-ink">
          <h2 className="font-editorial text-xl font-bold text-ink">
            5. Community Reporting, Moderation &amp; Limitation of Liability
          </h2>
          <p className="text-ink-muted">
            Shoppers may report suspicious listings, bait-and-switch variants, or order discrepancies for review by Trust &amp; Safety moderators. BudolCheck provides its verification heuristics on an &ldquo;as-is&rdquo; and &ldquo;as-available&rdquo; basis without warranties of merchantability or guaranteed fraud prevention, and shall not be liable for direct or indirect losses arising from third-party marketplace transactions.
          </p>
        </section>
      </article>
    </div>
  );
};
