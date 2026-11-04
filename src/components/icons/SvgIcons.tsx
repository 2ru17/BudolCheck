import React from 'react';
import { IllustrationKey } from '../../types/budol.ts';

interface IconProps {
  className?: string;
  size?: number;
}

export const ShoppingBagMascotSvg: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 120,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="BudolCheck Shopping Bag Mascot"
  >
    <path
      d="M42 42C42 26 50 18 60 18C70 18 78 26 78 42"
      stroke="#2C2623"
      strokeWidth="5"
      strokeLinecap="round"
    />
    <path
      d="M48 42C48 31 53 24 60 24C67 24 72 31 72 42"
      stroke="#2C2623"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeDasharray="2 3"
    />
    <path
      d="M24 40L32 104H88L96 40H24Z"
      fill="#FAD6B8"
      stroke="#2C2623"
      strokeWidth="4"
      strokeLinejoin="round"
    />
    <path d="M33 41L39 103" stroke="#E5B896" strokeWidth="3" />
    <circle cx="48" cy="65" r="4" fill="#2C2623" />
    <circle cx="72" cy="65" r="4" fill="#2C2623" />
    <path
      d="M50 77C55 84 65 84 70 77"
      stroke="#2C2623"
      strokeWidth="3.5"
      strokeLinecap="round"
    />
    <circle cx="42" cy="73" r="3.5" fill="#F09B8B" />
    <circle cx="78" cy="73" r="3.5" fill="#F09B8B" />
  </svg>
);

