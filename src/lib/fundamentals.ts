// Pure helpers that turn SEC EDGAR "companyfacts" XBRL into annual/quarterly series and
// derived ratios. Every ratio is a formula on reported values; nothing is estimated.
export type Fact = { end: string; val: number; frame?: string; form?: string };
export type Point = { year: number; val: number };
export type CompanyFacts = {
  facts?: Record<string, Record<string, { units?: Record<string, Fact[]> }>>;
};

const FLOW = /^CY(\d{4})$/;
const INSTANT = /^CY(\d{4})Q4I$/;

export function annualSeries(
  cf: CompanyFacts,
  concepts: string[],
  unit = "USD",
  instant = false,
  taxonomy = "us-gaap",
): Point[] {
  const byYear = new Map<number, number>();
  for (const c of concepts) {
    const arr = cf.facts?.[taxonomy]?.[c]?.units?.[unit];
    if (!arr) continue;
    for (const f of arr) {
      const m = f.frame?.match(instant ? INSTANT : FLOW);
      if (!m) continue;
      const y = Number(m[1]);
      if (!byYear.has(y)) byYear.set(y, f.val);
    }
  }
  return [...byYear.entries()]
    .map(([year, val]) => ({ year, val }))
    .sort((a, b) => a.year - b.year)
    .slice(-6);
}

export function quarterlySeries(cf: CompanyFacts, concept: string, unit: string) {
  const arr = cf.facts?.["us-gaap"]?.[concept]?.units?.[unit] ?? [];
  const out: { period: string; end: string; val: number }[] = [];
  for (const f of arr) {
    const m = f.frame?.match(/^CY(\d{4})Q([1-4])$/);
    if (m) out.push({ period: `${m[1]} Q${m[2]}`, end: f.end, val: f.val });
  }
  return out.sort((a, b) => a.end.localeCompare(b.end)).slice(-12);
}

export const CONCEPTS = {
  revenue: ["Revenues", "RevenueFromContractWithCustomerExcludingAssessedTax", "SalesRevenueNet"],
  grossProfit: ["GrossProfit"],
  operatingIncome: ["OperatingIncomeLoss"],
  netIncome: ["NetIncomeLoss"],
  operatingCashFlow: ["NetCashProvidedByUsedInOperatingActivities"],
  capex: ["PaymentsToAcquirePropertyPlantAndEquipment"],
  assets: ["Assets"],
  liabilities: ["Liabilities"],
  equity: ["StockholdersEquity", "StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest"],
  cash: ["CashAndCashEquivalentsAtCarryingValue"],
  longTermDebt: ["LongTermDebtNoncurrent", "LongTermDebt"],
  currentAssets: ["AssetsCurrent"],
  currentLiabilities: ["LiabilitiesCurrent"],
} as const;
const INSTANT_KEYS = new Set(["assets", "liabilities", "equity", "cash", "longTermDebt", "currentAssets", "currentLiabilities"]);

export type Statements = Record<keyof typeof CONCEPTS, Point[]> & { epsDiluted: Point[] };

export function extractStatements(cf: CompanyFacts): Statements {
  const out = {} as Statements;
  for (const [k, c] of Object.entries(CONCEPTS)) {
    out[k as keyof typeof CONCEPTS] = annualSeries(cf, [...c], "USD", INSTANT_KEYS.has(k));
  }
  out.epsDiluted = annualSeries(cf, ["EarningsPerShareDiluted"], "USD/shares");
  return out;
}

const latest = (p: Point[]) => p.at(-1);
const at = (p: Point[], year?: number) => (year == null ? undefined : p.find((x) => x.year === year)?.val);
const div = (a?: number, b?: number) => (a == null || b == null || b === 0 ? null : a / b);

export type Ratios = {
  fiscalYear: number | null;
  grossMargin: number | null;
  operatingMargin: number | null;
  netMargin: number | null;
  roe: number | null;
  debtToEquity: number | null;
  currentRatio: number | null;
  freeCashFlow: number | null;
  fcfMargin: number | null;
  revenueGrowth: number | null;
  revenueCagr3y: number | null;
  epsGrowth: number | null;
};

export function computeRatios(s: Statements): Ratios {
  const y = latest(s.revenue)?.year ?? latest(s.netIncome)?.year ?? null;
  const rev = at(s.revenue, y ?? undefined);
  const ocf = at(s.operatingCashFlow, y ?? undefined);
  const capex = at(s.capex, y ?? undefined);
  const fcf = ocf != null && capex != null ? ocf - capex : null;
  const yy = y ?? undefined;
  const prevRev = y != null ? at(s.revenue, y - 1) : undefined;
  const rev3 = y != null ? at(s.revenue, y - 3) : undefined;
  const eps = at(s.epsDiluted, yy);
  const prevEps = y != null ? at(s.epsDiluted, y - 1) : undefined;
  return {
    fiscalYear: y,
    grossMargin: div(at(s.grossProfit, yy), rev),
    operatingMargin: div(at(s.operatingIncome, yy), rev),
    netMargin: div(at(s.netIncome, yy), rev),
    roe: div(at(s.netIncome, yy), at(s.equity, yy)),
    debtToEquity: div(at(s.longTermDebt, yy), at(s.equity, yy)),
    currentRatio: div(at(s.currentAssets, yy), at(s.currentLiabilities, yy)),
    freeCashFlow: fcf,
    fcfMargin: div(fcf ?? undefined, rev),
    revenueGrowth: rev != null && prevRev ? rev / prevRev - 1 : null,
    revenueCagr3y: rev != null && rev3 && rev3 > 0 && rev > 0 ? Math.pow(rev / rev3, 1 / 3) - 1 : null,
    epsGrowth: eps != null && prevEps && prevEps > 0 ? eps / prevEps - 1 : null,
  };
}