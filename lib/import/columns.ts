// The columns of the guest list file (PRD FR-16). The template, the sample files and the import
// (step 6.3) all use this file, so the names of the columns are the same everywhere.
// The import reads the header names without caring about capital letters or extra spaces.

export const FIXED_HEADERS = {
  familyName: "Family name",
  contactName: "Contact name",
  city: "City",
  primaryPhone: "Main number",
  secondaryPhone: "Second number",
  side: "Side",
  organizerEmail: "Organizer email",
  notes: "Notes",
} as const;

export type FixedKey = keyof typeof FIXED_HEADERS;

export type ColumnInfo = {
  header: string;
  key: FixedKey | "event";
  eventId?: string; // for an event column
  required: boolean;
  width: number;
  help: string; // plain words for the "How to fill" sheet
  example: string;
};

type EventForColumn = { id: string; name: string; startsAt: Date };

// One column for each event of the wedding. If two events have the same name, the date is added
// to the header ("Haldi (12 Jan)"), so every header is different.
export function eventHeaders(events: EventForColumn[]): string[] {
  const count = new Map<string, number>();
  for (const event of events) count.set(event.name, (count.get(event.name) ?? 0) + 1);
  return events.map((event) => {
    if ((count.get(event.name) ?? 0) < 2) return event.name;
    const day = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short" }).format(event.startsAt);
    return `${event.name} (${day})`;
  });
}

// All the columns, in the order of the file: the family, the numbers, the side, the events, the
// organizer, the notes.
export function importColumns(events: EventForColumn[]): ColumnInfo[] {
  const fixed = (key: FixedKey, info: Omit<ColumnInfo, "header" | "key">): ColumnInfo => ({ header: FIXED_HEADERS[key], key, ...info });
  const headers = eventHeaders(events);

  return [
    fixed("familyName", { required: true, width: 28, help: "The name of the family, for example Sharma family.", example: "Sharma family" }),
    fixed("contactName", { required: false, width: 22, help: "Who we speak to. It helps to tell two Sharma families apart.", example: "Meena" }),
    fixed("city", { required: false, width: 18, help: "The city of the family.", example: "Jaipur" }),
    fixed("primaryPhone", { required: false, width: 20, help: "The main phone number. You can write it in any way: 98765 11111, 09876511111 or +91 98765-11111. A family with no number is allowed.", example: "98765 11111" }),
    fixed("secondaryPhone", { required: false, width: 20, help: "A second number. It needs a main number.", example: "98765 22222" }),
    fixed("side", { required: false, width: 14, help: "Bride, Groom or Both. If you leave it empty, the family goes to Both sides.", example: "Groom" }),
    ...events.map((event, index): ColumnInfo => ({
      header: headers[index],
      key: "event",
      eventId: event.id,
      required: false,
      width: 14,
      help: `Write yes if the family is invited to ${event.name}. Write no or leave it empty if not. Every family needs at least one yes.`,
      example: index === 0 ? "yes" : "no",
    })),
    fixed("organizerEmail", { required: false, width: 28, help: "The email of the team member who looks after this family. It must be a person of your team. A name does not work.", example: "rohan@example.com" }),
    fixed("notes", { required: false, width: 30, help: "Anything the team should know.", example: "Needs a ground floor room" }),
  ];
}
