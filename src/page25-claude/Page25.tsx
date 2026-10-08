import { useCallback, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import './styles/fonts.css';
import './styles/Page25.css';
import { Page25View } from './Page25View';
import { useVisibleViewportHeight } from './hooks/useVisibleViewportHeight';
import type { Page25Message, Page25Props, Page25QuickReply, Page25SendSource } from './types';
import { formatPage25Time } from './utils/formatTime';
import { createPage25Id, resolveQuickReplies } from './utils/text';
import {
  PAGE25_DEFAULT_ICEBREAKERS,
  PAGE25_DEMO_CURRENT_USER,
  PAGE25_DEMO_MATCHED_USER,
  PAGE25_DEMO_MATCH_CONTEXT,
  PAGE25_DEMO_MESSAGES,
  PAGE25_DEMO_QUICK_REPLIES,
} from './utils/demoData';

const NO_QUICK_REPLIES: Page25QuickReply[] = [];

/**
 * Page 25 — Garba partner chat (production entry).
 *
 * Controlled mode (production): pass `messages` and append new ones in `onSendMessage`.
 * Preview mode: render <Page25 /> with no `messages`; demo data and local state are used.
 */
export function Page25(props: Page25Props) {
  const {
    layout = 'viewport',
    inputPlaceholder = 'Type your message…',
    maxMessageLength = 1000,
    disabled = false,
    isMatchTyping = false,
    formatTime = formatPage25Time,
    onSendMessage,
    onDraftChange,
  } = props;

  const isPreview = props.messages === undefined;
  const currentUser = props.currentUser ?? PAGE25_DEMO_CURRENT_USER;
  const matchedUser = props.matchedUser ?? PAGE25_DEMO_MATCHED_USER;
  const matchContext = props.matchContext ?? (isPreview ? PAGE25_DEMO_MATCH_CONTEXT : undefined);
  const icebreakers = props.icebreakers ?? PAGE25_DEFAULT_ICEBREAKERS;
  const rawQuickReplies = props.quickReplies ?? (isPreview ? PAGE25_DEMO_QUICK_REPLIES : NO_QUICK_REPLIES);
  const quickReplies = useMemo(() => resolveQuickReplies(rawQuickReplies), [rawQuickReplies]);

  const [previewMessages, setPreviewMessages] = useState<Page25Message[]>(PAGE25_DEMO_MESSAGES);
  const messages = isPreview ? previewMessages : (props.messages as Page25Message[]);

  const [draft, setDraft] = useState('');
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const inputRef = useRef<HTMLInputElement>(null);

  const visibleHeight = useVisibleViewportHeight(layout === 'viewport');
  const rootStyle: CSSProperties | undefined =
    layout === 'viewport' && visibleHeight ? { height: `${visibleHeight}px` } : undefined;

  const statusLine = isMatchTyping
    ? 'typing…'
    : matchedUser.statusText ??
      `${matchedUser.relationshipLabel ?? 'Your Garba partner'} · ${matchedUser.isOnline ? 'Online' : 'Offline'}`;

  const sendText = useCallback(
    (rawText: string, source: Page25SendSource, restoreOnFailure: boolean) => {
      const text = rawText.trim().slice(0, maxMessageLength);
      if (!text || disabled) return;

      if (isPreview) {
        setPreviewMessages((list) => [
          ...list,
          { id: createPage25Id(), senderId: currentUser.id, text, createdAt: Date.now(), status: 'sent' },
        ]);
      }

      let result: void | Promise<void> = undefined;
      try {
        result = onSendMessage?.(text, { source });
      } catch (error) {
        if (restoreOnFailure && !draftRef.current) setDraft(rawText);
        console.error('[Page25] onSendMessage failed', error);
        return;
      }
      if (result && typeof (result as Promise<void>).catch === 'function') {
        (result as Promise<void>).catch((error: unknown) => {
          if (restoreOnFailure && !draftRef.current) setDraft(rawText);
          console.error('[Page25] onSendMessage failed', error);
        });
      }
    },
    [currentUser.id, disabled, isPreview, maxMessageLength, onSendMessage],
  );

  const handleDraftChange = useCallback(
    (value: string) => {
      setDraft(value);
      onDraftChange?.(value);
    },
    [onDraftChange],
  );

  const handleSelectSuggestion = useCallback(
    (text: string) => {
      setDraft(text);
      onDraftChange?.(text);
      // Focus the input and position cursor at the end so the user can easily edit
      requestAnimationFrame(() => {
        const input = inputRef.current;
        if (input) {
          input.focus();
          const len = input.value.length;
          input.setSelectionRange(len, len);
        }
      });
    },
    [onDraftChange],
  );

  const handleSubmitDraft = useCallback(() => {
    const text = draftRef.current;
    if (!text.trim()) return;
    setDraft('');
    sendText(text, 'composer', true);
  }, [sendText]);

  const handleSendText = useCallback(
    (text: string, source: Page25SendSource) => sendText(text, source, false),
    [sendText],
  );

  return (
    <Page25View
      currentUser={currentUser}
      matchedUser={matchedUser}
      messages={messages}
      quickReplies={quickReplies}
      icebreakers={icebreakers}
      matchContext={matchContext}
      isMatchTyping={isMatchTyping}
      statusLine={statusLine}
      draft={draft}
      inputPlaceholder={inputPlaceholder}
      maxMessageLength={maxMessageLength}
      disabled={disabled}
      layout={layout}
      rootStyle={rootStyle}
      className={props.className}
      inputRef={inputRef}
      formatTime={formatTime}
      onBack={props.onBack}
      onMenuClick={props.onMenuClick}
      onDraftChange={handleDraftChange}
      onSubmitDraft={handleSubmitDraft}
      onSendText={handleSendText}
      onSelectSuggestion={handleSelectSuggestion}
    />
  );
}

export default Page25;
