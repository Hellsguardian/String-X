import { ServiceResult, successResult, errorResult } from '../types/api';
import { supabase } from '../lib/supabase/client';
import { isSupabaseConfigured } from '../lib/supabase/env';

export const statsService = {
  /**
   * Retrieves the current total registered profiles count from the public.platform_statistics table.
   */
  async getProfileCount(): Promise<ServiceResult<number>> {
    if (!isSupabaseConfigured) {
      return successResult(0);
    }

    try {
      const { data, error } = await (supabase as any)
        .from('platform_statistics')
        .select('total_profiles')
        .eq('id', 'global')
        .maybeSingle();

      if (error) {
        console.warn('[statsService] Error fetching platform statistics:', error.message);
        return errorResult(error.message, error.code, error);
      }

      const count = typeof data?.total_profiles === 'number' ? data.total_profiles : 0;
      return successResult(count);
    } catch (err: any) {
      console.warn('[statsService] Exception fetching platform statistics:', err);
      return errorResult(err?.message || 'Failed to fetch platform statistics');
    }
  },

  /**
   * Subscribes to real-time UPDATE events on public.platform_statistics for the 'global' row.
   * Invokes the callback with the new total profile count whenever a profile is registered or deleted.
   * Returns a cleanup function that removes the channel.
   */
  subscribeToProfileCount(
    callback: (count: number) => void,
    onError?: (err: any) => void
  ): () => void {
    if (!isSupabaseConfigured) {
      return () => {};
    }

    try {
      const channel = supabase
        .channel('realtime_platform_statistics')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'platform_statistics',
            filter: 'id=eq.global',
          },
          (payload: any) => {
            if (payload?.new && typeof payload.new.total_profiles === 'number') {
              callback(payload.new.total_profiles);
            }
          }
        )
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR' && onError) {
            onError(new Error('Realtime connection error on platform_statistics'));
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
};
