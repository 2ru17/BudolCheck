import React, { useEffect, useState } from 'react';
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
  useSpring,
} from 'motion/react';
import {
  AdminConsoleTabId,
  SellerPortalTabId,
  useBudolStore,
} from '../../store/useBudolStore.ts';
import { ScreenId } from '../../types/budol.ts';
import {
  AlertIcon,
  BookIcon,
  BookmarkIcon,
  CheckIcon,
  ClockIcon,
  HomeIcon,
  LogOutIcon,
  SearchIcon,
  ShieldIcon,
  ShoppingBagMascotSvg,
  StarIcon,
  TagIcon,
  UserIcon,
} from '../icons/SvgIcons.tsx';

interface NavigationShellProps {
  children: React.ReactNode;
}

const SHOPPER_DESKTOP_NAV: { id: ScreenId; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'product', label: 'Product' },
  { id: 'seller', label: 'Seller' },
  { id: 'compare', label: 'Compare' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'redflags', label: 'Red Flags' },
  { id: 'summary', label: 'Summary' },
];

const SELLER_DESKTOP_NAV: {
  id: string;
  label: string;
  tab?: SellerPortalTabId;
  screen?: ScreenId;
}[] = [
  { id: 'seller-home', label: 'Overview', tab: 'home' },
  { id: 'seller-products', label: 'My Products', tab: 'products' },
  { id: 'seller-feedback', label: 'Feedback', tab: 'feedback' },
  { id: 'seller-guidelines', label: 'Self-Audit', tab: 'guidelines' },
  { id: 'seller-profile', label: 'Shop Profile', tab: 'profile' },
  { id: 'seller-inspector', label: 'Market Inspector', screen: 'home' },
];

const ADMIN_DESKTOP_NAV: {
  id: string;
  label: string;
  tab?: AdminConsoleTabId;
  screen?: ScreenId;
}[] = [
  { id: 'admin-home', label: 'Overview', tab: 'home' },
  { id: 'admin-users', label: 'Users', tab: 'users' },
  { id: 'admin-reports', label: 'Reports & Concerns', tab: 'reports' },
  { id: 'admin-settings', label: 'Settings', tab: 'settings' },
  { id: 'admin-inspector', label: 'Live Inspector', screen: 'home' },
];

const SHOPPER_MOBILE_DOCK: {
  label: string;
  screen: ScreenId;
  match: ScreenId[];
  icon: React.ReactNode;
}[] = [
  { label: 'Home', screen: 'home', match: ['home'], icon: <HomeIcon size={19} /> },
  {
    label: 'Checks',
    screen: 'product',
    match: ['product', 'seller', 'compare', 'marketing', 'redflags', 'summary'],
    icon: <ClockIcon size={19} />,
  },
  { label: 'Saved', screen: 'saved', match: ['saved'], icon: <BookmarkIcon size={19} /> },
  { label: 'Guides', screen: 'tips', match: ['tips'], icon: <BookIcon size={19} /> },
  {
    label: 'Profile',
    screen: 'profile',
    match: ['profile', 'privacy', 'terms'],
    icon: <UserIcon size={19} />,
  },
];

