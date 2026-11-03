import React, { useEffect, useRef, useState } from 'react';
import anime from 'animejs';

export const AnimatedCheckCircle: React.FC<{
  passed: boolean;
  delayMs?: number;
}> = ({ passed, delayMs = 0 }) => {
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    if (!pathRef.current) return;
    const el = pathRef.current;
    const length = el.getTotalLength ? el.getTotalLength() : 24;
    el.style.strokeDasharray = `${length}`;
    el.style.strokeDashoffset = `${length}`;

    const anim = anime({
      targets: el,
      strokeDashoffset: [length, 0],
      easing: 'easeOutQuart',
      duration: 520,
      delay: delayMs,
    });

    return () => {
      anim.pause();
    };
  }, [passed, delayMs]);

  return (
    <span
      className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-ink ${
        passed ? 'bg-verified text-white' : 'bg-flag text-white'
      }`}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
        {passed ? (
          <path
            ref={pathRef}
            d="M5 13l4 4L19 7"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          <path
            ref={pathRef}
            d="M18 6L6 18M6 6l12 12"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        )}
      </svg>
    </span>
  );
};

export const AnimatedRiskGauge: React.FC<{ score: number }> = ({ score }) => {
  const arcRef = useRef<SVGPathElement>(null);
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    const counterObj = { val: 0 };
    const counterAnim = anime({
      targets: counterObj,
      val: score,
      round: 1,
      easing: 'easeOutExpo',
      duration: 900,
      update: () => {
        setDisplayScore(counterObj.val);
      },
    });

    if (arcRef.current) {
      const totalLength = 126;
      const targetOffset = totalLength - (totalLength * Math.min(100, Math.max(0, score))) / 100;
      arcRef.current.style.strokeDasharray = `${totalLength}`;
      arcRef.current.style.strokeDashoffset = `${totalLength}`;

      anime({
        targets: arcRef.current,
        strokeDashoffset: [totalLength, targetOffset],
        easing: 'easeOutExpo',
        duration: 950,
      });
    }

    return () => {
      counterAnim.pause();
    };
  }, [score]);

  const strokeColor =
    score >= 70 ? '#D9383A' : score >= 40 ? '#D97706' : '#3B6E38';

  return (
    <div className="flex items-center gap-4">
      <div className="relative flex h-16 w-28 items-end justify-center">
        <svg width="110" height="62" viewBox="0 0 100 56" fill="none">
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            stroke="#E4DEC8"
            strokeWidth="9"
            strokeLinecap="round"
          />
          <path
            ref={arcRef}
            d="M 10 50 A 40 40 0 0 1 90 50"
            stroke={strokeColor}
            strokeWidth="9"
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute bottom-0.5 text-base font-extrabold tabular-nums text-ink">
          {displayScore}/100
        </span>
      </div>
    </div>
  );
};
