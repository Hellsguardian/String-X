export interface ActionButtonsProps {
  onReject?: () => void;
  onAccept?: () => void;
}

export function ActionButtons({ onReject, onAccept }: ActionButtonsProps) {
  return (
    <div className="p24-actions" role="group" aria-label="Match actions">
      <button
        type="button"
        className="p24-action-btn p24-action-btn--reject"
        onClick={onReject}
        aria-label="Pass match"
      >
        <svg
          className="p24-action-icon"
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      <button
        type="button"
        className="p24-action-btn p24-action-btn--accept"
        onClick={onAccept}
        aria-label="Accept match"
      >
        <svg
          className="p24-action-icon"
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </button>
    </div>
  );
}
