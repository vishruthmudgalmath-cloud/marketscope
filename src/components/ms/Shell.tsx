import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Activity, BarChart3, BookOpen, Briefcase, Building2, FlaskConical, Grid3x3, Landmark, LayoutDashboard, Menu, Newspaper, Scale, Search, Settings, X } from "lucide-react";
import { marketSession, type Session } from "@/lib/session";
import { TICKER_RE, normTicker } from "@/lib/format";
import { cn } from "@/lib/utils";

export const NAV = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/markets", label: "Markets", icon: BarChart3 },
  { to: "/economy", label: "Economy", icon: Landmark },
  { to: "/sectors", label: "Sectors", icon: Grid3x3 },
  { to: "/news", label: "News & Catalysts", icon: Newspaper },
  { to: "/company", label: "Company Research", icon: Building2 },
  { to: "/compare", label: "Compare", icon: Scale },
  { to: "/portfolio", label: "Portfolio", icon: Briefcase },
  { to: "/lab", label: "Analysis Lab", icon: FlaskConical },
  { to: "/learn", label: "Learn & Methodology", icon: BookOpen },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function NavList({ onNav }: { onNav?: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav aria-label="Main" className="flex flex-col gap-0.5 p-2">
      {NAV.map((n) => {
        const active = n.to === "/" ? path === "/" : path.startsWith(n.to);
        return (
          <Link key={n.to} to={n.to} onClick={onNav} aria-current={active ? "page" : undefined}
            className={cn("flex items-center gap-2.5 rounded px-2.5 py-2 text-sm transition-colors",
              active ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_2px_0_0_var(--primary)]" : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground")}>
            <n.icon className={cn("h-4 w-4", active && "text-primary")} aria-hidden />
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}

const SESSION_CLS: Record<Session, string> = { Open: "bg-up", "Pre-market": "bg-warn", "After-hours": "bg-warn", Closed: "bg-down" };

function SessionPill() {
  const [s, setS] = useState<ReturnType<typeof marketSession> | null>(null);
  useEffect(() => { const t = () => setS(marketSession(new Date())); t(); const i = setInterval(t, 30_000); return () => clearInterval(i); }, []);
  if (!s) return <span className="h-5 w-40" />;
  return (
    <span className="flex items-center gap-2 text-xs" title="NYSE regular session 09:30–16:00 ET; holidays included, early closes not modeled">
      <span className={cn("h-2 w-2 rounded-full", SESSION_CLS[s.session])} aria-hidden />
      <span className="font-medium">US market: {s.session}</span>
      <span className="num hidden text-muted-foreground sm:inline">{s.etDate} {s.etTime}</span>
    </span>
  );
}

function GlobalSearch() {
  const nav = useNavigate();
  const [v, setV] = useState("");
  const [err, setErr] = useState(false);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const t = normTicker(v);
    if (!TICKER_RE.test(t)) { setErr(true); return; }
    setErr(false); setV("");
    nav({ to: "/company", search: { t } });
  };
  return (
    <form onSubmit={submit} role="search" className="relative w-full max-w-xs">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <input aria-label="Search ticker" aria-invalid={err} value={v} onChange={(e) => { setV(e.target.value); setErr(false); }} placeholder="Ticker (e.g. MSFT) ↵"
        className={cn("num h-8 w-full rounded border bg-input/40 pl-8 pr-2 text-sm uppercase placeholder:normal-case placeholder:text-muted-foreground focus:border-primary focus:outline-none", err ? "border-destructive" : "border-border")} />
    </form>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-h-screen w-full">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-primary focus:p-2 focus:text-primary-foreground">Skip to content</a>
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <Brand />
        <NavList />
        <p className="mt-auto p-3 text-[10px] leading-relaxed text-muted-foreground">Educational information only — not financial advice.</p>
      </aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <button className="absolute inset-0 bg-background/80" aria-label="Close menu" onClick={() => setOpen(false)} />
          <aside className="relative h-full w-64 overflow-y-auto border-r border-sidebar-border bg-sidebar">
            <div className="flex items-center justify-between pr-2"><Brand /><button aria-label="Close menu" onClick={() => setOpen(false)} className="p-2"><X className="h-4 w-4" /></button></div>
            <NavList onNav={() => setOpen(false)} />
          </aside>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-12 items-center gap-3 border-b border-border bg-background/90 px-3 backdrop-blur">
          <button className="rounded p-1.5 hover:bg-muted lg:hidden" aria-label="Open menu" onClick={() => setOpen(true)}><Menu className="h-5 w-5" /></button>
          <GlobalSearch />
          <div className="ml-auto flex items-center gap-3">
            <SessionPill />
            <Link to="/settings" aria-label="Settings" className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"><Settings className="h-4 w-4" /></Link>
          </div>
        </header>
        <main id="main" className="flex-1 p-3 md:p-5">{children}</main>
        <footer className="border-t border-border px-5 py-4 text-[11px] text-muted-foreground">
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <span className="font-semibold text-foreground">MarketScope</span>
            <Link to="/learn" className="hover:text-primary">About & methodology</Link>
            <a className="hover:text-primary" href="https://fred.stlouisfed.org/" target="_blank" rel="noopener noreferrer">FRED</a>
            <a className="hover:text-primary" href="https://www.sec.gov/edgar" target="_blank" rel="noopener noreferrer">SEC EDGAR</a>
            <a className="hover:text-primary" href="https://www.tradingview.com/" target="_blank" rel="noopener noreferrer">TradingView widgets</a>
          </div>
          <p className="mt-2 max-w-4xl">For education and information only. Nothing here is investment advice or a recommendation to buy or sell any security. Market data may be delayed; verify with official sources before acting.</p>
        </footer>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2 px-4 py-3.5">
      <Activity className="h-5 w-5 text-primary" aria-hidden />
      <span className="font-semibold tracking-tight">Market<span className="text-primary">Scope</span></span>
    </Link>
  );
}