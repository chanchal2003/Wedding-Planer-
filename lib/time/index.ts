// Times are saved in UTC and shown in India time (CLAUDE.md rule 9).

const INDIA = "Asia/Kolkata";

// Today's date in India as "2027-01-15" (year-month-day).
export function todayInIndia(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: INDIA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

// A plain date from the database (a wedding date has no time), shown as "15 January 2027".
// The date is stored as midnight UTC, so it is read in UTC. India time would not change it.
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

// A last date (the reply-by date, the stay-by date) closes at 23:59 India time on that day
// (CLAUDE.md rule 9). Guests can reply until then. The team is never stopped by it.
// lastDate: "2026-12-31" or a plain date from the database.
export function lastDateClosesAt(lastDate: string | Date): Date {
  const day = typeof lastDate === "string" ? lastDate : lastDate.toISOString().slice(0, 10);
  return new Date(`${day}T23:59:59.999+05:30`);
}

export function isAfterLastDate(lastDate: string | Date, now: Date = new Date()): boolean {
  return now.getTime() > lastDateClosesAt(lastDate).getTime();
}

// Adds days to a plain date: addDays("2027-01-15", -2) is "2027-01-13".
export function addDays(day: string, days: number): string {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

// "2027-01-13" shown as "13 January 2027".
export function formatDay(day: string): string {
  return formatDate(new Date(`${day}T00:00:00Z`));
}