export const ProductIllustrationSvg: React.FC<{
  variant: IllustrationKey;
  size?: number;
}> = ({ variant, size = 72 }) => {
  if (variant === 'phonecase') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <rect x="28" y="14" width="44" height="72" rx="11" fill="#DCE9F6" stroke="#2C2623" strokeWidth="3" />
        <rect x="33" y="20" width="16" height="22" rx="5" fill="#FFFFFF" stroke="#2C2623" strokeWidth="2.4" />
        <circle cx="41" cy="26" r="3" fill="#2C2623" />
        <circle cx="41" cy="35" r="3" fill="#2C2623" />
        <circle cx="50" cy="56" r="11" stroke="#3E5634" strokeWidth="2.5" strokeDasharray="4 3" />
        <line x1="50" y1="68" x2="50" y2="76" stroke="#3E5634" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  }

  if (variant === 'shoes') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <path
          d="M16 66C16 56 26 52 36 48L48 34C52 34 56 40 60 44C69 48 84 50 86 62V70H16V66Z"
          fill="#E4EFE0"
          stroke="#2C2623"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <rect x="14" y="68" width="74" height="9" rx="4" fill="#FFFFFF" stroke="#2C2623" strokeWidth="2.8" />
        <path d="M36 56L54 62" stroke="#3E5634" strokeWidth="3" strokeLinecap="round" />
        <line x1="44" y1="42" x2="50" y2="45" stroke="#2C2623" strokeWidth="2.4" strokeLinecap="round" />
        <line x1="40" y1="47" x2="46" y2="50" stroke="#2C2623" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    );
  }

  if (variant === 'bag') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <path d="M36 36C36 22 42 16 50 16C58 16 64 22 64 36" stroke="#2C2623" strokeWidth="3.2" strokeLinecap="round" />
        <path d="M24 36H76L80 82H20L24 36Z" fill="#FAD6B8" stroke="#2C2623" strokeWidth="3" strokeLinejoin="round" />
        <rect x="38" y="50" width="24" height="18" rx="4" fill="#FFFDF9" stroke="#2C2623" strokeWidth="2.2" />
        <circle cx="50" cy="43" r="2.5" fill="#2C2623" />
      </svg>
    );
  }

  if (variant === 'dress') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <path
          d="M38 18L44 26H56L62 18L70 28L62 42L76 82H24L38 42L30 28L38 18Z"
          fill="#FCE2DF"
          stroke="#2C2623"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <line x1="38" y1="44" x2="62" y2="44" stroke="#2C2623" strokeWidth="2.4" />
      </svg>
    );
  }

  if (variant === 'watch') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <rect x="41" y="14" width="18" height="72" rx="5" fill="#FDEEC8" stroke="#2C2623" strokeWidth="2.6" />
        <circle cx="50" cy="50" r="21" fill="#FFFFFF" stroke="#2C2623" strokeWidth="3" />
        <polyline points="50,38 50,50 58,54" stroke="#2C2623" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (variant === 'earbuds') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <rect x="20" y="28" width="60" height="50" rx="18" fill="#F3F4F6" stroke="#2C2623" strokeWidth="3" />
        <line x1="20" y1="48" x2="80" y2="48" stroke="#2C2623" strokeWidth="2.5" />
        <rect x="44" y="54" width="12" height="6" rx="3" fill="#D9383A" />
        <path d="M35 28V20C35 15 43 15 43 20V28" fill="#FFFFFF" stroke="#2C2623" strokeWidth="2.5" />
        <path d="M57 28V20C57 15 65 15 65 20V28" fill="#FFFFFF" stroke="#2C2623" strokeWidth="2.5" />
      </svg>
    );
  }

  if (variant === 'serum') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <rect x="34" y="38" width="32" height="46" rx="8" fill="#D97706" stroke="#2C2623" strokeWidth="3" />
        <rect x="38" y="48" width="24" height="24" rx="3" fill="#FFFFFF" stroke="#2C2623" strokeWidth="2" />
        <rect x="42" y="28" width="16" height="10" rx="2" fill="#2C2623" />
        <path d="M46 28V18C46 14 54 14 54 18V28" fill="#FAD6B8" stroke="#2C2623" strokeWidth="2.5" />
      </svg>
    );
  }

  if (variant === 'rabbit') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <ellipse cx="38" cy="24" rx="7" ry="15" fill="#FCE7F3" stroke="#2C2623" strokeWidth="2.5" />
        <ellipse cx="62" cy="24" rx="7" ry="15" fill="#FCE7F3" stroke="#2C2623" strokeWidth="2.5" />
        <circle cx="50" cy="56" r="30" fill="#FCE7F3" stroke="#2C2623" strokeWidth="3" />
        <circle cx="41" cy="52" r="3.5" fill="#2C2623" />
        <circle cx="59" cy="52" r="3.5" fill="#2C2623" />
        <circle cx="50" cy="60" r="3" fill="#D9383A" />
      </svg>
    );
  }

  if (variant === 'cat') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <polygon points="26,42 30,18 46,32" fill="#FDE68A" stroke="#2C2623" strokeWidth="2.5" />
        <polygon points="74,42 70,18 54,32" fill="#FDE68A" stroke="#2C2623" strokeWidth="2.5" />
        <circle cx="50" cy="54" r="30" fill="#FDE68A" stroke="#2C2623" strokeWidth="3" />
        <circle cx="40" cy="50" r="3.5" fill="#2C2623" />
        <circle cx="60" cy="50" r="3.5" fill="#2C2623" />
        <path d="M45 60Q50 65 55 60" stroke="#2C2623" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  }

  if (variant === 'umbrella') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <path
          d="M14 50C14 28 30 16 50 16C70 16 86 28 86 50C77 45 68 45 62 50C55 45 45 45 38 50C32 45 23 45 14 50Z"
          fill="#374151"
          stroke="#2C2623"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path d="M50 16C42 26 38 38 38 50" stroke="#9CA3AF" strokeWidth="2.2" />
        <path d="M50 16C58 26 62 38 62 50" stroke="#9CA3AF" strokeWidth="2.2" />
        <line x1="50" y1="12" x2="50" y2="16" stroke="#2C2623" strokeWidth="3" strokeLinecap="round" />
        <path
          d="M50 50V78C50 83 45 86 41 86C37 86 34 83 34 79"
          stroke="#2C2623"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (variant === 'mouse') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <rect
          x="29"
          y="16"
          width="42"
          height="68"
          rx="21"
          fill="#DCE9F6"
          stroke="#2C2623"
          strokeWidth="3"
        />
        <line x1="50" y1="16" x2="50" y2="44" stroke="#2C2623" strokeWidth="2.4" />
        <line x1="29" y1="44" x2="71" y2="44" stroke="#2C2623" strokeWidth="2.4" />
        <rect x="46" y="25" width="8" height="14" rx="4" fill="#3E5634" stroke="#2C2623" strokeWidth="2" />
      </svg>
    );
  }

  if (variant === 'massager') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <rect x="22" y="24" width="46" height="24" rx="10" fill="#E4EFE0" stroke="#2C2623" strokeWidth="3" />
        <rect x="68" y="30" width="8" height="12" rx="2" fill="#2C2623" />
        <circle cx="80" cy="36" r="8" fill="#FAD6B8" stroke="#2C2623" strokeWidth="2.8" />
        <path
          d="M34 48L40 82C41 85 43 86 46 86H52C55 86 57 84 56 81L50 48"
          fill="#FFFFFF"
          stroke="#2C2623"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <circle cx="36" cy="36" r="4" fill="#3E5634" />
      </svg>
    );
  }

  if (variant === 'coaster') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <polygon
          points="50,16 82,32 82,68 50,84 18,68 18,32"
          fill="#FAD6B8"
          stroke="#2C2623"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <polyline points="18,32 50,48 82,32" stroke="#2C2623" strokeWidth="2.6" strokeLinejoin="round" />
        <line x1="50" y1="48" x2="50" y2="84" stroke="#2C2623" strokeWidth="2.6" />
        <line x1="34" y1="24" x2="66" y2="40" stroke="#3E5634" strokeWidth="2.6" strokeLinecap="round" />
      </svg>
    );
  }

  if (variant === 'car') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="36" fill="#E5E7EB" stroke="#2C2623" strokeWidth="3" />
        <circle cx="50" cy="50" r="26" fill="#FFFFFF" stroke="#2C2623" strokeWidth="2" strokeDasharray="4 4" />
        <circle cx="50" cy="50" r="8" fill="#3E5634" />
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <circle cx="28" cy="24" r="12" fill="#E6A875" stroke="#2C2623" strokeWidth="2.5" />
      <circle cx="72" cy="24" r="12" fill="#E6A875" stroke="#2C2623" strokeWidth="2.5" />
      <circle cx="28" cy="24" r="6" fill="#FAD6B8" />
      <circle cx="72" cy="24" r="6" fill="#FAD6B8" />
      <circle cx="50" cy="52" r="36" fill="#FDE2CB" stroke="#2C2623" strokeWidth="3" />
      <circle cx="39" cy="46" r="4" fill="#2C2623" />
      <circle cx="61" cy="46" r="4" fill="#2C2623" />
      <ellipse cx="50" cy="58" rx="11" ry="8" fill="#FFFFFF" stroke="#2C2623" strokeWidth="2" />
      <polygon points="50,53 46,58 54,58" fill="#2C2623" />
      <path d="M46 60C48 63 52 63 54 60" stroke="#2C2623" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
};

