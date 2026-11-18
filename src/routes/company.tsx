import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TV } from "@/components/ms/TV";
import { Panel, PageHeader, State } from "@/components/ms/Panel";
import { TickerForm } from "@/components/ms/TickerForm";
import { useCompany, useQuote } from "@/lib/hooks";
import { computeRatios, type Statements } from "@/lib/fundamentals";
import { fmtBig, fmtNum, fmtPct, fmtUsd } from "@/lib/format";
import { tvSym } from "@/lib/symbols";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/company")({
  validateSearch: (s: Record<string, unknown>): { t?: string | undefined } => ({ t: typeof s["t"] === "string" && s["t"] ? s["t"].toUpperCase() : undefined }),
  head: () => meta("Company Research", "Company overview, SEC-reported financial statements, calculated ratios, earnings history, filings and insider Form 4 activity."),
  component: Company,
});

const ROWS: [keyof Statements, string][] = [
  ["revenue", "Revenue"], ["grossProfit", "Gross profit"], ["operatingIncome", "Operating income"], ["netIncome", "Net income"],
  ["epsDiluted", "Diluted EPS"], ["operatingCashFlow", "Operating cash flow"], ["capex", "Capital expenditures"],
  ["assets", "Total assets"], ["liabilities", "Total liabilities"], ["equity", "Shareholders' equity"], ["cash", "Cash & equivalents"], ["longTermDebt", "Long-term debt"],
];

export function StatementsTable({ s }: { s: Statements }) {
  const years = [...new Set(ROWS.flatMap(([k]) => s[k].map((p) => p.year)))].sort().slice(-5);
  if (!years.length) return <State kind="empty">No standardized XBRL annual data for this filer.</State>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="border-b border-border text-left"><th className="py-1.5 font-medium text-muted-foreground">USD · CY frame</th>{years.map((y) => <th key={y} className="num py-1.5 text-right font-medium">{y}</th>)}</tr></thead>
        <tbody>{ROWS.map(([k, l]) => (
          <tr key={k} className="border-b border-border/50 hover:bg-muted/40"><td className="py-1.5">{l}</td>
            {years.map((y) => { const v = s[k].find((p) => p.year === y)?.val; return <td key={y} className="num py-1.5 text-right">{k === "epsDiluted" ? fmtNum(v) : fmtBig(v)}</td>; })}</tr>
        ))}</tbody>
      </table>
    </div>
  );
}

export const RATIO_DEFS = [
  ["grossMargin", "Gross margin", "Gross profit ÷ revenue"], ["operatingMargin", "Operating margin", "Operating income ÷ revenue"],
  ["netMargin", "Net margin", "Net income ÷ revenue"], ["roe", "Return on equity", "Net income ÷ year-end equity"],
  ["debtToEquity", "LT debt / equity", "Long-term debt ÷ equity"], ["currentRatio", "Current ratio", "Current assets ÷ current liabilities"],
  ["fcfMargin", "FCF margin", "(Operating cash flow − capex) ÷ revenue"], ["revenueGrowth", "Revenue growth", "Revenue ÷ prior-year revenue − 1"],
  ["revenueCagr3y", "Revenue CAGR 3y", "(Rev ÷ Rev 3y ago)^(1/3) − 1"], ["epsGrowth", "EPS growth", "Diluted EPS ÷ prior-year EPS − 1"],
] as const;
export const isMultiple = (k: string) => k === "debtToEquity" || k === "currentRatio";

