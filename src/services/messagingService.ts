import { supabase } from '../lib/supabase/client';
import { isSupabaseConfigured } from '../lib/supabase/env';
import type { Database } from '../lib/supabase/types';
import { ServiceResult, successResult, errorResult } from '../types/api';
import { MessageItem, MessageListener } from '../types/messaging';

type MessageRow = Database['public']['Tables']['messages']['Row'];
type MessageInsert = Database['public']['Tables']['messages']['Insert'];

export const messagingService = {
  /**
   * Load existing message history for one match.
   * Chronological order (ASC), limit 100.
   */
  async getMessages(matchId: string): Promise<ServiceResult<MessageItem[]>> {
    if (!isSupabaseConfigured) {
      return errorResult('Supabase is not configured');
    }

    if (!matchId) {
      return errorResult('Match ID is required');
    }

    try {
      const { data, error } = await (supabase as any)
        .from('messages')
        .select('id, match_id, sender_user_id, body, created_at')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) {
        console.error('[messagingService] Error fetching messages:', error.message);
        return errorResult(error.message, error.code, error);
      }

      const rows = (data as MessageRow[]) || [];
      const messages: MessageItem[] = rows.map((row) => ({
        id: row.id,
        matchId: row.match_id,
        senderUserId: row.sender_user_id,
        body: row.body,
        createdAt: row.created_at,
      }));

      return successResult(messages);
    } catch (err: any) {
      console.error('[messagingService] Exception fetching messages:', err);
      return errorResult(err?.message || 'Failed to load messages');
    }
  },

  /**
   * Insert one message into public.messages.
   * Body is trimmed and validated (1-2000 chars).
   */
  async sendMessage(
    matchId: string,
    senderUserId: string,
    body: string
  ): Promise<ServiceResult<MessageItem>> {
    if (!isSupabaseConfigured) {
      return errorResult('Supabase is not configured');
    }

    if (!matchId || !senderUserId) {
      return errorResult('Match ID and Sender User ID are required');
    }

    const trimmedBody = body?.trim() ?? '';
    if (!trimmedBody) {
      return errorResult('Message body cannot be empty');
    }

    if (trimmedBody.length > 2000) {
      return errorResult('Message body cannot exceed 2000 characters');
    }

    const insertPayload: MessageInsert = {
      match_id: matchId,
      sender_user_id: senderUserId,
      body: trimmedBody,
    };

    try {
      const { data, error } = await (supabase as any)
        .from('messages')
        .insert(insertPayload)
        .select('id, match_id, sender_user_id, body, created_at')
        .single();

      if (error) {
        console.error('[messagingService] Error sending message:', error.message);
        return errorResult(error.message, error.code, error);
      }

      if (!data) {
        return errorResult('Failed to send message: No data returned');
      }

      const row = data as MessageRow;
      const message: MessageItem = {
        id: row.id,
        matchId: row.match_id,
        senderUserId: row.sender_user_id,
        body: row.body,
        createdAt: row.created_at,
      };

      return successResult(message);
    } catch (err: any) {
      console.error('[messagingService] Exception sending message:', err);
      return errorResult(err?.message || 'Failed to send message');
    }
  },

  /**
   * Subscribe to real-time INSERT events on public.messages for a specific match.
   * Returns a cleanup function that removes the channel.
   */
  subscribeToMessages(
    matchId: string,
    onNewMessage: MessageListener,
    onError?: (err: any) => void
  ): () => void {
    if (!isSupabaseConfigured || !matchId) {
      return () => {};
    }

    try {
      const channel = supabase
        .channel(`messages:${matchId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `match_id=eq.${matchId}`,
          },
          (payload: any) => {
            try {
              if (payload?.new && payload.new.id) {
                const message: MessageItem = {
                  id: payload.new.id,
                  matchId: payload.new.match_id,
                  senderUserId: payload.new.sender_user_id,
                  body: payload.new.body,
                  createdAt: payload.new.created_at,
                };
                onNewMessage(message);
              }
            } catch (err) {
              console.error('[messagingService] Error handling realtime message:', err);
              if (onError) onError(err);
            }
          }
        )
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR' && onError) {
            onError(new Error(`Realtime channel error for messages:${matchId}`));
          }
        });

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.error('[messagingService] Exception creating realtime channel:', err);
      if (onError) onError(err);
      return () => {};
    }
  },
};