export const PlatformBadgeSvg: React.FC<{
  platform: 'Shopee' | 'Lazada' | 'Temu';
}> = ({ platform }) => {
  const colorMap: Record<string, { bg: string; text: string; label: string }> = {
    Shopee: { bg: '#EE4D2D', text: '#FFFFFF', label: 'S' },
    Lazada: { bg: '#0F146D', text: '#FFFFFF', label: 'L' },
    Temu: { bg: '#F97316', text: '#FFFFFF', label: 'M' },
  };
  const badge = colorMap[platform] || colorMap.Shopee;

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-ink bg-white px-2.5 py-0.5 text-xs font-semibold text-ink shadow-crisp">
      <span
        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold"
        style={{ backgroundColor: badge.bg, color: badge.text }}
      >
        {badge.label}
      </span>
      <span>{platform}</span>
    </span>
  );
};

export const SearchIcon: React.FC<IconProps> = ({ className = '', size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

export const ClipboardIcon: React.FC<IconProps> = ({ className = '', size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
  </svg>
);

export const UploadIcon: React.FC<IconProps> = ({ className = '', size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

export const BookIcon: React.FC<IconProps> = ({ className = '', size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);

export const RefreshIcon: React.FC<IconProps> = ({ className = '', size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 2v6h-6" />
    <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
    <path d="M3 22v-6h6" />
    <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
  </svg>
);

export const CartIcon: React.FC<IconProps> = ({ className = '', size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);

export const HeartIcon: React.FC<IconProps & { filled?: boolean }> = ({
  className = '',
  size = 16,
  filled = false,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={filled ? '#D9383A' : 'none'}
    stroke={filled ? '#D9383A' : 'currentColor'}
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

export const StarIcon: React.FC<IconProps & { filled?: boolean }> = ({
  className = '',
  size = 14,
  filled = true,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={filled ? '#F5B82E' : 'none'}
    stroke="#2C2623"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

export const ShieldIcon: React.FC<IconProps> = ({ className = '', size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export const AlertIcon: React.FC<IconProps> = ({ className = '', size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

export const TagIcon: React.FC<IconProps> = ({ className = '', size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
    <path d="M7 7h.01" />
  </svg>
);

export const ChecklistIcon: React.FC<IconProps> = ({ className = '', size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="5" width="6" height="6" rx="1" />
    <path d="m3 17 2 2 4-4" />
    <path d="M13 6h8" />
    <path d="M13 12h8" />
    <path d="M13 18h8" />
  </svg>
);

export const ArrowLeftIcon: React.FC<IconProps> = ({ className = '', size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M19 12H5" />
    <path d="m12 19-7-7 7-7" />
  </svg>
);

export const ArrowRightIcon: React.FC<IconProps> = ({ className = '', size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);

export const HomeIcon: React.FC<IconProps> = ({ className = '', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

export const ClockIcon: React.FC<IconProps> = ({ className = '', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

export const BookmarkIcon: React.FC<IconProps> = ({ className = '', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);

export const UserIcon: React.FC<IconProps> = ({ className = '', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export const ShareIcon: React.FC<IconProps> = ({ className = '', size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

const strokeProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export const CloseIcon: React.FC<IconProps> = ({ className = '', size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...strokeProps} className={className}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

export const ChevronLeftIcon: React.FC<IconProps> = ({ className = '', size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...strokeProps} className={className}>
    <path d="m15 18-6-6 6-6" />
  </svg>
);

export const ChevronRightIcon: React.FC<IconProps> = ({ className = '', size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...strokeProps} className={className}>
    <path d="m9 18 6-6-6-6" />
  </svg>
);

export const ZoomInIcon: React.FC<IconProps> = ({ className = '', size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...strokeProps} className={className}>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
    <path d="M11 8v6" />
    <path d="M8 11h6" />
  </svg>
);

export const ZoomOutIcon: React.FC<IconProps> = ({ className = '', size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...strokeProps} className={className}>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
    <path d="M8 11h6" />
  </svg>
);

export const ExpandIcon: React.FC<IconProps> = ({ className = '', size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...strokeProps} className={className}>
    <path d="M15 3h6v6" />
    <path d="M9 21H3v-6" />
    <path d="m21 3-7 7" />
    <path d="m3 21 7-7" />
  </svg>
);

export const EditIcon: React.FC<IconProps> = ({ className = '', size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...strokeProps} className={className}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);

export const CheckIcon: React.FC<IconProps> = ({ className = '', size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...strokeProps} className={className}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

export const LogOutIcon: React.FC<IconProps> = ({ className = '', size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...strokeProps} className={className}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

export const ExternalLinkIcon: React.FC<IconProps> = ({ className = '', size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...strokeProps} className={className}>
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);
