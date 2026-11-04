import React from 'react';
import { useBudolStore } from '../store/useBudolStore.ts';
import {
  AnimatedCheckCircle,
  AnimatedRiskGauge,
} from '../components/visuals/AnimeCheckmark.tsx';
import {
  AlertIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ExternalLinkIcon,
  HeartIcon,
  PlatformBadgeSvg,
  ShareIcon,
} from '../components/icons/SvgIcons.tsx';
import {
  formatCurrency,
  resolveListingExternalUrl,
} from '../lib/formatters.ts';
import { Stagger, StaggerItem } from '../components/visuals/Motion.tsx';

export const MarketingCheckView: React.FC = () => {
  const activeCheck = useBudolStore((s) => s.activeCheck);
  const navigateTo = useBudolStore((s) => s.navigateTo);
  const directListingUrl = resolveListingExternalUrl(
    activeCheck.sourceUrl,
    activeCheck.platformName,
    activeCheck.productTitle
  );

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

        <div className="flex flex-wrap items-center gap-2">
          <a
            href={directListingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="budol-btn-secondary px-3.5 py-2 text-xs"
          >
            <span>Open Listing on {activeCheck.platformName}</span>
            <ExternalLinkIcon size={13} />
          </a>
          <button
            type="button"
            onClick={() => navigateTo('redflags')}
            className="budol-btn-primary px-4 py-2 text-xs"
          >
            <span>Inspect Red Flags</span>
            <ArrowRightIcon size={15} />
          </button>
        </div>
      </div>

      <div className="budol-card bg-butter p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <PlatformBadgeSvg platform={activeCheck.platformName} />
              <span className="sticker bg-white text-caution">
                {activeCheck.marketing.hypeScoreLabel}
              </span>
            </div>
            <h1 className="font-editorial mt-2 text-2xl font-bold text-ink">
              Marketing & Promo Tactics Check
            </h1>
            <p className="mt-1 text-sm font-normal text-ink-muted">
              {activeCheck.marketing.summary}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {activeCheck.marketing.tactics.map((tactic) => {
          const badgeStyle =
            tactic.severity === 'high'
              ? 'bg-flag text-white'
              : tactic.severity === 'medium'
              ? 'bg-gold text-ink'
              : 'bg-forest text-white';

          return (
            <div
              key={tactic.id}
              className={`budol-card flex flex-col justify-between p-5 ${
                tactic.severity === 'high'
                  ? 'bg-blush'
                  : tactic.severity === 'medium'
                  ? 'bg-butter'
                  : 'bg-mint'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className={`sticker ${badgeStyle}`}>
                    {tactic.badgeText}
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                    {tactic.severity} impact
                  </span>
                </div>

                <h2 className="font-editorial mt-3 text-base font-bold text-ink">
                  {tactic.type}
                </h2>
                <p className="mt-1.5 text-xs font-normal leading-relaxed text-ink-muted">
                  {tactic.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const BudolRedFlagsView: React.FC = () => {
  const activeCheck = useBudolStore((s) => s.activeCheck);
  const role = useBudolStore((s) => s.role);
  const navigateTo = useBudolStore((s) => s.navigateTo);
  const setAdminConsoleTab = useBudolStore((s) => s.setAdminConsoleTab);
  const submitReportToAdminQueue = useBudolStore((s) => s.submitReportToAdminQueue);
  const directListingUrl = resolveListingExternalUrl(
    activeCheck.sourceUrl,
    activeCheck.platformName,
    activeCheck.productTitle
  );

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

        <div className="flex flex-wrap items-center gap-2">
          <a
            href={directListingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="budol-btn-secondary px-3.5 py-2 text-xs"
          >
            <span>Open Listing on {activeCheck.platformName}</span>
            <ExternalLinkIcon size={13} />
          </a>
          <button
            type="button"
            onClick={() => {
              void submitReportToAdminQueue({
                productTitle: activeCheck.productTitle,
                subtitle: `${activeCheck.seller.storeName} • ${activeCheck.redFlags.riskLabel}`,
                platform: activeCheck.platformName,
                flagReason:
                  activeCheck.redFlags.items[0]?.title ||
                  'Flagged from Red Flags Scanner',
                reportCategory: 'report',
                priceAnomaly: `${formatCurrency(activeCheck.listedPricePhp)} (${activeCheck.redFlags.riskLabel})`,
                illustrationKey: activeCheck.illustrationKey,
                thumbnailUrl: activeCheck.imageUrls?.[0],
                sourceUrl: activeCheck.sourceUrl,
              });
              if (role === 'admin') {
                setAdminConsoleTab('reports');
              }
            }}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border-[1.5px] border-ink bg-flag px-3.5 py-2 text-xs font-bold text-white shadow-crisp"
          >
            <AlertIcon size={13} />
            <span>{role === 'admin' ? 'Escalate to Queue' : 'Report Listing'}</span>
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
      </div>

      <div className="budol-card flex flex-col justify-between gap-4 bg-blush p-5 sm:flex-row sm:items-center">
        <div>
          <PlatformBadgeSvg platform={activeCheck.platformName} />
          <h1 className="font-editorial mt-2 text-2xl font-bold text-ink">
            Budol Red Flags Scanner
          </h1>
          <p className="mt-1 text-sm font-normal text-ink-muted">
            Automated risk diagnostics for{' '}
            <strong className="font-semibold text-ink">
              {activeCheck.productTitle}
            </strong>
          </p>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border-[1.5px] border-ink bg-cream px-4 py-3 shadow-crisp">
          <AnimatedRiskGauge score={activeCheck.redFlags.riskScore} />
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
              Composite Risk
            </span>
            <p className="text-sm font-bold text-ink">
              {activeCheck.redFlags.riskLabel}
            </p>
          </div>
        </div>
      </div>

      <Stagger className="space-y-3.5">
        {activeCheck.redFlags.items.map((flag) => {
          const pillColors =
            flag.severity === 'HIGH'
              ? 'bg-flag text-white'
              : flag.severity === 'MEDIUM'
              ? 'bg-gold text-ink'
              : 'bg-forest text-white';

          const cardSurface =
            flag.severity === 'HIGH'
              ? 'bg-blush'
              : flag.severity === 'MEDIUM'
              ? 'bg-butter'
              : 'bg-mint';

          return (
            <StaggerItem key={flag.id}>
            <div className={`budol-card p-5 ${cardSurface}`}>
              <div className="flex items-start gap-3.5">
                <span className={`sticker mt-0.5 shrink-0 ${pillColors}`}>
                  <AlertIcon size={13} />
                  <span>{flag.severity}</span>
                </span>
                <div>
                  <h2 className="font-editorial text-base font-bold text-ink">
                    {flag.title}
                  </h2>
                  <p className="mt-1 text-sm font-normal leading-relaxed text-ink-muted">
                    {flag.description}
                  </p>
                </div>
              </div>
            </div>
            </StaggerItem>
          );
        })}
      </Stagger>
    </div>
  );
};

export const FinalSummaryView: React.FC = () => {
  const activeCheck = useBudolStore((s) => s.activeCheck);
  const savedCheckIds = useBudolStore((s) => s.savedCheckIds);
  const navigateTo = useBudolStore((s) => s.navigateTo);
  const toggleSavedCheck = useBudolStore((s) => s.toggleSavedCheck);
  const showToast = useBudolStore((s) => s.showToast);

  const isSaved = savedCheckIds.includes(activeCheck.id);

  const handleShare = async () => {
    const lines = [
      `BudolCheck report: ${activeCheck.productTitle} (${activeCheck.platformName})`,
      `Verdict: ${activeCheck.finalSummary.verdictTitle}`,
      `Risk: ${activeCheck.redFlags.riskLabel}`,
      `Verified: ${activeCheck.finalSummary.checkedAndVerified.length} | Needs verification: ${activeCheck.finalSummary.needsVerification.length}`,
      'Check First. Budol Later.',
    ];
    const text = lines.join('\n');
    try {
      if (navigator.share) {
        await navigator.share({ title: 'BudolCheck report', text });
        return;
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      }
    } catch {
      return;
    }
    showToast('Report summary copied to clipboard');
  };

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

        <div className="flex flex-wrap items-center gap-2">
          <a
            href={resolveListingExternalUrl(
              activeCheck.sourceUrl,
              activeCheck.platformName,
              activeCheck.productTitle
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="budol-btn-secondary px-3.5 py-2 text-xs"
          >
            <span>Visit Listing on {activeCheck.platformName}</span>
            <ExternalLinkIcon size={14} />
          </a>

          <button
            type="button"
            onClick={() => toggleSavedCheck(activeCheck.id)}
            className="budol-btn-secondary px-3.5 py-2 text-xs"
          >
            <HeartIcon size={15} filled={isSaved} />
            <span>{isSaved ? 'Saved' : 'Save Check'}</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="budol-btn-secondary px-3.5 py-2 text-xs"
          >
            <ShareIcon size={15} />
            <span>Share Report</span>
          </button>
        </div>
      </div>

      <div className="budol-card bg-butter p-6">
        <div className="flex flex-wrap items-center gap-2">
          <PlatformBadgeSvg platform={activeCheck.platformName} />
          <span className="sticker bg-cream text-ink">
            Final Verification Scorecard
          </span>
        </div>

        <h1 className="font-editorial mt-2.5 text-2xl font-bold text-ink">
          {activeCheck.finalSummary.verdictTitle}
        </h1>
        <p className="mt-1 text-sm font-normal text-ink-muted">
          {activeCheck.finalSummary.verdictSubtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="budol-card bg-mint p-5">
          <div className="flex items-center justify-between border-b border-ink/15 pb-3">
            <h2 className="font-editorial text-lg font-bold text-verified">
              Checked and Verified
            </h2>
            <span className="sticker bg-white tabular-nums text-verified">
              {activeCheck.finalSummary.checkedAndVerified.length} Passed
            </span>
          </div>

          <ul className="mt-4 space-y-2.5">
            {activeCheck.finalSummary.checkedAndVerified.map((item, idx) => (
              <li
                key={item}
                className="flex items-start gap-3 rounded-xl border-[1.5px] border-ink bg-white p-3 text-sm font-normal text-ink shadow-crisp"
              >
                <AnimatedCheckCircle passed delayMs={idx * 80} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="budol-card bg-blush p-5">
          <div className="flex items-center justify-between border-b border-ink/15 pb-3">
            <h2 className="font-editorial text-lg font-bold text-flag">
              Needs Verification
            </h2>
            <span className="sticker bg-white tabular-nums text-flag">
              {activeCheck.finalSummary.needsVerification.length} Action Items
            </span>
          </div>

          <ul className="mt-4 space-y-2.5">
            {activeCheck.finalSummary.needsVerification.map((item, idx) => (
              <li
                key={item}
                className="flex items-start gap-3 rounded-xl border-[1.5px] border-ink bg-white p-3 text-sm font-normal text-ink shadow-crisp"
              >
                <AnimatedCheckCircle passed={false} delayMs={idx * 80} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="budol-card flex flex-wrap items-center justify-between gap-3 p-4">
        <button
          type="button"
          onClick={() => navigateTo('product', 'overview')}
          className="budol-btn-secondary text-xs"
        >
          <ArrowLeftIcon size={15} />
          <span>Review Product Specs</span>
        </button>

        <button
          type="button"
          onClick={() => navigateTo('compare')}
          className="budol-btn-primary text-xs"
        >
          <span>Compare Prices Across Platforms</span>
          <ArrowRightIcon size={15} />
        </button>
      </div>
    </div>
  );
};
