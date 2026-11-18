export const TICKER_RE = /^[A-Z]{1,5}([.-][A-Z]{1,2})?$/;
export const normTicker = (s: string) => s.trim().toUpperCase();
export function fmtPct(v: number | null | undefined, d = 1) { return v == null || !isFinite(v) ? "—" : `${(v * 100).toFixed(d)}%`; }
export function fmtNum(v: number | null | undefined, d = 2) { return v == null || !isFinite(v) ? "—" : v.toLocaleString("en-US", { maximumFractionDigits: d, minimumFractionDigits: d }); }
export function fmtBig(v: number | null | undefined) {
  if (v == null || !isFinite(v)) return "—";
  const a = Math.abs(v);
  const [n, s] = a >= 1e12 ? [v / 1e12, "T"] : a >= 1e9 ? [v / 1e9, "B"] : a >= 1e6 ? [v / 1e6, "M"] : a >= 1e3 ? [v / 1e3, "K"] : [v, ""];
  return `${(n as number).toFixed(2)}${s}`;
}
export function fmtUsd(v: number | null | undefined) { return v == null || !isFinite(v) ? "—" : v.toLocaleString("en-US", { style: "currency", currency: "USD" }); }