// NYSE full-day closures (published exchange calendar). Early closes are not modeled.
export const NYSE_HOLIDAYS = new Set([
  "2026-01-01","2026-01-19","2026-02-16","2026-04-03","2026-05-25","2026-06-19","2026-07-03","2026-09-07","2026-11-26","2026-12-25",
  "2027-01-01","2027-01-18","2027-02-15","2027-03-26","2027-05-31","2027-06-18","2027-07-05","2027-09-06","2027-11-25","2027-12-24",
]);
export type Session = "Pre-market" | "Open" | "After-hours" | "Closed";

export function marketSession(now: Date): { session: Session; etDate: string; etTime: string } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", weekday: "short", hour12: false,
  }).formatToParts(now);
  const g = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const etDate = `${g("year")}-${g("month")}-${g("day")}`;
  const h = Number(g("hour")) % 24;
  const mins = h * 60 + Number(g("minute"));
  const etTime = `${String(h).padStart(2, "0")}:${g("minute")} ET`;
  if (g("weekday") === "Sat" || g("weekday") === "Sun" || NYSE_HOLIDAYS.has(etDate)) return { session: "Closed", etDate, etTime };
  const session: Session = mins >= 570 && mins < 960 ? "Open" : mins >= 240 && mins < 570 ? "Pre-market" : mins >= 960 && mins < 1200 ? "After-hours" : "Closed";
  return { session, etDate, etTime };
}