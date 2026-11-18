import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { parseFredCsv } from "./fred";
import { extractStatements, quarterlySeries, type CompanyFacts } from "./fundamentals";

const SEC_UA = "MarketScope educational research dashboard (contact: marketscope-app@proton.me)";
const cache = new Map<string, { t: number; v: unknown }>();
async function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.t < ttlMs) return hit.v as T;
  const v = await fn();
  cache.set(key, { t: Date.now(), v });
  return v;
}

export const getFredSeries = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().regex(/^[A-Z0-9_]{2,30}$/), start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }).parse(d),
  )
  .handler(async ({ data }) =>
    cached(`fred:${data.id}:${data.start}`, 60 * 60 * 1000, async () => {
      const r = await fetch(`https://fred.stlouisfed.org/graph/fredgraph.csv?id=${data.id}&cosd=${data.start}`);
      if (!r.ok) throw new Error(r.status === 429 ? "FRED rate limit reached — try again shortly" : `FRED responded ${r.status}`);
      return { id: data.id, points: parseFredCsv(await r.text()), fetchedAt: new Date().toISOString() };
    }),
  );

type TickerRow = { cik_str: number; ticker: string; title: string };

export const getCompany = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ ticker: z.string().regex(/^[A-Z]{1,5}([.-][A-Z]{1,2})?$/) }).parse(d))
  .handler(async ({ data }) => {
    const headers = { "User-Agent": SEC_UA, Accept: "application/json" };
    const map = await cached("sec:tickers", 24 * 3600 * 1000, async () => {
      const r = await fetch("https://www.sec.gov/files/company_tickers.json", { headers });
      if (!r.ok) throw new Error(`SEC ticker list responded ${r.status}`);
      const j = (await r.json()) as Record<string, TickerRow>;
      const m: Record<string, TickerRow> = {};
      for (const row of Object.values(j)) m[row.ticker.toUpperCase()] = row;
      return m;
    });
    const row = map[data.ticker] ?? map[data.ticker.replace(".", "-")];
    if (!row) return { found: false as const, ticker: data.ticker };
    return cached(`sec:co:${row.cik_str}`, 6 * 3600 * 1000, async () => {
      const cik = String(row.cik_str).padStart(10, "0");
      const [fr, sr] = await Promise.all([
        fetch(`https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`, { headers }),
        fetch(`https://data.sec.gov/submissions/CIK${cik}.json`, { headers }),
      ]);
      const facts = fr.ok ? ((await fr.json()) as CompanyFacts & { facts?: { dei?: Record<string, { units?: Record<string, { end: string; val: number }[]> }> } }) : null;
      type Sub = { name: string; sicDescription?: string; exchanges?: string[]; fiscalYearEnd?: string; stateOfIncorporation?: string; website?: string;
        filings?: { recent?: { form: string[]; filingDate: string[]; accessionNumber: string[]; primaryDocument: string[]; primaryDocDescription: string[] } } };
      const sub = sr.ok ? ((await sr.json()) as Sub) : null;
      const rec = sub?.filings?.recent;
      const filings = rec
        ? rec.form.slice(0, 200).map((form, i) => ({
            form, date: rec.filingDate[i], desc: rec.primaryDocDescription[i] || form,
            url: `https://www.sec.gov/Archives/edgar/data/${row.cik_str}/${(rec.accessionNumber[i] ?? "").replace(/-/g, "")}/${rec.primaryDocument[i]}`,
          }))
        : [];
      const sharesArr = facts?.facts?.dei?.["EntityCommonStockSharesOutstanding"]?.units?.["shares"] ?? [];
      const shares = [...sharesArr].sort((a, b) => a.end.localeCompare(b.end)).at(-1) ?? null;
      return {
        found: true as const,
        ticker: row.ticker, cik: row.cik_str, name: sub?.name ?? row.title,
        sic: sub?.sicDescription ?? null, exchanges: sub?.exchanges ?? [], fiscalYearEnd: sub?.fiscalYearEnd ?? null,
        state: sub?.stateOfIncorporation ?? null,
        statements: facts ? extractStatements(facts) : null,
        quarterlyEps: facts ? quarterlySeries(facts, "EarningsPerShareDiluted", "USD/shares") : [],
        quarterlyRevenue: facts ? quarterlySeries(facts, "RevenueFromContractWithCustomerExcludingAssessedTax", "USD") : [],
        shares: shares ? { val: shares.val, asOf: shares.end } : null,
        filings: filings.filter((f) => f.form !== "4").slice(0, 30),
        insider: filings.filter((f) => f.form === "4").slice(0, 15),
        edgarUrl: `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${cik}`,
        fetchedAt: new Date().toISOString(),
      };
    });
  });