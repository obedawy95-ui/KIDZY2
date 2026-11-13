import React from 'react';

export type KidzyLogoVariant = 'teal' | 'cream' | 'yellow-cream' | 'aqua-teal' | 'mono-dark' | 'mono-light';

interface KidzyWordmarkProps {
  variant?: KidzyLogoVariant;
  className?: string;
  showTagline?: boolean;
  taglineBilingual?: string;
}

const WORDMARK_COLORS: Record<KidzyLogoVariant, { main: string; star: string; tagline: string }> = {
  // Brandbook Approved Pairings (p. 25–29):
  teal: { main: '#01AFC5', star: '#FEC448', tagline: '#007C8D' },
  cream: { main: '#FEF4E3', star: '#FEC448', tagline: '#FEF4E3' },
  'yellow-cream': { main: '#FEF4E3', star: '#01AFC5', tagline: '#063B44' },
  'aqua-teal': { main: '#01AFC5', star: '#FEC448', tagline: '#063B44' },
  'mono-dark': { main: '#063B44', star: '#063B44', tagline: '#063B44' },
  'mono-light': { main: '#FEF4E3', star: '#FEF4E3', tagline: '#FEF4E3' },
};

/**
 * Official Kidzy Primary & Secondary Wordmark SVG extracted directly from
 * Kidzy Brand Guidelines 2026 (Pages 8–10).
 * Strictly follows Page 38 rules: solid brand fills, no drop shadows,
 * no gradients, no rotation, no distortion, preserve clear space.
 */
