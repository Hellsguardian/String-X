import type { Page25MatchedUser } from '../types';

interface ChatHeaderProps {
  matchedUser: Page25MatchedUser;
  statusLine: string;
  onBack?: () => void;
  onMenuClick?: (anchor: HTMLButtonElement) => void;
}

export function ChatHeader({ matchedUser, statusLine, onBack, onMenuClick }: ChatHeaderProps) {
  const initial = matchedUser.name.trim().charAt(0).toUpperCase() || '?';
  return (
    <header className="p25-header">
      <button type="button" className="p25-header__back" aria-label="Back" onClick={onBack}>
        <span className="p25-icon p25-icon--back" aria-hidden="true" />
      </button>

      <div className="p25-avatar">
        <div className="p25-avatar__ring">
          <div className="p25-avatar__inner">
            {matchedUser.avatarUrl ? (
              <img className="p25-avatar__img" src={matchedUser.avatarUrl} alt="" />
            ) : (
              <span aria-hidden="true">{initial}</span>
            )}
          </div>
        </div>
        {matchedUser.isOnline ? <span className="p25-avatar__online" aria-hidden="true" /> : null}
      </div>

      <div className="p25-header__text">
        <h1 className="p25-header__name">{matchedUser.name}</h1>
        <p className="p25-header__status" aria-live="polite">
          {statusLine}
        </p>
      </div>

      <button
        type="button"
        className="p25-header__more"
        aria-label="More options"
        aria-haspopup="menu"
        onClick={(event) => onMenuClick?.(event.currentTarget)}
      >
        <span className="p25-icon p25-icon--more" aria-hidden="true" />
      </button>
    </header>
  );
}
