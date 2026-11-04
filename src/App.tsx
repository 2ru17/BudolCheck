import React, { Suspense, lazy, useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useBudolStore } from './store/useBudolStore.ts';
import { NavigationShell } from './components/layout/NavigationShell.tsx';
import { ProductOverviewSkeleton } from './components/visuals/BudolSkeletons.tsx';
import { CHECK_SCREENS, CheckStepper } from './components/layout/CheckStepper.tsx';
import { HomeDashboardView } from './screens/HomeDashboardView.tsx';
import { ProductDetailsView } from './screens/ProductDetailsView.tsx';
import { ScreenId } from './types/budol.ts';
import { AlertIcon, CheckIcon, ShieldIcon } from './components/icons/SvgIcons.tsx';

const OnboardingView = lazy(() => import('./screens/OnboardingView.tsx'));
const AuthView = lazy(() => import('./screens/AuthView.tsx'));
const SellerCheckView = lazy(() =>
  import('./screens/SellerAndCompareView.tsx').then((m) => ({
    default: m.SellerCheckView,
  }))
);
const CompareToBuyView = lazy(() =>
  import('./screens/SellerAndCompareView.tsx').then((m) => ({
    default: m.CompareToBuyView,
  }))
);
const MarketingCheckView = lazy(() =>
  import('./screens/ExtendedChecksView.tsx').then((m) => ({
    default: m.MarketingCheckView,
  }))
);
const BudolRedFlagsView = lazy(() =>
  import('./screens/ExtendedChecksView.tsx').then((m) => ({
    default: m.BudolRedFlagsView,
  }))
);
const FinalSummaryView = lazy(() =>
  import('./screens/ExtendedChecksView.tsx').then((m) => ({
    default: m.FinalSummaryView,
  }))
);
const TipsAndGuidesView = lazy(() =>
  import('./screens/UtilityAndRoleViews.tsx').then((m) => ({
    default: m.TipsAndGuidesView,
  }))
);
const SavedChecksView = lazy(() =>
  import('./screens/UtilityAndRoleViews.tsx').then((m) => ({
    default: m.SavedChecksView,
  }))
);
const ProfileAndRolesView = lazy(() =>
  import('./screens/UtilityAndRoleViews.tsx').then((m) => ({
    default: m.ProfileAndRolesView,
  }))
);
const SellerDashboardView = lazy(() =>
  import('./screens/UtilityAndRoleViews.tsx').then((m) => ({
    default: m.SellerDashboardView,
  }))
);
const AdminDashboardView = lazy(() =>
  import('./screens/UtilityAndRoleViews.tsx').then((m) => ({
    default: m.AdminDashboardView,
  }))
);
const NotFoundView: React.FC = () => {
  const navigateTo = useBudolStore((s) => s.navigateTo);
  return (
    <div className="budol-card mx-auto max-w-lg bg-white p-8 text-center">
      <span className="sticker bg-flag/15 text-flag">
        <AlertIcon size={13} />
        <span>Error 404 &bull; Missing Route</span>
      </span>
      <h1 className="font-editorial mt-3 text-3xl font-bold text-ink">
        Listing or Page Not Found
      </h1>
      <p className="mt-2 text-sm text-ink-muted">
        The product link or internal page you followed does not exist, has expired, or is outside verified marketplace domains.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => navigateTo('home')}
          className="budol-btn-primary text-xs"
        >
          <span>Return to Home Dashboard</span>
        </button>
        <button
          type="button"
          onClick={() => navigateTo('tips')}
          className="budol-btn-secondary text-xs"
        >
          <span>Browse Scam Guides</span>
        </button>
      </div>
    </div>
  );
};