export const KidzyWordmark: React.FC<KidzyWordmarkProps> = ({
  variant = 'teal',
  className = 'h-9 w-auto',
  showTagline = false,
  taglineBilingual,
}) => {
  const palette = WORDMARK_COLORS[variant];

  return (
    <span className="inline-flex flex-col items-center select-none" dir="ltr">
      <svg
        viewBox="0 0 461.11 211.93"
        preserveAspectRatio="xMidYMid meet"
        className={className}
        role="img"
        aria-label="Kidzy official brand logo"
        fill="none"
      >
        {/* K + sweeping smile */}
        <path
          d="M113.13 178.36C94.19 160.00 80.13 135.09 69.42 110.88C68.49 121.91 66.50 132.22 63.23 142.49C60.15 152.26 56.21 161.55 51.50 170.63C47.04 179.50 41.79 187.74 36.36 195.97C31.31 203.63 21.29 205.88 13.67 200.90C6.08 195.93 4.00 185.62 9.26 178.01C24.60 155.84 37.82 128.36 37.17 100.85C36.89 89.17 34.21 77.85 28.66 67.57C25.56 61.83 21.97 56.20 17.06 51.91C10.12 45.84 8.76 35.82 14.70 28.66C20.41 21.78 30.89 20.73 37.81 26.81C41.71 30.25 45.09 34.02 48.28 38.20C56.97 49.57 63.07 62.52 66.51 76.46C71.00 74.65 75.22 72.46 79.14 69.57C86.76 63.94 91.91 56.00 93.83 46.66C95.23 39.86 95.50 32.78 93.92 25.97C91.81 16.84 97.17 7.88 106.31 5.92C115.22 4.00 124.12 9.87 125.71 19.11C128.07 30.63 127.97 42.59 125.43 54.08C121.70 70.93 112.15 85.60 98.25 95.76C103.58 108.20 109.54 119.97 116.72 131.22C120.97 137.88 125.53 144.10 130.78 149.97C138.67 158.73 146.20 164.43 157.09 169.00C175.32 176.64 193.43 173.29 210.45 164.17C217.92 160.16 224.87 155.47 231.43 150.13C238.54 144.34 248.81 145.30 254.52 152.34C260.25 159.39 259.05 169.83 251.77 175.48C245.93 180.02 240.09 184.30 233.75 188.19C226.68 192.52 219.49 196.24 211.72 199.19C192.96 206.32 173.51 207.93 154.12 202.26C138.68 197.75 124.66 189.53 113.13 178.36Z"
          fill={palette.main}
        />
        {/* i stem */}
        <path
          d="M180.26 127.79C181.57 137.77 175.47 145.88 165.98 146.68C156.26 147.51 148.66 141.23 147.96 131.56L147.43 124.26L145.85 104.29L145.15 89.20C144.87 83.19 146.04 77.63 150.34 73.79C154.56 70.03 160.50 68.73 166.22 70.03C173.16 71.62 177.71 76.67 177.99 83.90L178.75 103.27L179.34 111.83C179.70 117.00 179.54 122.26 180.26 127.79Z"
          fill={palette.main}
        />
        {/* 5-pointed rounded star above i */}
        <path
          d="M160.57 55.42L150.55 61.25C149.35 61.95 146.91 62.16 145.72 61.54C144.68 61.00 143.05 58.96 143.22 57.74L144.90 45.06L136.75 38.14C135.27 36.88 134.13 35.16 134.49 33.30C134.81 31.57 136.61 29.83 138.53 29.46L150.41 27.16L155.20 16.25C155.96 14.51 158.16 13.39 159.75 13.34C161.51 13.28 163.54 14.27 164.42 16.03L169.58 26.38L181.00 28.05C182.72 28.31 184.68 29.29 185.29 30.56C187.54 35.24 181.25 39.57 176.32 43.84L178.07 53.92C178.49 56.34 178.47 58.64 176.51 60.02C174.73 61.26 172.46 61.50 170.25 60.37Z"
          fill={palette.star}
        />
        {/* d (evenodd ensures clean open bowl regardless of subpath direction) */}
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M230.82 112.86C238.13 111.44 241.95 105.03 240.72 98.40C239.66 92.70 233.46 87.82 227.42 89.24C220.52 90.87 216.92 96.40 217.62 103.04C218.22 108.74 224.38 114.12 230.82 112.86ZM247.21 133.79C240.85 137.37 234.51 139.92 227.26 140.34C206.96 141.50 189.90 126.27 188.07 106.05C186.85 92.63 192.68 78.26 203.83 70.31C214.01 63.06 226.04 61.48 237.55 65.20L236.13 48.33C235.68 43.03 238.04 37.73 242.22 35.02C247.58 31.54 253.80 31.17 258.93 34.07C264.48 37.21 265.76 42.68 266.38 49.05L267.81 63.76L273.53 119.30C273.81 122.11 274.38 125.30 273.75 127.95C272.51 133.09 268.25 137.12 263.64 138.55C257.39 140.48 251.48 138.90 247.21 133.79Z"
          fill={palette.main}
        />
        {/* z */}
        <path
          d="M305.95 133.35C295.02 134.53 287.44 134.29 283.84 123.02C282.17 117.78 283.62 112.52 287.00 108.18L308.27 80.86L295.08 82.33C287.63 83.17 281.31 78.67 280.03 70.90C278.96 64.34 283.45 56.07 290.86 55.27L331.61 50.86C336.81 50.29 342.66 51.13 346.16 55.31C351.71 61.94 350.33 70.95 345.15 77.42L324.28 103.49L331.91 102.59C336.29 102.08 341.13 100.76 345.62 101.85C352.48 103.50 356.21 110.83 355.32 117.27C354.36 124.21 348.64 128.76 341.68 129.50Z"
          fill={palette.main}
        />
        {/* y */}
        <path
          d="M418.23 121.28C411.42 123.96 404.80 126.30 397.28 125.81C380.43 124.70 366.56 112.33 363.54 95.57C361.38 83.53 361.00 71.48 362.23 59.28C362.92 52.39 368.95 47.51 375.41 46.37C385.14 44.66 394.33 51.25 394.50 61.28L394.86 82.09C394.97 88.51 399.79 95.50 406.50 94.85C414.57 94.06 416.93 85.70 415.87 76.79L413.63 57.90C412.45 47.99 418.43 39.31 427.89 37.68C437.01 36.11 446.60 41.66 448.02 51.62L453.72 91.79L455.24 107.39C457.11 126.75 452.85 147.01 439.80 161.93C426.09 177.61 403.28 182.86 383.90 175.38C374.18 171.63 365.89 165.46 360.92 156.56C356.59 148.79 359.48 140.07 366.22 135.53C373.46 130.64 382.57 132.77 388.03 139.76C391.18 143.79 395.26 146.11 400.10 146.47C404.97 146.82 409.90 145.10 413.23 141.05C416.97 135.45 418.86 128.86 418.23 121.28Z"
          fill={palette.main}
        />
      </svg>
      {showTagline && (
        <span
          className="text-[10px] font-extrabold tracking-[0.22em] uppercase mt-1 leading-none"
          style={{ color: palette.tagline }}
        >
          {taglineBilingual || 'MAKE THEIR DAY. THE KIDZY WAY.'}
        </span>
      )}
    </span>
  );
};

