import type { Page25MatchContext } from '../types';
import { joinWithAnd } from '../utils/text';

export function MatchContextBanner({ context }: { context: Page25MatchContext }) {
  const interests = context.sharedInterests ?? [];
  return (
    <>
      {context.badge ? (
        <div className="p25-badge">
          <span className="p25-badge__dot" aria-hidden="true" />
          {context.badge}
        </div>
      ) : null}
      {interests.length > 0 ? (
        <p className="p25-shared">
          You both picked{' '}
          {joinWithAnd(interests).map(([item, separator]) => (
            <span key={item}>
              <b>{item}</b>
              {separator}
            </span>
          ))}
          .
        </p>
      ) : null}
    </>
  );
}
