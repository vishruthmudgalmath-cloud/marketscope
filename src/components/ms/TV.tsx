import { useEffect, useRef, useState } from "react";

/** TradingView public embed widget. Data and display are provided by TradingView under its widget terms. */
export function TV({ widget, config, height = 400, label }: { widget: string; config: Record<string, unknown>; height?: number; label?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const cfg = JSON.stringify(config);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setFailed(false);
    el.innerHTML = '<div class="tradingview-widget-container__widget" style="height:100%;width:100%"></div>';
    const s = document.createElement("script");
    s.src = `https://s3.tradingview.com/external-embedding/embed-widget-${widget}.js`;
    s.async = true;
    s.type = "text/javascript";
    s.onerror = () => setFailed(true);
    s.innerHTML = JSON.stringify({ colorTheme: "dark", isTransparent: true, locale: "en", width: "100%", height: "100%", ...JSON.parse(cfg) });
    el.appendChild(s);
    return () => { el.innerHTML = ""; };
  }, [widget, cfg]);
  return (
    <div>
      <div ref={ref} className="tradingview-widget-container w-full" style={{ height }} aria-label={label ?? `TradingView ${widget} widget`} />
      {failed && <p className="p-3 text-sm text-warn">TradingView widget could not load (blocked or offline). The rest of the page still works.</p>}
      <p className="mt-1 text-[11px] text-muted-foreground">
        Widget & data by{" "}
        <a className="underline hover:text-primary" href="https://www.tradingview.com/" target="_blank" rel="noopener noreferrer">TradingView</a>
        {" "}· quotes typically delayed per exchange rules
      </p>
    </div>
  );
}