import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase/client';
import { matchmakingService } from '../../services/matchmakingService';
import { MatchRevealScreen } from '../../components/screens/MatchRevealScreen';

interface MatchRevealPageProps {
  onBack: () => void;
  onSendMessage: () => void;
  partner?: any;
}

export const MatchRevealPage: React.FC<MatchRevealPageProps> = ({
  onBack,
  onSendMessage,
  partner: propPartner,
}) => {
  const { user, profile, status } = useAuth();
  const currentUserId = user?.id || profile?.id;

  const [loading, setLoading] = useState<boolean>(!propPartner);
  const [partner, setPartner] = useState<any>(propPartner);

  useEffect(() => {
    let isMounted = true;

    // If partner was already supplied via props, use it directly
    if (propPartner) {
      setPartner(propPartner);
      setLoading(false);
      return;
    }

    // Wait if authentication is still initializing
    if (status === 'loading') {
      return;
    }

    // Data validation: current user must exist and match profile
    if (!currentUserId || !profile?.id || currentUserId !== profile.id) {
      setLoading(false);
      return;
    }

    const resolveMatchAndPartner = async () => {
      setLoading(true);

      try {
        const matchRes = await matchmakingService.checkActiveMatch(currentUserId);
        if (!isMounted) return;

        if (matchRes.error || !matchRes.data) {
          console.warn('[MatchRevealPage] Could not find active match:', matchRes.error?.message);
          setLoading(false);
          return;
        }

        const activeMatch = matchRes.data;
        if (!activeMatch.partnerId) {
          console.warn('[MatchRevealPage] Active match has no partnerId');
          setLoading(false);
          return;
        }

        // Query secure projection view v_matched_profiles for revealed partner
        const { data: matchedProfile, error: partnerError } = (await supabase
          .from('v_matched_profiles' as any)
          .select('id, full_name, gender, primary_photo_path, university_name, course_name, user_code')
          .eq('id', activeMatch.partnerId)
          .maybeSingle()) as { data: any; error: any };

        if (!isMounted) return;

        if (partnerError || !matchedProfile) {
          console.warn('[MatchRevealPage] Could not fetch partner from v_matched_profiles:', partnerError?.message);
          setLoading(false);
          return;
        }

        // Data validation: matchedProfile.id must match activeMatch.partnerId
        if (matchedProfile.id !== activeMatch.partnerId) {
          console.warn('[MatchRevealPage] Partner ID mismatch validation failed');
          setLoading(false);
          return;
        }

        // Resolve primary profile photo URL from Supabase Storage
        let partnerPhoto: string | undefined = undefined;
        if (matchedProfile.primary_photo_path) {
          if (matchedProfile.primary_photo_path.startsWith('http')) {
            partnerPhoto = matchedProfile.primary_photo_path;
          } else {
            const { data: urlData } = supabase.storage
              .from('profile-photos')
              .getPublicUrl(matchedProfile.primary_photo_path);
            if (urlData?.publicUrl) {
              partnerPhoto = urlData.publicUrl;
            }
          }
        }

        setPartner({
          name: matchedProfile.full_name,
          fullName: matchedProfile.full_name,
          nickname: matchedProfile.full_name?.trim().split(' ')[0],
          gender: matchedProfile.gender,
          photoUrl: partnerPhoto,
          collegeName: matchedProfile.university_name,
          department: matchedProfile.course_name,
        });
      } catch (err) {
        console.error('[MatchRevealPage] Exception resolving partner profile:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    resolveMatchAndPartner();

    return () => {
      isMounted = false;
    };
  }, [currentUserId, profile?.id, propPartner, status]);

  if (loading) {
    return (
      <div className="w-full h-full min-h-full flex-1 flex flex-col items-center justify-center p-6 text-center bg-[#160624] text-white">
        <div className="w-10 h-10 rounded-full border-4 border-[#894EFF] border-t-transparent animate-spin mb-3" />
        <p className="text-xs font-bold text-[#894EFF]/80 tracking-wider uppercase">
          Revealing match...
        </p>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="w-full h-full min-h-full flex-1 flex flex-col items-center justify-center p-6 text-center bg-[#160624] text-white">
        <p className="text-sm font-medium text-white/80 mb-4">
          Unable to load match profile.
        </p>
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-[#894EFF] text-white font-bold text-xs uppercase tracking-wider shadow-sm hover:bg-[#7839EE] transition-colors cursor-pointer"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <MatchRevealScreen
      profile={profile}
      partner={partner}
      onBack={onBack}
      onSendMessage={onSendMessage}
    />
  );
};

