import { useLayoutEffect, useState, type RefObject } from 'react';

export interface StageMetrics {
  scale: number;
  stageHeight: number;
  compactProgress: number;
}

/**
 * Responsive stage scale & vertical compaction.
 * - Horizontal scale: width-driven on mobile (w / designW) to fill 100% width.
 *   Contain-scale on desktop (Math.min(w / designW, h / designH)).
 * - Vertical stage height: when mobile viewport is shorter than the width-scaled
 *   design height, calculates stageHeight and compactProgress (0..1) to
 *   intelligently compact vertical spacing and prevent bottom CTA clipping.
 */
export function useStageScale(
  ref: RefObject<HTMLElement | null>,
  designW: number,
  designH: number,
): StageMetrics | null {
  const [metrics, setMetrics] = useState<StageMetrics | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    let frame = 0;
    const measure = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w <= 0) return;

      // A phone container is either a mobile viewport (window.innerWidth < 640)
      // or a phone preview container on desktop (w <= 540, such as DeviceFrame's ~392px frame).
      // In either phone container, scale is width-driven (w / designW) so the UI and background
      // occupy 100% of the available inner width with no horizontal margins.
      const isPhoneContainer = (typeof window !== 'undefined' && window.innerWidth < 640) || w <= 540;
      const scale = isPhoneContainer
        ? w / designW
        : (h > 0 ? Math.min(w / designW, h / designH) : w / designW);

      let stageHeight = designH;
      let compactProgress = 0;

      if (isPhoneContainer && h > 0 && scale > 0) {
        const availDesignH = h / scale;
        if (availDesignH < designH) {
          // Available height in 390-wide design units is less than 844
          stageHeight = Math.max(560, availDesignH);
          compactProgress = Math.max(0, Math.min(1, (designH - availDesignH) / (designH - 580)));
        }
      }

      setMetrics((prev) => {
        if (
          prev !== null &&
          Math.abs(prev.scale - scale) < 0.0005 &&
          Math.abs(prev.stageHeight - stageHeight) < 0.5 &&
          Math.abs(prev.compactProgress - compactProgress) < 0.005
        ) {
          return prev;
        }
        return { scale, stageHeight, compactProgress };
      });
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };

    measure();

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(schedule) : null;
    ro?.observe(el);
    window.addEventListener('resize', schedule);
    window.addEventListener('orientationchange', schedule);
    const vv = window.visualViewport;
    vv?.addEventListener('resize', schedule);

    return () => {
      cancelAnimationFrame(frame);
      ro?.disconnect();
      window.removeEventListener('resize', schedule);
      window.removeEventListener('orientationchange', schedule);
      vv?.removeEventListener('resize', schedule);
    };
  }, [ref, designW, designH]);

  return metrics;
}
