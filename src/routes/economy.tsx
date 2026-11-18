import { createFileRoute } from "@tanstack/react-router";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useQueries } from "@tanstack/react-query";
import { FredChart } from "@/components/ms/Fred";
import { Panel, PageHeader, State } from "@/components/ms/Panel";
import { TV } from "@/components/ms/TV";
import { getFredSeries } from "@/lib/data.functions";
import { yearsAgo } from "@/lib/hooks";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/economy")({
  head: () => meta("Economy", "US inflation, jobs, GDP, Fed funds, Treasury yield curve, sentiment, housing, retail sales and leading indicators from FRED."),
  component: Economy,
});

const CURVE = [["DGS1MO", "1M"], ["DGS3MO", "3M"], ["DGS6MO", "6M"], ["DGS1", "1Y"], ["DGS2", "2Y"], ["DGS5", "5Y"], ["DGS10", "10Y"], ["DGS30", "30Y"]] as const;

function YieldCurve() {
  const start = yearsAgo(1.1);
  const qs = useQueries({ queries: CURVE.map(([id]) => ({ queryKey: ["fred", id, start], queryFn: () => getFredSeries({ data: { id, start } }), staleTime: 30 * 60_000, retry: 1 })) });
  const loading = qs.some((q) => q.isLoading);
  const ok = qs.every((q) => q.data?.points.length);
  const latestDate = ok ? qs[6]!.data!.points.at(-1)!.date : null;
  const yearAgo = latestDate ? `${Number(latestDate.slice(0, 4)) - 1}${latestDate.slice(4)}` : null;
  const rows = ok ? CURVE.map(([, label], i) => {
    const pts = qs[i]!.data!.points;
    const past = [...pts].reverse().find((p) => p.date <= yearAgo!);
    return { label, now: pts.at(-1)!.value, ago: past?.value ?? null };
  }) : [];
  return (
    <Panel title="Treasury yield curve" kind="historical" className="lg:col-span-2" source="FRED / U.S. Treasury constant-maturity yields (DGS series)" sourceUrl="https://fred.stlouisfed.org/categories/115" updated={qs[0]?.data?.fetchedAt}>
      {loading ? <State kind="loading" /> : !ok ? <State kind="error">One or more Treasury series unavailable from FRED.</State> : (
        <>
          <p className="mb-2 text-xs text-muted-foreground">Latest observation <span className="num">{latestDate}</span> vs ~1 year earlier (<span className="num">{yearAgo}</span>).</p>
          <div className="h-64" role="img" aria-label="Yield curve chart">
            <ResponsiveContainer>
              <LineChart data={rows} margin={{ top: 4, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" />
                <XAxis dataKey="label" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                <YAxis unit="%" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} domain={["auto", "auto"]} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line dataKey="now" name={`Latest (${latestDate})`} stroke="var(--chart-1)" strokeWidth={2} isAnimationActive={false} />
                <Line dataKey="ago" name="~1 year ago" stroke="var(--chart-3)" strokeDasharray="4 3" isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </Panel>
  );
}

function Economy() {
  return (
    <>
      <PageHeader title="Economy" sub="All series fetched from FRED (St. Louis Fed), which republishes BLS, BEA, Federal Reserve, Census, Treasury, University of Michigan and OECD data. Dates are observation periods; open the FRED link on each panel for official release dates and revisions." />
      <div className="grid gap-3 lg:grid-cols-3">
        <YieldCurve />
        <FredChart id="T10Y2Y" title="10Y − 2Y Treasury spread" unit=" pp" years={5} zero note="Below zero = inverted curve." />
        <FredChart id="CPIAUCSL" title="CPI inflation, YoY" t="yoy" unit="%" note="BLS CPI-U, seasonally adjusted; YoY computed as index ÷ index 12 months earlier − 1." />
        <FredChart id="CPILFESL" title="Core CPI (ex food & energy), YoY" t="yoy" unit="%" />
        <FredChart id="PCEPILFE" title="Core PCE price index, YoY" t="yoy" unit="%" note="BEA. The Fed's 2% target is defined on PCE inflation." />
        <FredChart id="UNRATE" title="Unemployment rate" unit="%" />
        <FredChart id="PAYEMS" title="Nonfarm payrolls, monthly change" t="diff" unit="K" years={5} zero note="BLS establishment survey; thousands of jobs." />
        <FredChart id="A191RL1Q225SBEA" title="Real GDP growth (q/q annualized)" unit="%" zero />
        <FredChart id="FEDFUNDS" title="Effective Fed funds rate (monthly)" unit="%" />
        <FredChart id="UMCSENT" title="Consumer sentiment (U. Michigan)" />
        <FredChart id="HOUST" title="Housing starts (thousands, SAAR)" />
        <FredChart id="RSAFS" title="Retail sales, YoY" t="yoy" unit="%" note="Census advance retail & food services, nominal." />
        <FredChart id="INDPRO" title="Industrial production, YoY" t="yoy" unit="%" zero />
        <FredChart id="USALOLITOAASTSAM" title="OECD composite leading indicator (US)" note="100 = long-term trend. Above 100 and rising suggests expansion above trend." />
      </div>
      <Panel className="mt-3" title="Economic calendar (US)" kind="embed" source="TradingView economic calendar — actual / forecast / prior as published by TradingView" sourceUrl="https://www.tradingview.com/economic-calendar/">
        <TV widget="events" height={560} config={{ importanceFilter: "0,1", countryFilter: "us" }} />
      </Panel>
    </>
  );
}