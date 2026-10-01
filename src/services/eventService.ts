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
   * Resolves application event identifier ('navratri', 'pu-navratri-2026', or UUID)
   * to the authoritative database public.events.id UUID.
   */
  async resolveEventId(eventIdentifier: string): Promise<ServiceResult<string>> {
    try {
      if (!eventIdentifier) {
        return errorResult('Event identifier cannot be empty');
      }

      const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      // 1. Direct UUID match
      if (UUID_REGEX.test(eventIdentifier)) {
        return successResult(eventIdentifier);
      }

      // Check in-memory cache
      const normalized = eventIdentifier.toLowerCase().trim();
      const cached = (globalThis as any).__STRINGX_EVENT_CACHE?.[normalized];
      if (cached) {
        return successResult(cached);
      }

      if (!isSupabaseConfigured) {
        return successResult(eventIdentifier);
      }

      // 2. Database slug query
      const candidateSlug = normalized === 'navratri' ? 'pu-navratri-2026' : eventIdentifier;

      const { data, error } = await (supabase
        .from('events' as any) as any)
        .select('id')
        .or(`slug.eq.${candidateSlug},slug.eq.${eventIdentifier}`)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.warn('[eventService] Error querying events table:', error.message);
        return errorResult(`Failed to resolve event '${eventIdentifier}': ${error.message}`);
      }

      if ((data as any)?.id) {
        const id = (data as any).id;
        (globalThis as any).__STRINGX_EVENT_CACHE = (globalThis as any).__STRINGX_EVENT_CACHE || {};
        (globalThis as any).__STRINGX_EVENT_CACHE[normalized] = id;
        (globalThis as any).__STRINGX_EVENT_CACHE[candidateSlug] = id;
        return successResult(id);
      }

      // 3. Fallback: check for any active campus event
      const { data: activeEvent, error: activeErr } = await (supabase
        .from('events' as any) as any)
        .select('id')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!activeErr && (activeEvent as any)?.id) {
        const id = (activeEvent as any).id;
        (globalThis as any).__STRINGX_EVENT_CACHE = (globalThis as any).__STRINGX_EVENT_CACHE || {};
        (globalThis as any).__STRINGX_EVENT_CACHE[normalized] = id;
        return successResult(id);
      }

      return errorResult(`Event '${eventIdentifier}' not found in database`);
    } catch (err: any) {
      return errorResult(err.message || `Failed to resolve event '${eventIdentifier}'`);
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
      const resolveRes = await eventService.resolveEventId(eventId);
      if (resolveRes.error || !resolveRes.data) {
        return errorResult(resolveRes.error?.message || `Event '${eventId}' could not be resolved`);
      }
      const resolvedEventUuid = resolveRes.data;

      const registration: UserEventRegistration = {
        eventId,
        isCompleted: true,
        answers,
        completedAt: Date.now(),
      };

      if (isSupabaseConfigured) {
        // Enforce using the currently authenticated Supabase user ID if available
        let effectiveUserId = userId;
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData?.session?.user?.id) {
            effectiveUserId = sessionData.session.user.id;
          }
        } catch (authErr) {
          console.warn('[eventService] Could not retrieve session user id:', authErr);
        }

        if (!effectiveUserId) {
          return errorResult('Cannot register for event: No authenticated user session found');
        }

        // 1. Ensure event_registrations record exists
        const { data: existingReg, error: regFindError } = await (supabase
          .from('event_registrations' as any) as any)
          .select('id')
          .eq('event_id', resolvedEventUuid)
          .eq('user_id', effectiveUserId)
          .maybeSingle();

        if (regFindError) {
          console.error('[eventService] Error querying existing registration:', regFindError);
          return errorResult(regFindError.message, regFindError.code, regFindError);
        }

        let registrationId = existingReg?.id;
        if (!registrationId) {
          const { data: newReg, error: regInsertError } = await (supabase
            .from('event_registrations' as any) as any)
            .insert({
              event_id: resolvedEventUuid,
              user_id: effectiveUserId,
              status: 'registered',
            })
            .select('id')
            .single();

          if (regInsertError) {
            console.error('[eventService] Error inserting registration:', regInsertError);
            return errorResult(regInsertError.message, regInsertError.code, regInsertError);
          }
          registrationId = newReg.id;
        }

        // 2. Map and persist to event_preferences
        const partnerGenderPref = (answers.partnerGenderPreference || answers.partner_gender_preference || 'Open to Anyone') as
          | 'Girls'
          | 'Guys'
          | 'Open to Anyone';

        const vibes: string[] = Array.isArray(answers.navratriVibes) ? answers.navratriVibes : [];

        const prefPayload = {
          registration_id: registrationId,
          partner_gender_preference: partnerGenderPref,
          most_excited_1: vibes[0] || null,
          most_excited_2: vibes[1] || null,
          most_excited_3: vibes[2] || null,
          favourite_evening_spot: answers.favouriteEveningSpot || answers.favourite_evening_spot || null,
          navratri_excitement: answers.navratriExcitement ?? answers.navratri_excitement ?? 50,
          garba_level: answers.garbaLevel || answers.garba_level || null,
          garba_energy: answers.garbaEnergy || answers.garba_energy || null,
          answer_last_round: answers.answerLastRound || answers.answer_last_round || null,
          answer_persona: answers.answerPersonality || answers.answerPersona || answers.answer_persona || null,
          answer_partner_new_step: answers.answerPartnerNewStep || answers.answer_partner_new_step || null,
        };

        const { error: prefError } = await (supabase
          .from('event_preferences' as any) as any)
          .upsert(prefPayload, { onConflict: 'registration_id' });

        if (prefError) {
          return errorResult(prefError.message, prefError.code, prefError);
        }

        // 3. Persist user interests to user_interests junction table
        if (Array.isArray(answers.interests) && answers.interests.length > 0) {
          try {
            const { data: matchedInterests } = await (supabase
              .from('interests' as any) as any)
              .select('id, name');

            if (matchedInterests && matchedInterests.length > 0) {
              const selectedInterestIds = matchedInterests
                .filter((item: any) =>
                  answers.interests.some(
                    (sel: string) =>
                      sel.toLowerCase() === item.name.toLowerCase() || sel === item.id
                  )
                )
                .map((item: any) => item.id);

              if (selectedInterestIds.length > 0) {
                const interestRows = selectedInterestIds.map((interestId: string) => ({
                  user_id: effectiveUserId,
                  interest_id: interestId,
                }));
                await (supabase
                  .from('user_interests' as any) as any)
                  .upsert(interestRows, { onConflict: 'user_id,interest_id' });
              }
            }
          } catch (interestErr) {
            console.warn('[eventService] Non-critical error syncing user_interests:', interestErr);
          }
        }
      }

      // Local storage fallback strictly for offline / unconfigured mode
      if (!isSupabaseConfigured && typeof window !== 'undefined') {
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
      const resolveRes = await eventService.resolveEventId(eventId);
      if (resolveRes.error || !resolveRes.data) {
        return errorResult(resolveRes.error?.message || `Event '${eventId}' could not be resolved`);
      }
      const resolvedEventUuid = resolveRes.data;

      if (isSupabaseConfigured) {
        let effectiveUserId = userId;
        if (!effectiveUserId) {
          try {
            const { data: sessionData } = await supabase.auth.getSession();
            if (sessionData?.session?.user?.id) {
              effectiveUserId = sessionData.session.user.id;
            }
          } catch {
            // ignore
          }
        }

        if (!effectiveUserId) {
          return successResult(null);
        }

        const { data: reg, error: regError } = await (supabase
          .from('event_registrations' as any) as any)
          .select('id, event_id, status, registered_at, matched_with')
          .eq('event_id', resolvedEventUuid)
          .eq('user_id', effectiveUserId)
          .maybeSingle();

        if (regError) {
          return errorResult(regError.message, regError.code, regError);
        }

        if (reg) {
          const { data: pref } = await (supabase
            .from('event_preferences' as any) as any)
            .select('*')
            .eq('registration_id', reg.id)
            .maybeSingle();

          const vibes: string[] = [
            pref?.most_excited_1,
            pref?.most_excited_2,
            pref?.most_excited_3,
          ].filter(Boolean) as string[];

          return successResult({
            eventId,
            isCompleted: reg.status === 'registered' || reg.status === 'checked_in',
            matchedWith: reg.matched_with || null,
            answers: {
              partnerGenderPreference: pref?.partner_gender_preference || 'Open to Anyone',
              navratriVibes: vibes,
              favouriteEveningSpot: pref?.favourite_evening_spot || '',
              navratriExcitement: pref?.navratri_excitement ?? 50,
              garbaLevel: pref?.garba_level || '',
              garbaEnergy: pref?.garba_energy || '',
              answerLastRound: pref?.answer_last_round || '',
              answerPersonality: pref?.answer_persona || '',
              answerPartnerNewStep: pref?.answer_partner_new_step || '',
            },
            completedAt: reg.registered_at ? new Date(reg.registered_at).getTime() : Date.now(),
          });
        }

        // Supabase is configured and query returned no row: user is not registered
        return successResult(null);
      }

      // Offline / Mock fallback strictly when Supabase is not configured
      if (!isSupabaseConfigured && typeof window !== 'undefined') {
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
