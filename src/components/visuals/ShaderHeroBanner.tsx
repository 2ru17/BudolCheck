import React, { Suspense, lazy, useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { getDeviceProfile } from '../../lib/deviceCapability.ts';
import { ArrowRightIcon, ShoppingBagMascotSvg } from '../icons/SvgIcons.tsx';
import { MascotCanvasSkeleton } from './BudolSkeletons.tsx';

const ThreeShoppingBag = lazy(() => import('./ThreeShoppingBag.tsx'));

interface ShaderHeroBannerProps {
  userName?: string;
  onClick?: () => void;
}

const shouldUse3d = (): boolean => {
  const profile = getDeviceProfile();
  return profile.supportsWebGL && !profile.isMobileViewport && !profile.isLowEndHardware;
};

export const ShaderHeroBanner: React.FC<ShaderHeroBannerProps> = React.memo(
  ({ userName = 'Daisy', onClick }) => {
    const ref = useRef<HTMLDivElement>(null);
    const reduce = useReducedMotion();
    const { scrollYProgress } = useScroll({
      target: ref,
      offset: ['start start', 'end start'],
    });
    const waveBack = useTransform(scrollYProgress, [0, 1], [0, -36]);
    const waveFront = useTransform(scrollYProgress, [0, 1], [0, -64]);
    const textY = useTransform(scrollYProgress, [0, 1], [0, 24]);
    const use3d = React.useMemo(shouldUse3d, []);

    return (
      <div
        ref={ref}
        className="relative overflow-hidden rounded-3xl border-[1.5px] border-ink text-white shadow-brutal-lg"
        style={{
          backgroundImage:
            'linear-gradient(125deg, #354A2C 0%, #48633C 52%, #6E8C5F 100%)',
        }}
      >
        <motion.svg
          aria-hidden="true"
          style={{ y: reduce ? 0 : waveBack }}
          className="pointer-events-none absolute inset-x-0 bottom-0 h-36 w-full opacity-25"
          viewBox="0 0 800 160"
          preserveAspectRatio="none"
        >
          <path d="M0 90 Q 200 20 400 90 T 800 70 L 800 160 L 0 160 Z" fill="#F8E5D4" />
        </motion.svg>
        <motion.svg
          aria-hidden="true"
          style={{ y: reduce ? 0 : waveFront }}
          className="pointer-events-none absolute inset-x-0 bottom-0 h-24 w-full opacity-20"
          viewBox="0 0 800 120"
          preserveAspectRatio="none"
        >
          <path d="M0 70 Q 260 10 520 70 T 800 50 L 800 120 L 0 120 Z" fill="#2C2623" />
        </motion.svg>

        <div className="relative z-10 grid items-center gap-6 px-6 py-7 md:grid-cols-[1.45fr_1fr] md:px-10 md:py-9">
          <motion.div style={{ y: reduce ? 0 : textY }}>
            <span className="sticker bg-butter text-ink">
              <span className="h-2 w-2 rounded-full border border-ink bg-verified" />
              <span>Hello, {userName}! Ready to check before you budol?</span>
            </span>

            <h1 className="font-editorial mt-4 text-3xl font-bold leading-[1.12] tracking-tight text-white md:text-5xl">
              Check First.{' '}
              <span className="inline-block rounded-xl border-[1.5px] border-ink bg-peach px-3 py-0.5 text-ink shadow-crisp">
                Budol Later.
              </span>
            </h1>

            <p className="mt-4 max-w-xl text-sm font-normal leading-relaxed text-white/95 md:text-[15px]">
              BudolCheck helps you verify if online stores and product listings
              are legitimate before making a purchase across Shopee, Lazada,
              TikTok Shop, and Temu.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              {onClick && (
                <button
                  type="button"
                  onClick={onClick}
                  className="budol-btn-secondary text-xs"
                >
                  <span>Read Buyer Guides</span>
                  <ArrowRightIcon size={14} />
                </button>
              )}
              <span className="text-xs font-medium text-white/85">
                6-point automated verification in seconds
              </span>
            </div>
          </motion.div>

          <div className="relative hidden items-center justify-center md:flex">
            <div className="flex h-52 w-52 items-center justify-center rounded-3xl border-[1.5px] border-ink bg-cream/95 p-3 shadow-brutal">
              {use3d ? (
                <Suspense fallback={<MascotCanvasSkeleton size={200} />}>
                  <ThreeShoppingBag size={200} />
                </Suspense>
              ) : (
                <div className="animate-float">
                  <ShoppingBagMascotSvg size={160} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

ShaderHeroBanner.displayName = 'ShaderHeroBanner';
