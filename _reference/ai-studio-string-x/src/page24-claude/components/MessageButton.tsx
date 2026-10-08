/// <reference path="../page24-env.d.ts" />
import arrowIcon from '../assets/icon-arrow-right.svg?raw';
import { InlineSvg } from './InlineSvg';

export interface MessageButtonProps {
  label: string;
  onMessage?: () => void;
}

/** Primary CTA pinned to the bottom of the stage. */
export function MessageButton({ label, onMessage }: MessageButtonProps) {
  return (
    <div className="p24-cta-wrap">
      <button type="button" className="p24-cta" onClick={onMessage}>
        {label}
        <InlineSvg svg={arrowIcon} className="p24-icon p24-icon--arrow" />
      </button>
    </div>
  );
}
