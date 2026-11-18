import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, ReferenceLine } from "recharts";
import { useFred } from "@/lib/hooks";
import { diff, pctChange, type Obs } from "@/lib/fred";
import { Panel, State } from "./Panel";
import { cn } from "@/lib/utils";

export type Transform = "level" | "yoy" | "yoyq" | "diff";
export function transform(points: Obs[], t: Transform) {
  return t === "yoy" ? pctChange(points, 12) : t === "yoyq" ? pctChange(points, 4) : t === "diff" ? diff(points) : points;
}
const fredUrl = (id: string) => `https://fred.stlouisfed.org/series/${id}`;

export function FredKpi({ id, label, t = "level", unit = "", years = 3, digits = 2 }: { id: string; label: string; t?: Transform; unit?: string; years?: number; digits?: number }) {
  const q = useFred(id, years);
  const pts = q.data ? transform(q.data.points, t) : [];
  const last = pts.at(-1), prev = pts.at(-2);
  const ch = last && prev ? last.value - prev.value : null;
  return (
    <a href={fredUrl(id)} target="_blank" rel="noopener noreferrer" className="panel block p-3 transition-colors hover:border-primary/60">
      <div className="eyebrow">{label}</div>
      {q.isLoading ? <div className="mt-2 h-6 w-20 animate-pulse rounded bg-muted" /> : q.isError || !last ? (
        <div className="mt-1 text-sm text-warn">Unavailable</div>
      ) : (
        <>
          <div className="num mt-1 text-xl font-semibold">{last.value.toFixed(digits)}{unit}</div>
          <div className="num mt-0.5 flex justify-between text-[11px] text-muted-foreground">
            <span>obs {last.date}</span>
            {ch != null && <span className={cn(ch > 0 ? "text-up" : ch < 0 ? "text-down" : "")}>{ch > 0 ? "+" : ""}{ch.toFixed(digits)}</span>}
          </div>
        </>
      )}
      <div className="mt-1 text-[10px] text-muted-foreground">FRED · {id}</div>
    </a>
  );
}

export function FredChart({ id, title, t = "level", unit = "", years = 10, note, zero }: { id: string; title: string; t?: Transform; unit?: string; years?: number; note?: string; zero?: boolean }) {
  const q = useFred(id, years);
  const pts = q.data ? transform(q.data.points, t) : [];
  const last = pts.at(-1), prev = pts.at(-2);
  return (
    <Panel title={title} kind="historical" source={`FRED, Federal Reserve Bank of St. Louis — ${id}`} sourceUrl={fredUrl(id)} updated={q.data?.fetchedAt}>
      {q.isLoading ? <State kind="loading" /> : q.isError ? <State kind="error">{(q.error as Error).message || "FRED unavailable"}</State> : !pts.length ? <State kind="empty" /> : (
        <>
          <dl className="mb-2 grid grid-cols-3 gap-2 text-xs">
            <div><dt className="eyebrow">Latest</dt><dd className="num text-base font-semibold">{last!.value.toFixed(2)}{unit}</dd></div>
            <div><dt className="eyebrow">Prior</dt><dd className="num text-base">{prev ? `${prev.value.toFixed(2)}${unit}` : "—"}</dd></div>
            <div><dt className="eyebrow">Observation</dt><dd className="num text-base">{last!.date}</dd></div>
          </dl>
          <div className="h-44" role="img" aria-label={`${title} chart`}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={pts} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" />
                <XAxis dataKey="date" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} minTickGap={40} tickFormatter={(d: string) => d.slice(0, 7)} />
                <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} domain={["auto", "auto"]} width={48} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", fontSize: 12 }} formatter={(v: number) => [`${v.toFixed(2)}${unit}`, title]} />
                {zero && <ReferenceLine y={0} stroke="var(--warn)" strokeDasharray="3 3" />}
                <Line type="monotone" dataKey="value" stroke="var(--chart-1)" dot={false} strokeWidth={1.6} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {note && <p className="mt-2 text-[11px] text-muted-foreground">{note}</p>}
        </>
      )}
    </Panel>
  );
}