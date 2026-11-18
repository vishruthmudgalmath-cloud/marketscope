import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { TV } from "@/components/ms/TV";
import { Panel, PageHeader } from "@/components/ms/Panel";
import { TICKER_RE, normTicker } from "@/lib/format";
import { tvSym } from "@/lib/symbols";
import { meta } from "@/lib/meta";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/markets")({
  head: () => meta("Markets & Charts", "Interactive charts with SMA, EMA, RSI, MACD and Bollinger Bands, symbol comparison and a US stock screener."),
  component: Markets,
});

const STUDIES = {
  "SMA 20": { id: "MASimple@tv-basicstudies", inputs: { length: 20 } },
  "SMA 50": { id: "MASimple@tv-basicstudies", inputs: { length: 50 } },
  "SMA 200": { id: "MASimple@tv-basicstudies", inputs: { length: 200 } },
  "EMA 21": { id: "MAExp@tv-basicstudies", inputs: { length: 21 } },
  Bollinger: { id: "BB@tv-basicstudies" },
  RSI: { id: "RSI@tv-basicstudies" },
  MACD: { id: "MACD@tv-basicstudies" },
} as const;
type StudyName = keyof typeof STUDIES;
const INTERVALS = [["15", "15m"], ["60", "1h"], ["D", "1D"], ["W", "1W"], ["M", "1M"]] as const;

function Markets() {
  const [symbol, setSymbol] = useState("SPY");
  const [compare, setCompare] = useState<string[]>([]);
  const [interval, setIntervalV] = useState<string>("D");
  const [studies, setStudies] = useState<StudyName[]>(["SMA 50", "SMA 200", "RSI"]);
  const [input, setInput] = useState("");
  const [cmp, setCmp] = useState("");
  const [err, setErr] = useState("");

  const load = (e: FormEvent) => { e.preventDefault(); const t = normTicker(input); if (!TICKER_RE.test(t)) return setErr("Invalid ticker"); setErr(""); setSymbol(t); setInput(""); };
  const addCmp = (e: FormEvent) => { e.preventDefault(); const t = normTicker(cmp); if (!TICKER_RE.test(t)) return setErr("Invalid compare ticker"); if (compare.length >= 3 || compare.includes(t)) return setErr("Up to 3 unique compare symbols"); setErr(""); setCompare([...compare, t]); setCmp(""); };
  const toggle = (s: StudyName) => setStudies((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]));

  return (
    <>
      <PageHeader title="Markets" sub="Charts and screener are TradingView embeds. Indicators are computed by TradingView from its delayed data; definitions are on the Learn page." />
      <Panel title={`Chart · ${symbol}${compare.length ? " vs " + compare.join(", ") : ""}`} kind="embed" source="TradingView Advanced Chart" sourceUrl="https://www.tradingview.com/widget-docs/widgets/charts/advanced-chart/"
        actions={<div className="flex gap-1" role="group" aria-label="Timeframe">{INTERVALS.map(([v, l]) => (
          <button key={v} aria-pressed={interval === v} onClick={() => setIntervalV(v)} className={cn("num rounded px-2 py-0.5 text-xs", interval === v ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-accent")}>{l}</button>))}</div>}>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <form onSubmit={load} className="flex gap-1"><input aria-label="Chart symbol" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Symbol" className="num h-8 w-28 rounded border border-border bg-input/40 px-2 text-sm uppercase" /><button className="h-8 rounded bg-primary px-3 text-sm text-primary-foreground">Load</button></form>
          <form onSubmit={addCmp} className="flex gap-1"><input aria-label="Compare symbol" value={cmp} onChange={(e) => setCmp(e.target.value)} placeholder="Compare" className="num h-8 w-28 rounded border border-border bg-input/40 px-2 text-sm uppercase" /><button className="h-8 rounded border border-border px-3 text-sm hover:bg-muted">+ Compare</button></form>
          {compare.map((c) => <button key={c} onClick={() => setCompare(compare.filter((x) => x !== c))} className="num rounded bg-muted px-2 py-0.5 text-xs" aria-label={`Remove ${c}`}>{c} ×</button>)}
          {err && <span role="alert" className="text-xs text-warn">{err}</span>}
        </div>
        <div className="mb-3 flex flex-wrap gap-1" role="group" aria-label="Indicators">
          {(Object.keys(STUDIES) as StudyName[]).map((s) => (
            <button key={s} aria-pressed={studies.includes(s)} onClick={() => toggle(s)} className={cn("rounded border px-2 py-0.5 text-xs", studies.includes(s) ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:text-foreground")}>{s}</button>
          ))}
        </div>
        <TV widget="advanced-chart" height={620} config={{
          symbol: tvSym(symbol), interval, timezone: "America/New_York", theme: "dark", style: "1", allow_symbol_change: true, withdateranges: true,
          hide_side_toolbar: false, studies: studies.map((s) => STUDIES[s]), compareSymbols: compare.map((c) => ({ symbol: tvSym(c), position: "SameScale" })),
          backgroundColor: "rgba(0,0,0,0)",
        }} />
      </Panel>
      <Panel className="mt-3" title="US stock screener" kind="embed" source="TradingView Screener — filters for market cap, price, sector, valuation and performance are inside the widget" sourceUrl="https://www.tradingview.com/screener/">
        <TV widget="screener" height={640} config={{ defaultColumn: "overview", defaultScreen: "most_capitalized", market: "america", showToolbar: true }} />
      </Panel>
    </>
  );
}