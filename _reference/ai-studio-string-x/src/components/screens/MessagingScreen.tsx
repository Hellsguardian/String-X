import React, { useState, useMemo, useRef, useEffect } from 'react';
import { UserProfile } from '../../types';
import { SAMPLE_MATCH_PROFILE } from '../../data/mockData';
import { Page25 } from '../../page25-claude';
import type {
  Page25CurrentUser,
  Page25MatchedUser,
  Page25Message,
  Page25MatchContext,
  Page25SendMeta,
  Page25QuickReply,
} from '../../page25-claude';

interface MessagingScreenProps {
  profile: UserProfile;
  onBack: () => void;
  partnerName?: string;
  partnerPhoto?: string;
}

export const MessagingScreen: React.FC<MessagingScreenProps> = ({
  profile,
  onBack,
  partnerName,
  partnerPhoto,
}) => {
  const currentUserId = 'user-me';
  const partnerUserId = 'partner-match';

  const isUserMale = profile.gender === 'Male';
  const match = SAMPLE_MATCH_PROFILE;

  // Resolve partner name consistent with Page 24 match reveal
  const resolvedPartnerName =
    partnerName && partnerName !== 'Aarohi'
      ? partnerName
      : isUserMale
      ? 'Aanya'
      : (match.name ? match.name.split(' ')[0] : 'Arjun');

  const resolvedPartnerPhoto =
    partnerPhoto ||
    (isUserMale
      ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80'
      : (match.photoUrl || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80'));

  const currentUser: Page25CurrentUser = useMemo(
    () => ({
      id: currentUserId,
      firstName: profile.nickname?.trim() || profile.fullName?.trim()?.split(' ')[0] || 'You',
      avatarUrl: profile.faceVerificationPhoto || profile.photoUrl || undefined,
    }),
    [profile]
  );

  const matchedUser: Page25MatchedUser = useMemo(
    () => ({
      id: partnerUserId,
      name: resolvedPartnerName,
      avatarUrl: resolvedPartnerPhoto,
      isOnline: true,
      relationshipLabel: 'Your Garba partner',
    }),
    [resolvedPartnerName, resolvedPartnerPhoto]
  );

  const matchContext: Page25MatchContext = useMemo(() => {
    const rawInterests = profile.interests?.length
      ? profile.interests
      : profile.navratriVibes?.length
      ? profile.navratriVibes
      : ['Garba', 'Late Night Chai', 'Music'];
    const sharedInterests = rawInterests
      .slice(0, 3)
      .map((item) =>
        item.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim()
      );

    return {
      badge: 'STRINGS ATTACHED · NAVRATRI NIGHT 1',
      sharedInterests,
    };
  }, [profile]);

  const quickReplies: Page25QuickReply[] = useMemo(
    () => [
      'You coming tonight? 👀',
      'So, when and were are we meeting? 👀',
      'What are you wearing? 👀',
      'Ready for Garba? ✨',
      'Outfit match karein? 👗',
      'are u a Chai person or coffee person? 👀',
      'Sweet or spicy? 👀',
      'Which hostel are you in?',
      'Have we met before?',
    ],
    []
  );

  const icebreakers: string[] = useMemo(
    () => [
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
    ],
    []
  );

  // Initial conversation starts empty until the user sends a message
  const [messages, setMessages] = useState<Page25Message[]>([]);

  const [isTyping, setIsTyping] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(clearTimeout);
    };
  }, []);

  const handleSendMessage = (text: string, _meta: Page25SendMeta) => {
    const userMsgId = `user-${Date.now()}`;
    const userMsg: Page25Message = {
      id: userMsgId,
      senderId: currentUserId,
      text,
      createdAt: Date.now(),
      status: 'sent',
      isOwn: true,
    };

    setMessages((prev) => [...prev, userMsg]);

    // Simulated status updates: delivered → seen
    const tDelivered = setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) => (m.id === userMsgId ? { ...m, status: 'delivered' } : m))
      );
    }, 600);
    timeoutsRef.current.push(tDelivered);

    const tSeen = setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) => (m.id === userMsgId ? { ...m, status: 'seen' } : m))
      );
    }, 1300);
    timeoutsRef.current.push(tSeen);

    // Realistic partner reply
    const tTypingStart = setTimeout(() => {
      setIsTyping(true);
    }, 1800);
    timeoutsRef.current.push(tTypingStart);

    const tReply = setTimeout(() => {
      setIsTyping(false);
      let replyText = 'Totally! Let’s meet near Gate 2 at the center ground! 🪩';
      const lower = text.toLowerCase();
      if (lower.includes('you coming tonight') || lower.includes('coming tonight')) {
        replyText = 'Yess! Absolutely, arriving around 8 PM. Are you coming?';
      } else if (lower.includes('when and were') || lower.includes('meeting')) {
        replyText = 'Near Gate 2 around 8:15 PM once the crowd settles in! Sounds good?';
      } else if (lower.includes('what are you wearing')) {
        replyText = 'Traditional chaniya choli with mirror work! What about you?';
      } else if (lower.includes('ready for garba')) {
        replyText = '100% ready, energy levels are sky high! 🔥';
      } else if (lower.includes('outfit match') || lower.includes('outfit')) {
        replyText = 'Yess! Traditional yellow & royal blue for Night 1! What are you wearing?';
      } else if (lower.includes('chai person') || lower.includes('coffee person')) {
        replyText = 'Late night chai tapri fan always! But coffee for exams ☕';
      } else if (lower.includes('sweet or spicy')) {
        replyText = 'Spicy fafda-chutney first, then sweet jalebi to balance! You?';
      } else if (lower.includes('hostel')) {
        replyText = 'Block C hostel! What about you, day scholar or hostel?';
      } else if (lower.includes('met before')) {
        replyText = 'Maybe near the central library or campus food court! We might have crossed paths 😄';
      } else if (lower.includes('where are you from') || lower.includes('from?')) {
        replyText = 'From Ahmedabad! But staying on campus for college. What about you?';
      } else if (lower.includes('year are you in') || lower.includes('which year')) {
        replyText = '2nd year CSE! What about you?';
      } else if (lower.includes('studying')) {
        replyText = 'Computer Science & Design! Lots of assignments this week haha.';
      } else if (lower.includes('day going')) {
        replyText = 'Pretty good, just wrapped up classes and getting ready for evening Garba! You?';
      } else if (lower.includes('gate 2') || lower.includes('8 baje')) {
        replyText = 'Perfect, 8 baje sharp near Gate 2! I’ll look out for you ✨';
      } else if (lower.includes('chai')) {
        replyText = 'Deal! Post-Garba chai at the tapri is non-negotiable ☕';
      } else if (lower.includes('excited for garba') || lower.includes('excited')) {
        replyText = 'Super excited! Been practicing with friends all week 🔥';
      } else if (lower.includes('which garba night') || lower.includes('night are you going')) {
        replyText = 'Definitely Night 1 and the weekend rounds! Are you going today?';
      } else if (lower.includes('playlist') || lower.includes('song')) {
        replyText = 'Chogada and Dholida on repeat! Can’t wait for the live orchestra tonight 🎶';
      } else if (lower.includes('pro') || lower.includes('beginner')) {
        replyText = 'Haha intermediate! But full energy on the Sanedo rounds 🔥';
      } else if (lower.includes('step') || lower.includes('taali')) {
        replyText = '3-taali always! We’ll sync steps before the circle speeds up 🕺';
      }

      const partnerMsg: Page25Message = {
        id: `partner-${Date.now()}`,
        senderId: partnerUserId,
        text: replyText,
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, partnerMsg]);
    }, 3400);
    timeoutsRef.current.push(tReply);
  };

  return (
    <div className="relative w-full h-full min-h-0 flex-1 flex flex-col overflow-hidden">
      <Page25
        layout="fill"
        currentUser={currentUser}
        matchedUser={matchedUser}
        matchContext={matchContext}
        messages={messages}
        quickReplies={quickReplies}
        icebreakers={icebreakers}
        isMatchTyping={isTyping}
        onBack={onBack}
        onSendMessage={handleSendMessage}
        onMenuClick={() => setShowMenu((prev) => !prev)}
      />

      {/* Options dropdown menu */}
      {showMenu && (
        <div
          className="absolute inset-0 z-50 flex items-start justify-end p-4 pt-16 bg-black/40 backdrop-blur-xs"
          onClick={() => setShowMenu(false)}
        >
          <div
            className="w-48 bg-[#1e1033] border border-[#7c4dff]/40 rounded-2xl shadow-2xl py-2 overflow-hidden text-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-2 border-b border-white/10 text-xs font-semibold text-[#b9aad6]">
              {matchedUser.name} &amp; {currentUser.firstName}
            </div>
            <button
              type="button"
              onClick={() => {
                setShowMenu(false);
              }}
              className="w-full text-left px-4 py-2 text-white/90 hover:bg-white/10 transition-colors text-xs font-medium cursor-pointer"
            >
              View Match Details
            </button>
            <button
              type="button"
              onClick={() => {
                setMessages([]);
                setShowMenu(false);
              }}
              className="w-full text-left px-4 py-2 text-white/90 hover:bg-white/10 transition-colors text-xs font-medium cursor-pointer"
            >
              Clear Conversation
            </button>
            <button
              type="button"
              onClick={() => {
                setShowMenu(false);
              }}
              className="w-full text-left px-4 py-2 text-[#ff2d87] hover:bg-white/10 transition-colors text-xs font-medium cursor-pointer"
            >
              Report / Safety
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagingScreen;
