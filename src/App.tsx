import React, { Suspense, lazy } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useBudolStore } from './store/useBudolStore.ts';
import { NavigationShell } from './components/layout/NavigationShell.tsx';
import { ProductOverviewSkeleton } from './components/visuals/BudolSkeletons.tsx';
import { CHECK_SCREENS, CheckStepper } from './components/layout/CheckStepper.tsx';
import { HomeDashboardView } from './screens/HomeDashboardView.tsx';
import { ProductDetailsView } from './screens/ProductDetailsView.tsx';

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

export const App: React.FC = () => {
  const currentScreen = useBudolStore((s) => s.currentScreen);
  const hasListing = useBudolStore((s) => s.hasListing);
  const navigateTo = useBudolStore((s) => s.navigateTo);
  const prefersReducedMotion = useReducedMotion();
  const isCheckScreen = CHECK_SCREENS.includes(currentScreen);

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
      case 'seller-dash':
        return <SellerDashboardView />;
      case 'admin-dash':
        return <AdminDashboardView />;
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
    </NavigationShell>
  );
};

export default App;