export const NavigationShell: React.FC<NavigationShellProps> = ({ children }) => {
  const currentScreen = useBudolStore((s) => s.currentScreen);
  const sellerPortalTab = useBudolStore((s) => s.sellerPortalTab);
  const adminConsoleTab = useBudolStore((s) => s.adminConsoleTab);
  const isAuthenticated = useBudolStore((s) => s.isAuthenticated);
  const authUser = useBudolStore((s) => s.authUser);
  const authLoading = useBudolStore((s) => s.authLoading);
  const savedCount = useBudolStore((s) => s.savedCheckIds.length);
  const adminQueue = useBudolStore((s) => s.adminQueue);
  const toastMessage = useBudolStore((s) => s.toastMessage);
  const navigateTo = useBudolStore((s) => s.navigateTo);
  const setSellerPortalTab = useBudolStore((s) => s.setSellerPortalTab);
  const setAdminConsoleTab = useBudolStore((s) => s.setAdminConsoleTab);
  const logout = useBudolStore((s) => s.logout);
  const clearToast = useBudolStore((s) => s.clearToast);

  const [scrolled, setScrolled] = useState(false);
  const { scrollY, scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 24 });

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setScrolled(latest > 16);
  });

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => {
      clearToast();
    }, 2600);
    return () => window.clearTimeout(timer);
  }, [toastMessage, clearToast]);

  const isFocusScreen = currentScreen === 'front' || currentScreen === 'auth';

  if (isFocusScreen) {
    return (
      <div className="relative flex min-h-[100dvh] flex-col">
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
      </div>
    );
  }

  const activeRole = isAuthenticated && authUser ? authUser.role : 'user';
  const firstName = authUser ? authUser.fullName.trim().split(/\s+/)[0] : 'Account';
  const openCasesCount = adminQueue.filter(
    (q) => q.status !== 'resolved' && q.status !== 'dismissed'
  ).length;

  const handleBrandClick = () => {
    if (activeRole === 'admin') {
      setAdminConsoleTab('home');
    } else if (activeRole === 'seller') {
      setSellerPortalTab('home');
    } else {
      navigateTo('home');
    }
  };

  return (
    <div className="relative flex min-h-[100dvh] flex-col">
      <motion.div
        aria-hidden="true"
        style={{ scaleX: progress }}
        className="fixed left-0 right-0 top-0 z-50 h-1 origin-left bg-gradient-to-r from-olive via-sage to-gold"
      />

      <header
        className={`sticky top-0 z-40 border-b-[1.5px] border-ink bg-cream/95 backdrop-blur-md transition-all duration-200 ${
          scrolled ? 'py-2.5 shadow-[0_2px_0_#2C2623]' : 'py-3.5'
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4">
          <button
            type="button"
            onClick={handleBrandClick}
            className="group flex shrink-0 items-center gap-2.5 text-left"
            aria-label="BudolCheck home"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border-[1.5px] border-ink bg-peach shadow-crisp transition-transform duration-200 group-hover:-translate-y-0.5">
              <ShoppingBagMascotSvg size={28} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-brand text-xl font-bold tracking-tight">
                  <span className="text-ink">Budol</span>
                  <span className="text-sage">Check</span>
                </span>
                {isAuthenticated && activeRole === 'seller' && (
                  <span className="rounded-full border border-ink bg-[#D7E6D0] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#28401E]">
                    Seller Hub
                  </span>
                )}
                {isAuthenticated && activeRole === 'admin' && (
                  <span className="rounded-full border border-ink bg-[#FAD6B8] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink">
                    Admin Console
                  </span>
                )}
              </div>
              <span className="hidden text-[11px] font-medium text-ink-muted xl:block">
                {activeRole === 'admin'
                  ? 'Trust & Safety Moderation Suite'
                  : activeRole === 'seller'
                  ? 'Verified Merchant & Self-Audit Portal'
                  : 'Check First. Budol Later.'}
              </span>
            </div>
          </button>

          {activeRole === 'seller' ? (
            <nav
              aria-label="Seller Portal Primary"
              className="hidden items-center gap-0.5 rounded-full border-[1.5px] border-ink bg-white p-1 shadow-crisp lg:flex"
            >
              {SELLER_DESKTOP_NAV.map((item) => {
                const isActive = item.tab
                  ? currentScreen === 'seller-dash' && sellerPortalTab === item.tab
                  : currentScreen !== 'seller-dash' && currentScreen !== 'profile';
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (item.tab) setSellerPortalTab(item.tab);
                      else if (item.screen) navigateTo(item.screen);
                    }}
                    className={`relative whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors duration-150 ${
                      isActive ? 'text-white' : 'text-ink hover:bg-peach/60'
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="desktop-nav-pill"
                        className="absolute inset-0 rounded-full border border-ink bg-gradient-to-r from-olive to-sage"
                        transition={{ type: 'spring', stiffness: 460, damping: 34 }}
                      />
                    )}
                    <span className="relative z-10">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          ) : activeRole === 'admin' ? (
            <nav
              aria-label="Admin Console Primary"
              className="hidden items-center gap-0.5 rounded-full border-[1.5px] border-ink bg-white p-1 shadow-crisp lg:flex"
            >
              {ADMIN_DESKTOP_NAV.map((item) => {
                const isActive = item.tab
                  ? currentScreen === 'admin-dash' && adminConsoleTab === item.tab
                  : currentScreen !== 'admin-dash' && currentScreen !== 'profile';
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (item.tab) setAdminConsoleTab(item.tab);
                      else if (item.screen) navigateTo(item.screen);
                    }}
                    className={`relative whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors duration-150 ${
                      isActive ? 'text-white' : 'text-ink hover:bg-peach/60'
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="desktop-nav-pill"
                        className="absolute inset-0 rounded-full border border-ink bg-gradient-to-r from-olive to-sage"
                        transition={{ type: 'spring', stiffness: 460, damping: 34 }}
                      />
                    )}
                    <span className="relative z-10">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          ) : (
            <nav
              aria-label="Primary"
              className="hidden items-center gap-0.5 rounded-full border-[1.5px] border-ink bg-white p-1 shadow-crisp lg:flex"
            >
              {SHOPPER_DESKTOP_NAV.map((item) => {
                const isActive = currentScreen === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigateTo(item.id)}
                    className={`relative whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors duration-150 ${
                      isActive ? 'text-white' : 'text-ink hover:bg-peach/60'
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="desktop-nav-pill"
                        className="absolute inset-0 rounded-full border border-ink bg-gradient-to-r from-olive to-sage"
                        transition={{ type: 'spring', stiffness: 460, damping: 34 }}
                      />
                    )}
                    <span className="relative z-10">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          )}

          <div className="flex items-center gap-2">
            {activeRole === 'user' && (
              <>
                <button
                  type="button"
                  onClick={() => navigateTo('tips')}
                  className="budol-btn-secondary hidden !min-h-[38px] !px-3.5 !py-1.5 text-xs sm:inline-flex"
                  title="Tips and guides"
                  aria-label="Tips and guides"
                >
                  <BookIcon size={15} />
                  <span className="hidden xl:inline">Guides</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigateTo('saved')}
                  className="budol-btn-secondary tabular-nums !min-h-[38px] !px-3.5 !py-1.5 text-xs"
                  title="Saved items"
                  aria-label="Saved items"
                >
                  <BookmarkIcon size={15} />
                  <span>{savedCount}</span>
                </button>
              </>
            )}

            {isAuthenticated && authUser ? (
              <>
                {activeRole === 'seller' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (currentScreen === 'seller-dash') {
                        setSellerPortalTab('products');
                      } else {
                        setSellerPortalTab('home');
                      }
                    }}
                    className="budol-btn-primary hidden !min-h-[38px] !px-3.5 !py-1.5 text-xs sm:inline-flex"
                  >
                    <ShieldIcon size={14} />
                    <span>
                      {currentScreen === 'seller-dash' ? 'Manage Products' : 'Seller Portal'}
                    </span>
                  </button>
                )}

                {activeRole === 'admin' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (currentScreen === 'admin-dash') {
                        setAdminConsoleTab('reports');
                      } else {
                        setAdminConsoleTab('home');
                      }
                    }}
                    className="budol-btn-secondary hidden !min-h-[38px] !bg-blush !px-3.5 !py-1.5 text-xs !text-flag sm:inline-flex"
                  >
                    <AlertIcon size={14} />
                    <span className="tabular-nums">
                      {currentScreen === 'admin-dash'
                        ? `${openCasesCount} Open Cases`
                        : 'Admin Console'}
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => navigateTo('profile')}
                  className="budol-btn-secondary !min-h-[38px] !px-3.5 !py-1.5 text-xs"
                  aria-label="Open account profile"
                >
                  <UserIcon size={15} />
                  <span className="max-w-[96px] truncate">{firstName}</span>
                </button>

                <button
                  type="button"
                  disabled={authLoading}
                  onClick={() => void logout()}
                  className="budol-btn-secondary !min-h-[38px] !px-3 !py-1.5 text-xs"
                  aria-label="Log out"
                  title="Log out"
                >
                  <LogOutIcon size={15} />
                  <span className="hidden sm:inline">Log Out</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => navigateTo('auth')}
                className="budol-btn-primary !min-h-[38px] !px-4 !py-1.5 text-xs"
              >
                <UserIcon size={15} />
                <span>Log In</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-8 pt-6 lg:pb-14">
        {children}
      </main>

      <footer className="border-t-[1.5px] border-ink bg-white pb-24 pt-4 lg:py-4">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 text-xs text-ink-muted sm:flex-row">
          <p className="font-brand text-sm font-bold text-ink">
            Budol<span className="text-sage">Check</span>{' '}
            <span className="ml-2 font-sans text-xs font-medium text-ink-muted">
              Check First. Budol Later.
            </span>
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <span className="hidden font-medium md:inline">
              Supporting Shopee, Lazada, and Temu product checks
            </span>
            <span aria-hidden="true" className="hidden md:inline">&bull;</span>
            <button
              type="button"
              onClick={() => navigateTo('privacy')}
              className="font-semibold text-ink hover:text-forest hover:underline"
            >
              Privacy Policy
            </button>
            <span aria-hidden="true">&bull;</span>
            <button
              type="button"
              onClick={() => navigateTo('terms')}
              className="font-semibold text-ink hover:text-forest hover:underline"
            >
              Terms of Service
            </button>
          </div>
        </div>
      </footer>

      <nav
        aria-label="Mobile navigation"
        className="safe-bottom-dock fixed bottom-0 left-0 right-0 z-40 border-t-[1.5px] border-ink bg-white lg:hidden"
      >
        <div className="mx-auto flex max-w-md items-center justify-around px-2 pt-1.5">
          {activeRole === 'seller' ? (
            <>
              {[
                { label: 'Overview', tab: 'home' as SellerPortalTabId, icon: <HomeIcon size={18} /> },
                { label: 'Products', tab: 'products' as SellerPortalTabId, icon: <TagIcon size={18} /> },
                { label: 'Feedback', tab: 'feedback' as SellerPortalTabId, icon: <StarIcon size={18} /> },
                { label: 'Audit', tab: 'guidelines' as SellerPortalTabId, icon: <CheckIcon size={18} /> },
                { label: 'Profile', tab: 'profile' as SellerPortalTabId, icon: <UserIcon size={18} /> },
              ].map((item) => {
                const active =
                  currentScreen === 'seller-dash' && sellerPortalTab === item.tab;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setSellerPortalTab(item.tab)}
                    className={`relative flex min-h-[46px] min-w-[58px] flex-col items-center justify-center gap-0.5 rounded-2xl px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                      active ? 'text-white' : 'text-ink-muted'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="dock-pill"
                        className="absolute inset-0 rounded-2xl border-[1.5px] border-ink bg-olive shadow-crisp"
                        transition={{ type: 'spring', stiffness: 460, damping: 34 }}
                      />
                    )}
                    <span className="relative z-10">{item.icon}</span>
                    <span className="relative z-10">{item.label}</span>
                  </button>
                );
              })}
            </>
          ) : activeRole === 'admin' ? (
            <>
              {[
                { label: 'Console', tab: 'home' as AdminConsoleTabId, icon: <HomeIcon size={18} /> },
                { label: 'Users', tab: 'users' as AdminConsoleTabId, icon: <UserIcon size={18} /> },
                { label: 'Reports', tab: 'reports' as AdminConsoleTabId, icon: <AlertIcon size={18} /> },
                { label: 'Settings', tab: 'settings' as AdminConsoleTabId, icon: <ShieldIcon size={18} /> },
              ].map((item) => {
                const active =
                  currentScreen === 'admin-dash' && adminConsoleTab === item.tab;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setAdminConsoleTab(item.tab)}
                    className={`relative flex min-h-[46px] min-w-[58px] flex-col items-center justify-center gap-0.5 rounded-2xl px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                      active ? 'text-white' : 'text-ink-muted'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="dock-pill"
                        className="absolute inset-0 rounded-2xl border-[1.5px] border-ink bg-olive shadow-crisp"
                        transition={{ type: 'spring', stiffness: 460, damping: 34 }}
                      />
                    )}
                    <span className="relative z-10">{item.icon}</span>
                    <span className="relative z-10">{item.label}</span>
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => navigateTo('home')}
                className={`relative flex min-h-[46px] min-w-[58px] flex-col items-center justify-center gap-0.5 rounded-2xl px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                  currentScreen !== 'admin-dash' ? 'text-white' : 'text-ink-muted'
                }`}
              >
                {currentScreen !== 'admin-dash' && (
                  <motion.span
                    layoutId="dock-pill"
                    className="absolute inset-0 rounded-2xl border-[1.5px] border-ink bg-olive shadow-crisp"
                    transition={{ type: 'spring', stiffness: 460, damping: 34 }}
                  />
                )}
                <span className="relative z-10">
                  <SearchIcon size={18} />
                </span>
                <span className="relative z-10">Inspector</span>
              </button>
            </>
          ) : (
            SHOPPER_MOBILE_DOCK.map((item) => {
              const active = item.match.includes(currentScreen);
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => navigateTo(item.screen)}
                  className={`relative flex min-h-[46px] min-w-[58px] flex-col items-center justify-center gap-0.5 rounded-2xl px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                    active ? 'text-white' : 'text-ink-muted'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="dock-pill"
                      className="absolute inset-0 rounded-2xl border-[1.5px] border-ink bg-olive shadow-crisp"
                      transition={{ type: 'spring', stiffness: 460, damping: 34 }}
                    />
                  )}
                  <span className="relative z-10">
                    {item.icon}
                    {item.screen === 'saved' && savedCount > 0 && (
                      <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full border border-ink bg-butter px-1 text-[10px] font-bold tabular-nums text-ink">
                        {savedCount}
                      </span>
                    )}
                  </span>
                  <span className="relative z-10">{item.label}</span>
                </button>
              );
            })
          )}
        </div>
      </nav>

      <AnimatePresence>
        {toastMessage && (
          <motion.div
            key={toastMessage}
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            role="status"
            aria-live="polite"
            className="fixed left-1/2 top-20 z-50 -translate-x-1/2 rounded-full border-[1.5px] border-ink bg-butter px-5 py-2.5 text-xs font-semibold text-ink shadow-brutal"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
