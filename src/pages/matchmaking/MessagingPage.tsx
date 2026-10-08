import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase/client';
import { MessagingScreen } from '../../components/screens/MessagingScreen';
import { matchmakingService, ActiveMatchResult } from '../../services/matchmakingService';

interface MessagingPageProps {
  onBack: () => void;
  matchId?: string;
  partnerName?: string;
  partnerPhoto?: string;
}

export const MessagingPage: React.FC<MessagingPageProps> = ({
  onBack,
  matchId: propMatchId,
  partnerName: propPartnerName,
  partnerPhoto: propPartnerPhoto,
}) => {
  const { user, profile } = useAuth();
  const currentUserId = user?.id || profile?.id;

  const [loading, setLoading] = useState<boolean>(true);
  const [activeMatch, setActiveMatch] = useState<ActiveMatchResult | null>(null);
  const [partnerName, setPartnerName] = useState<string | undefined>(propPartnerName);
  const [partnerPhoto, setPartnerPhoto] = useState<string | undefined>(propPartnerPhoto);

  useEffect(() => {
    let isMounted = true;

    const resolveMatchAndPartner = async () => {
      // If matchId is already passed via props, use it directly
      if (propMatchId) {
        setLoading(false);
        return;
      }

      if (!currentUserId) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const matchRes = await matchmakingService.checkActiveMatch(currentUserId);
        if (!isMounted) return;

        if (matchRes.error) {
          console.warn('[MessagingPage] Error resolving active match:', matchRes.error.message);
          setLoading(false);
          return;
        }

        const match = matchRes.data;
        if (match) {
          setActiveMatch(match);

          // Resolve partner identity if not already provided via props
          if (!propPartnerName && match.partnerId) {
            // Identity validation: current user must not be partner
            if (currentUserId === match.partnerId) {
              console.warn('[MessagingPage] Identity safety check failed: currentUserId matches partnerId');
              setLoading(false);
              return;
            }

            try {
              const { data: matchedProfile, error: partnerError } = (await supabase
                .from('v_matched_profiles' as any)
                .select('id, full_name, gender, primary_photo_path, user_code')
                .eq('id', match.partnerId)
                .maybeSingle()) as { data: any; error: any };

              if (!isMounted) return;

              if (partnerError) {
                console.warn('[MessagingPage] Error querying v_matched_profiles:', partnerError.message);
                if (match.partnerUserCode) {
                  setPartnerName(match.partnerUserCode);
                }
              } else if (matchedProfile) {
                // Identity validation: matchedProfile.id must match match.partnerId
                if (matchedProfile.id !== match.partnerId) {
                  console.warn('[MessagingPage] Partner ID mismatch in v_matched_profiles');
                  setLoading(false);
                  return;
                }

                // Resolve real partner name from full_name
                const resolvedName =
                  matchedProfile.full_name?.trim().split(' ')[0] ||
                  matchedProfile.full_name ||
                  match.partnerUserCode;

                if (resolvedName) {
                  setPartnerName(resolvedName);
                }

                // Resolve primary profile photo from Supabase Storage
                if (!propPartnerPhoto && matchedProfile.primary_photo_path) {
                  if (matchedProfile.primary_photo_path.startsWith('http')) {
                    setPartnerPhoto(matchedProfile.primary_photo_path);
                  } else {
                    const { data: urlData } = supabase.storage
                      .from('profile-photos')
                      .getPublicUrl(matchedProfile.primary_photo_path);
                    if (urlData?.publicUrl) {
                      setPartnerPhoto(urlData.publicUrl);
                    }
                  }
                }
              } else if (match.partnerUserCode) {
                // Defensive fallback only if profile genuinely unavailable
                setPartnerName(match.partnerUserCode);
              }
            } catch (err) {
              console.warn('[MessagingPage] Could not fetch partner profile:', err);
              if (match.partnerUserCode) {
                setPartnerName(match.partnerUserCode);
              }
            }
          } else if (!propPartnerName && match.partnerUserCode) {
            setPartnerName(match.partnerUserCode);
          }
        }
      } catch (err) {
        console.warn('[MessagingPage] Exception checking active match:', err);
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
  }, [currentUserId, propMatchId, propPartnerName, propPartnerPhoto]);

  // Loading state
  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[500px] p-6 text-center">
        <div className="w-10 h-10 rounded-full border-4 border-amber-400 border-t-transparent animate-spin mb-3" />
        <p className="text-xs font-bold text-[#251436]/70 tracking-wider uppercase">
          Loading chat...
        </p>
      </div>
    );
  }

  // Reveal gate: messaging is only available if the match has been revealed
  if (activeMatch && activeMatch.isRevealed === false) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[500px] p-6 text-center">
        <p className="text-sm font-semibold text-[#251436]/80 mb-4">
          This match has not been revealed yet.
        </p>
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-amber-400 text-[#251436] font-bold text-xs uppercase tracking-wider shadow-sm hover:bg-amber-300 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  const resolvedMatchId = propMatchId || activeMatch?.id;

  return (
    <MessagingScreen
      profile={profile}
      onBack={onBack}
      partnerName={partnerName}
      partnerPhoto={partnerPhoto}
      {...({
        matchId: resolvedMatchId,
        currentUserId,
      } as any)}
    />
  );
};

