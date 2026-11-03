import React from 'react';
import { useBudolStore } from '../../store/useBudolStore.ts';
import { ProductSubTab, ScreenId } from '../../types/budol.ts';
import { ArrowLeftIcon, ArrowRightIcon } from '../icons/SvgIcons.tsx';

interface StepDef {
  id: string;
  label: string;
  screen: ScreenId;
  subTab?: ProductSubTab;
}

const STEPS: StepDef[] = [
  { id: 'product', label: 'Product', screen: 'product', subTab: 'overview' },
  { id: 'seller', label: 'Seller', screen: 'seller' },
  { id: 'reviews', label: 'Reviews', screen: 'product', subTab: 'reviews' },
  { id: 'compare', label: 'Compare', screen: 'compare' },
  { id: 'marketing', label: 'Marketing', screen: 'marketing' },
  { id: 'redflags', label: 'Red Flags', screen: 'redflags' },
  { id: 'summary', label: 'Summary', screen: 'summary' },
];

export const CHECK_SCREENS: ScreenId[] = [
  'product',
  'seller',
  'compare',
  'marketing',
  'redflags',
  'summary',
];

function activeStepIndex(screen: ScreenId, subTab: ProductSubTab): number {
  if (screen === 'product') return subTab === 'reviews' ? 2 : 0;
  return STEPS.findIndex((step) => step.screen === screen);
}

export const CheckStepper: React.FC = () => {
  const currentScreen = useBudolStore((s) => s.currentScreen);
  const currentSubTab = useBudolStore((s) => s.currentSubTab);
  const check = useBudolStore((s) => s.activeCheck);
  const navigateTo = useBudolStore((s) => s.navigateTo);

  const index = activeStepIndex(currentScreen, currentSubTab);
  if (index < 0) return null;

  const results: Record<string, string> = {
    product: `${check.overview.claims.length} claims`,
    seller: `${check.seller.rating}/5`,
    reviews: `${check.reviewSummary.productReviewsCount}`,
    compare: `${check.comparisons.length} stores`,
    marketing: `${check.marketing.tactics.length} tactics`,
    redflags: `${check.redFlags.riskScore}/100`,
    summary: `${check.finalSummary.checkedAndVerified.length} verified`,
  };

  const go = (step: StepDef) => navigateTo(step.screen, step.subTab);
  const prev = index > 0 ? STEPS[index - 1] : null;
  const next = index < STEPS.length - 1 ? STEPS[index + 1] : null;
  const percent = Math.round(((index + 1) / STEPS.length) * 100);

  return (
    <nav aria-label="Check progress" className="budol-card mb-5 bg-white p-3.5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="section-label">
            Step {index + 1} of {STEPS.length}
          </p>
          <p className="font-editorial truncate text-base font-bold text-ink">
            {STEPS[index].label} check
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!prev}
            onClick={() => prev && go(prev)}
            aria-label={prev ? `Previous: ${prev.label}` : 'No previous step'}
            className="budol-btn-secondary !min-h-[44px] !px-3 text-xs disabled:opacity-40"
          >
            <ArrowLeftIcon size={15} />
            <span className="hidden sm:inline">{prev ? prev.label : 'Back'}</span>
          </button>
          <button
            type="button"
            disabled={!next}
            onClick={() => next && go(next)}
            aria-label={next ? `Next: ${next.label}` : 'No next step'}
            className="budol-btn-primary !min-h-[44px] !px-3.5 text-xs disabled:opacity-40"
          >
            <span className="hidden sm:inline">{next ? next.label : 'Done'}</span>
            <span className="sm:hidden">Next</span>
            <ArrowRightIcon size={15} />
          </button>
        </div>
      </div>

      <div
        className="mt-3 h-2 overflow-hidden rounded-full border border-ink/40 bg-cream"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
      >
        <div
          className="h-full bg-gradient-to-r from-olive to-sage transition-[width] duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>

      <ol className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {STEPS.map((step, stepIndex) => {
          const active = stepIndex === index;
          const done = stepIndex < index;
          return (
            <li key={step.id} className="shrink-0">
              <button
                type="button"
                onClick={() => go(step)}
                aria-current={active ? 'step' : undefined}
                className={`flex min-h-[44px] flex-col items-start justify-center rounded-xl border-[1.5px] px-3 py-1 text-left transition-colors duration-150 ${
                  active
                    ? 'border-ink bg-olive text-white shadow-crisp'
                    : done
                      ? 'border-ink bg-mint text-ink'
                      : 'border-ink/40 bg-cream text-ink hover:bg-peach/60'
                }`}
              >
                <span className="text-xs font-semibold">
                  {stepIndex + 1}. {step.label}
                </span>
                <span
                  className={`text-[11px] font-medium tabular-nums ${
                    active ? 'text-white/85' : 'text-ink-muted'
                  }`}
                >
                  {results[step.id]}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default CheckStepper;
