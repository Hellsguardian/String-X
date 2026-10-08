/// <reference path="../page24-env.d.ts" />
import skySvg from '../assets/sky.svg?raw';
import { InlineSvgBlock } from './InlineSvg';

/** Lavender night sky with moon glow and clouds. */
export function SkyLayer() {
  return <InlineSvgBlock svg={skySvg} className="p24-sky" />;
}
