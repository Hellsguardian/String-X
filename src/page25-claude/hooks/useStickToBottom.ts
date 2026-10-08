import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';

const NEAR_BOTTOM_PX = 140;

/**
 * Keeps the conversation pinned to the newest message, like a real chat:
 * - jumps to the bottom on first render,
 * - follows new messages if the reader is already near the bottom or just sent one,
 * - never yanks the reader down while they are reading older messages.
 */
export function useStickToBottom<T extends HTMLElement>(changeKey: string, lastIsOwn: boolean) {
  const ref = useRef<T | null>(null);
  const wasNearBottom = useRef(true);
  const firstRun = useRef(true);

  const onScroll = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    wasNearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
  }, []);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (firstRun.current || wasNearBottom.current || lastIsOwn) {
      el.scrollTop = el.scrollHeight;
      wasNearBottom.current = true;
    }
    firstRun.current = false;
  }, [changeKey, lastIsOwn]);

  // Keep pinned when the visible area shrinks (keyboard opens, browser bars change).
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => {
      if (wasNearBottom.current) el.scrollTop = el.scrollHeight;
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, onScroll };
}
