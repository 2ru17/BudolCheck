import React from 'react';

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
  variant: 'cupmat' | 'earbuds' | 'serum' | 'coaster' | 'cat' | 'rabbit' | 'car';
  size?: number;
}> = ({ variant, size = 72 }) => {
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
  platform: 'Shopee' | 'Lazada' | 'TikTok Shop' | 'Temu';
}> = ({ platform }) => {
  const colorMap: Record<string, { bg: string; text: string; label: string }> = {
    Shopee: { bg: '#EE4D2D', text: '#FFFFFF', label: 'S' },
    Lazada: { bg: '#0F146D', text: '#FFFFFF', label: 'L' },
    'TikTok Shop': { bg: '#111111', text: '#FFFFFF', label: 'T' },
    Temu: { bg: '#F97316', text: '#FFFFFF', label: 'M' },
  };
  const badge = colorMap[platform] || colorMap['TikTok Shop'];

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
