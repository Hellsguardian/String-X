import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Send, Sparkles } from 'lucide-react';
import { UserProfile } from '../../types';

interface MatchChatScreenProps {
  profile: UserProfile;
  initialDraft?: string;
  onBack: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'partner';
  text: string;
  timestamp: string;
}

export const MatchChatScreen: React.FC<MatchChatScreenProps> = ({
  profile,
  initialDraft = '',
  onBack,
}) => {
  const isGuysPreference = profile.partnerGenderPreference === 'Guys';
  const partnerName = isGuysPreference ? 'Arjun' : 'Aarohi';
  const partnerPhoto = isGuysPreference
    ? 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80'
    : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80';

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState(initialDraft);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const starters = [
    'Ready for Garba? 💃',
    "What's your favourite Garba song?",
    'Which Navratri night are you going to? 👀',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    if (initialDraft) {
      inputRef.current?.focus();
    }
  }, [initialDraft]);

  const getTimeString = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: getTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');

    // Trigger realistic partner reply
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      let replyText = `Hey!! So glad our strings connected! 🪩✨ Can't wait for Navratri tonight!`;
      if (text.includes('song')) {
        replyText = `Definitely 'Chogada' and 'Kamariya'! Have you got your steps ready? 🎶`;
      } else if (text.includes('night') || text.includes('excited')) {
        replyText = `Night 1 for sure! The energy at the main ground is going to be unreal! ✨`;
      } else if (text.includes('Ready') || text.includes('Garba')) {
        replyText = `100% ready! Let's get a 3-tali Garba circle going as soon as it kicks off! 💃`;
      }

      const partnerMsg: ChatMessage = {
        id: `partner-${Date.now()}`,
        sender: 'partner',
        text: replyText,
        timestamp: getTimeString(),
      };
      setMessages((prev) => [...prev, partnerMsg]);
    }, 1300);
  };

  const handleSelectStarter = (starterText: string) => {
    setInputText(starterText);
    inputRef.current?.focus();
  };

  return (
    <div className="w-full h-full min-h-full max-h-full flex-1 flex flex-col justify-between bg-[#251436] text-white select-none relative overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          1. CHAT HEADER
          ←        [Avatar] Aarohi
                   Your String X match
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <header className="shrink-0 flex items-center justify-between px-4 sm:px-5 py-3 pt-[max(14px,env(safe-area-inset-top,0px))] border-b border-[#E3E0F5]/10 bg-[#251436] z-20">
        <div className="flex items-center gap-3">
          {/* Back button */}
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-[#1B0B2A] border border-[#E3E0F5]/15 flex items-center justify-center text-white hover:bg-[#381F4E] active:scale-95 transition-all cursor-pointer"
            aria-label="Back to reveal"
          >
            <ArrowLeft size={18} strokeWidth={2.4} />
          </button>

          {/* Partner Avatar + Name */}
          <div className="flex items-center gap-2.5">
            <div className="relative w-9 h-9 rounded-full overflow-hidden border border-[#894EFF]/60 bg-[#1B0B2A]">
              <img
                src={partnerPhoto}
                alt={partnerName}
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#08A98D] border-2 border-[#251436]" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white leading-tight">
                {partnerName}
              </span>
              <span className="text-[11px] font-medium text-[#E3E0F5]/65 leading-tight">
                Your String X match
              </span>
            </div>
          </div>
        </div>

        {/* Minimal pulse indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1B0B2A] border border-[#E3E0F5]/10 text-[10.5px] font-medium text-[#08A98D]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#08A98D] animate-pulse" />
          <span>Active</span>
        </div>
      </header>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          2. CHAT AREA: Empty state or message thread
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-5 py-4 flex flex-col space-y-3">
        {/* Empty State Banner */}
        <div className="my-2 p-4 rounded-2xl bg-[#1B0B2A]/90 border border-[#E3E0F5]/10 text-center flex flex-col items-center">
          {/* Subtle String X thread motif */}
          <div className="w-8 h-8 rounded-full bg-[#894EFF]/20 border border-[#FFC928]/50 flex items-center justify-center text-[#FFC928] mb-2 shadow-xs">
            <Sparkles size={14} />
          </div>
          <h4 className="text-xs font-bold text-white mb-0.5">
            The string connected.
          </h4>
          <p className="text-[11px] font-medium text-[#E3E0F5]/70 max-w-xs">
            Now say hello. 👋
          </p>
        </div>

        {/* 3 Tappable Conversation Starters */}
        {messages.length < 2 && (
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#FFC928]/90 pl-1">
              Start the conversation
            </span>
            <div className="flex flex-col gap-1.5">
              {starters.map((starter) => (
                <button
                  key={starter}
                  type="button"
                  onClick={() => handleSelectStarter(starter)}
                  className="w-full text-left text-xs font-medium py-2.5 px-3.5 rounded-xl bg-[#1B0B2A] hover:bg-[#381F4E] active:scale-[0.99] border border-[#E3E0F5]/10 text-[#E3E0F5] transition-all cursor-pointer flex items-center justify-between group"
                >
                  <span className="group-hover:text-white transition-colors">
                    {starter}
                  </span>
                  <span className="text-[#FFC928] text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                    ↵
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages List */}
        <div className="flex flex-col space-y-2.5 pt-2">
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[80%] px-3.5 py-2.5 text-xs font-medium leading-relaxed select-text ${
                      isUser
                        ? 'bg-[#894EFF] text-white rounded-2xl rounded-br-xs shadow-xs'
                        : 'bg-[#381F4E] text-white rounded-2xl rounded-bl-xs border border-[#E3E0F5]/10 shadow-xs'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[9.5px] text-[#E3E0F5]/45 mt-1 px-1">
                    {msg.timestamp}
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Typing Indicator */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-1.5 self-start bg-[#381F4E] border border-[#E3E0F5]/10 px-3 py-2 rounded-2xl rounded-bl-xs"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#E3E0F5]/70 animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#E3E0F5]/70 animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#E3E0F5]/70 animate-bounce" />
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          3. MESSAGE COMPOSER
          [ Message...                                     ➤ ]
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <footer className="shrink-0 p-3 sm:p-4 pb-[max(14px,env(safe-area-inset-bottom,0px))] border-t border-[#E3E0F5]/10 bg-[#251436] z-20">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2 bg-[#1B0B2A] border border-[#E3E0F5]/15 rounded-2xl p-1.5 pl-3.5 focus-within:border-[#894EFF] transition-colors"
        >
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Message ${partnerName}...`}
            className="flex-1 min-w-0 bg-transparent text-xs text-white placeholder-[#E3E0F5]/40 focus:outline-none"
          />

          <button
            type="submit"
            disabled={!inputText.trim()}
            className="w-9 h-9 rounded-xl bg-[#894EFF] disabled:opacity-30 disabled:pointer-events-none hover:bg-[#783BE8] active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-xs"
            aria-label="Send message"
          >
            <Send size={15} />
          </button>
        </form>
      </footer>
    </div>
  );
};
