import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Send, MoreVertical, Sparkles, Check, CheckCheck } from 'lucide-react';
import { UserProfile } from '../../types';
import { CampusNightChatBackground } from '../illustrations/CampusNightChatBackground';

interface Message {
  id: string;
  sender: 'user' | 'partner';
  text: string;
  timestamp: string;
}

interface MessagingScreenProps {
  profile: UserProfile;
  onBack: () => void;
  partnerName?: string;
  partnerPhoto?: string;
}

export const MessagingScreen: React.FC<MessagingScreenProps> = ({
  profile,
  onBack,
  partnerName = 'Aarohi',
  partnerPhoto,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Suggested conversation starters
  const STARTERS = [
    'Which Garba night are you going to? 🕺',
    "What's your favourite Garba song?",
    'Ready for Navratri? ✨',
  ];

  // Default partner photo fallback
  const resolvedPartnerPhoto =
    partnerPhoto ||
    (profile.gender === 'Male' ? '/assets/female.png' : '/assets/male.png');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');

    // Trigger mock partner reply after a brief realistic delay
    if (messages.length === 0) {
      setTimeout(() => {
        setIsTyping(true);
      }, 700);

      setTimeout(() => {
        setIsTyping(false);
        const replyMsg: Message = {
          id: `partner-${Date.now()}`,
          sender: 'partner',
          text: 'Hey! 👋 Super excited we matched! Are you practicing the 3-Taali steps?',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, replyMsg]);
      }, 2100);
    } else {
      setTimeout(() => {
        setIsTyping(true);
      }, 800);

      setTimeout(() => {
        setIsTyping(false);
        const replyMsg: Message = {
          id: `partner-${Date.now()}`,
          sender: 'partner',
          text: 'Totally! Let’s definitely meet near the center ground! 🪩',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, replyMsg]);
      }, 2000);
    }
  };

  const handleSelectStarter = (starterText: string) => {
    setInputText(starterText);
    inputRef.current?.focus();
  };

  return (
    <div className="w-full h-full min-h-full max-h-full flex-1 flex flex-col justify-between bg-[#251436] text-white select-none relative overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* ILLUSTRATED EVENING CAMPUS ENVIRONMENT (Flat vector editorial artwork, zero neon/glow) */}
      <CampusNightChatBackground />

      {/* TOP HEADER: ←, Profile photo, Aarohi, Your Garba partner, three-dot menu */}
      <header 
        className="relative shrink-0 z-20 px-4 pb-2.5 bg-[#251436]/90 backdrop-blur-md border-b border-[#E3E0F5]/10 flex items-center justify-between"
        style={{ paddingTop: 'max(12px, env(safe-area-inset-top, 12px))' }}
      >
        <div className="flex items-center gap-3">
          {/* Back button: small rounded-square, dark translucent, subtle purple border */}
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-[#1B0B2A]/80 hover:bg-[#1B0B2A] active:scale-95 border border-[#894EFF]/30 flex items-center justify-center text-white transition-all cursor-pointer shadow-xs"
            aria-label="Back to match reveal"
          >
            <ArrowLeft size={16} strokeWidth={2.4} />
          </button>

          {/* Profile photo with subtle border & online ring */}
          <div className="relative">
            <div className="w-9 h-9 rounded-full overflow-hidden border border-[#F02A8A]/70 bg-[#1B0B2A]">
              <img
                src={resolvedPartnerPhoto}
                alt={partnerName}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.src = '/assets/female.png';
                }}
              />
            </div>
            {/* Small online green dot */}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#08A98D] border-2 border-[#251436]" />
          </div>

          {/* Name & status */}
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white tracking-tight leading-tight">
              {partnerName}
            </span>
            <span className="text-[11px] font-medium text-[#E3E0F5]/70 leading-tight">
              Your Garba partner
            </span>
          </div>
        </div>

        {/* Right action: subtle three-dot button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMenu((prev) => !prev)}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 flex items-center justify-center text-[#E3E0F5]/80 hover:text-white transition-all cursor-pointer"
            aria-label="Chat options"
          >
            <MoreVertical size={16} />
          </button>

          {/* Minimal dropdown menu */}
          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 4 }}
                className="absolute right-0 top-10 w-40 bg-[#1B0B2A] border border-[#894EFF]/30 rounded-xl shadow-xl py-1.5 z-50 text-xs"
              >
                <button
                  type="button"
                  onClick={() => setShowMenu(false)}
                  className="w-full text-left px-3 py-1.5 hover:bg-white/10 text-white/90 transition-colors"
                >
                  View String Details
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMessages([]);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-white/10 text-white/90 transition-colors"
                >
                  Clear Chat
                </button>
                <button
                  type="button"
                  onClick={() => setShowMenu(false)}
                  className="w-full text-left px-3 py-1.5 hover:bg-white/10 text-[#F02A8A] transition-colors"
                >
                  Report / Safety
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* CHAT MESSAGES SCROLL AREA */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 z-10 no-scrollbar">
        {/* CONVERSATION INTRO: String & Sparkles, Connected message */}
        <div className="py-4 px-3 flex flex-col items-center text-center my-2">
          {/* Miniature string loop graphic */}
          <div className="w-12 h-12 rounded-full bg-[#1B0B2A] border border-[#FFC928]/40 shadow-[0_0_16px_rgba(255,201,40,0.2)] flex items-center justify-center text-[#FFC928] mb-2.5 relative">
            <Sparkles size={20} strokeWidth={2.4} />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 12, ease: 'linear' }}
              className="absolute inset-0 rounded-full border border-dashed border-[#F02A8A]/40"
            />
          </div>

          <h3 className="text-sm font-extrabold text-white tracking-tight">
            Your strings are connected ✨
          </h3>
          <p className="text-xs font-medium text-[#E3E0F5]/75 mt-1 max-w-[240px]">
            Say hi and start your Garba story.
          </p>
        </div>

        {/* SUGGESTED CONVERSATION STARTERS (Chips) */}
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="space-y-2 max-w-[320px] mx-auto pt-1 pb-3"
          >
            <span className="text-[10px] font-black uppercase text-[#894EFF] tracking-wider text-center block">
              Suggested Starters
            </span>
            <div className="flex flex-col gap-1.5">
              {STARTERS.map((starter) => (
                <button
                  key={starter}
                  type="button"
                  onClick={() => handleSelectStarter(starter)}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl bg-[#1B0B2A]/90 hover:bg-[#1B0B2A] active:scale-[0.99] border border-[#894EFF]/30 hover:border-[#894EFF]/60 text-xs font-medium text-[#E3E0F5] transition-all cursor-pointer shadow-xs flex items-center justify-between group"
                >
                  <span>{starter}</span>
                  <span className="text-[10px] text-[#894EFF] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    Tap to use
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* RENDER MESSAGES */}
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[78%] px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed shadow-sm ${
                  isUser
                    ? 'bg-[#894EFF] text-white rounded-2xl rounded-br-xs shadow-[0_4px_16px_rgba(137,78,255,0.35)]'
                    : 'bg-[#1B0B2A] border border-[#894EFF]/30 text-[#E3E0F5] rounded-2xl rounded-bl-xs'
                }`}
              >
                {msg.text}
              </div>
              <div className="flex items-center gap-1 mt-1 px-1">
                <span className="text-[9.5px] text-[#E3E0F5]/50">{msg.timestamp}</span>
                {isUser && <CheckCheck size={11} className="text-[#08A98D]" />}
              </div>
            </motion.div>
          );
        })}

        {/* TYPING INDICATOR */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#1B0B2A] border border-[#894EFF]/30 rounded-2xl rounded-bl-xs w-fit"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#894EFF] animate-bounce" />
            <span
              className="w-1.5 h-1.5 rounded-full bg-[#F02A8A] animate-bounce"
              style={{ animationDelay: '0.15s' }}
            />
            <span
              className="w-1.5 h-1.5 rounded-full bg-[#FFC928] animate-bounce"
              style={{ animationDelay: '0.3s' }}
            />
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* BOTTOM FIXED MESSAGE COMPOSER */}
      <footer 
        className="relative shrink-0 z-20 px-3.5 pt-2 bg-[#251436]/95 backdrop-blur-md border-t border-[#E3E0F5]/10"
        style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))' }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2 max-w-[420px] mx-auto"
        >
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Message your Garba partner... 😊"
              className="w-full bg-[#1B0B2A] text-white placeholder-[#E3E0F5]/40 text-xs sm:text-sm rounded-full pl-4 pr-3 py-2.5 border border-[#E3E0F5]/20 focus:outline-none focus:border-[#894EFF] transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={!inputText.trim()}
            className="w-10 h-10 rounded-full bg-[#894EFF] hover:bg-[#7839f3] disabled:opacity-40 disabled:hover:bg-[#894EFF] active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-[0_2px_12px_rgba(137,78,255,0.4)]"
            aria-label="Send message"
          >
            <Send size={15} strokeWidth={2.4} className="translate-x-[1px]" />
          </button>
        </form>
      </footer>
    </div>
  );
};
