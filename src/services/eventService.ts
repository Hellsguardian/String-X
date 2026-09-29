import { supabase } from '../lib/supabase/client';
import { isSupabaseConfigured } from '../lib/supabase/env';
import { EventDefinition, UserEventRegistration } from '../types/events';
import { ServiceResult, successResult, errorResult } from '../types/api';
import { STRINGX_EVENTS } from '../data/eventsData';

const MOCK_EVENT_REGISTRATIONS_KEY = 'stringx_event_registrations';

export const eventService = {
  /**
   * Get all active campus events
   */
  async getEvents(): Promise<ServiceResult<EventDefinition[]>> {
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('is_active', true);

        if (!error && data && data.length > 0) {
          // If custom events exist in database, merge or use them
        }
      }

      return successResult(STRINGX_EVENTS);
    } catch (err: any) {
      return errorResult(err.message || 'Failed to fetch events');
    }
  },

  /**
   * Get single event by id
   */
  async getEventById(eventId: string): Promise<ServiceResult<EventDefinition>> {
    try {
      const event = STRINGX_EVENTS.find((e) => e.id === eventId);
      if (!event) {
        return errorResult(`Event with ID '${eventId}' not found`);
      }
      return successResult(event);
    } catch (err: any) {
      return errorResult(err.message || 'Failed to fetch event');
    }
  },

  /**
   * Save user registration & answers for an event
   */
  async submitEventAnswers(
    eventId: string,
    userId: string,
    answers: Record<string, any>
  ): Promise<ServiceResult<UserEventRegistration>> {
    try {
      const registration: UserEventRegistration = {
        eventId,
        isCompleted: true,
        answers,
        completedAt: Date.now(),
      };

      if (isSupabaseConfigured) {
        const { error } = await (supabase.from('event_participants') as any).upsert({
          event_id: eventId,
          user_id: userId,
          answers,
          is_completed: true,
          updated_at: new Date().toISOString(),
        });

        if (error) {
          return errorResult(error.message, error.code, error);
        }
      }

      // Local storage fallback
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(MOCK_EVENT_REGISTRATIONS_KEY);
        const map = stored ? JSON.parse(stored) : {};
        map[eventId] = registration;
        localStorage.setItem(MOCK_EVENT_REGISTRATIONS_KEY, JSON.stringify(map));
      }

      return successResult(registration);
    } catch (err: any) {
      return errorResult(err.message || 'Failed to submit event answers');
    }
  },

  /**
   * Check if user is registered for an event
   */
  async getEventRegistration(eventId: string, userId: string): Promise<ServiceResult<UserEventRegistration | null>> {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(MOCK_EVENT_REGISTRATIONS_KEY);
        if (stored) {
          const map = JSON.parse(stored);
          if (map[eventId]) {
            return successResult(map[eventId]);
          }
        }
      }

      return successResult(null);
    } catch (err: any) {
      return errorResult(err.message || 'Failed to check event registration');
    }
  },
};
