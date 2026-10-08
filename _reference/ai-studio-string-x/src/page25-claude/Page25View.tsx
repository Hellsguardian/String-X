import type { CSSProperties, RefObject } from 'react';
import { ChatHeader } from './components/ChatHeader';
import { Composer } from './components/Composer';
import { IcebreakerCard } from './components/IcebreakerCard';
import { MessageBubble } from './components/MessageBubble';
import { QuickReplies } from './components/QuickReplies';
import { TypingIndicator } from './components/TypingIndicator';
import { useStickToBottom } from './hooks/useStickToBottom';
import type {
  Page25CurrentUser,
  Page25MatchContext,
  Page25MatchedUser,
  Page25Message,
  Page25SendSource,
} from './types';
import type { ResolvedQuickReply } from './utils/text';

/**
 * Pure visual composition of Page 25. Expects resolved data.
 * Import `Page25` (not this file) from the host app: Page25 loads the CSS/fonts
 * and provides viewport handling, defaults and send logic.
 */
export interface Page25ViewProps {
  currentUser: Page25CurrentUser;
  matchedUser: Page25MatchedUser;
  messages: Page25Message[];
  quickReplies: ResolvedQuickReply[];
  icebreakers: string[];
  matchContext?: Page25MatchContext;
  isMatchTyping: boolean;
  statusLine: string;
  draft: string;
  inputPlaceholder: string;
  maxMessageLength: number;
  disabled: boolean;
  layout: 'viewport' | 'fill';
  rootStyle?: CSSProperties;
  className?: string;
  inputRef?: RefObject<HTMLInputElement | null>;
  formatTime: (value: Page25Message['createdAt']) => string;
  onBack?: () => void;
  onMenuClick?: (anchor: HTMLButtonElement) => void;
  onDraftChange: (value: string) => void;
  onSubmitDraft: () => void;
  onSendText: (text: string, source: Page25SendSource) => void;
  onSelectSuggestion: (text: string) => void;
}

const isOwnMessage = (message: Page25Message, currentUserId: string) =>
  message.isOwn ?? message.senderId === currentUserId;

export function Page25View(props: Page25ViewProps) {
  const {
    currentUser,
    matchedUser,
    messages,
    quickReplies,
    icebreakers,
    isMatchTyping,
    statusLine,
    draft,
    inputPlaceholder,
    maxMessageLength,
    disabled,
    layout,
    rootStyle,
    className,
    inputRef,
    formatTime,
  } = props;

  const last = messages[messages.length - 1];
  const lastIsOwn = last ? isOwnMessage(last, currentUser.id) : false;
  const changeKey = `${messages.length}:${last?.id ?? ''}:${isMatchTyping ? 1 : 0}`;
  const { ref: scrollRef, onScroll } = useStickToBottom<HTMLDivElement>(changeKey, lastIsOwn);

  const rootClass = ['p25-root', layout === 'viewport' ? 'p25-root--viewport' : 'p25-root--fill', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClass} style={rootStyle}>
      <div className="p25-clouds" aria-hidden="true" />

      <ChatHeader
        matchedUser={matchedUser}
        statusLine={statusLine}
        onBack={props.onBack}
        onMenuClick={props.onMenuClick}
      />

      <main className="p25-conversation">
        <div className="p25-city" aria-hidden="true" />
        <div
          ref={scrollRef}
          className={`p25-scroll ${messages.length === 0 ? 'p25-scroll--empty' : ''}`}
          role="log"
          aria-live="polite"
          aria-label={`Conversation with ${matchedUser.name}`}
          onScroll={onScroll}
        >
          {messages.length < 5 ? (
            <div
              className={`p25-ice-wrapper ${
                messages.length === 0 ? 'p25-ice-wrapper--center' : 'p25-ice-wrapper--top'
              }`}
            >
              <IcebreakerCard
                prompts={icebreakers}
                disabled={disabled}
                onSend={(text) => props.onSelectSuggestion(text)}
              />
            </div>
          ) : null}

          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              text={message.text}
              time={formatTime(message.createdAt)}
              own={isOwnMessage(message, currentUser.id)}
              status={message.status}
            />
          ))}

          {isMatchTyping ? <TypingIndicator name={matchedUser.name} /> : null}
        </div>
      </main>

      <footer className="p25-footer">
        {messages.length >= 5 ? (
          <QuickReplies
            items={quickReplies}
            disabled={disabled}
            onPick={(text) => props.onSelectSuggestion(text)}
          />
        ) : null}
        <Composer
          inputRef={inputRef}
          value={draft}
          placeholder={inputPlaceholder}
          maxLength={maxMessageLength}
          disabled={disabled}
          onChange={props.onDraftChange}
          onSubmit={props.onSubmitDraft}
        />
      </footer>
    </div>
  );
}
