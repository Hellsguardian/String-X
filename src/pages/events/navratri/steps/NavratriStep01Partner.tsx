import React from 'react';
import { UserProfile } from '../../../../types/user';
import { PlayfulBadge } from '../../../../components/illustrations/GarbaIllustrations';

interface NavratriStep01PartnerProps {
  profile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
}

export const NavratriStep01Partner: React.FC<NavratriStep01PartnerProps> = ({
  profile,
  onUpdateProfile,
}) => {
  return (
    <div className="space-y-4 sm:space-y-5">
      <div>
        <PlayfulBadge text="MATCH PREFERENCE" color="purple" tilt="right" />
        <h2 className="text-3xl font-black text-[#251436] tracking-tight mt-2">
          Who do you want to match with?
        </h2>
        <p className="text-xs font-semibold text-[#251436]/70 mt-1">
          Help our matchmaking string tune its algorithm:
        </p>
      </div>

      <div className="space-y-2.5 pt-1">
        <label className="block text-xs font-bold uppercase tracking-wider text-[#251436]/70">
          Gender Preference:
        </label>
        <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
          {['Girls', 'Guys', 'Open to Anyone'].map((p) => {
            const isSelected = profile.partnerGenderPreference === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => onUpdateProfile({ partnerGenderPreference: p as any })}
                className={`py-3.5 px-2 rounded-2xl border-2 text-xs sm:text-sm font-extrabold transition-all text-center cursor-pointer ${
                  isSelected
                    ? 'bg-[#894EFF] text-white border-[#251436] shadow-[3px_3px_0px_#251436]'
                    : 'bg-white text-[#251436] border-[#251436]/30 hover:border-[#251436]'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
