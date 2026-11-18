import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { TV } from "@/components/ms/TV";
import { Panel, PageHeader } from "@/components/ms/Panel";
import { SECTORS } from "@/lib/symbols";
import { meta } from "@/lib/meta";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/sectors")({
  head: () => meta("Sectors", "S&P 500 sector heatmap, sector ETF performance, relative strength versus SPY and breadth views."),
  component: Sectors,
});

function Sectors() {
  const [sel, setSel] = useState<string>("XLK");
  return (
    <>
      <PageHeader title="Sectors" sub="Sector exposure measured through SPDR Select Sector ETFs. Relative strength = sector ETF price ÷ SPY price; a rising line means the sector is outperforming." />
      <div className="grid gap-3 xl:grid-cols-3">
        <Panel title="S&P 500 heatmap (by sector, sized by market cap)" kind="embed" className="xl:col-span-2" source="TradingView Stock Heatmap">
          <TV widget="stock-heatmap" height={560} config={{ dataSource: "SPX500", blockSize: "market_cap_basic", blockColor: "change", grouping: "sector", hasTopBar: true, isZoomEnabled: true, hasSymbolTooltip: true, isMonoSize: false }} />
        </Panel>
        <Panel title="Sector ETF performance" kind="embed" source="TradingView">
          <TV widget="market-overview" height={560} config={{ dateRange: "12M", showChart: true, tabs: [{ title: "Sectors", symbols: SECTORS.map(([s, n]) => ({ s: `AMEX:${s}`, d: n })) }] }} />
        </Panel>
        <Panel title={`Relative strength · ${sel} ÷ SPY (rotation view)`} kind="embed" className="xl:col-span-3" source="TradingView ratio chart"
          actions={<div className="flex flex-wrap gap-1" role="group" aria-label="Sector">{SECTORS.map(([s]) => (
            <button key={s} aria-pressed={sel === s} onClick={() => setSel(s)} className={cn("num rounded px-1.5 py-0.5 text-[11px]", sel === s ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-accent")}>{s}</button>))}</div>}>
          <TV widget="advanced-chart" height={460} config={{ symbol: `AMEX:${sel}/AMEX:SPY`, interval: "W", theme: "dark", style: "2", timezone: "America/New_York", studies: [{ id: "MASimple@tv-basicstudies", inputs: { length: 26 } }], hide_side_toolbar: true, backgroundColor: "rgba(0,0,0,0)" }} />
          <p className="mt-2 text-xs text-muted-foreground">Rotation heuristic: ratio above its 26-week average and rising = leadership; below and falling = lagging. This is a descriptive rule, not a forecast.</p>
        </Panel>
        <Panel title="Breadth: % of S&P 500 members above 200-day average" kind="embed" className="xl:col-span-3" source="TradingView INDEX:S5TH">
          <TV widget="advanced-chart" height={360} config={{ symbol: "INDEX:S5TH", interval: "D", theme: "dark", style: "2", hide_side_toolbar: true, backgroundColor: "rgba(0,0,0,0)" }} />
        </Panel>
      </div>
    </>
  );
}