/**
 * Renders a local, static SVG asset inline (so CSS classes, `currentColor`
 * and the page's self-hosted fonts apply to it). Only ever used with SVG files
 * that ship inside Page24/assets — never with user-supplied markup.
 */
export interface InlineSvgProps {
  svg: string;
  className?: string;
}

export function InlineSvg({ svg, className }: InlineSvgProps) {
  return <span className={className} aria-hidden="true" dangerouslySetInnerHTML={{ __html: svg }} />;
}

export function InlineSvgBlock({ svg, className }: InlineSvgProps) {
  return <div className={className} aria-hidden="true" dangerouslySetInnerHTML={{ __html: svg }} />;
}
