import React, { Suspense, lazy } from 'react';
import { useBudolStore } from '../store/useBudolStore.ts';
import { ArrowRightIcon, UserIcon } from '../components/icons/SvgIcons.tsx';
import { MascotCanvasSkeleton } from '../components/visuals/BudolSkeletons.tsx';

const ThreeShoppingBag = lazy(
  () => import('../components/visuals/ThreeShoppingBag.tsx')
);

export const OnboardingView: React.FC = () => {
  const navigateTo = useBudolStore((s) => s.navigateTo);

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
          Your structured pre-purchase verification companion. Search products across
          Shopee, Lazada, and Temu or paste a direct listing link to check
          seller credentials, buyer photos, and real cross-store prices.
        </p>

        <div className="mt-7 flex w-full max-w-sm flex-col gap-2.5">
          <button
            type="button"
            onClick={() => navigateTo('home')}
            className="btn-primary-gradient w-full py-3 text-base"
          >
            <span>Start Checking Products</span>
            <ArrowRightIcon size={17} />
          </button>

          <button
            type="button"
            onClick={() => navigateTo('auth')}
            className="budol-btn-secondary w-full py-2.5 text-xs"
          >
            <UserIcon size={15} />
            <span>Log In or Create Account</span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default OnboardingView;
