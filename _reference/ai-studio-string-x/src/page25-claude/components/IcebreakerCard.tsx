import { useEffect, useState } from 'react';

export interface IcebreakerPage {
  prompts: [string, string] | string[];
}

interface IcebreakerCardProps {
  prompts: string[] | string[][];
  disabled?: boolean;
  onSend: (text: string) => void;
}

export function IcebreakerCard({ prompts, disabled, onSend }: IcebreakerCardProps) {
  // Normalize prompts into pages of 2 items each
  const pages: [string, string][] = [];

  if (prompts.length > 0) {
    if (Array.isArray(prompts[0])) {
      // Already an array of arrays/pairs
      for (const item of prompts as string[][]) {
        pages.push([item[0] ?? '', item[1] ?? '']);
      }
    } else {
      // Flat array of strings: chunk into pairs
      const flat = prompts as string[];
      for (let i = 0; i < flat.length; i += 2) {
        pages.push([flat[i] ?? '', flat[i + 1] ?? '']);
      }
    }
  }

  const [pageIndex, setPageIndex] = useState(0);
  const count = pages.length;

  useEffect(() => {
    if (pageIndex >= count && count > 0) {
      setPageIndex(0);
    }
  }, [count, pageIndex]);

  if (count === 0) return null;

  const safeIndex = Math.min(Math.max(0, pageIndex), count - 1);
  const currentPage = pages[safeIndex];
  const [prompt1, prompt2] = currentPage;

  const go = (step: number) => {
    setPageIndex((i) => (i + step + count) % count);
  };

  return (
    <section className="p25-ice" aria-label="Icebreakers">
      <div className="p25-ice__tag" aria-hidden="true">
        <span className="p25-ice__tag-dot" />
        ICEBREAKERS
      </div>

      <div className="p25-ice__row">
        <p className="p25-ice__hint">
          Tap to send{' '}
          <span className="p25-ice__count">
            {safeIndex + 1}/{count}
          </span>
        </p>
        {count > 1 ? (
          <div className="p25-ice__nav">
            <button
              type="button"
              className="p25-ice__arrow"
              aria-label="Previous icebreaker suggestions"
              onClick={() => go(-1)}
            >
              <span className="p25-icon p25-icon--chev-left" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="p25-ice__arrow"
              aria-label="Next icebreaker suggestions"
              onClick={() => go(1)}
            >
              <span className="p25-icon p25-icon--chev-right" aria-hidden="true" />
            </button>
          </div>
        ) : null}
      </div>

      <div className="p25-ice__slots">
        {prompt1 ? (
          <button
            type="button"
            className="p25-ice__prompt"
            disabled={disabled}
            onClick={() => onSend(prompt1)}
          >
            <span className="p25-ice__prompt-text">{prompt1}</span>
            <span className="p25-icon p25-icon--send-outline" aria-hidden="true" />
          </button>
        ) : null}

        {prompt2 ? (
          <button
            type="button"
            className="p25-ice__prompt"
            disabled={disabled}
            onClick={() => onSend(prompt2)}
          >
            <span className="p25-ice__prompt-text">{prompt2}</span>
            <span className="p25-icon p25-icon--send-outline" aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </section>
  );
}

