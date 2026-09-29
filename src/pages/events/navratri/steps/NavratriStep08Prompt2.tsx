import React from 'react';
import { UserProfile } from '../../../../types/user';
import { PlayfulBadge } from '../../../../components/illustrations/GarbaIllustrations';
import { PromptCardSelector } from '../../../../components/inputs/PromptCardSelector';
import { PROMPTS } from '../../../../data/mockData';

interface NavratriStep08Prompt2Props {
  profile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onAutoAdvance?: (delayMs?: number) => void;
}

export const NavratriStep08Prompt2: React.FC<NavratriStep08Prompt2Props> = ({
  profile,
  onUpdateProfile,
  onAutoAdvance,
}) => {
  return (
    <div className="space-y-3">
      <div>
        <PlayfulBadge text="VIBE CHECK" color="pink" tilt="right" />
        <h2 className="text-2xl sm:text-3xl font-black text-[#251436] tracking-tight mt-2">
          {PROMPTS.personality.question}
        </h2>
        <p className="text-xs font-semibold text-[#251436]/70 mt-1">
          {PROMPTS.personality.subtitle}
        </p>
      </div>

      <PromptCardSelector
        options={PROMPTS.personality.options}
        selected={profile.answerPersonality}
        onSelect={(answerPersonality) => {
          onUpdateProfile({ answerPersonality });
          if (onAutoAdvance) {
            onAutoAdvance(260);
          }
        }}
      />
    </div>
  );
};
