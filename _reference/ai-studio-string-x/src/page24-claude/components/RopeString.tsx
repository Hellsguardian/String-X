/// <reference path="../page24-env.d.ts" />
import ropeSvg from '../assets/rope.svg?raw';
import { InlineSvgBlock } from './InlineSvg';

/** The twisted neon rope the polaroids hang from (with the travelling light spark). */
export function RopeString() {
  return <InlineSvgBlock svg={ropeSvg} className="p24-rope" />;
}
