import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { TV } from "@/components/ms/TV";
import { Panel, PageHeader, State } from "@/components/ms/Panel";
import { useCompany } from "@/lib/hooks";
import { TICKER_RE, normTicker } from "@/lib/format";
import { tvSym } from "@/lib/symbols";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/news")({
  head: () => meta("News & Catalysts", "Financial headlines, company news, SEC filings such as 8-K, 10-Q and 10-K, and the US economic release calendar."),
  component: News,
});

function News() {
  const [t, setT] = useState("AAPL");
  const [v, setV] = useState("");
  const co = useCompany(t);
  const submit = (e: FormEvent) => { e.preventDefault(); const x = normTicker(v); if (TICKER_RE.test(x)) { setT(x); setV(""); } };
  return (
    <>
      <PageHeader title="News & Catalysts" sub="Headlines come from TradingView's news feed (each item credits its publisher). Company events come straight from SEC EDGAR filings. Nothing on this page is written or invented by MarketScope." />
      <div className="grid gap-3 xl:grid-cols-2">
        <Panel title="Market headlines" kind="embed" source="TradingView news">
          <TV widget="timeline" height={620} config={{ feedMode: "all_symbols", displayMode: "regular" }} />
        </Panel>
        <Panel title={`Company news & filings · ${t}`} kind="live" source="TradingView news + SEC EDGAR" sourceUrl={co.data?.found ? co.data.edgarUrl : "https://www.sec.gov/edgar"} updated={co.data?.found ? co.data.fetchedAt : null}
          actions={<form onSubmit={submit} className="flex gap-1"><input aria-label="Company ticker" value={v} onChange={(e) => setV(e.target.value)} placeholder="Ticker" className="num h-7 w-24 rounded border border-border bg-input/40 px-2 text-xs uppercase" /><button className="h-7 rounded bg-primary px-2 text-xs text-primary-foreground">Go</button></form>}>
          <h3 className="eyebrow mb-1">Recent SEC filings (8-K = material events, 10-Q/10-K = earnings reports)</h3>
          {co.isLoading ? <State kind="loading" /> : co.isError ? <State kind="error">SEC EDGAR unavailable right now.</State> : co.data && !co.data.found ? <State kind="empty">Ticker not found in SEC registry.</State> : (
            <ul className="mb-3 max-h-56 divide-y divide-border overflow-y-auto text-sm">
              {co.data?.filings.filter((f) => ["8-K", "10-Q", "10-K", "DEF 14A", "S-1", "6-K", "20-F"].includes(f.form)).slice(0, 15).map((f) => (
                <li key={f.url} className="flex gap-3 py-1.5"><span className="num w-24 shrink-0 text-muted-foreground">{f.date}</span><span className="num w-14 shrink-0 font-semibold text-primary">{f.form}</span>
                  <a href={f.url} target="_blank" rel="noopener noreferrer" className="truncate hover:underline">{f.desc}</a></li>
              ))}
            </ul>
          )}
          <TV widget="timeline" height={360} config={{ feedMode: "symbol", symbol: tvSym(t), displayMode: "compact" }} />
        </Panel>
      </div>
      <Panel className="mt-3" title="Economic releases (US, medium & high importance)" kind="embed" source="TradingView economic calendar">
        <TV widget="events" height={480} config={{ importanceFilter: "0,1", countryFilter: "us" }} />
      </Panel>
    </>
  );
}