import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueries } from "@tanstack/react-query";
import { X } from "lucide-react";
import { TV } from "@/components/ms/TV";
import { Panel, PageHeader, State } from "@/components/ms/Panel";
import { TickerForm } from "@/components/ms/TickerForm";
import { getCompany } from "@/lib/data.functions";
import { computeRatios } from "@/lib/fundamentals";
import { fmtBig, fmtNum, fmtPct, TICKER_RE } from "@/lib/format";
import { RATIO_DEFS, isMultiple } from "./company";
import { tvSym } from "@/lib/symbols";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/compare")({
  validateSearch: (s: Record<string, unknown>): { s?: string | undefined } => ({ s: typeof s["s"] === "string" && s["s"] ? s["s"].toUpperCase() : undefined }),
  head: () => meta("Compare Companies", "Compare up to four tickers side by side on price performance, growth, profitability, leverage and technical ratings."),
  component: Compare,
});

function Compare() {
  const { s } = Route.useSearch();
  const nav = useNavigate();
  const list = (s ?? "AAPL,MSFT").split(",").filter((x) => TICKER_RE.test(x)).slice(0, 4);
  const setList = (l: string[]) => nav({ to: "/compare", search: { s: l.join(",") || undefined } });
  const qs = useQueries({ queries: list.map((t) => ({ queryKey: ["company", t], queryFn: () => getCompany({ data: { ticker: t } }), staleTime: 3600_000, retry: 1 })) });
  return (
    <>
      <PageHeader title="Compare" sub="Fundamentals from SEC filings (latest calendar-aligned annual frame); price performance and technical ratings from TradingView embeds.">
        <TickerForm cta="+ Add" label="Add ticker" onSubmit={(t) => !list.includes(t) && list.length < 4 && setList([...list, t])} />
      </PageHeader>
      <div className="mb-3 flex flex-wrap gap-1.5">{list.map((t) => <button key={t} onClick={() => setList(list.filter((x) => x !== t))} className="num flex items-center gap-1 rounded border border-border bg-muted px-2 py-1 text-xs" aria-label={`Remove ${t}`}>{t}<X className="h-3 w-3" /></button>)}{list.length >= 4 && <span className="text-xs text-muted-foreground">Max 4 tickers</span>}</div>
      {!list.length ? <State kind="empty">Add at least one ticker.</State> : (
        <div className="grid gap-3">
          <Panel title="Price performance (same scale, %)" kind="embed" source="TradingView">
            <TV widget="advanced-chart" height={440} config={{ symbol: tvSym(list[0]!), interval: "D", range: "12M", theme: "dark", style: "2", hide_side_toolbar: true, compareSymbols: list.slice(1).map((c) => ({ symbol: tvSym(c), position: "SameScale" })), backgroundColor: "rgba(0,0,0,0)" }} />
          </Panel>
          <Panel title="Fundamentals side-by-side" kind="calc" source="SEC EDGAR XBRL · formulas on Learn page" sourceUrl="https://www.sec.gov/edgar">
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead><tr className="border-b border-border text-left"><th className="py-1.5 font-medium text-muted-foreground">Metric</th>{list.map((t) => <th key={t} className="num py-1.5 text-right">{t}</th>)}</tr></thead>
              <tbody>
                <tr className="border-b border-border/50"><td className="py-1.5">Latest frame</td>{qs.map((q, i) => <td key={i} className="num text-right">{q.isLoading ? "…" : q.data?.found && q.data.statements ? computeRatios(q.data.statements).fiscalYear ?? "—" : q.isError ? "error" : "n/a"}</td>)}</tr>
                <tr className="border-b border-border/50"><td className="py-1.5">Revenue</td>{qs.map((q, i) => <td key={i} className="num text-right">{q.data?.found ? fmtBig(q.data.statements?.revenue.at(-1)?.val) : "—"}</td>)}</tr>
                <tr className="border-b border-border/50"><td className="py-1.5">Net income</td>{qs.map((q, i) => <td key={i} className="num text-right">{q.data?.found ? fmtBig(q.data.statements?.netIncome.at(-1)?.val) : "—"}</td>)}</tr>
                {RATIO_DEFS.map(([k, l]) => (
                  <tr key={k} className="border-b border-border/50 hover:bg-muted/40"><td className="py-1.5">{l}</td>{qs.map((q, i) => {
                    const r = q.data?.found && q.data.statements ? computeRatios(q.data.statements) : null; const v = r?.[k] ?? null;
                    return <td key={i} className="num text-right">{isMultiple(k) ? (v == null ? "—" : `${fmtNum(v)}×`) : fmtPct(v)}</td>; })}</tr>
                ))}
              </tbody>
            </table></div>
            <p className="mt-2 text-[11px] text-muted-foreground">Fiscal years differ between companies; SEC "CY" frames align values to the nearest calendar year. Valuation multiples need a price — see Company pages or TradingView panels below.</p>
          </Panel>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{list.map((t) => (
            <Panel key={t} title={`${t} · technical rating`} kind="embed" source="TradingView technical summary (its own rules)">
              <TV widget="technical-analysis" height={380} config={{ symbol: tvSym(t), interval: "1D", showIntervalTabs: true, displayMode: "single" }} />
            </Panel>))}</div>
        </div>
      )}
    </>
  );
}