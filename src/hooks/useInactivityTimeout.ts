import { useEffect, useRef, useCallback } from "react";

const TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

export const useInactivityTimeout = (onTimeout: () => void, enabled = true) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (enabled) {
      timerRef.current = setTimeout(onTimeout, TIMEOUT_MS);
    }
  }, [onTimeout, enabled]);

  useEffect(() => {
    if (!enabled) return;

    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "click"];
    events.forEach((e) => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((e) => window.removeEventListener(e, resetTimer));
    };
  }, [resetTimer, enabled]);
};
