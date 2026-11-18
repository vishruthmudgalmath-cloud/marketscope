export type Txn = { id: string; symbol: string; side: "buy" | "sell"; date: string; qty: number; price: number; fee: number };
export type Holding = { symbol: string; qty: number; costBasis: number; avgCost: number; realized: number };

/** Average-cost method. Buy fees add to cost basis; sell fees reduce proceeds. */
export function computeHoldings(txns: Txn[]): { holdings: Holding[]; realizedTotal: number; errors: string[] } {
  const map = new Map<string, Holding>();
  const errors: string[] = [];
  const sorted = [...txns].sort((a, b) => a.date.localeCompare(b.date));
  for (const t of sorted) {
    const h = map.get(t.symbol) ?? { symbol: t.symbol, qty: 0, costBasis: 0, avgCost: 0, realized: 0 };
    if (t.side === "buy") {
      h.costBasis += t.qty * t.price + t.fee;
      h.qty += t.qty;
    } else {
      if (t.qty > h.qty + 1e-9) {
        errors.push(`${t.symbol}: sell of ${t.qty} on ${t.date} exceeds ${h.qty} held — ignored`);
        continue;
      }
      const avg = h.qty ? h.costBasis / h.qty : 0;
      h.realized += t.qty * t.price - t.fee - avg * t.qty;
      h.costBasis -= avg * t.qty;
      h.qty -= t.qty;
    }
    h.avgCost = h.qty > 0 ? h.costBasis / h.qty : 0;
    map.set(t.symbol, h);
  }
  const all = [...map.values()];
  return { holdings: all.filter((h) => h.qty > 1e-9), realizedTotal: all.reduce((s, h) => s + h.realized, 0), errors };
}