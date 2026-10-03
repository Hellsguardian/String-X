import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';

interface PrimaryButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'plum';
  icon?: boolean;
  className?: string;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  label,
  onClick,
  disabled = false,
  variant = 'primary',
  icon = true,
  className = ''
}) => {
  const variantStyles = {
    primary: 'bg-[#894EFF] text-white hover:bg-[#783dee]',
    secondary: 'bg-[#FFC928] text-[#251436] hover:bg-[#f5be18]',
    plum: 'bg-[#251436] text-white hover:bg-[#331c49]'
  };

  return (
    <motion.button
      type="button"
      whileTap={disabled ? {} : { scale: 0.97 }}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`w-full py-4 px-6 rounded-2xl border-3 border-[#251436] font-extrabold text-base flex items-center justify-center gap-2.5 transition-all select-none ${
        disabled
          ? 'bg-[#D4CEEF]/50 text-[#251436]/40 border-[#251436]/30 cursor-not-allowed shadow-none'
          : `${variantStyles[variant]} shadow-[4px_4px_0px_#251436] active:translate-y-1 active:shadow-[1px_1px_0px_#251436]`
      } ${className}`}
    >
      <span>{label}</span>
      {icon && <ArrowRight size={18} strokeWidth={3} className="mt-0.5" />}
    </motion.button>
  );
};
