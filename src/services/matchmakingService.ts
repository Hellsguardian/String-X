import { EventMatch } from '../types/events';
import { ServiceResult, successResult, errorResult } from '../types/api';
import { MOCK_EVENT_MATCHES } from '../data/eventsData';
import { SAMPLE_MATCH_PROFILE } from '../data/mockData';

export const matchmakingService = {
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
