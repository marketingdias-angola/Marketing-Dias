import { useState } from 'react';
import { BRAND_LOGO_PATH } from '../constants/marketplace';

interface MarketingDiasLogoProps {
  variant?: 'header' | 'footer';
}

export function MarketingDiasLogo({ variant = 'header' }: MarketingDiasLogoProps) {
  const [imgError, setImgError] = useState(false);
  const isFooter = variant === 'footer';

  if (imgError) {
    return (
      <div className="inline-flex flex-col items-center justify-center select-none shrink-0 bg-[#0A1A36] px-3 py-1.5 rounded-lg">
        <span className="font-display font-extrabold text-2xl tracking-tight text-white">
          M<span className="text-[#FF6A00]">D</span>
        </span>
        <span className="text-[9px] font-display font-semibold tracking-wider text-slate-200 whitespace-nowrap">
          MARKETING <span className="text-[#FF6A00]">DIAS</span>
        </span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center justify-center select-none shrink-0">
      <img
        src={BRAND_LOGO_PATH}
        alt="Marketing Dias — Angola Marketplace"
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
        className={
          isFooter
            ? 'h-20 w-auto object-contain rounded-lg'
            : 'h-12 sm:h-14 w-auto object-contain rounded-md'
        }
      />
    </div>
  );
}
