import type { Ratios } from "./fundamentals";

// Rules-based (deterministic) scorecard. Thresholds are deliberately simple and visible.
export type RuleResult = { id: string; group: string; label: string; rule: string; value: number | null; pass: boolean | null };

export const COMPANY_RULES: { id: string; group: string; label: string; rule: string; key: keyof Ratios; test: (v: number) => boolean }[] = [
  { id: "gm", group: "Profitability", label: "Gross margin", rule: "≥ 40%", key: "grossMargin", test: (v) => v >= 0.4 },
  { id: "om", group: "Profitability", label: "Operating margin", rule: "≥ 15%", key: "operatingMargin", test: (v) => v >= 0.15 },
  { id: "roe", group: "Profitability", label: "Return on equity", rule: "≥ 15%", key: "roe", test: (v) => v >= 0.15 },
  { id: "rg", group: "Growth", label: "Revenue growth (YoY)", rule: "≥ 5%", key: "revenueGrowth", test: (v) => v >= 0.05 },
  { id: "cagr", group: "Growth", label: "Revenue CAGR (3y)", rule: "≥ 5%", key: "revenueCagr3y", test: (v) => v >= 0.05 },
  { id: "eps", group: "Growth", label: "Diluted EPS growth", rule: "> 0%", key: "epsGrowth", test: (v) => v > 0 },
  { id: "de", group: "Balance sheet", label: "LT debt / equity", rule: "≤ 1.0×", key: "debtToEquity", test: (v) => v >= 0 && v <= 1 },
  { id: "cr", group: "Balance sheet", label: "Current ratio", rule: "≥ 1.0×", key: "currentRatio", test: (v) => v >= 1 },
  { id: "fcf", group: "Cash flow", label: "FCF margin", rule: "≥ 5%", key: "fcfMargin", test: (v) => v >= 0.05 },
];

export function scoreCompany(r: Ratios) {
  const results: RuleResult[] = COMPANY_RULES.map((x) => {
    const v = r[x.key];
    return { id: x.id, group: x.group, label: x.label, rule: x.rule, value: v, pass: v == null ? null : x.test(v) };
  });
  const evaluated = results.filter((x) => x.pass !== null);
  const passed = evaluated.filter((x) => x.pass).length;
  return { results, passed, evaluated: evaluated.length, score: evaluated.length ? Math.round((passed / evaluated.length) * 100) : null };
}

export type MacroInputs = { curve10y2y: number | null; unemploymentNow: number | null; unemployment12mLow: number | null; cpiYoY: number | null };

export function macroSignals(m: MacroInputs) {
  return [
    { label: "Yield curve (10Y−2Y)", rule: "Inverted when < 0 pp — historically preceded several recessions", value: m.curve10y2y,
      flag: m.curve10y2y == null ? null : m.curve10y2y < 0 },
    { label: "Unemployment vs 12-month low", rule: "Caution when rate is ≥ 0.5 pp above its 12-month low (Sahm-style, simplified)",
      value: m.unemploymentNow != null && m.unemployment12mLow != null ? m.unemploymentNow - m.unemployment12mLow : null,
      flag: m.unemploymentNow == null || m.unemployment12mLow == null ? null : m.unemploymentNow - m.unemployment12mLow >= 0.5 },
    { label: "CPI inflation (YoY)", rule: "Elevated when > 3% (Fed target is 2% on PCE)", value: m.cpiYoY, flag: m.cpiYoY == null ? null : m.cpiYoY > 3 },
  ];
}

export type Scenario = { name: string; revGrowth: number; netMargin: number; pe: number; probability: number };

/** Implied per-share value after `years`: revenue × (1+g)^n × margin × P/E ÷ shares. */
export function impliedValue(revenue: number, shares: number, s: Scenario, years = 3) {
  if (!(revenue > 0) || !(shares > 0)) return null;
  return (revenue * Math.pow(1 + s.revGrowth / 100, years) * (s.netMargin / 100) * s.pe) / shares;
}