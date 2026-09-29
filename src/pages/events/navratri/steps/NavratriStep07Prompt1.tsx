import React from 'react';
import { UserProfile } from '../../../../types/user';
import { PlayfulBadge } from '../../../../components/illustrations/GarbaIllustrations';
import { PromptCardSelector } from '../../../../components/inputs/PromptCardSelector';
import { PROMPTS } from '../../../../data/mockData';

interface NavratriStep07Prompt1Props {
  profile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onAutoAdvance?: (delayMs?: number) => void;
}

export const NavratriStep07Prompt1: React.FC<NavratriStep07Prompt1Props> = ({
  profile,
  onUpdateProfile,
  onAutoAdvance,
}) => {
  return (
    <div className="space-y-3.5 pb-2">
      <div>
        <PlayfulBadge text="STAY OR SLAY" color="yellow" tilt="none" className="-rotate-1" />
        <h2 className="text-2xl sm:text-3xl font-black text-[#251436] tracking-tight mt-2 leading-tight">
          {PROMPTS.lastRound.question}
        </h2>
      </div>

      <PromptCardSelector
        options={PROMPTS.lastRound.options}
        selected={profile.answerLastRound}
        onSelect={(answerLastRound) => {
          onUpdateProfile({ answerLastRound });
          if (onAutoAdvance) {
            onAutoAdvance(260);
          }
        }}
      />
    </div>
  );
};
