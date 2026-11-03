import React, { useEffect, useState } from 'react';
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
  useSpring,
} from 'motion/react';
import { useBudolStore } from '../../store/useBudolStore.ts';
import { ScreenId, UserRole } from '../../types/budol.ts';
import {
  BookIcon,
  BookmarkIcon,
  ClockIcon,
  HomeIcon,
  RefreshIcon,
  ShoppingBagMascotSvg,
  UserIcon,
} from '../icons/SvgIcons.tsx';

interface NavigationShellProps {
  children: React.ReactNode;
}

const DESKTOP_NAV_ITEMS: { id: ScreenId; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'product', label: 'Product' },
  { id: 'seller', label: 'Seller' },
  { id: 'compare', label: 'Compare' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'redflags', label: 'Red Flags' },
  { id: 'summary', label: 'Summary' },
];

const MOBILE_DOCK: {
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
    match: ['profile', 'seller-dash', 'admin-dash'],
    icon: <UserIcon size={19} />,
  },
];

export const NavigationShell: React.FC<NavigationShellProps> = ({ children }) => {
  const currentScreen = useBudolStore((s) => s.currentScreen);
  const role = useBudolStore((s) => s.role);
  const savedCount = useBudolStore((s) => s.savedCheckIds.length);
  const toastMessage = useBudolStore((s) => s.toastMessage);
  const navigateTo = useBudolStore((s) => s.navigateTo);
  const setRole = useBudolStore((s) => s.setRole);
  const loadProductCheck = useBudolStore((s) => s.loadProductCheck);
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
    }, 2400);
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
            onClick={() => navigateTo('home')}
            className="group flex shrink-0 items-center gap-2.5 text-left"
            aria-label="BudolCheck home"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border-[1.5px] border-ink bg-peach shadow-crisp transition-transform duration-200 group-hover:-translate-y-0.5">
              <ShoppingBagMascotSvg size={28} />
            </span>
            <div>
              <span className="font-brand text-xl font-bold tracking-tight">
                <span className="text-ink">Budol</span>
                <span className="text-sage">Check</span>
              </span>
              <span className="hidden text-[11px] font-medium text-ink-muted xl:block">
                Check First. Budol Later.
              </span>
            </div>
          </button>

          <nav
            aria-label="Primary"
            className="hidden items-center gap-0.5 rounded-full border-[1.5px] border-ink bg-white p-1 shadow-crisp lg:flex"
          >
            {DESKTOP_NAV_ITEMS.map((item) => {
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

          <div className="flex items-center gap-2">
            <select
              aria-label="Switch role"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="min-h-[40px] rounded-full border-[1.5px] border-ink bg-white px-3 text-xs font-semibold text-ink shadow-crisp md:hidden"
            >
              <option value="user">Shopper</option>
              <option value="seller">Seller</option>
              <option value="admin">Admin</option>
            </select>

            <div
              role="group"
              aria-label="Role switcher"
              className="hidden items-center rounded-full border-[1.5px] border-ink bg-white p-1 shadow-crisp md:flex"
            >
              {(['user', 'seller', 'admin'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`relative rounded-full px-3 py-1 text-xs font-semibold capitalize transition-colors ${
                    role === r ? 'text-white' : 'text-ink hover:bg-peach/60'
                  }`}
                >
                  {role === r && (
                    <motion.span
                      layoutId="role-pill"
                      className="absolute inset-0 rounded-full bg-ink"
                      transition={{ type: 'spring', stiffness: 460, damping: 34 }}
                    />
                  )}
                  <span className="relative z-10">{r === 'user' ? 'Shopper' : r}</span>
                </button>
              ))}
            </div>

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
            >
              <BookmarkIcon size={15} />
              <span>{savedCount}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                loadProductCheck('chk_cupmat_001');
                setRole('user', false);
                navigateTo('home');
              }}
              className="budol-btn-secondary hidden !min-h-[38px] !px-2.5 !py-1.5 text-xs sm:inline-flex"
              title="Reset demo state"
              aria-label="Reset demo state"
            >
              <RefreshIcon size={15} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-28 pt-6 lg:pb-14">
        {children}
      </main>

      <footer className="hidden border-t-[1.5px] border-ink bg-white py-4 lg:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 text-xs text-ink-muted">
          <p className="font-brand text-sm font-bold text-ink">
            Budol<span className="text-sage">Check</span>{' '}
            <span className="ml-2 font-sans text-xs font-medium text-ink-muted">
              Check First. Budol Later.
            </span>
          </p>
          <p className="font-medium">
            Supporting Shopee, Lazada, TikTok Shop, and Temu product checks
          </p>
        </div>
      </footer>

      <nav
        aria-label="Mobile navigation"
        className="safe-bottom-dock fixed bottom-0 left-0 right-0 z-40 border-t-[1.5px] border-ink bg-white lg:hidden"
      >
        <div className="mx-auto flex max-w-md items-center justify-around px-2 pt-1.5">
          {MOBILE_DOCK.map((item) => {
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
          })}
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
