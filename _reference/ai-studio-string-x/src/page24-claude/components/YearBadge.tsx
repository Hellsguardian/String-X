import type { Page24YearBadge } from '../types';

export interface YearBadgeProps {
  variant: 'current' | 'match';
  badge: Page24YearBadge;
}

/** Small tilted card on the polaroid edge, styled like the onboarding year cards. */
export function YearBadge({ variant, badge }: YearBadgeProps) {
  return (
    <div className={`p24-year-badge p24-year-badge--${variant}`}>
      <div className="p24-year-value">{badge.value}</div>
      <div className="p24-year-caption">{badge.caption}</div>
    </div>
  );
}
