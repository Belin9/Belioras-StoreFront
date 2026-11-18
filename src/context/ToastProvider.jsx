/* Context Provider: ToastProvider */
import { useCallback, useMemo, useRef, useState } from "react";
import { ToastContext } from "./ToastContext";

let nextId = 0;

/* DEFAULT DURATION */
const DEFAULT_DURATION = 4000;

/* ACTION DURATION */
const ACTION_DURATION = 8000;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  // id -> {timer, expiresAt, remaining}
  const timers = useRef(new Map());

  const clearTimer = useCallback((id) => {

    const entry = timers.current.get(id);
    if (entry?.timer) clearTimeout(entry.timer);
    timers.current.delete(id);
  }, []);

  const dismiss = useCallback(
    (id) => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      clearTimer(id);
    },
    [clearTimer],
  );

  const schedule = useCallback(
    (id, ms) => {

      const timer = setTimeout(() => dismiss(id), ms);
      timers.current.set(id, { timer, expiresAt: Date.now() + ms, remaining: ms });
    },
    [dismiss],
  );

  const toast = useCallback(
    (message, typeOrOptions = "info") => {

      const options =
        typeof typeOrOptions === "string" ? { type: typeOrOptions } : (typeOrOptions ?? {});
      const { type = "info", action, duration } = options;

      const id = ++nextId;

      const ms = duration ?? (action ? ACTION_DURATION : DEFAULT_DURATION);

      setToasts((prev) => [...prev, { id, message, type, action }]);
      schedule(id, ms);
      return id;
    },
    [schedule],
  );

  const pause = useCallback((id) => {

    const entry = timers.current.get(id);
    if (!entry?.timer) return;
    clearTimeout(entry.timer);
    timers.current.set(id, {
      timer: null,
      expiresAt: entry.expiresAt,
      remaining: Math.max(0, entry.expiresAt - Date.now()),
    });
  }, []);

  const resume = useCallback(
    (id) => {

      const entry = timers.current.get(id);
      // Only resume something that is actually paused, so a stray pointerleave
      // cannot stack a second timer onto a live toast.
      if (!entry || entry.timer) return;
      schedule(id, entry.remaining);
    },
    [schedule],
  );

  const value = useMemo(
    () => ({ toasts, toast, dismiss, pause, resume }),
    [toasts, toast, dismiss, pause, resume],
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}
