import React from 'react';

interface AzreGoldMedallionProps {
  size?: number;
  className?: string;
  glow?: boolean;
}

/**
 * High-fidelity vector rendering of the user's uploaded 3D Gold AZRE Monogram Emblem
 * (AZ with inner ring and dot in polished metallic gold)
 */
export const AzreGoldMedallion: React.FC<AzreGoldMedallionProps> = ({
  size = 48,
  className = '',
  glow = true,
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {glow && (
        <div
          className="absolute inset-0 rounded-full blur-md opacity-40 pointer-events-none"
          style={{
            background: 'radial-gradient(circle, #f59e0b 0%, #d97706 60%, transparent 80%)',
          }}
        />
      )}
      <svg
        viewBox="0 0 200 200"
        width={size}
        height={size}
        className="relative drop-shadow-md select-none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Rich metallic gold gradient */}
          <linearGradient id="azGoldGrad" x1="20" y1="20" x2="180" y2="180" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFF2A3" />
            <stop offset="25%" stopColor="#F5BF4F" />
            <stop offset="50%" stopColor="#DF981E" />
            <stop offset="75%" stopColor="#FBD668" />
            <stop offset="100%" stopColor="#B3740A" />
          </linearGradient>

          {/* Rim light highlight */}
          <linearGradient id="azGoldLight" x1="0" y1="0" x2="200" y2="200" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
            <stop offset="40%" stopColor="#F7CE68" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#8A5300" stopOpacity="0.9" />
          </linearGradient>

          {/* Deep gold bevel shadow */}
          <filter id="azBevelShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="2" dy="3" stdDeviation="2" floodColor="#422502" floodOpacity="0.75" />
          </filter>
        </defs>

        {/* Outer Circular Ring */}
        <circle
          cx="100"
          cy="100"
          r="86"
          stroke="url(#azGoldGrad)"
          strokeWidth="14"
          filter="url(#azBevelShadow)"
        />
        <circle
          cx="100"
          cy="100"
          r="86"
          stroke="url(#azGoldLight)"
          strokeWidth="2.5"
          fill="none"
        />

        {/* The "A" Glyph - Left diagonal leg spanning circle, crossbar, and right descent */}
        <path
          d="M 52 148 L 94 48 L 118 48 L 76 148 Z"
          fill="url(#azGoldGrad)"
          filter="url(#azBevelShadow)"
        />
        <path
          d="M 85 96 L 105 110 L 80 110 Z"
          fill="url(#azGoldGrad)"
        />

        {/* The "Z" Glyph - Top bar, sharp diagonal descent, bottom bar */}
        <path
          d="M 106 58 L 158 58 L 158 72 L 126 122 L 160 122 L 160 138 L 96 138 L 96 124 L 132 72 L 106 72 Z"
          fill="url(#azGoldGrad)"
          filter="url(#azBevelShadow)"
        />

        {/* The Gold Dot Accent beside the Z */}
        <circle
          cx="146"
          cy="126"
          r="7.5"
          fill="url(#azGoldGrad)"
          filter="url(#azBevelShadow)"
        />
        <circle
          cx="144"
          cy="124"
          r="3"
          fill="#FFF6C2"
          opacity="0.8"
        />
      </svg>
    </div>
  );
};

interface AzreTextLogoProps {
  layout?: 'horizontal' | 'stacked';
  theme?: 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Exact branded typographic logo:
 * ASHARI (white / black)
 * ZAKAR (vibrant green #00FF66)
 * REAL ESTATE (clean tracking)
 */
export const AzreTextLogo: React.FC<AzreTextLogoProps> = ({
  layout = 'horizontal',
  theme = 'dark',
  size = 'md',
  className = '',
}) => {
  const isLight = theme === 'light';
  const textColor = isLight ? 'text-slate-900' : 'text-white';
  const subColor = isLight ? 'text-slate-700' : 'text-slate-300';
  const greenColor = 'text-[#00FF66] drop-shadow-[0_0_12px_rgba(0,255,102,0.4)]';

  if (layout === 'stacked') {
    const titleSize = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-3xl' : 'text-2xl';
    const subSize = size === 'sm' ? 'text-[9px]' : size === 'lg' ? 'text-xs' : 'text-[10px]';

    return (
      <div className={`flex flex-col items-center text-center font-bold tracking-tight select-none ${className}`}>
        <span className={`${titleSize} leading-none ${textColor} tracking-wider font-extrabold`}>
          ASHARI
        </span>
        <span className={`${titleSize} leading-tight ${greenColor} tracking-widest font-extrabold mt-0.5`}>
          ZAKAR
        </span>
        <span className={`${subSize} tracking-[0.35em] ${subColor} uppercase font-medium mt-1`}>
          REAL ESTATE
        </span>
      </div>
    );
  }

  // Horizontal layout
  const textSize = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-xl' : 'text-base';
  const subTextSize = size === 'sm' ? 'text-[9px]' : size === 'lg' ? 'text-xs' : 'text-[10px]';

  return (
    <div className={`flex items-baseline gap-2 select-none ${className}`}>
      <div className="flex items-baseline gap-1.5 font-extrabold tracking-wider">
        <span className={`${textSize} ${textColor}`}>ASHARI</span>
        <span className={`${textSize} ${greenColor}`}>ZAKAR</span>
      </div>
      <span className={`${subTextSize} tracking-[0.25em] ${subColor} uppercase font-semibold border-l border-slate-700/60 pl-2`}>
        REAL ESTATE
      </span>
    </div>
  );
};

interface AzreBrandHeaderProps {
  showSubtitle?: boolean;
  className?: string;
}

export const AzreBrandHeader: React.FC<AzreBrandHeaderProps> = ({
  showSubtitle = true,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <AzreGoldMedallion size={38} />
      <div className="flex flex-col">
        <AzreTextLogo layout="horizontal" size="md" />
        {showSubtitle && (
          <span className="text-[11px] text-slate-400 font-mono tracking-tight flex items-center gap-1.5 mt-0.5">
            <span>DEALDESK ULTRA</span>
            <span className="text-emerald-400 font-bold">·</span>
            <span className="text-slate-300">Atlanta Headquarters</span>
          </span>
        )}
      </div>
    </div>
  );
};
