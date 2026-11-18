import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { TV } from "@/components/ms/TV";
import { Panel, PageHeader } from "@/components/ms/Panel";
import { FredKpi } from "@/components/ms/Fred";
import { KEYS, useLocal } from "@/lib/storage";
import { TICKER_RE, normTicker } from "@/lib/format";
import { SECTORS, SNAPSHOT_TABS, tvSym } from "@/lib/symbols";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/")({
  head: () => meta("Market Overview", "Snapshot of US indices, rates, volatility, the dollar, commodities, crypto, sectors, movers and headlines."),
  component: Overview,
});

export const DEFAULT_WATCH = ["AAPL", "MSFT", "NVDA", "AMZN", "JPM"];

function Overview() {
  return (
    <>
      <PageHeader title="Market Overview" sub="Embedded quotes from TradingView (delayed per exchange rules) and macro readings fetched live from FRED. Each panel loads independently." />
      <TV widget="ticker-tape" height={46} config={{ displayMode: "adaptive", showSymbolLogo: false, symbols: SNAPSHOT_TABS.flatMap((t) => t.symbols.map((x) => ({ proName: x.s, title: x.d }))) }} />
      <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <FredKpi id="DGS10" label="10Y Treasury" unit="%" years={1} />
        <FredKpi id="DGS2" label="2Y Treasury" unit="%" years={1} />
        <FredKpi id="T10Y2Y" label="10Y − 2Y spread" unit=" pp" years={1} />
        <FredKpi id="DFF" label="Fed funds (effective)" unit="%" years={1} />
        <FredKpi id="CPIAUCSL" label="CPI inflation YoY" t="yoy" unit="%" years={3} />
        <FredKpi id="UNRATE" label="Unemployment" unit="%" years={2} digits={1} />
      </div>
      <div className="mt-3 grid gap-3 xl:grid-cols-3">
        <Panel title="Cross-asset snapshot" kind="embed" className="xl:col-span-2" source="TradingView" sourceUrl="https://www.tradingview.com/">
          <TV widget="market-overview" height={460} config={{ dateRange: "1D", showChart: true, showSymbolLogo: false, tabs: SNAPSHOT_TABS.map((t) => ({ title: t.title, symbols: t.symbols, originalTitle: t.title })) }} />
        </Panel>
        <Panel title="Top gainers / losers / most active (US)" kind="embed" source="TradingView" sourceUrl="https://www.tradingview.com/">
          <TV widget="hotlists" height={460} config={{ exchange: "US", showChart: false, dateRange: "1D", showSymbolLogo: false }} />
        </Panel>
        <Panel title="Sector ETFs" kind="embed" source="TradingView (SPDR sector ETFs)">
          <TV widget="market-quotes" height={420} config={{ showSymbolLogo: false, symbolsGroups: [{ name: "Sectors", symbols: SECTORS.map(([s, n]) => ({ name: `AMEX:${s}`, displayName: n })) }] }} />
        </Panel>
        <Panel title="Market breadth (% of S&P 500 above moving average)" kind="embed" source="TradingView breadth indices S5TH / S5FI / S5TW">
          <TV widget="market-quotes" height={420} config={{ showSymbolLogo: false, symbolsGroups: [{ name: "Breadth", symbols: [
            { name: "INDEX:S5TH", displayName: "% above 200-day" }, { name: "INDEX:S5FI", displayName: "% above 50-day" }, { name: "INDEX:S5TW", displayName: "% above 20-day" } ] }] }} />
        </Panel>
        <Watchlist />
        <Panel title="Latest market headlines" kind="embed" className="xl:col-span-3" source="TradingView news (third-party publishers credited per item)">
          <TV widget="timeline" height={460} config={{ feedMode: "market", market: "stock", displayMode: "regular" }} />
        </Panel>
      </div>
    </>
  );
}

function Watchlist() {
  const [list, setList] = useLocal<string[]>(KEYS.watchlist, DEFAULT_WATCH);
  const [v, setV] = useState("");
  const [err, setErr] = useState("");
  const add = (e: FormEvent) => {
    e.preventDefault();
    const t = normTicker(v);
    if (!TICKER_RE.test(t)) return setErr("Enter a valid US ticker");
    if (list.includes(t)) return setErr("Already in watchlist");
    if (list.length >= 20) return setErr("Max 20 symbols");
    setList([...list, t]); setV(""); setErr("");
  };
  return (
    <Panel title="Watchlist" kind="local" source="Quotes: TradingView embed · list saved in this browser">
      <form onSubmit={add} className="mb-2 flex gap-2">
        <input aria-label="Add ticker to watchlist" value={v} onChange={(e) => setV(e.target.value)} placeholder="Add ticker" className="num h-8 flex-1 rounded border border-border bg-input/40 px-2 text-sm uppercase" />
        <button className="h-8 rounded bg-primary px-3 text-sm font-medium text-primary-foreground">Add</button>
      </form>
      {err && <p className="mb-2 text-xs text-warn" role="alert">{err}</p>}
      <ul className="mb-2 flex flex-wrap gap-1.5">
        {list.map((t) => (
          <li key={t} className="flex items-center gap-1 rounded border border-border bg-muted px-1.5 py-0.5 text-xs">
            <Link to="/company" search={{ t }} className="num hover:text-primary">{t}</Link>
            <button aria-label={`Remove ${t}`} onClick={() => setList(list.filter((x) => x !== t))}><X className="h-3 w-3" /></button>
          </li>
        ))}
      </ul>
      {list.length ? (
        <TV widget="market-quotes" height={300} config={{ showSymbolLogo: false, symbolsGroups: [{ name: "Watchlist", symbols: list.map((t) => ({ name: tvSym(t) })) }] }} />
      ) : <p className="text-sm text-muted-foreground">Your watchlist is empty — add a ticker above.</p>}
    </Panel>
  );
}