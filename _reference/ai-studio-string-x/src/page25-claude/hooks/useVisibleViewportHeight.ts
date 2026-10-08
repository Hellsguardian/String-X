import { useEffect, useState } from 'react';

/**
 * Tracks the height of the *visible* viewport (window.visualViewport).
 * On iOS Safari / Android WebView this shrinks when the on-screen keyboard opens,
 * which keeps the composer above the keyboard. Returns undefined when unsupported
 * or disabled, so CSS fallbacks (100dvh / 100svh / 100vh) take over.
 */
export function useVisibleViewportHeight(enabled: boolean): number | undefined {
  const [height, setHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || !window.visualViewport) {
      setHeight(undefined);
      return;
    }
    const viewport = window.visualViewport;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setHeight(Math.round(viewport.height)));
    };
    update();
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);
    return () => {
      cancelAnimationFrame(frame);
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
    };
  }, [enabled]);

  return height;
}
