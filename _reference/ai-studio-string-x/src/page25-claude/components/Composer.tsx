import { useId } from 'react';
import type { FormEvent, KeyboardEvent, RefObject } from 'react';

interface ComposerProps {
  value: string;
  placeholder: string;
  maxLength: number;
  disabled?: boolean;
  inputRef?: RefObject<HTMLInputElement | null>;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

export function Composer({
  value,
  placeholder,
  maxLength,
  disabled,
  inputRef,
  onChange,
  onSubmit,
}: ComposerProps) {
  const inputId = useId();
  const canSend = !disabled && value.trim().length > 0;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (canSend) onSubmit();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    // Enter sends; ignore while an IME composition (e.g. Gujarati/Hindi keyboards) is active.
    if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
      event.preventDefault();
      if (canSend) onSubmit();
    }
  };

  return (
    <form className="p25-composer" onSubmit={handleSubmit}>
      <div className="p25-composer__field">
        <label htmlFor={inputId} className="p25-visually-hidden">
          {placeholder.replace(/…$/, '')}
        </label>
        <input
          ref={inputRef}
          id={inputId}
          className="p25-composer__input"
          type="text"
          inputMode="text"
          enterKeyHint="send"
          autoComplete="off"
          autoCorrect="on"
          value={value}
          maxLength={maxLength}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>
      <button type="submit" className="p25-composer__send" aria-label="Send message" disabled={!canSend}>
        <span className="p25-icon p25-icon--send" aria-hidden="true" />
      </button>
    </form>
  );
}

