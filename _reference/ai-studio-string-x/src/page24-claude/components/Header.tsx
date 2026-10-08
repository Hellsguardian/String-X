/// <reference path="../page24-env.d.ts" />
import backIcon from '../assets/icon-back.svg?raw';
import { InlineSvg } from './InlineSvg';

export interface HeaderProps {
  backLabel: string;
  onBack?: () => void;
}

export function Header({ backLabel, onBack }: HeaderProps) {
  return (
    <div className="p24-header">
      <button type="button" className="p24-back" aria-label={backLabel} onClick={onBack}>
        <InlineSvg svg={backIcon} className="p24-icon p24-icon--back" />
      </button>
      <div className="p24-logo">
        STRING <span className="p24-logo-x">X</span>
      </div>
      <div className="p24-header-spacer" />
    </div>
  );
}
