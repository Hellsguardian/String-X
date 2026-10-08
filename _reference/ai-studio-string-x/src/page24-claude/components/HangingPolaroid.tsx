import type { Page24YearBadge } from '../types';
import { Clothespin } from './Clothespin';
import { PolaroidPhoto } from './PolaroidPhoto';
import { YearBadge } from './YearBadge';

export interface HangingPolaroidProps {
  variant: 'current' | 'match';
  label: string;
  photoUrl: string | null;
  photoAlt: string;
  year: Page24YearBadge;
}

/** A polaroid clipped to the rope, gently swinging from its clothespin. */
export function HangingPolaroid({ variant, label, photoUrl, photoAlt, year }: HangingPolaroidProps) {
  return (
    <div className={`p24-polaroid p24-polaroid--${variant}`}>
      <div className="p24-polaroid-frame">
        <PolaroidPhoto variant={variant} photoUrl={photoUrl} alt={photoAlt} />
        <div className="p24-polaroid-caption">
          <span className={`p24-name-pill p24-name-pill--${variant}`} title={label}>
            {label}
          </span>
        </div>
        <YearBadge variant={variant} badge={year} />
      </div>
      <Clothespin />
    </div>
  );
}
