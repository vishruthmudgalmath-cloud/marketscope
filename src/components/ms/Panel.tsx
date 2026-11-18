import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type Kind = "live" | "delayed" | "eod" | "historical" | "embed" | "calc" | "local" | "rules";
const KIND: Record<Kind, string> = {
  live: "Live fetch", delayed: "Delayed", eod: "End of day", historical: "Historical", embed: "Embed",
  calc: "Calculated", local: "Stored locally", rules: "Rules-based",
};
export function Badge({ kind }: { kind: Kind }) {
  return <span className="rounded-sm border border-primary/40 bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">{KIND[kind]}</span>;
}
export function Panel({ title, kind, source, sourceUrl, updated, actions, children, className }: {
  title: string; kind?: Kind; source?: string; sourceUrl?: string; updated?: string | null | undefined; actions?: ReactNode; children: ReactNode; className?: string;
}) {
  return (
    <section className={cn("panel flex min-w-0 flex-col", className)} aria-label={title}>
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">{title}</h2>
          {kind && <Badge kind={kind} />}
        </div>
        {actions}
      </header>
      <div className="flex-1 p-3">{children}</div>
      {(source || updated) && (
        <footer className="flex flex-wrap justify-between gap-2 border-t border-border px-3 py-1.5 text-[11px] text-muted-foreground">
          <span>Source:{" "}{sourceUrl ? <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">{source}</a> : source}</span>
          {updated && <span className="num">Retrieved {new Date(updated).toLocaleString()}</span>}
        </footer>
      )}
    </section>
  );
}
export function State({ kind, children }: { kind: "loading" | "error" | "empty"; children?: ReactNode }) {
  return (
    <div role={kind === "error" ? "alert" : "status"} className={cn("flex min-h-24 items-center justify-center rounded border border-dashed border-border p-4 text-center text-sm",
      kind === "error" ? "text-warn" : "text-muted-foreground", kind === "loading" && "animate-pulse")}>
      {children ?? (kind === "loading" ? "Loading…" : kind === "error" ? "Source unavailable." : "No data.")}
    </div>
  );
}
export function PageHeader({ title, sub, children }: { title: string; sub?: string; children?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {sub && <p className="mt-0.5 max-w-3xl text-sm text-muted-foreground">{sub}</p>}
      </div>
      {children}
    </div>
  );
}