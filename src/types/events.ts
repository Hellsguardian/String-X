export type EventCategory = 'all' | 'cultural' | 'campus' | 'fest' | 'social';

export type EventQuestionType = 'cards' | 'scale' | 'slider';

export interface EventOption {
  id: string;
  title: string;
  subtitle?: string;
  emoji?: string;
  vibe?: string;
  badge?: string;
}

export interface ScalePoint {
  value: string;
  label: string;
  emoji?: string;
}

export interface SliderConfig {
  minLabel: string;
  maxLabel: string;
  defaultValue?: number;
}

export interface EventQuestion {
  id: string;
  numberLabel: string; // e.g. "Question 01"
  title: string;
  subtitle?: string;
  type: EventQuestionType;
  options?: EventOption[];
  scalePoints?: ScalePoint[];
  sliderConfig?: SliderConfig;
}

export interface VibeDimensionConfig {
  key: string;
  label: string;
  defaultScore: number;
  color: string;
}

export interface EventDefinition {
  id: string;
  category: 'cultural' | 'campus' | 'fest' | 'social';
  title: string;
  tagline: string;
  shortDesc: string;
  emoji: string;
  participantCount: string;
  joinedCountNum: number;
  accentColor: string;
  accentBg: string;
  accentBorder: string;
  themeGradient: string;
  badge: string;
  date: string;
  location: string;
  introHeadline: string;
  introSubtitle: string;
  questions: EventQuestion[];
  vibeDimensions: VibeDimensionConfig[];
}

export interface EventMatch {
  id: string;
  eventId: string;
  name: string;
  nickname: string;
  age: number;
  gender: string;
  college: string;
  department: string;
  collegeYear: string;
  photoUrl: string;
  compatibilityScore: number;
  vibeTitle: string;
  vibeQuote: string;
  sharedHighlights: string[];
  dimensionScores: { label: string; score: number }[];
  badges: string[];
}

export interface UserEventRegistration {
  eventId: string;
  isCompleted: boolean;
  answers: Record<string, any>;
  completedAt?: number;
  matchedWith?: string | null;
}
