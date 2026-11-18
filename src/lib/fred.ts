export type Obs = { date: string; value: number };
export function parseFredCsv(csv: string): Obs[] {
  const out: Obs[] = [];
  for (const line of csv.trim().split(/\r?\n/).slice(1)) {
    const [date, raw] = line.split(",");
    const value = Number(raw);
    if (date && raw && raw !== "." && isFinite(value)) out.push({ date, value });
  }
  return out;
}
/** Percent change vs `lag` observations earlier (12 for monthly YoY, 4 for quarterly). */
export function pctChange(obs: Obs[], lag: number): Obs[] {
  return obs.slice(lag).map((o, i) => ({ date: o.date, value: (o.value / obs[i]!.value - 1) * 100 }));
}
export function diff(obs: Obs[]): Obs[] {
  return obs.slice(1).map((o, i) => ({ date: o.date, value: o.value - obs[i]!.value }));
}