import { EventMatch } from '../types/events';
import { ServiceResult, successResult, errorResult } from '../types/api';
import { MOCK_EVENT_MATCHES } from '../data/eventsData';
import { SAMPLE_MATCH_PROFILE } from '../data/mockData';
import { supabase } from '../lib/supabase/client';
import { isSupabaseConfigured } from '../lib/supabase/env';

export interface ActiveMatchResult {
  id: string;
  eventId?: string;
  partnerId?: string;
  partnerUserCode?: string;
  compatibilityScore?: number;
  compatibilityReasons?: any;
  sharedHighlights?: string[];
  status: string;
  matchedAt: string;
  isRevealed?: boolean;
}

export const matchmakingService = {
  /**
   * Check for an existing, confirmed active match for the user in Supabase
   * Checks both public.v_my_matches view and public.matches table.
   */
  async checkActiveMatch(userId?: string): Promise<ServiceResult<ActiveMatchResult | null>> {
    try {
      if (isSupabaseConfigured) {
        let currentUserId = userId;
        if (!currentUserId) {
          const { data: authData } = await supabase.auth.getUser();
          currentUserId = authData?.user?.id;
        }

        if (!currentUserId) {
          return successResult(null);
        }

        // Helper to resolve pair-level reveal status from public.connections
        const resolveConnectionReveal = async (matchId: string): Promise<boolean> => {
          try {
            const { data: connection, error: connectionError } = await (supabase
              .from('connections' as any) as any)
              .select('user_a_revealed, user_b_revealed')
              .eq('match_id', matchId)
              .maybeSingle();

            if (connectionError || !connection) {
              if (connectionError) {
                console.warn('[MATCHMAKING_SERVICE] Error checking connection reveal:', connectionError.message);
              }
              return false;
            }

            return Boolean(connection.user_a_revealed && connection.user_b_revealed);
          } catch (connErr) {
            console.warn('[MATCHMAKING_SERVICE] Exception querying connection reveal:', connErr);
            return false;
          }
        };

        // 1. Query secure projection view v_my_matches
        const { data: viewData, error: viewError } = await (supabase
          .from('v_my_matches' as any)
          .select('*')
          .limit(1)
          .maybeSingle() as any);

        if (!viewError && viewData) {
          const matchId = viewData.match_id || viewData.id;
          const isRevealed = await resolveConnectionReveal(matchId);

          return successResult({
            id: matchId,
            eventId: viewData.event_id,
            partnerId: viewData.partner_id,
            partnerUserCode: viewData.partner_user_code,
            compatibilityScore: viewData.compatibility_score,
            compatibilityReasons: viewData.compatibility_reasons,
            sharedHighlights: viewData.shared_highlights,
            status: viewData.status || 'active',
            matchedAt: viewData.matched_at || new Date().toISOString(),
            isRevealed,
          });
        }

        // 2. Direct query on public.matches if view returned no rows or has RLS nuance
        const { data: directMatch, error: directError } = await (supabase
          .from('matches' as any)
          .select('*')
          .or(`user_a_id.eq.${currentUserId},user_b_id.eq.${currentUserId}`)
          .eq('status', 'active')
          .limit(1)
          .maybeSingle() as any);

        if (directError) {
          console.error('[MATCHMAKING_SERVICE] Error querying matches table:', directError);
          return errorResult(directError.message, directError.code, directError);
        }

        if (directMatch) {
          const partnerId = directMatch.user_a_id === currentUserId ? directMatch.user_b_id : directMatch.user_a_id;
          const isRevealed = await resolveConnectionReveal(directMatch.id);

          return successResult({
            id: directMatch.id,
            eventId: directMatch.event_id,
            partnerId,
            compatibilityScore: directMatch.compatibility_score,
            compatibilityReasons: directMatch.compatibility_reasons,
            sharedHighlights: directMatch.shared_highlights,
            status: directMatch.status,
            matchedAt: directMatch.matched_at || new Date().toISOString(),
            isRevealed,
          });
        }

        // Explicitly zero active matches found
        return successResult(null);
      }

      // Local storage check for local test state (never fabricates a match automatically)
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('stringx_active_match');
        if (stored) {
          try {
            return successResult(JSON.parse(stored));
          } catch {
            return successResult(null);
          }
        }
      }

      return successResult(null);
    } catch (err: any) {
      console.error('[MATCHMAKING_SERVICE] Exception in checkActiveMatch:', err);
      return errorResult(err.message || 'Failed to check active match');
    }
  },

  /**
   * Subscribe to match notifications and real-time database changes
   */
  subscribeToMatches(
    userId: string,
    onMatchFound: (match: ActiveMatchResult) => void,
    onError?: (err: any) => void
  ): () => void {
    if (!isSupabaseConfigured) {
      return () => {};
    }

    try {
      const channel = supabase
        .channel(`matches_${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'matches',
          },
          async () => {
            const res = await matchmakingService.checkActiveMatch(userId);
            if (res.data) {
              onMatchFound(res.data);
            }
          }
        )
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR' && onError) {
            onError(new Error('Realtime connection error'));
          }
        });

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      if (onError) onError(err);
      return () => {};
    }
  },

  /**
   * Get list of matched candidate profiles for an event
   */
  async getMatchesForEvent(eventId: string): Promise<ServiceResult<EventMatch[]>> {
    try {
      const matches = MOCK_EVENT_MATCHES[eventId] || [];
      return successResult(matches);
    } catch (err: any) {
      return errorResult(err.message || 'Failed to fetch event matches');
    }
  },

  /**
   * Get the sneak peek sample match profile (e.g. Arjun Mehta)
   */
  getSneakPeekProfile() {
    return SAMPLE_MATCH_PROFILE;
  },

  /**
   * Wave at a matched partner
   */
  async sendWave(matchId: string): Promise<ServiceResult<{ success: boolean; message: string }>> {
    try {
      return successResult({
        success: true,
        message: 'Wave sent successfully! 👋',
      });
    } catch (err: any) {
      return errorResult(err.message || 'Failed to send wave');
    }
  },
};