interface KidzyMonogramProps {
  variant?: 'tile-teal' | 'tile-yellow' | 'tile-cream' | 'teal' | 'cream';
  size?: number;
  className?: string;
}

/**
 * Official Kidzy K-Star Monogram extracted from Brandbook Pages 11–12 & 45.
 * Designed for compact headers, avatars, and badges where space is tight.
 */
export const KidzyMonogram: React.FC<KidzyMonogramProps> = ({
  variant = 'tile-teal',
  size = 38,
  className = '',
}) => {
  const isTile = variant.startsWith('tile-');
  const tileBg =
    variant === 'tile-teal'
      ? '#01AFC5'
      : variant === 'tile-yellow'
      ? '#FEC448'
      : variant === 'tile-cream'
      ? '#FEF4E3'
      : 'transparent';

  const kColor =
    variant === 'tile-teal' || variant === 'cream'
      ? '#FEF4E3'
      : variant === 'tile-yellow'
      ? '#FEF4E3'
      : '#01AFC5';

  const starColor =
    variant === 'tile-yellow' ? '#01AFC5' : '#FEC448';

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 select-none ${
        isTile ? 'rounded-xl' : ''
      } ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: isTile ? tileBg : undefined,
        padding: isTile ? Math.max(3, Math.round(size * 0.14)) : 0,
      }}
    >
      <svg
        viewBox="0 0 253.18 205.18"
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full"
        role="img"
        aria-label="Kidzy K monogram"
        fill="none"
      >
        <path
          d="M102.29 164.46C86.48 146.59 76.48 127.90 66.57 106.43C63.91 137.00 51.49 162.94 35.01 187.58C29.94 195.15 20.45 197.41 12.97 192.39C5.66 187.48 4.00 177.69 9.13 170.24C17.08 158.72 23.78 146.69 28.75 133.57C39.23 105.87 38.88 76.27 19.58 52.97L14.32 47.53C8.78 40.86 9.47 31.49 15.58 25.91C21.88 20.16 31.14 20.56 37.46 26.68C50.50 39.30 59.31 55.46 63.77 73.22C86.24 64.31 94.05 46.66 89.94 23.47C88.42 14.91 94.21 7.09 102.23 5.57C110.52 4.00 118.46 9.20 120.41 17.60C126.09 45.70 117.87 74.26 94.19 91.66C103.22 112.24 114.21 132.94 130.26 148.77C135.31 153.60 140.71 157.28 146.96 160.35C174.39 173.83 199.71 161.32 221.96 143.91C228.60 138.71 237.66 139.14 243.37 145.26C248.74 151.01 249.18 160.88 242.88 166.68C236.59 172.48 229.45 177.10 222.06 181.59C199.85 195.05 174.42 201.18 148.98 194.16C130.69 189.10 114.96 178.77 102.29 164.46Z"
          fill={kColor}
        />
        <path
          d="M188.20 44.12C185.89 43.92 183.04 44.77 181.47 46.82L171.49 59.74C170.53 60.96 168.97 62.82 167.38 62.84L148.14 63.12C145.28 63.17 142.83 65.15 141.66 67.24C140.41 69.49 140.41 72.92 142.07 75.14L153.22 89.96C153.99 91.00 154.29 92.66 153.84 93.90L148.29 109.45C147.27 112.27 148.09 115.86 150.28 117.73C152.54 119.65 155.83 119.97 158.62 119.16L173.93 114.64C174.85 114.37 175.65 114.38 176.44 114.58L176.44 114.59C176.45 114.59 176.46 114.59 176.47 114.59C176.48 114.59 176.48 114.59 176.49 114.60L176.49 114.59C177.31 114.65 178.07 114.90 178.85 115.46L191.86 124.71C194.24 126.38 197.46 127.15 200.21 126.07C202.89 125.01 204.83 121.88 204.79 118.88L204.59 102.37C204.56 101.05 205.39 99.58 206.45 98.85L221.81 88.45C224.10 86.89 225.22 83.65 224.77 81.12C224.34 78.75 222.67 76.09 219.98 75.12L201.87 68.59C200.37 68.06 199.50 65.80 199.00 64.33L193.75 48.87C192.92 46.42 190.51 44.69 188.26 44.12Z"
          fill={starColor}
        />
      </svg>
    </span>
  );
};

