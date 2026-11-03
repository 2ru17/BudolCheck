import React, { Suspense, lazy } from 'react';
import { useBudolStore } from '../store/useBudolStore.ts';
import { UserRole } from '../types/budol.ts';
import { ArrowRightIcon } from '../components/icons/SvgIcons.tsx';
import { MascotCanvasSkeleton } from '../components/visuals/BudolSkeletons.tsx';

const ThreeShoppingBag = lazy(
  () => import('../components/visuals/ThreeShoppingBag.tsx')
);

export const OnboardingView: React.FC = () => {
  const role = useBudolStore((s) => s.role);
  const setRole = useBudolStore((s) => s.setRole);
  const navigateTo = useBudolStore((s) => s.navigateTo);

  const handleGetStarted = () => {
    if (role === 'seller') {
      navigateTo('seller-dash');
    } else if (role === 'admin') {
      navigateTo('admin-dash');
    } else {
      navigateTo('auth');
    }
  };

  return (
    <section className="mx-auto flex min-h-[82dvh] max-w-lg flex-col items-center justify-between py-6 text-center">
      <div className="budol-card-elevated flex w-full flex-1 flex-col items-center justify-center bg-white px-6 py-8">
        <div className="mb-4 animate-float rounded-3xl border-[1.5px] border-ink bg-peach p-4 shadow-brutal">
          <Suspense fallback={<MascotCanvasSkeleton size={160} />}>
            <ThreeShoppingBag size={160} />
          </Suspense>
        </div>

        <h1 className="font-brand mt-1 text-4xl font-bold tracking-tight md:text-5xl">
          <span className="text-ink">Budol</span>
          <span className="text-sage">Check</span>
        </h1>

        <p className="font-editorial mt-2.5 inline-block rounded-xl border-[1.5px] border-ink bg-butter px-4 py-1 text-lg font-bold text-ink shadow-crisp md:text-xl">
          "Check First. Budol Later."
        </p>

        <p className="mt-3.5 max-w-md text-xs leading-relaxed text-ink-muted md:text-sm">
          Your structured pre-purchase verification companion. Inspect product
          claims, seller credentials, buyer unboxing photos, and cross-platform
          prices across Shopee, Lazada, TikTok Shop, and Temu before checking out.
        </p>

        <div className="mt-6">
          <span className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
            Select Active Role View
          </span>
          <div className="inline-flex items-center gap-1 rounded-full border-[1.5px] border-ink bg-cream p-1 shadow-crisp">
            {(
              [
                { id: 'user', label: 'Shopper View' },
                { id: 'seller', label: 'Seller View' },
                { id: 'admin', label: 'Admin View' },
              ] as { id: UserRole; label: string }[]
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setRole(item.id, false)}
                className={`min-h-[36px] rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-150 ${
                  role === item.id
                    ? 'bg-forest text-white shadow-sm'
                    : 'text-ink hover:bg-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-7 w-full max-w-sm">
          <button
            type="button"
            onClick={handleGetStarted}
            className="btn-primary-gradient w-full py-3 text-base"
          >
            <span>Get started</span>
            <ArrowRightIcon size={17} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default OnboardingView;
