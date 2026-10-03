import React from 'react';
import { ArrowLeft, X } from 'lucide-react';
import { StringXLogo } from '../illustrations/GarbaIllustrations';

interface HeaderNavProps {
  currentStep?: number;
  totalSteps?: number;
  onBack?: () => void;
  onExit?: () => void;
  showProgress?: boolean;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  currentStep = 1,
  totalSteps = 22,
  onBack,
  onExit,
  showProgress = true
}) => {
  const progressPercent = Math.min(100, Math.round((currentStep / totalSteps) * 100));

  return (
    <div className="w-full select-none pt-4 pb-1.5 px-6">
      {/* Top row */}
      <div className="flex items-center justify-between">
        {/* Back button or spacer */}
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-white border-2 border-[#251436] flex items-center justify-center text-[#251436] shadow-[2px_2px_0px_#251436] active:translate-y-0.5 active:shadow-none hover:bg-[#E3E0F5] transition-all"
            aria-label="Go back"
          >
            <ArrowLeft size={17} strokeWidth={2.5} />
          </button>
        ) : (
          <div className="w-9 h-9" />
        )}

        {/* Center Logo */}
        <StringXLogo size="sm" />

        {/* Step indicator counter pill */}
        {showProgress ? (
          <div className="px-2.5 py-1 rounded-xl bg-white border-2 border-[#251436] text-[11px] font-black text-[#251436] shadow-[1.5px_1.5px_0px_#251436] tracking-tight">
            <span>{String(currentStep).padStart(2, '0')}</span>
            <span className="text-[#894EFF] px-0.5">/</span>
            <span className="text-[#251436]/60">{String(totalSteps).padStart(2, '0')}</span>
          </div>
        ) : onExit ? (
          <button
            type="button"
            onClick={onExit}
            className="w-9 h-9 rounded-xl bg-white border-2 border-[#251436] flex items-center justify-center text-[#251436] shadow-[1.5px_1.5px_0px_#251436]"
            aria-label="Close"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        ) : (
          <div className="w-9 h-9" />
        )}
      </div>

      {/* Progress Bar with Connecting String Animation */}
      {showProgress && (
        <div className="relative mt-2.5 w-full h-1.5 bg-[#251436]/10 rounded-full border border-[#251436]/30 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#894EFF] via-[#F02A8A] to-[#FFC928] rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}
    </div>
  );
};
