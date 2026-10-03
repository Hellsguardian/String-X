export interface AssignedMatch {
  id: string;
  name: string;
  nickname?: string;
  age: number;
  collegeYear: string;
  college: string;
  department: string;
  photoUrl: string;
  height?: string;
  garbaLevel?: string;
  garbaEnergy?: string;
  homeState?: string;
  sharedInterests: string[];
  assignedAt: string;
}

const STORAGE_KEY = 'string_x_assigned_match';
const CHANNEL_NAME = 'string_x_matching_channel';
const EVENT_ASSIGNED = 'string_x_match_assigned';
const EVENT_CLEARED = 'string_x_match_cleared';

// BroadcastChannel instance (if supported by browser)
let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
  }
} catch {
  // broadcastChannel not supported
}

/**
 * Get currently assigned match from persistence / backend cache
 */
export function getAssignedMatch(): AssignedMatch | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AssignedMatch;
  } catch {
    return null;
  }
}

/**
 * Assign a match to the current user (called by admin / backend / dev tool)
 */
export function assignMatch(matchData?: Partial<AssignedMatch>): AssignedMatch {
  const match: AssignedMatch = {
    id: matchData?.id || `match-${Date.now()}`,
    name: matchData?.name || 'Aarohi Patel',
    nickname: matchData?.nickname || (matchData?.name ? matchData.name.split(' ')[0] : 'Aarohi'),
    age: matchData?.age || 20,
    collegeYear: matchData?.collegeYear || '2nd Year',
    college: matchData?.college || 'Parul University',
    department: matchData?.department || 'Design & Arts',
    photoUrl:
      matchData?.photoUrl ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    height: matchData?.height || '168 cm',
    garbaLevel: matchData?.garbaLevel || '3-Taali Enthusiast 🔥',
    garbaEnergy: matchData?.garbaEnergy || 'Non-Stop / All 9 Nights 🪩',
    homeState: matchData?.homeState || 'Gujarat',
    sharedInterests: matchData?.sharedInterests || [
      'Dandiya Raas 🥢',
      'Midnight Maggie & Chai 🍜',
      'Sanedo Screaming 🗣️',
      'Traditional Chaniya Choli 💃',
    ],
    assignedAt: new Date().toISOString(),
    ...matchData,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(match));
    window.dispatchEvent(new CustomEvent(EVENT_ASSIGNED, { detail: match }));
    broadcastChannel?.postMessage({ type: 'MATCH_ASSIGNED', payload: match });
  } catch (err) {
    console.error('Failed to persist match assignment', err);
  }

  return match;
}

/**
 * Clear the current match (to return to waiting/searching state)
 */
export function clearAssignedMatch(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(EVENT_CLEARED));
    broadcastChannel?.postMessage({ type: 'MATCH_CLEARED' });
  } catch (err) {
    console.error('Failed to clear match assignment', err);
  }
}

/**
 * Subscribe to real-time changes in match assignment
 * Listens to custom events, cross-tab storage, and BroadcastChannel
 */
export function subscribeToMatch(
  onMatch: (match: AssignedMatch) => void,
  onClear?: () => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleCustomEvent = (e: Event) => {
    const custom = e as CustomEvent<AssignedMatch>;
    if (custom.detail) {
      onMatch(custom.detail);
    }
  };

  const handleClearEvent = () => {
    onClear?.();
  };

  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      if (e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          onMatch(parsed);
        } catch {
          // ignore
        }
      } else {
        onClear?.();
      }
    }
  };

  const handleBroadcast = (e: MessageEvent) => {
    if (e.data?.type === 'MATCH_ASSIGNED' && e.data.payload) {
      onMatch(e.data.payload);
    } else if (e.data?.type === 'MATCH_CLEARED') {
      onClear?.();
    }
  };

  window.addEventListener(EVENT_ASSIGNED, handleCustomEvent);
  window.addEventListener(EVENT_CLEARED, handleClearEvent);
  window.addEventListener('storage', handleStorage);
  broadcastChannel?.addEventListener('message', handleBroadcast);

  return () => {
    window.removeEventListener(EVENT_ASSIGNED, handleCustomEvent);
    window.removeEventListener(EVENT_CLEARED, handleClearEvent);
    window.removeEventListener('storage', handleStorage);
    broadcastChannel?.removeEventListener('message', handleBroadcast);
  };
}

/**
 * Fallback polling mechanism: polls for match assignment every `intervalMs`
 * Automatically stops once a match is found or when cleanup is called
 */
export function pollForMatch(
  onMatch: (match: AssignedMatch) => void,
  intervalMs = 3000
): () => void {
  if (typeof window === 'undefined') return () => {};

  let active = true;

  const timer = setInterval(() => {
    if (!active) return;
    const match = getAssignedMatch();
    if (match) {
      active = false;
      clearInterval(timer);
      onMatch(match);
    }
  }, intervalMs);

  return () => {
    active = false;
    clearInterval(timer);
  };
}

// Expose on window for manual test / admin trigger via developer console
if (typeof window !== 'undefined') {
  (window as unknown as { __stringX: unknown }).__stringX = {
    assignMatch,
    clearAssignedMatch,
    getAssignedMatch,
  };
}
