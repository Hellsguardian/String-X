import type { Page25MessageStatus } from '../types';

interface MessageBubbleProps {
  text: string;
  time: string;
  own: boolean;
  status?: Page25MessageStatus;
}

const STATUS_LABEL: Record<Page25MessageStatus, string> = {
  sending: 'Sending',
  sent: 'Sent',
  delivered: 'Delivered',
  seen: 'Seen',
  failed: 'Not sent',
};

export function MessageBubble({ text, time, own, status }: MessageBubbleProps) {
  return (
    <div className={own ? 'p25-msg p25-msg--own' : 'p25-msg p25-msg--their'}>
      <div className="p25-msg__bubble">{text}</div>
      <div className="p25-msg__meta">
        <time>{time}</time>
        {own && status ? (
          <span
            className={`p25-icon p25-icon--status-${status}`}
            role="img"
            aria-label={STATUS_LABEL[status]}
            title={STATUS_LABEL[status]}
          />
        ) : null}
      </div>
    </div>
  );
}
