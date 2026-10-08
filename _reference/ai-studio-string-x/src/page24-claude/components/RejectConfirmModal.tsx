import { useEffect } from 'react';

export interface RejectConfirmModalProps {
  onCancel: () => void;
  onConfirm: () => void;
}

export function RejectConfirmModal({ onCancel, onConfirm }: RejectConfirmModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  return (
    <div
      className="p24-modal-scrim"
      role="dialog"
      aria-modal="true"
      aria-labelledby="p24-modal-title"
      aria-describedby="p24-modal-desc"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onCancel();
        }
      }}
    >
      <div className="p24-modal-card">
        <div className="p24-modal-icon-badge" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </div>

        <h3 id="p24-modal-title" className="p24-modal-title">
          Are you sure you want to pass?
        </h3>

        <p id="p24-modal-desc" className="p24-modal-desc">
          You won't be able to match with this person again for tonight's event.
        </p>

        <div className="p24-modal-actions">
          <button
            type="button"
            className="p24-modal-btn p24-modal-btn--keep"
            onClick={onCancel}
          >
            Keep Match
          </button>
          <button
            type="button"
            className="p24-modal-btn p24-modal-btn--pass"
            onClick={onConfirm}
          >
            Yes, Pass
          </button>
        </div>
      </div>
    </div>
  );
}