const CookieConsentBanner: React.FC = () => {
  const navigateTo = useBudolStore((s) => s.navigateTo);
  const [hasConsented, setHasConsented] = useState<boolean>(() => {
    try {
      return localStorage.getItem('budolcheck_cookie_consent') === 'accepted';
    } catch {
      return true;
    }
  });

  if (hasConsented) return null;

  return (
    <div
      role="region"
      aria-label="Cookie consent banner"
      className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-xl rounded-2xl border-[2px] border-ink bg-white p-4 shadow-[4px_4px_0px_#2C2623] sm:bottom-6 sm:left-6 sm:right-auto"
    >
      <div className="flex items-start gap-3">
        <div className="rounded-xl border-[1.5px] border-ink bg-cream p-2 text-ink">
          <ShieldIcon size={18} />
        </div>
        <div className="flex-1 text-xs">
          <p className="font-bold text-ink">Essential Cookies &amp; Privacy Telemetry</p>
          <p className="mt-1 leading-relaxed text-ink-muted">
            BudolCheck uses essential HTTP session cookies and privacy-preserving Vercel Analytics in accordance with RA 10173. No cross-site ad trackers are used.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                try {
                  localStorage.setItem('budolcheck_cookie_consent', 'accepted');
                } catch {}
                setHasConsented(true);
              }}
              className="budol-btn-primary !min-h-[34px] px-3.5 py-1 text-xs"
            >
              <CheckIcon size={14} />
              <span>Accept &amp; Continue</span>
            </button>
            <button
              type="button"
              onClick={() => navigateTo('privacy')}
              className="budol-btn-secondary !min-h-[34px] px-3 py-1 text-xs"
            >
              <span>Review Privacy Policy</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
const PrivacyPolicyView = lazy(() =>
  import('./screens/UtilityAndRoleViews.tsx').then((m) => ({
    default: m.PrivacyPolicyView,
  }))
);
const TermsOfServiceView = lazy(() =>
  import('./screens/UtilityAndRoleViews.tsx').then((m) => ({
    default: m.TermsOfServiceView,
  }))
);

export const App: React.FC = () => {
  const currentScreen = useBudolStore((s) => s.currentScreen);
  const activeCheck = useBudolStore((s) => s.activeCheck);
  const hasListing = useBudolStore((s) => s.hasListing);
  const isAuthenticated = useBudolStore((s) => s.isAuthenticated);
  const role = useBudolStore((s) => s.role);
  const navigateTo = useBudolStore((s) => s.navigateTo);
  const hydrateFromBackend = useBudolStore((s) => s.hydrateFromBackend);
  const prefersReducedMotion = useReducedMotion();
  const isCheckScreen = CHECK_SCREENS.includes(currentScreen);

  useEffect(() => {
    void hydrateFromBackend();
  }, [hydrateFromBackend]);

  useEffect(() => {
    const metaTitles: Record<ScreenId, string> = {
      front: 'BudolCheck | Check First. Budol Later.',
      home: 'BudolCheck | Philippine E-Commerce Scam & Price Checker',
      product:
        hasListing && activeCheck?.productTitle
          ? `BudolCheck | ${activeCheck.productTitle.slice(0, 48)}...`
          : 'BudolCheck | Product Verification & Specification Audit',
      seller: 'BudolCheck | Seller Legitimacy & DTI Compliance Check',
      compare: 'BudolCheck | Cross-Marketplace Price Comparison',
      marketing: 'BudolCheck | Marketing Tactics & Deceptive Claims Audit',
      redflags: 'BudolCheck | 6-Point Scam Risk Verdict',
      summary: 'BudolCheck | Final Verification Summary & Action Plan',
      tips: 'BudolCheck | Online Shopping Guides & Scam Avoidance Tips',
      saved: 'BudolCheck | Saved Listings & Verified Items',
      profile: 'BudolCheck | User Account & Storefront Preferences',
      'seller-dash': 'BudolCheck | Verified Merchant Self-Audit Portal',
      'admin-dash': 'BudolCheck | Trust & Safety Moderation Console',
      privacy: 'BudolCheck | Privacy Policy & Data Protection Statement',
      terms: 'BudolCheck | Terms of Service & Verification Disclaimer',
      auth: 'BudolCheck | Log In & Storefront Authentication',
      '404': 'BudolCheck | 404 Page Not Found',
    };

    const title = metaTitles[currentScreen] || 'BudolCheck | Check First. Budol Later.';
    document.title = title;

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        'content',
        `Verify Shopee, Lazada, and Temu listings before checkout with BudolCheck. ${title}`
      );
    }
  }, [currentScreen, activeCheck, hasListing]);

  const renderActiveScreen = () => {
    if (isCheckScreen && !hasListing) {
      return (
        <div className="budol-card mx-auto max-w-lg bg-white p-8 text-center">
          <h1 className="font-editorial text-xl font-bold text-ink">
            No product loaded yet
          </h1>
          <p className="mt-1 text-sm font-normal text-ink-muted">
            Paste a link or upload a photo on Home to start your check.
          </p>
          <button
            type="button"
            onClick={() => navigateTo('home')}
            className="budol-btn-primary mt-4 text-xs"
          >
            <span>Go to Home</span>
          </button>
        </div>
      );
    }
    switch (currentScreen) {
      case 'front':
        return <OnboardingView />;
      case 'auth':
        return <AuthView />;
      case 'home':
        return <HomeDashboardView />;
      case 'product':
        return <ProductDetailsView />;
      case 'seller':
        return <SellerCheckView />;
      case 'compare':
        return <CompareToBuyView />;
      case 'marketing':
        return <MarketingCheckView />;
      case 'redflags':
        return <BudolRedFlagsView />;
      case 'summary':
        return <FinalSummaryView />;
      case 'tips':
        return <TipsAndGuidesView />;
      case 'saved':
        return <SavedChecksView />;
      case 'profile':
        return <ProfileAndRolesView />;
      case 'privacy':
        return <PrivacyPolicyView />;
      case 'terms':
        return <TermsOfServiceView />;
      case 'seller-dash':
        if (!isAuthenticated || (role !== 'seller' && role !== 'admin')) {
          return (
            <div className="budol-card mx-auto max-w-lg bg-white p-8 text-center">
              <h1 className="font-editorial text-xl font-bold text-ink">
                Seller Account Required
              </h1>
              <p className="mt-1.5 text-sm font-normal text-ink-muted">
                Sign in with a verified seller account or connect your shop to access the Seller Self-Audit Portal.
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={() => navigateTo('auth')}
                  className="budol-btn-primary text-xs"
                >
                  <span>Log In as Seller</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigateTo('home')}
                  className="budol-btn-secondary text-xs"
                >
                  <span>Back to Home</span>
                </button>
              </div>
            </div>
          );
        }
        return <SellerDashboardView />;
      case 'admin-dash':
        if (!isAuthenticated || role !== 'admin') {
          return (
            <div className="budol-card mx-auto max-w-lg bg-white p-8 text-center">
              <h1 className="font-editorial text-xl font-bold text-ink">
                Moderator Access Required
              </h1>
              <p className="mt-1.5 text-sm font-normal text-ink-muted">
                Sign in with an authorized Trust and Safety moderator account to access the Moderation Console.
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={() => navigateTo('auth')}
                  className="budol-btn-primary text-xs"
                >
                  <span>Log In as Moderator</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigateTo('home')}
                  className="budol-btn-secondary text-xs"
                >
                  <span>Back to Home</span>
                </button>
              </div>
            </div>
          );
        }
        return <AdminDashboardView />;
      case '404':
        return <NotFoundView />;
      default:
        return <HomeDashboardView />;
    }
  };

  return (
    <NavigationShell>
      <Suspense fallback={<ProductOverviewSkeleton />}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentScreen}
            initial={
              prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }
            }
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            {isCheckScreen && hasListing && <CheckStepper />}
            {renderActiveScreen()}
          </motion.div>
        </AnimatePresence>
      </Suspense>
      <CookieConsentBanner />
    </NavigationShell>
  );
};

export default App;
