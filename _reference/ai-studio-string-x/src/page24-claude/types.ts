/**
 * Page24 — Match Reveal ("Strings attached") — public types.
 */

/**
 * College year.
 * - number 1–5  → rendered as "1st", "2nd", "3rd", "4th", "5th" with caption "YEAR"
 * - 'PG'        → rendered as "PG" with caption "YEAR" (override via `yearBadge`)
 * - any other string is shown verbatim (e.g. "3rd")
 */
export type Page24Year = number | 'PG' | string;

/** Explicit override for the small tilted year card on a polaroid. */
export interface Page24YearBadge {
  /** Big text, e.g. "3rd". */
  value: string;
  /** Small mono caption under it, e.g. "YEAR". */
  caption: string;
}

export interface Page24Person {
  /** Full or first name. Only the first word is shown on the page. */
  name: string;
  /** Absolute or relative image URL. When missing or failing to load, the design's gradient silhouette is shown. */
  photoUrl?: string | null;
  /** College year (see Page24Year). */
  year: Page24Year;
  /** Optional manual override of the year card. */
  yearBadge?: Page24YearBadge;
  /** Course / degree, e.g. "B.Tech". */
  course?: string;
  /** Interests chosen during onboarding (used to compute common interests). */
  interests?: string[];
}

export type Page24CurrentUser = Page24Person;

export interface Page24MatchedUser extends Page24Person {
  /** Shown after the first name on the polaroid label: "Aanya, 20". */
  age?: number | null;
}

/** All visible copy. Every key is optional; defaults reproduce the finalized design. */
export interface Page24Copy {
  /** Pink tag on the white card. Default: "STRINGS ATTACHED" */
  stickerTag: string;
  /** Title line 1. Default: "You found your" */
  titleLine1: string;
  /** Title line 2 (violet). Default: "Garba partner." */
  titleLine2: string;
  /** Line under the title. Default: "<MatchFirstName> · <course> <year> Year" */
  matchSubtitle: string;
  /** Label above the chips. Default: "COMMON INTERESTS" */
  interestsLabel: string;
  /** CTA text. Default: "Send a Message" */
  ctaLabel: string;
  /** Accessible label of the back button. Default: "Back" */
  backLabel: string;
  /** Alt text of the current user's photo. Default: "Your photo" */
  currentPhotoAlt: string;
  /** Alt text of the matched user's photo. Default: "<MatchFirstName>'s photo" */
  matchPhotoAlt: string;
}

export interface Page24Props {
  /** The signed-in user (left polaroid). */
  currentUser: Page24CurrentUser;
  /** The revealed match (right polaroid). */
  matchedUser: Page24MatchedUser;
  /**
   * Chips under "COMMON INTERESTS". Max 3 are shown (the design is laid out for 3).
   * If omitted: intersection of currentUser.interests and matchedUser.interests,
   * falling back to matchedUser.interests. If the final list is empty the section is hidden.
   */
  commonInterests?: string[];
  /** Header back button. If omitted the button is still rendered but does nothing. */
  onBack?: () => void;
  /** Main CTA ("Send a Message") — open the chat with the match. */
  onMessage?: () => void;
  /** Reject / skip this match (✕ button). */
  onReject?: () => void;
  /** Accept / continue with this match (✓ button). */
  onAccept?: () => void;
  /** Copy overrides. */
  copy?: Partial<Page24Copy>;
  /**
   * 'fullscreen' (default): the page sizes itself to the viewport (100dvh) and needs no wrapper.
   * 'fill': the page fills its parent box (parent must have a definite height).
   */
  layout?: 'fullscreen' | 'fill';
  /** Extra class on the outermost element. */
  className?: string;
}

/** Fully resolved data handed to the presentational view. */
export interface Page24ViewModel {
  currentName: string;
  currentPhotoUrl: string | null;
  currentYear: Page24YearBadge;
  matchLabel: string;
  matchPhotoUrl: string | null;
  matchYear: Page24YearBadge;
  interests: string[];
  copy: Page24Copy;
}
