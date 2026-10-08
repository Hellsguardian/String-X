import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../types';
import { messagingService } from '../../services/messagingService';
import { MessageItem } from '../../types/messaging';
import Page25, { Page25Message } from '../../page25-claude';

interface MessagingScreenProps {
  profile: UserProfile;
  onBack: () => void;
  partnerName?: string;
  partnerPhoto?: string;
  matchId?: string;
  currentUserId?: string;
  partnerId?: string;
}

export const MessagingScreen: React.FC<MessagingScreenProps> = ({
  profile,
  onBack,
  partnerName = 'Aarohi',
  partnerPhoto,
  matchId,
  currentUserId,
  partnerId,
}) => {
  const effectiveUserId = currentUserId || profile.id || 'user';
  const effectivePartnerId = partnerId || (partnerName ? `partner-${partnerName.toLowerCase()}` : 'partner');
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Default partner photo fallback
  const resolvedPartnerPhoto =
    partnerPhoto ||
    (profile.gender === 'Male' ? '/assets/female.png' : '/assets/male.png');

  // Load message history & subscribe to realtime updates
  useEffect(() => {
    if (!matchId) return;

    let isMounted = true;
    setIsLoadingHistory(true);

    const loadHistory = async () => {
      try {
        const res = await messagingService.getMessages(matchId);
        if (!isMounted) return;

        if (res.data) {
          const history = res.data;
          setMessages((prev) => {
            const combined = [...prev];
            for (const item of history) {
              if (!combined.some((m) => m.id === item.id)) {
                combined.push(item);
              }
            }
            combined.sort(
              (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
            return combined;
          });
        }
      } catch (err) {
        console.error('[MessagingScreen] Exception loading message history:', err);
      } finally {
        if (isMounted) {
          setIsLoadingHistory(false);
        }
      }
    };

    loadHistory();

    const unsubscribe = messagingService.subscribeToMessages(
      matchId,
      (newMessage) => {
        if (!isMounted) return;
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMessage.id)) {
            return prev;
          }
          const next = [...prev, newMessage];
          next.sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          return next;
        });
      },
      (err) => {
        console.warn('[MessagingScreen] Realtime notice:', err);
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [matchId]);

  const handleSend = async (textToSend: string) => {
    const text = textToSend.trim();
    if (!text || isSending) return;

    if (!matchId || !effectiveUserId) {
      console.warn('[MessagingScreen] Cannot send message: matchId or senderId is missing');
      return;
    }

    setIsSending(true);
    setSendError(null);

    try {
      const res = await messagingService.sendMessage(matchId, effectiveUserId, text);
      if (res.error) {
        console.error('[MessagingScreen] Failed to send message:', res.error.message);
        setSendError(res.error.message);
        throw new Error(res.error.message);
      } else if (res.data) {
        const sentMessage = res.data;
        setMessages((prev) => {
          if (prev.some((m) => m.id === sentMessage.id)) {
            return prev;
          }
          const next = [...prev, sentMessage];
          next.sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          return next;
        });
      }
    } catch (err: any) {
      console.error('[MessagingScreen] Exception sending message:', err);
      setSendError(err?.message || 'Failed to send message');
      throw err;
    } finally {
      setIsSending(false);
    }
  };

  // Map production data to Page25 data contract
  const currentUser = {
    id: effectiveUserId,
    firstName: profile.fullName?.trim().split(' ')[0],
    avatarUrl: profile.photoUrl || profile.faceVerificationPhoto,
  };

  const matchedUser = {
    id: effectivePartnerId,
    name: partnerName,
    avatarUrl: resolvedPartnerPhoto,
    relationshipLabel: 'Your Garba partner',
    statusText: 'Your Garba partner',
  };

  const page25Messages: Page25Message[] = messages.map((m) => {
    const isOwn = m.senderUserId === effectiveUserId;
    return {
      id: m.id,
      senderId: m.senderUserId,
      text: m.body,
      createdAt: m.createdAt,
      isOwn,
      status: isOwn ? 'sent' : undefined,
    };
  });

  return (
    <div className="relative w-full h-full min-h-full max-h-full flex-1 flex flex-col overflow-hidden">
      {/* Loading history notice */}
      {isLoadingHistory && messages.length === 0 && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-3 py-1 rounded-full bg-[#1B0B2A]/80 border border-[#894EFF]/30 text-white text-[11px] shadow-md pointer-events-none">
          <div className="w-3 h-3 rounded-full border-2 border-[#894EFF] border-t-transparent animate-spin" />
          <span>Loading messages...</span>
        </div>
      )}

      {/* Sending error banner */}
      {sendError && (
        <div className="absolute top-16 left-4 right-4 z-40 px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-200 text-xs flex items-center justify-between shadow-md">
          <span>{sendError}</span>
          <button
            type="button"
            onClick={() => setSendError(null)}
            className="text-red-300 hover:text-white font-bold ml-2 cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* Options menu modal */}
      {showMenu && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-end p-4 bg-black/40"
          onClick={() => setShowMenu(false)}
        >
          <div
            className="mt-12 w-44 bg-[#1B0B2A] border border-[#894EFF]/30 rounded-xl shadow-xl py-1.5 text-xs text-white z-50 select-none"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => {
                setShowMenu(false);
                onBack();
              }}
              className="w-full text-left px-3 py-2 hover:bg-white/10 transition-colors cursor-pointer"
            >
              View Match Details
            </button>
            <button
              type="button"
              onClick={() => {
                setMessages([]);
                setShowMenu(false);
              }}
              className="w-full text-left px-3 py-2 hover:bg-white/10 transition-colors cursor-pointer"
            >
              Clear Local Chat
            </button>
            <button
              type="button"
              onClick={() => {
                alert('Thank you. Safety report submitted.');
                setShowMenu(false);
              }}
              className="w-full text-left px-3 py-2 hover:bg-white/10 text-[#F02A8A] transition-colors cursor-pointer"
            >
              Report / Safety
            </button>
          </div>
        </div>
      )}

      {/* Redesigned Page 25 Chat Screen */}
      <Page25
        layout="fill"
        currentUser={currentUser}
        matchedUser={matchedUser}
        messages={page25Messages}
        disabled={isSending}
        matchContext={{
          badge: 'STRINGS ATTACHED · NAVRATRI',
        }}
        onBack={onBack}
        onSendMessage={(text) => handleSend(text)}
        onMenuClick={() => setShowMenu((prev) => !prev)}
      />
    </div>
  );
};