function Company() {
  const { t } = Route.useSearch();
  const nav = useNavigate();
  const q = useCompany(t);
  const quote = useQuote(t);
  const d = q.data?.found ? q.data : null;
  const r = d?.statements ? computeRatios(d.statements) : null;
  const lastEps = d?.statements?.epsDiluted.at(-1)?.val;
  const lastRev = d?.statements?.revenue.at(-1)?.val;
  const mcap = quote.data && d?.shares ? quote.data.price * d.shares.val : null;
  return (
    <>
      <PageHeader title={d ? `${d.name} (${d.ticker})` : "Company Research"} sub={d ? `${d.sic ?? "—"} · ${d.exchanges.join(", ") || "—"} · CIK ${d.cik} · fiscal year-end ${d.fiscalYearEnd ?? "—"}` : "Search a US-listed company. Fundamentals come from SEC EDGAR XBRL filings."}>
        <TickerForm key={t} initial={t ?? ""} onSubmit={(x) => nav({ to: "/company", search: { t: x } })} />
      </PageHeader>
      {!t ? <State kind="empty">Enter a ticker to begin — e.g. AAPL, MSFT, JPM, XOM.</State> : q.isLoading ? <State kind="loading">Fetching SEC filings for {t}…</State> :
        q.isError ? <State kind="error">SEC EDGAR is unavailable or rate-limited. Try again in a minute.</State> : !d ? <State kind="empty">{t} was not found in the SEC company registry (ETFs, funds and some foreign issuers are not covered).</State> : (
        <div className="grid gap-3 xl:grid-cols-3">
          <Panel title="Price & profile" kind="embed" source="TradingView symbol info">
            <TV widget="symbol-info" height={190} config={{ symbol: tvSym(d.ticker) }} />
            <div className="mt-2 flex gap-2 text-xs"><Link to="/compare" search={{ s: d.ticker }} className="rounded border border-border px-2 py-1 hover:bg-muted">Compare</Link><Link to="/lab" search={{ t: d.ticker }} className="rounded border border-border px-2 py-1 hover:bg-muted">Analyze in Lab</Link><a href={d.edgarUrl} target="_blank" rel="noopener noreferrer" className="rounded border border-border px-2 py-1 hover:bg-muted">EDGAR ↗</a></div>
          </Panel>
          <Panel title="Valuation" kind="calc" className="xl:col-span-2" source={quote.data ? "Price: Finnhub (your key) · Shares & earnings: SEC" : "SEC shares outstanding; price requires optional key"}>
            {quote.data ? (
              <dl className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                <Kpi l="Price (Finnhub)" v={fmtUsd(quote.data.price)} s={new Date(quote.data.time).toLocaleString()} />
                <Kpi l="Market cap" v={fmtBig(mcap)} s="price × SEC shares" />
                <Kpi l="P/E (trailing FY)" v={lastEps && lastEps > 0 ? fmtNum(quote.data.price / lastEps, 1) : "n/m"} s="price ÷ last FY diluted EPS" />
                <Kpi l="P/S" v={mcap && lastRev ? fmtNum(mcap / lastRev, 1) : "—"} s="market cap ÷ last FY revenue" />
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">Shares outstanding (SEC cover page): <span className="num text-foreground">{fmtBig(d.shares?.val)}</span> as of {d.shares?.asOf ?? "—"}. Add an optional free Finnhub key in <Link to="/settings" className="text-primary underline">Settings</Link> to compute P/E, P/S and market cap here, or see TradingView's figures in the Financials panel below.</p>
            )}
          </Panel>
          <Panel title="Calculated ratios" kind="calc" source="Formulas on SEC-reported values" sourceUrl={d.edgarUrl}>
            {r ? <table className="w-full text-sm"><tbody>{RATIO_DEFS.map(([k, l, f]) => (
              <tr key={k} className="border-b border-border/50"><td className="py-1.5"><div>{l}</div><div className="text-[10px] text-muted-foreground">{f}</div></td>
                <td className="num text-right">{isMultiple(k) ? (r[k] == null ? "—" : `${fmtNum(r[k], 2)}×`) : fmtPct(r[k])}</td></tr>))}</tbody></table> : <State kind="empty" />}
            {r?.fiscalYear && <p className="mt-2 text-[11px] text-muted-foreground">Latest calendar-aligned frame: {r.fiscalYear}</p>}
          </Panel>
          <Panel title="Annual financial statements" kind="historical" className="xl:col-span-2" source="SEC EDGAR XBRL companyfacts" sourceUrl={d.edgarUrl} updated={d.fetchedAt}>
            {d.statements ? <StatementsTable s={d.statements} /> : <State kind="empty" />}
          </Panel>
          <Panel title="Earnings history — reported diluted EPS (quarterly)" kind="historical" className="xl:col-span-2" source="SEC 10-Q/10-K filings" sourceUrl={d.edgarUrl}>
            {d.quarterlyEps.length ? (
              <div className="h-56" role="img" aria-label="Quarterly EPS chart"><ResponsiveContainer><BarChart data={d.quarterlyEps}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" /><XAxis dataKey="period" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} /><YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", fontSize: 12 }} /><Bar dataKey="val" name="Diluted EPS" fill="var(--chart-1)" isAnimationActive={false} />
              </BarChart></ResponsiveContainer></div>
            ) : <State kind="empty">No quarterly EPS frames reported in XBRL.</State>}
            <p className="mt-1 text-[11px] text-muted-foreground">Fourth quarters are often only reported inside annual totals, so gaps are expected. Analyst estimates are not shown — no free licensed source.</p>
          </Panel>
          <Panel title="Insider transactions (Form 4 filings)" kind="live" source="SEC EDGAR" sourceUrl={`https://www.sec.gov/cgi-bin/own-disp?action=getissuer&CIK=${d.cik}`}>
            {d.insider.length ? <ul className="max-h-64 divide-y divide-border overflow-y-auto text-sm">{d.insider.map((f) => (
              <li key={f.url} className="flex justify-between py-1"><span className="num text-muted-foreground">{f.date}</span><a className="text-primary hover:underline" href={f.url} target="_blank" rel="noopener noreferrer">Form 4 ↗</a></li>))}</ul>
              : <State kind="empty">No recent Form 4 filings.</State>}
            <p className="mt-2 text-[11px] text-muted-foreground">Institutional (13F) ownership is not aggregated by any free official API; see the <a className="underline" href={`https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${d.cik}&type=SC+13`} target="_blank" rel="noopener noreferrer">SC 13D/G filings</a> on EDGAR.</p>
          </Panel>
          <Panel title="Financials & valuation (TradingView)" kind="embed" className="xl:col-span-2" source="TradingView fundamentals">
            <TV widget="financials" height={480} config={{ symbol: tvSym(d.ticker), displayMode: "regular" }} />
          </Panel>
          <Panel title="Recent filings" kind="live" source="SEC EDGAR submissions" sourceUrl={d.edgarUrl}>
            <ul className="max-h-[480px] divide-y divide-border overflow-y-auto text-sm">{d.filings.map((f) => (
              <li key={f.url} className="py-1.5"><div className="flex justify-between"><span className="num font-semibold text-primary">{f.form}</span><span className="num text-xs text-muted-foreground">{f.date}</span></div>
                <a href={f.url} target="_blank" rel="noopener noreferrer" className="line-clamp-1 text-xs hover:underline">{f.desc}</a></li>))}</ul>
          </Panel>
        </div>
      )}
    </>
  );
}

export function Kpi({ l, v, s }: { l: string; v: string; s?: string }) {
  return <div><dt className="eyebrow">{l}</dt><dd className="num text-lg font-semibold">{v}</dd>{s && <dd className="text-[10px] text-muted-foreground">{s}</dd>}</div>;
}