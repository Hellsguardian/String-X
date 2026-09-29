import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Check, Sparkles, ArrowRight } from 'lucide-react';
import { StringXLogo } from '../illustrations/GarbaIllustrations';

interface FaceVerifiedTransitionProps {
  onComplete: () => void;
}

export const FaceVerifiedTransition: React.FC<FaceVerifiedTransitionProps> = ({
  onComplete,
}) => {
  useEffect(() => {
    // Brief, smooth auto-transition after 1.5s
    const timer = setTimeout(() => {
      onComplete();
    }, 1500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="w-full h-full min-h-full max-h-full flex-1 flex flex-col items-center justify-between bg-[#E3E0F5] text-[#251436] select-none overflow-hidden p-6 relative font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Header branding */}
      <div className="shrink-0 pt-[max(14px,env(safe-area-inset-top,0px))]">
        <StringXLogo size="sm" />
      </div>

      {/* Center Celebratory Block */}
      <div className="flex-1 flex flex-col items-center justify-center text-center max-w-xs">
        <motion.div
          initial={{ scale: 0.5, rotate: -15, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: 'spring', damping: 12, stiffness: 200 }}
          className="w-20 h-20 rounded-3xl bg-[#10B981] border-4 border-[#251436] shadow-[5px_5px_0px_#251436] flex items-center justify-center text-white mb-5"
        >
          <Check size={42} strokeWidth={3.5} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
          className="space-y-2"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border-2 border-[#251436] rounded-full text-xs font-black text-[#10B981] shadow-[2px_2px_0px_#251436] uppercase tracking-wider">
            <Sparkles size={13} />
            <span>FACE VERIFIED</span>
          </div>

          <h2 className="text-3xl font-black text-[#251436] tracking-tight leading-tight pt-1">
            You're officially in.
          </h2>

          <p className="text-sm font-extrabold text-[#894EFF]">
            Welcome to STRING X.
          </p>

          <p className="text-xs font-semibold text-[#251436]/65 pt-1">
            Discovering events and people around your campus...
          </p>
        </motion.div>
      </div>

      {/* Bottom quick CTA if user doesn't want to wait 1.5s */}
      <div className="shrink-0 w-full max-w-xs pb-[max(12px,env(safe-area-inset-bottom,0px))]">
        <button
          type="button"
          onClick={onComplete}
          className="w-full py-3 px-4 bg-[#894EFF] text-white font-black text-xs rounded-2xl border-3 border-[#251436] shadow-[3px_3px_0px_#251436] active:translate-y-0.5 cursor-pointer transition-all flex items-center justify-center gap-1.5"
        >
          <span>Enter STRING X</span>
          <ArrowRight size={15} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
};
