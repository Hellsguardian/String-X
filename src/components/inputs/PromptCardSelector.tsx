import React from 'react';
import { motion } from 'motion/react';
import { Check, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export interface PromptCardOption {
  text?: string;
  main?: string;
  subtext?: string;
  desc?: string;
  emoji: string;
  emojiBg?: string;
  vibe?: string;
  tag?: string;
}

interface PromptCardSelectorProps {
  options: PromptCardOption[];
  selected: string;
  onSelect: (answer: string) => void;
  celebrateOnSelect?: boolean;
}

export const PromptCardSelector: React.FC<PromptCardSelectorProps> = ({
  options,
  selected,
  onSelect,
  celebrateOnSelect = true
}) => {
  const handleSelect = (val: string) => {
    onSelect(val);
    if (celebrateOnSelect) {
      try {
        confetti({
          particleCount: 22,
          spread: 45,
          origin: { y: 0.8 },
          colors: ['#894EFF', '#F02A8A', '#FFC928', '#08A98D'],
          disableForReducedMotion: true
        });
      } catch {
        // fallback
      }
    }
  };

  return (
    <div className="flex flex-col gap-2.5 w-full select-none">
      {options.map((opt, idx) => {
        const mainText = opt.main || opt.text || '';
        const subText = opt.subtext || opt.desc;
        const tagText = opt.tag || opt.vibe;
        const fullValue: string = opt.text || (opt.main && opt.subtext ? `${opt.main} ${opt.subtext}` : opt.main) || '';

        const isSelected =
          Boolean(selected) &&
          (selected === opt.main ||
            selected === opt.text ||
            selected === fullValue ||
            Boolean(opt.main && selected.startsWith(opt.main)));

        const defaultBg =
          opt.emoji === '💤'
            ? '#E8EEFF'
            : opt.emoji === '🤝'
            ? '#FFF5D6'
            : opt.emoji === '🔥'
            ? '#FFE8DF'
            : opt.emoji === '💬'
            ? '#FCE7F3'
            : '#FAF9FF';

        return (
          <motion.div
            key={opt.main || opt.text || idx}
            whileHover={{ scale: 1.012 }}
            whileTap={{ scale: 0.985 }}
            onClick={() => handleSelect(fullValue)}
            className={`relative py-3 px-3.5 sm:py-3.5 sm:px-4 rounded-2xl cursor-pointer transition-all duration-200 ${
              isSelected
                ? 'bg-[#FAF7FF] border-2 border-[#894EFF] shadow-[3px_3px_0px_#251436] -translate-y-0.5 ring-2 ring-[#894EFF]/20'
                : 'bg-white/85 border-2 border-[#251436]/25 hover:border-[#251436] hover:bg-white'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-start gap-3 sm:gap-3.5 flex-1 min-w-0">
                {/* 42x42px Rounded-square emoji container with soft pastel background */}
                <motion.div
                  animate={{ scale: isSelected ? [1, 1.08, 1] : 1 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="w-[42px] h-[42px] min-w-[42px] rounded-[13px] border border-[#251436]/20 flex items-center justify-center text-[21px] shrink-0 select-none shadow-[1px_1px_0px_rgba(37,20,54,0.08)]"
                  style={{ backgroundColor: opt.emojiBg || defaultBg }}
                >
                  {opt.emoji}
                </motion.div>

                {/* 3-part hierarchy: Main text, Subtext, Tag tightly grouped */}
                <div className="flex-1 min-w-0 flex flex-col items-start pt-0.5">
                  <h4 className="text-[15px] sm:text-base font-black text-[#251436] leading-snug tracking-tight break-words">
                    {mainText}
                  </h4>

                  {subText && (
                    <p className="text-xs sm:text-[13px] font-semibold text-[#251436]/70 mt-0.5 leading-tight break-words">
                      {subText}
                    </p>
                  )}

                  {tagText && (
                    <div className="mt-1.5">
                      <span className="inline-block text-[9.5px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#D4CEEF]/80 text-[#894EFF] border border-[#894EFF]/30">
                        {tagText}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Reserved checkmark slot with soft pop-in animation */}
              <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center self-center">
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0.3, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    className="w-6 h-6 rounded-full bg-[#F02A8A] text-white flex items-center justify-center shadow-xs"
                  >
                    <Check size={14} strokeWidth={3} />
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