/**
 * Subtle decorative confetti & Kidzy star motif pattern overlay inspired by Brandbook Pages 31–32.
 * Intended strictly for container banner backdrops (never inside logo marks).
 */
export const KidzyPatternDecor: React.FC<{ variant?: 'dark-banner' | 'cream-card' }> = ({
  variant = 'dark-banner',
}) => {
  const starFill = variant === 'dark-banner' ? '#FEC448' : '#01AFC5';
  const arcStroke = variant === 'dark-banner' ? '#BAEBF1' : '#FEC448';
  const secondaryFill = variant === 'dark-banner' ? '#FEF4E3' : '#BAEBF1';

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 w-full h-full opacity-20"
      viewBox="0 0 800 260"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
    >
      {/* Rounded Kidzy stars */}
      <g transform="translate(690, 28) scale(0.45)">
        <path
          d="M48 8L58 29L81 32C85 33 87 38 83 41L67 57L71 80C72 84 67 88 63 85L43 75L23 85C19 88 14 84 15 80L19 57L3 41C-1 38 1 33 5 32L28 29L38 8C40 4 46 4 48 8Z"
          fill={starFill}
        />
      </g>
      <g transform="translate(55, 180) scale(0.32)">
        <path
          d="M48 8L58 29L81 32C85 33 87 38 83 41L67 57L71 80C72 84 67 88 63 85L43 75L23 85C19 88 14 84 15 80L19 57L3 41C-1 38 1 33 5 32L28 29L38 8C40 4 46 4 48 8Z"
          fill={secondaryFill}
        />
      </g>
      <g transform="translate(560, 175) scale(0.28)">
        <path
          d="M48 8L58 29L81 32C85 33 87 38 83 41L67 57L71 80C72 84 67 88 63 85L43 75L23 85C19 88 14 84 15 80L19 57L3 41C-1 38 1 33 5 32L28 29L38 8C40 4 46 4 48 8Z"
          fill={starFill}
        />
      </g>
      {/* Confetti celebratory arcs */}
      <path d="M620 40 C640 18, 668 25, 675 50" stroke={arcStroke} strokeWidth="6" strokeLinecap="round" />
      <path d="M745 145 C770 155, 775 185, 755 202" stroke={starFill} strokeWidth="6" strokeLinecap="round" />
      <path d="M90 38 C110 18, 140 24, 150 48" stroke={arcStroke} strokeWidth="5" strokeLinecap="round" />
      <path d="M235 215 C255 198, 282 204, 290 226" stroke={secondaryFill} strokeWidth="5" strokeLinecap="round" />
      <circle cx="460" cy="36" r="5" fill={arcStroke} />
      <circle cx="755" cy="88" r="4.5" fill={secondaryFill} />
    </svg>
  );
};
