/// <reference path="../page24-env.d.ts" />
import gateSvg from '../assets/campus-gate.svg?raw';
import { InlineSvgBlock } from './InlineSvg';

/** Flat 2D Parul University main gate + campus buildings, water tower, trees and plaza. */
export function CampusGate() {
  return <InlineSvgBlock svg={gateSvg} className="p24-gate" />;
}
