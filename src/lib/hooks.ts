import { useQuery } from "@tanstack/react-query";
import { getCompany, getFredSeries } from "./data.functions";
import { KEYS, useLocal } from "./storage";

export function yearsAgo(n: number) {
  const d = new Date();
  d.setFullYear(d.getFullYear() - n);
  return d.toISOString().slice(0, 10);
}
export function useFred(id: string, years = 10) {
  const start = yearsAgo(years);
  return useQuery({ queryKey: ["fred", id, start], queryFn: () => getFredSeries({ data: { id, start } }), staleTime: 30 * 60_000, retry: 1 });
}
export function useCompany(ticker?: string) {
  return useQuery({
    queryKey: ["company", ticker], enabled: !!ticker, staleTime: 60 * 60_000, retry: 1,
    queryFn: () => getCompany({ data: { ticker: ticker! } }),
  });
}
/** Optional, user-supplied Finnhub key (stored only in this browser). */
export function useQuote(symbol?: string) {
  const [key] = useLocal<string>(KEYS.finnhub, "");
  return useQuery({
    queryKey: ["quote", symbol, !!key], enabled: !!symbol && !!key, staleTime: 60_000, retry: 0,
    queryFn: async () => {
      const r = await fetch(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol!)}&token=${encodeURIComponent(key)}`);
      if (r.status === 429) throw new Error("Finnhub rate limit");
      if (!r.ok) throw new Error(`Finnhub ${r.status}`);
      const j = (await r.json()) as { c: number; pc: number; t: number };
      if (!j.c) throw new Error("No quote");
      return { price: j.c, prevClose: j.pc, time: new Date(j.t * 1000).toISOString() };
    },
  });
}