import { useCallback, useEffect, useState } from "react";

const EVT = "ms-storage";
/** Hydration-safe localStorage state shared across components in the same tab. */
export function useLocal<T>(key: string, initial: T) {
  const [val, setVal] = useState<T>(initial);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const read = () => {
      try {
        const raw = localStorage.getItem(key);
        setVal(raw == null ? initial : (JSON.parse(raw) as T));
      } catch { /* corrupt value: keep default */ }
    };
    read();
    setReady(true);
    const on = (e: Event) => { if ((e as CustomEvent).detail === key) read(); };
    window.addEventListener(EVT, on);
    return () => window.removeEventListener(EVT, on);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const set = useCallback((next: T | ((p: T) => T)) => {
    setVal((prev) => {
      const v = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      localStorage.setItem(key, JSON.stringify(v));
      queueMicrotask(() => window.dispatchEvent(new CustomEvent(EVT, { detail: key })));
      return v;
    });
  }, [key]);
  return [val, set, ready] as const;
}

export const KEYS = { watchlist: "ms.watchlist", txns: "ms.txns", manualPrices: "ms.manualPrices", finnhub: "ms.finnhubKey", analyses: "ms.analyses" };