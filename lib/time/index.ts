// Times are saved in UTC and shown in India time (CLAUDE.md rule 9). Plan step 5.3 adds
// the last-date helper ("is it after 23:59 India time?") to this file.

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
