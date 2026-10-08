import type { ResolvedQuickReply } from '../utils/text';

interface QuickRepliesProps {
  items: ResolvedQuickReply[];
  disabled?: boolean;
  onPick: (message: string) => void;
}

export function QuickReplies({ items, disabled, onPick }: QuickRepliesProps) {
  if (items.length === 0) return null;
  return (
    <div className="p25-quick" role="group" aria-label="Quick replies">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          className="p25-quick__chip"
          disabled={disabled}
          onClick={() => onPick(item.message)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
