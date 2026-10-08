/**
 * Public data contracts for Page 25 (Garba partner chat).
 * The host String X app maps its own user / message records onto these shapes.
 */

export interface Page25CurrentUser {
  /** Stable id of the signed-in user. Used to decide which messages are "mine". */
  id: string;
  /** First name of the signed-in user (not shown on this screen, kept for adapters/analytics). */
  firstName?: string;
  avatarUrl?: string;
}

export interface Page25MatchedUser {
  id: string;
  /** Display name shown in the header, e.g. "Aanya". */
  name: string;
  /** Optional photo. When missing, the first letter of `name` is shown inside the ring. */
  avatarUrl?: string;
  /** Drives the green dot and the "· Online" / "· Offline" suffix. */
  isOnline?: boolean;
  /** Left part of the status line. Defaults to "Your Garba partner". */
  relationshipLabel?: string;
  /** Replaces the whole status line (except while typing) when provided. */
  statusText?: string;
}

export type Page25MessageStatus = 'sending' | 'sent' | 'delivered' | 'seen' | 'failed';

export interface Page25Message {
  id: string;
  /** Compared with `currentUser.id` to decide bubble side, unless `isOwn` is set. */
  senderId: string;
  text: string;
  /** ISO string, epoch milliseconds or Date. */
  createdAt: string | number | Date;
  /** Delivery state for outgoing messages. Ignored for incoming messages. */
  status?: Page25MessageStatus;
  /** Optional explicit override of the side. */
  isOwn?: boolean;
}

export type Page25QuickReply =
  | string
  | {
      id?: string;
      /** Text shown on the chip. */
      label: string;
      /** Text actually sent. Defaults to `label`. */
      message?: string;
    };

export interface Page25MatchContext {
  /** Small dark pill at the top of the conversation, e.g. "STRINGS ATTACHED · NAVRATRI NIGHT 1". */
  badge?: string;
  /** Rendered as "You both picked A, B and C." */
  sharedInterests?: string[];
}

export type Page25SendSource = 'composer' | 'quick-reply' | 'icebreaker';

export interface Page25SendMeta {
  source: Page25SendSource;
}

export interface Page25Props {
  currentUser?: Page25CurrentUser;
  matchedUser?: Page25MatchedUser;
  /**
   * Conversation messages, oldest first.
   * When omitted, Page 25 runs in standalone preview mode with demo data and local state.
   * When provided, the component is fully controlled: the host must append new messages.
   */
  messages?: Page25Message[];
  quickReplies?: Page25QuickReply[];
  /** Icebreaker prompts shown one at a time in the card. Pass [] to hide the card. */
  icebreakers?: string[];
  matchContext?: Page25MatchContext;
  /** Shows the typing bubble and "typing…" in the header. */
  isMatchTyping?: boolean;

  onBack?: () => void;
  /**
   * Called for composer sends, quick replies and icebreakers.
   * If it returns a rejected promise, the composer text is restored.
   */
  onSendMessage?: (text: string, meta: Page25SendMeta) => void | Promise<void>;
  /** Three-dot button. Receives the button element so the host can anchor its own menu. */
  onMenuClick?: (anchor: HTMLButtonElement) => void;
  /** Fires on every composer keystroke (e.g. to emit a typing signal). */
  onDraftChange?: (text: string) => void;

  /**
   * "viewport" (default): fills the visible mobile viewport (dvh + visualViewport, safe areas).
   * "fill": fills the parent element (height: 100%). Use inside a device frame or a sized layout.
   */
  layout?: 'viewport' | 'fill';
  inputPlaceholder?: string;
  maxMessageLength?: number;
  /** Disables the composer, quick replies and icebreakers (e.g. blocked/unmatched). */
  disabled?: boolean;
  /** Custom timestamp formatter. Default: "07:42 PM". */
  formatTime?: (value: Page25Message['createdAt']) => string;
  className?: string;
}
