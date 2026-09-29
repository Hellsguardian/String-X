import React from 'react';
import { UserProfile } from '../../../../types/user';
import { PlayfulBadge } from '../../../../components/illustrations/GarbaIllustrations';
import { Instagram } from 'lucide-react';

interface NavratriStep09InstagramProps {
  profile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
}

export const NavratriStep09Instagram: React.FC<NavratriStep09InstagramProps> = ({
  profile,
  onUpdateProfile,
}) => {
  return (
    <div className="space-y-4 pt-1 sm:pt-2">
      <div>
        <PlayfulBadge text="STAY CONNECTED" color="yellow" tilt="left" />
        <h2 className="text-2xl sm:text-3xl font-black text-[#251436] tracking-tight mt-2 leading-tight">
          Enter your Instagram ID
        </h2>
        <p className="text-xs font-semibold text-[#251436]/70 mt-1">
          Let your match find you after the reveal.
        </p>
      </div>

      <div className="space-y-3 pt-1">
        <div>
          <label
            htmlFor="instagram-id"
            className="block text-xs font-bold uppercase tracking-wider text-[#251436]/70 mb-1.5"
          >
            INSTAGRAM ID:
          </label>

          <div className="flex items-center gap-2">
            {/* Fixed Instagram visual badge */}
            <div className="w-12 h-12 bg-white border-3 border-[#251436] rounded-2xl shadow-[3px_3px_0px_#251436] flex items-center justify-center text-[#251436] shrink-0">
              <Instagram size={22} strokeWidth={2.2} className="text-[#894EFF]" />
            </div>

            {/* Clean input field */}
            <div className="flex-1 relative">
              <input
                id="instagram-id"
                type="text"
                value={profile.instagramId || ''}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^a-zA-Z0-9._@]/g, '');
                  onUpdateProfile({ instagramId: raw });
                }}
                onBlur={() => {
                  const trimmed = (profile.instagramId || '').trim();
                  if (trimmed) {
                    const cleanHandle = trimmed.replace(/^@+/, '');
                    if (cleanHandle) {
                      onUpdateProfile({ instagramId: `@${cleanHandle}` });
                    }
                  }
                }}
                placeholder="@username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className="w-full px-4 py-3 sm:py-3.5 bg-white border-3 border-[#251436] rounded-2xl text-base font-extrabold text-[#251436] placeholder-[#251436]/40 shadow-[3px_3px_0px_#251436] focus:outline-hidden focus:ring-2 focus:ring-[#894EFF] transition-all"
              />
            </div>
          </div>
        </div>

        <p className="text-[11px] sm:text-xs font-semibold text-[#251436]/65 pl-1 pt-0.5">
          ✨ Enter with or without @. Only revealed to your confirmed Garba partner.
        </p>
      </div>
    </div>
  );
};
