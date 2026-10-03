import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Compass,
  Calendar,
  HeartHandshake,
  User,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Share2,
  RefreshCw,
  LogOut,
  MapPin,
  GraduationCap,
  Flame,
} from 'lucide-react';
import { UserProfile } from '../../types';
import { EventDefinition } from '../../types/events';
import { STRINGX_EVENTS } from '../../data/eventsData';
import { StringXLogo } from '../illustrations/GarbaIllustrations';
import { EventDiscoveryFeed } from './EventDiscoveryFeed';
import { EventIntroScreen } from './EventIntroScreen';
import { EventQuestionnaireScreen } from './EventQuestionnaireScreen';
import { EventMatchingTransition } from './EventMatchingTransition';
import { EventMatchesScreen } from './EventMatchesScreen';

interface MainAppLayoutProps {
  profile: UserProfile;
  initialEventId?: string;
  initialSubView?: 'feed' | 'intro' | 'questions' | 'transition' | 'matches';
  onReturnToOnboarding?: () => void;
}

export type MainTab = 'home' | 'events' | 'matches' | 'profile';

export const MainAppLayout: React.FC<MainAppLayoutProps> = ({
  profile,
  initialEventId = 'navratri',
  initialSubView = 'feed',
  onReturnToOnboarding,
}) => {
  const [activeTab, setActiveTab] = useState<MainTab>('home');
  const [subView, setSubView] = useState<'feed' | 'intro' | 'questions' | 'transition' | 'matches'>(
    initialSubView
  );
  const [selectedEventId, setSelectedEventId] = useState<string>(initialEventId);
  const [joinedEventIds, setJoinedEventIds] = useState<string[]>(['navratri']);
  const [eventAnswers, setEventAnswers] = useState<Record<string, Record<string, any>>>({
    navratri: {
      'garba-experience': 'decent',
      'garba-energy': 'full-energy',
      'partner-type': 'match-energy',
      frequency: 'often',
      'ideal-night': 'dance-all-night',
      'social-energy': 85,
    },
  });

  const currentEvent: EventDefinition =
    STRINGX_EVENTS.find((e) => e.id === selectedEventId) || STRINGX_EVENTS[0];

  // Handler to open an event from feed
  const handleSelectEvent = (eventId: string) => {
    setSelectedEventId(eventId);
    // If user already joined this event and answers exist, open intro with option to view matches directly
    setSubView('intro');
  };

  // Handler to start questionnaire
  const handleStartQuestions = () => {
    setSubView('questions');
  };

  // Handler when questionnaire completes
  const handleCompleteQuestions = (answers: Record<string, any>) => {
    setEventAnswers((prev) => ({ ...prev, [selectedEventId]: answers }));
    if (!joinedEventIds.includes(selectedEventId)) {
      setJoinedEventIds((prev) => [...prev, selectedEventId]);
    }
    // Transition to the matching algorithm animation
    setSubView('transition');
  };

  // Handler when matching animation finishes and user clicks "See my matches"
  const handleProceedToMatches = () => {
    setSubView('matches');
  };

  // Back to feed
  const handleBackToFeed = () => {
    setSubView('feed');
  };

  return (
    <div className="w-full h-full min-h-full max-h-full flex-1 flex flex-col justify-between bg-[#E3E0F5] text-[#251436] select-none overflow-hidden relative">
      {/* 
        TOP PERSISTENT APP HEADER
        Shown on standard tabs (Home, Events, Matches, Profile) when not in a modal question/intro view
      */}
      {subView === 'feed' && (
        <header className="shrink-0 flex items-center justify-between px-4 sm:px-5 pt-[max(12px,env(safe-area-inset-top,0px))] pb-2 border-b border-[#251436]/10 bg-[#E3E0F5]">
          <div className="flex items-center gap-2">
            <StringXLogo size="sm" />
            <div className="flex items-center gap-1 bg-white border border-[#251436] px-2 py-0.5 rounded-full shadow-[1px_1px_0px_#251436]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
              <span className="text-[10px] font-black uppercase text-[#251436] truncate max-w-[110px] sm:max-w-[140px]">
                {profile.collegeName || 'Campus Pass'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className="flex items-center gap-1.5 bg-white border-2 border-[#251436] px-2.5 py-1 rounded-xl shadow-[1.5px_1.5px_0px_#251436] cursor-pointer hover:bg-[#F3EEFF] active:translate-y-0.5 transition-all"
          >
            <div className="w-5 h-5 rounded-full bg-[#894EFF] text-white flex items-center justify-center text-[10px] font-black overflow-hidden">
              {profile.photoUrl ? (
                <img src={profile.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                profile.nickname?.[0] || 'U'
              )}
            </div>
            <span className="text-xs font-black text-[#251436]">
              {profile.nickname || 'Profile'}
            </span>
          </button>
        </header>
      )}

      {/* MAIN VIEWPORT CONTAINER */}
      <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {/* SUB-FLOW: EVENT INTRO */}
        {subView === 'intro' && (
          <EventIntroScreen
            event={currentEvent}
            onStartQuestions={handleStartQuestions}
            onBack={handleBackToFeed}
            alreadyAnswered={joinedEventIds.includes(currentEvent.id)}
            onViewMatchesDirectly={() => setSubView('matches')}
          />
        )}

        {/* SUB-FLOW: QUESTIONNAIRE */}
        {subView === 'questions' && (
          <EventQuestionnaireScreen
            event={currentEvent}
            onComplete={handleCompleteQuestions}
            onCancel={handleBackToFeed}
          />
        )}

        {/* SUB-FLOW: MATCHING ALGORITHM TRANSITION */}
        {subView === 'transition' && (
          <EventMatchingTransition
            event={currentEvent}
            answers={eventAnswers[selectedEventId] || {}}
            onProceedToMatches={handleProceedToMatches}
          />
        )}

        {/* SUB-FLOW: EVENT MATCHES */}
        {subView === 'matches' && (
          <EventMatchesScreen
            currentEvent={currentEvent}
            allEvents={STRINGX_EVENTS}
            joinedEventIds={joinedEventIds}
            onSelectEvent={(evtId) => {
              setSelectedEventId(evtId);
            }}
            onBackToHome={handleBackToFeed}
          />
        )}

        {/* STANDARD TAB VIEWS */}
        {subView === 'feed' && (
          <>
            {/* 1. HOME / EVENT DISCOVERY */}
            {activeTab === 'home' && (
              <EventDiscoveryFeed
                onSelectEvent={handleSelectEvent}
                joinedEventIds={joinedEventIds}
              />
            )}

            {/* 2. ALL EVENTS TAB */}
            {activeTab === 'events' && (
              <div className="w-full flex-1 flex flex-col overflow-y-auto no-scrollbar px-4 sm:px-5 py-3">
                <div className="mb-3">
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#894EFF]">
                    All Campus Events
                  </span>
                  <h2 className="text-xl font-black text-[#251436] tracking-tight">
                    Find where your campus is heading
                  </h2>
                </div>

                <div className="flex flex-col gap-3">
                  {STRINGX_EVENTS.map((evt) => {
                    const isJoined = joinedEventIds.includes(evt.id);
                    return (
                      <div
                        key={evt.id}
                        onClick={() => handleSelectEvent(evt.id)}
                        className="bg-white rounded-2xl border-2 border-[#251436] p-3.5 shadow-[3px_3px_0px_#251436] cursor-pointer hover:shadow-[4px_4px_0px_#251436] transition-all flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-10 h-10 rounded-xl border-2 border-[#251436] flex items-center justify-center text-xl shrink-0"
                            style={{ backgroundColor: evt.accentBg }}
                          >
                            <span>{evt.emoji}</span>
                          </div>
                          <div>
                            <h3 className="text-sm font-black text-[#251436] leading-tight">
                              {evt.title}
                            </h3>
                            <p className="text-[11px] font-bold text-[#894EFF]">
                              {evt.tagline}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`text-xs font-black px-2.5 py-1 rounded-xl border ${
                            isJoined
                              ? 'bg-[#E2F8F4] text-[#08A98D] border-[#08A98D]'
                              : 'bg-[#894EFF] text-white border-[#251436]'
                          }`}
                        >
                          {isJoined ? 'Joined ✓' : 'Join'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. MATCHES HUB TAB */}
            {activeTab === 'matches' && (
              <div className="w-full flex-1 flex flex-col justify-between overflow-y-auto no-scrollbar px-4 sm:px-5 py-3">
                <div>
                  <div className="mb-3">
                    <span className="text-[11px] font-black uppercase tracking-wider text-[#894EFF]">
                      Event Match Hub
                    </span>
                    <h2 className="text-xl font-black text-[#251436] tracking-tight">
                      Your event-specific pairings
                    </h2>
                    <p className="text-xs text-[#251436]/70 mt-0.5">
                      Select an event to browse your compatible peers.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3">
                    {STRINGX_EVENTS.filter((e) => joinedEventIds.includes(e.id)).map((evt) => (
                      <div
                        key={evt.id}
                        onClick={() => {
                          setSelectedEventId(evt.id);
                          setSubView('matches');
                        }}
                        className="bg-white rounded-2xl border-2 border-[#251436] p-4 shadow-[3px_3px_0px_#251436] cursor-pointer hover:shadow-[4px_4px_0px_#894EFF] transition-all flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{evt.emoji}</span>
                          <div>
                            <h3 className="text-base font-black text-[#251436] leading-tight">
                              {evt.title}
                            </h3>
                            <p className="text-xs font-bold text-[#08A98D]">
                              Compatible peers waiting ✨
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="px-3 py-1.5 rounded-xl bg-[#894EFF] text-white text-xs font-black border-2 border-[#251436] shadow-[1.5px_1.5px_0px_#251436]"
                        >
                          Open Matches →
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-white/70 rounded-2xl border border-[#251436]/20 text-center text-xs font-medium text-[#251436]/75 mt-4">
                  Each event generates independent compatibility matches based on event vibe.
                </div>
              </div>
            )}

            {/* 4. VERIFIED PROFILE TAB */}
            {activeTab === 'profile' && (
              <div className="w-full flex-1 flex flex-col justify-between overflow-y-auto no-scrollbar px-4 sm:px-5 py-3">
                <div className="space-y-3">
                  {/* Verified Badge */}
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs font-black text-[#10B981] bg-[#E2F8F4] border border-[#10B981] px-3 py-1 rounded-full">
                      <ShieldCheck size={14} strokeWidth={2.5} />
                      <span>Verified College Student</span>
                    </span>

                    {onReturnToOnboarding && (
                      <button
                        type="button"
                        onClick={onReturnToOnboarding}
                        className="text-[11px] font-bold text-[#894EFF] hover:underline cursor-pointer"
                      >
                        View Onboarding Form
                      </button>
                    )}
                  </div>

                  {/* Profile Card */}
                  <div className="bg-white rounded-3xl border-3 border-[#251436] p-4 shadow-[4px_4px_0px_#251436]">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-14 h-14 rounded-2xl border-2 border-[#251436] overflow-hidden shadow-[2px_2px_0px_#251436] bg-[#894EFF] text-white flex items-center justify-center text-xl font-black">
                        {profile.photoUrl ? (
                          <img
                            src={profile.photoUrl}
                            alt={profile.fullName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          profile.nickname?.[0] || 'U'
                        )}
                      </div>

                      <div>
                        <h2 className="text-lg font-black text-[#251436] leading-tight">
                          {profile.fullName || 'Student'}
                        </h2>
                        <p className="text-xs font-bold text-[#894EFF]">
                          "{profile.nickname || 'Student'}" · {profile.collegeYear || 'Campus'}
                        </p>
                        <p className="text-[11px] text-[#251436]/70">
                          {profile.collegeName || 'Parul University'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-bold text-[#251436]/80 pt-2 border-t border-[#251436]/15">
                      <div className="p-2 rounded-xl bg-[#F3EEFF] border border-[#894EFF]/30">
                        <span className="text-[10px] text-[#894EFF] uppercase block">Garba Energy</span>
                        <span>{profile.garbaEnergy || 'Energetic ⚡'}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-[#FFF9E6] border border-[#FFC928]/40">
                        <span className="text-[10px] text-[#FF8811] uppercase block">Skill Level</span>
                        <span>{profile.garbaLevelTitle || 'Pretty decent 🔥'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Joined Events Passes */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#251436]/70">
                      Active Event Passes ({joinedEventIds.length})
                    </span>
                    <div className="flex gap-2">
                      {joinedEventIds.map((id) => {
                        const evt = STRINGX_EVENTS.find((e) => e.id === id);
                        if (!evt) return null;
                        return (
                          <div
                            key={id}
                            onClick={() => {
                              setSelectedEventId(id);
                              setSubView('matches');
                            }}
                            className="flex-1 p-2.5 rounded-xl bg-white border-2 border-[#251436] shadow-[2px_2px_0px_#251436] flex items-center gap-2 cursor-pointer hover:bg-[#F3EEFF]"
                          >
                            <span className="text-xl">{evt.emoji}</span>
                            <div className="min-w-0">
                              <span className="text-xs font-black text-[#251436] block truncate">
                                {evt.title}
                              </span>
                              <span className="text-[10px] font-bold text-[#08A98D] block">
                                Matches Ready
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="pt-3">
                  <p className="text-[11px] text-center text-[#251436]/60">
                    STRING X Campus Verification Pass
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* 
        BOTTOM MAIN NAVIGATION BAR:
        - Home
        - Events
        - Matches
        - Profile
        Shown only when on root tabs
      */}
      {subView === 'feed' && (
        <nav
          aria-label="Main Navigation"
          className="shrink-0 bg-white border-t-3 border-[#251436] px-3 sm:px-5 py-2 pb-[max(10px,env(safe-area-inset-bottom,0px))] flex items-center justify-around shadow-[0_-2px_10px_rgba(37,20,54,0.06)]"
        >
          {/* 1. Home Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'home'
                ? 'text-[#894EFF] font-black'
                : 'text-[#251436]/60 font-bold hover:text-[#251436]'
            }`}
          >
            <div
              className={`p-1 rounded-lg transition-colors ${
                activeTab === 'home' ? 'bg-[#894EFF]/15' : 'bg-transparent'
              }`}
            >
              <Compass size={18} strokeWidth={activeTab === 'home' ? 3 : 2} />
            </div>
            <span className="text-[10px] tracking-tight">Home</span>
          </button>

          {/* 2. Events Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('events')}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'events'
                ? 'text-[#894EFF] font-black'
                : 'text-[#251436]/60 font-bold hover:text-[#251436]'
            }`}
          >
            <div
              className={`p-1 rounded-lg transition-colors ${
                activeTab === 'events' ? 'bg-[#894EFF]/15' : 'bg-transparent'
              }`}
            >
              <Calendar size={18} strokeWidth={activeTab === 'events' ? 3 : 2} />
            </div>
            <span className="text-[10px] tracking-tight">Events</span>
          </button>

          {/* 3. Matches Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('matches')}
            className={`relative flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'matches'
                ? 'text-[#894EFF] font-black'
                : 'text-[#251436]/60 font-bold hover:text-[#251436]'
            }`}
          >
            <div
              className={`p-1 rounded-lg transition-colors ${
                activeTab === 'matches' ? 'bg-[#894EFF]/15' : 'bg-transparent'
              }`}
            >
              <HeartHandshake size={18} strokeWidth={activeTab === 'matches' ? 3 : 2} />
            </div>
            <span className="text-[10px] tracking-tight">Matches</span>
            {joinedEventIds.length > 0 && (
              <span className="absolute top-1 right-3 w-2 h-2 rounded-full bg-[#F02A8A] ring-1 ring-white" />
            )}
          </button>

          {/* 4. Profile Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'text-[#894EFF] font-black'
                : 'text-[#251436]/60 font-bold hover:text-[#251436]'
            }`}
          >
            <div
              className={`p-1 rounded-lg transition-colors ${
                activeTab === 'profile' ? 'bg-[#894EFF]/15' : 'bg-transparent'
              }`}
            >
              <User size={18} strokeWidth={activeTab === 'profile' ? 3 : 2} />
            </div>
            <span className="text-[10px] tracking-tight">Profile</span>
          </button>
        </nav>
      )}
    </div>
  );
};
