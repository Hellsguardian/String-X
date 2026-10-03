import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Sparkles, X, Heart, Ticket, ArrowRight, ChevronUp } from 'lucide-react';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  isNew: boolean;
  type: 'string' | 'profile' | 'pass' | 'general';
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Your string is waiting',
    message: 'Navratri is almost here.',
    time: '2m',
    isNew: true,
    type: 'string',
  },
  {
    id: 'notif-2',
    title: 'Your profile is ready',
    message: 'Everything looks good!',
    time: '1h',
    isNew: true,
    type: 'profile',
  },
  {
    id: 'notif-3',
    title: 'Garba pass activated',
    message: 'Parul University campus',
    time: '1d',
    isNew: false,
    type: 'pass',
  },
  {
    id: 'notif-4',
    title: 'Welcome to STRING X',
    message: 'One thread. Many stories.',
    time: '2d',
    isNew: false,
    type: 'general',
  },
];

interface NotificationsPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction?: (actionType: 'string' | 'profile' | 'pass' | 'general') => void;
}

export const NotificationsPopover: React.FC<NotificationsPopoverProps> = ({
  isOpen,
  onClose,
  onSelectAction,
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [showAll, setShowAll] = useState(false);

  const unreadCount = notifications.filter((n) => n.isNew).length;

  const handleItemClick = (item: NotificationItem) => {
    // Mark this item as read
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, isNew: false } : n))
    );
    if (onSelectAction && item.type) {
      onSelectAction(item.type);
      onClose();
    }
  };

  const displayedNotifications = showAll
    ? notifications
    : notifications.slice(0, 3);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 pointer-events-auto">
          {/* Subtle translucent backdrop over the page: 0.25 opacity, home screen remains recognized */}
          <motion.div
            key="popover-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#0F0519]/25 backdrop-blur-[1px]"
            aria-label="Close notifications popover"
          />

          {/* Floating Notification Popover anchored near top-right bell */}
          <motion.div
            key="popover-card"
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -6 }}
            transition={{
              type: 'spring',
              damping: 26,
              stiffness: 360,
              mass: 0.75,
            }}
            style={{ transformOrigin: 'top right' }}
            className="absolute top-[56px] sm:top-[60px] right-3 sm:right-4 w-[calc(100%-24px)] max-w-[318px] sm:max-w-[325px] rounded-[24px] bg-[#251436] border border-[#E3E0F5]/10 shadow-[0_20px_50px_rgba(0,0,0,0.35),0_0_24px_rgba(137,78,255,0.12)] text-white select-none overflow-hidden font-['Plus_Jakarta_Sans',sans-serif] z-50"
          >
            {/* Small triangular pointer visually connecting popover to bell */}
            <div className="absolute -top-[5px] right-8 sm:right-9 w-2.5 h-2.5 rotate-45 bg-[#251436] border-t border-l border-[#E3E0F5]/10 z-20 pointer-events-none" />

            {/* Subtle radial ambient light behind header & micro texture */}
            <div
              className="absolute inset-0 pointer-events-none opacity-40 z-0"
              style={{
                background:
                  'radial-gradient(circle at 20% 0%, rgba(137, 78, 255, 0.16) 0%, rgba(240, 42, 138, 0.05) 50%, transparent 80%)',
              }}
            />

            {/* Ultra-thin String X signature curved thread woven behind the notification feed */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.14] overflow-visible z-0"
              viewBox="0 0 320 340"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="popoverStringSig" x1="0" y1="40" x2="320" y2="300" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#F02A8A" />
                  <stop offset="50%" stopColor="#894EFF" />
                  <stop offset="100%" stopColor="#FFC928" />
                </linearGradient>
              </defs>
              <path
                d="M -15 90 C 35 125 18 200 70 230 C 130 265 200 180 270 215 C 300 230 315 270 335 290"
                stroke="url(#popoverStringSig)"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>

            {/* HEADER: [bell] Notifications                 2 new   [×] */}
            <div className="relative z-10 px-4 pt-3.5 pb-3 flex items-center justify-between border-b border-[#E3E0F5]/[0.08] h-[54px]">
              <div className="flex items-center gap-2.5">
                {/* 34px circular container for bell icon */}
                <div className="w-[34px] h-[34px] rounded-full bg-[#894EFF]/15 border border-[#894EFF]/25 flex items-center justify-center text-[#894EFF] shrink-0 shadow-[0_0_12px_rgba(137,78,255,0.2)]">
                  <Bell size={15} strokeWidth={2.4} />
                </div>
                {/* Title: 20px, 700 weight, white */}
                <h2 className="text-[20px] font-bold text-white tracking-tight leading-none">
                  Notifications
                </h2>
              </div>

              <div className="flex items-center gap-2">
                {/* "2 new" small pill */}
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-[rgba(240,42,138,0.12)] border border-[rgba(240,42,138,0.30)] text-[#F02A8A] text-[11px] font-bold tracking-wide">
                    {unreadCount} new
                  </span>
                )}

                {/* 32px circular close button */}
                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 border border-white/8 text-[#E3E0F5]/70 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                  aria-label="Close notifications"
                >
                  <X size={14} strokeWidth={2.2} />
                </button>
              </div>
            </div>

            {/* NOTIFICATION FEED (Unified container with hairline dividers, no heavy card boxes) */}
            <div className="relative z-10 px-2 py-1 max-h-[265px] overflow-y-auto no-scrollbar">
              {displayedNotifications.map((item, index) => {
                const isFirst = item.id === 'notif-1';
                const isSecond = item.id === 'notif-2';
                const isThird = item.id === 'notif-3';
                const isLastInView = index === displayedNotifications.length - 1;

                // Staggered delay for rows: 40ms, 70ms, 100ms...
                const staggerDelay = 0.04 + index * 0.03;

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22, delay: staggerDelay, ease: 'easeOut' }}
                    className={`${!isLastInView ? 'border-b border-[#E3E0F5]/[0.07]' : ''}`}
                  >
                    <button
                      type="button"
                      onClick={() => handleItemClick(item)}
                      className="w-full text-left py-2.5 px-3 rounded-2xl transition-all cursor-pointer relative group hover:bg-white/[0.045] active:scale-[0.99] flex items-start gap-3 my-0.5"
                    >
                      {/* LEFT: 30-34px icon container with distinctive accent colors */}
                      <div className="shrink-0 mt-0.5">
                        {isFirst ? (
                          // Notification 1: Warm Yellow #FFC928 ✨
                          <div className="w-[32px] h-[32px] rounded-xl bg-[#FFC928]/12 border border-[#FFC928]/25 text-[#FFC928] flex items-center justify-center shadow-[0_0_10px_rgba(255,201,40,0.18)] transition-transform group-hover:scale-105">
                            <Sparkles size={15} strokeWidth={2.4} />
                          </div>
                        ) : isSecond ? (
                          // Notification 2: Electric Purple #894EFF 💜
                          <div className="w-[32px] h-[32px] rounded-xl bg-[#894EFF]/15 border border-[#894EFF]/25 text-[#894EFF] flex items-center justify-center shadow-[0_0_10px_rgba(137,78,255,0.18)] transition-transform group-hover:scale-105">
                            <Heart size={14} strokeWidth={2.4} className="fill-[#894EFF]/30" />
                          </div>
                        ) : isThird ? (
                          // Notification 3: Emerald #08A98D ✦
                          <div className="w-[32px] h-[32px] rounded-xl bg-[#08A98D]/15 border border-[#08A98D]/25 text-[#08A98D] flex items-center justify-center shadow-[0_0_10px_rgba(8,169,141,0.18)] transition-transform group-hover:scale-105">
                            <Ticket size={14} strokeWidth={2.4} />
                          </div>
                        ) : (
                          // General
                          <div className="w-[32px] h-[32px] rounded-xl bg-[#F02A8A]/15 border border-[#F02A8A]/25 text-[#F02A8A] flex items-center justify-center transition-transform group-hover:scale-105">
                            <Sparkles size={14} strokeWidth={2.4} />
                          </div>
                        )}
                      </div>

                      {/* CENTER: Title & Description */}
                      <div className="flex-1 min-w-0 pr-1">
                        <div className="flex items-center justify-between gap-1">
                          {/* Title: 14px, 700 weight, white */}
                          <h3
                            className={`text-[14px] font-bold tracking-tight transition-colors truncate leading-tight ${
                              isFirst
                                ? 'text-white group-hover:text-[#FFC928]'
                                : 'text-white/95 group-hover:text-white'
                            }`}
                          >
                            {item.title}
                          </h3>

                          {/* RIGHT: Unread dot (Hot Pink #F02A8A) */}
                          {item.isNew && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#F02A8A] shadow-[0_0_6px_#F02A8A] shrink-0" />
                          )}
                        </div>

                        {/* Description: 12px, 500 weight, Soft Lavender 70-75% opacity */}
                        <p className="text-[12px] font-medium text-[#E3E0F5]/75 mt-0.5 leading-snug line-clamp-1">
                          {item.message}
                        </p>

                        {/* Timestamp: 10-11px, Soft Lavender 45-55% opacity */}
                        <div className="flex justify-end mt-0.5">
                          <span className="text-[11px] font-medium text-[#E3E0F5]/50">
                            {item.time}
                          </span>
                        </div>
                      </div>
                    </button>
                  </motion.div>
                );
              })}
            </div>

            {/* FOOTER: View all notifications → / Show less ↑ */}
            <div className="relative z-10 px-3 py-2.5 border-t border-[#E3E0F5]/[0.08] flex items-center justify-center">
              <button
                type="button"
                onClick={() => setShowAll((prev) => !prev)}
                className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-[#E3E0F5]/65 hover:text-white transition-colors cursor-pointer py-0.5 px-2 rounded-md hover:bg-white/5 active:scale-95"
              >
                <span>{showAll ? 'Show less' : 'View all notifications'}</span>
                {showAll ? (
                  <ChevronUp size={13} className="text-[#E3E0F5]/70" />
                ) : (
                  <ArrowRight size={13} className="text-[#E3E0F5]/70" />
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
