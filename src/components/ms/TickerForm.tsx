import { useState, type FormEvent } from "react";
import { TICKER_RE, normTicker } from "@/lib/format";

export function TickerForm({ onSubmit, label = "Ticker", cta = "Load", initial = "" }: { onSubmit: (t: string) => void; label?: string; cta?: string; initial?: string }) {
  const [v, setV] = useState(initial);
  const [err, setErr] = useState("");
  const go = (e: FormEvent) => { e.preventDefault(); const t = normTicker(v); if (!TICKER_RE.test(t)) return setErr("Enter a valid US ticker, e.g. MSFT or BRK.B"); setErr(""); onSubmit(t); };
  return (
    <form onSubmit={go} className="flex flex-wrap items-center gap-2">
      <input aria-label={label} aria-invalid={!!err} value={v} onChange={(e) => setV(e.target.value)} placeholder={label} className="num h-9 w-36 rounded border border-border bg-input/40 px-2 text-sm uppercase" />
      <button className="h-9 rounded bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">{cta}</button>
      {err && <span role="alert" className="text-xs text-warn">{err}</span>}
    </form>
  );
}