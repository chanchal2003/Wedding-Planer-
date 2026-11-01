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

// The month and year of a wedding date, for the link preview: "January 2027".
export function formatMonthYear(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", { timeZone: "UTC", month: "long", year: "numeric" }).format(date);
}

// An event moment in India time, for the guest page: "12 January" and "10:00 am".
export function formatEventDate(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", { timeZone: INDIA, day: "numeric", month: "long" }).format(date);
}
export function formatEventTime(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", { timeZone: INDIA, hour: "numeric", minute: "2-digit", hour12: true }).format(date);
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

// ---- A date and a time typed in India time (for example an event) ----

// "2027-01-12" and "10:00" typed in India become the exact moment (saved in UTC, rule 9).
export function parseIndiaDateTime(day: string, time: string): Date {
  return new Date(`${day}T${time}:00+05:30`);
}

// The moment as the two values of the form fields: { day: "2027-01-12", time: "10:00" } in India time.
export function indiaParts(date: Date): { day: string; time: string } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: INDIA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return { day: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour")}:${get("minute")}` };
}

// "12 January 2027, 10:00 am" in India time.
export function formatDateTime(date: Date): string {
  const day = new Intl.DateTimeFormat("en-IN", { timeZone: INDIA, day: "numeric", month: "long", year: "numeric" }).format(date);
  const time = new Intl.DateTimeFormat("en-IN", { timeZone: INDIA, hour: "numeric", minute: "2-digit", hour12: true }).format(date);
  return `${day}, ${time}`;
}
