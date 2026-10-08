import type {
  Page25CurrentUser,
  Page25MatchContext,
  Page25MatchedUser,
  Page25Message,
  Page25QuickReply,
} from '../types';

/**
 * Preview-only sample data. Used when Page 25 is rendered without real data.
 * Do not use in production; the host app passes real String X data via props.
 */
const today = (h: number, m: number): number => {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.getTime();
};

export const PAGE25_DEMO_CURRENT_USER: Page25CurrentUser = { id: 'demo-me', firstName: 'Dev' };

export const PAGE25_DEMO_MATCHED_USER: Page25MatchedUser = {
  id: 'demo-match',
  name: 'Aanya',
  isOnline: true,
  relationshipLabel: 'Your Garba partner',
};

export const PAGE25_DEMO_MESSAGES: Page25Message[] = [
  { id: 'd1', senderId: 'demo-match', text: 'Kem cho! Finally pata chala kaun hai mera Garba partner', createdAt: today(19, 42) },
  { id: 'd2', senderId: 'demo-me', text: 'Haha same! Tumne bhi Late Night Chai pick kiya?', createdAt: today(19, 43), status: 'seen' },
  { id: 'd3', senderId: 'demo-match', text: 'Obviously. Garba ke baad chai is non-negotiable', createdAt: today(19, 44) },
  { id: 'd4', senderId: 'demo-match', text: 'Aaj kitne baje aa rahe ho ground pe?', createdAt: today(19, 44) },
];

export const PAGE25_DEMO_QUICK_REPLIES: Page25QuickReply[] = [
  'You coming tonight? 👀',
  'So, when and were are we meeting? 👀',
  'What are you wearing? 👀',
  'Ready for Garba? ✨',
  'Outfit match karein? 👗',
  'are u a Chai person or coffee person? 👀',
  'Sweet or spicy? 👀',
  'Which hostel are you in?',
  'Have we met before?',
];

export const PAGE25_DEFAULT_ICEBREAKERS: string[] = [
  'Hii, where are you from? 👋',
  'Heyy, which hostel are you in?',
  'Hii! Which year are you in?',
  'What are you studying?',
  'Have we met somewhere on campus before? 👀',
  "How's your day going?",
  'Are you excited for Garba? 💃',
  'Which Garba night are you going to?',
  "What's your go-to Garba song? 🎶",
  'Okay important question — chai after Garba? ☕',
];

export const PAGE25_DEMO_MATCH_CONTEXT: Page25MatchContext = {
  badge: 'STRINGS ATTACHED · NAVRATRI NIGHT 1',
  sharedInterests: ['Garba', 'Late Night Chai', 'Music'],
};
