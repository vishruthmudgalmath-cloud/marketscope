// Symbol lists for TradingView embeds. Index levels are shown via liquid ETF proxies (labelled as such)
// because broad index feeds are licensed separately.
export const SNAPSHOT_TABS = [
  { title: "Indices (ETF proxies)", symbols: [
    { s: "AMEX:SPY", d: "S&P 500 · SPY" }, { s: "NASDAQ:QQQ", d: "Nasdaq-100 · QQQ" },
    { s: "AMEX:DIA", d: "Dow 30 · DIA" }, { s: "AMEX:IWM", d: "Russell 2000 · IWM" } ] },
  { title: "Rates & Vol", symbols: [
    { s: "TVC:US10Y", d: "US 10Y yield" }, { s: "TVC:US02Y", d: "US 2Y yield" }, { s: "TVC:US30Y", d: "US 30Y yield" }, { s: "TVC:VIX", d: "Cboe VIX" } ] },
  { title: "Dollar & Commodities", symbols: [
    { s: "TVC:DXY", d: "US Dollar Index" }, { s: "TVC:GOLD", d: "Gold" }, { s: "TVC:USOIL", d: "WTI crude" }, { s: "TVC:SILVER", d: "Silver" } ] },
  { title: "Crypto", symbols: [{ s: "BITSTAMP:BTCUSD", d: "Bitcoin" }, { s: "BITSTAMP:ETHUSD", d: "Ether" }] },
];
export const SECTORS = [
  ["XLK", "Technology"], ["XLF", "Financials"], ["XLV", "Health Care"], ["XLY", "Cons. Discretionary"], ["XLP", "Cons. Staples"],
  ["XLE", "Energy"], ["XLI", "Industrials"], ["XLB", "Materials"], ["XLU", "Utilities"], ["XLRE", "Real Estate"], ["XLC", "Communication"],
] as const;
export const tvSym = (t: string) => t.replace("-", ".");