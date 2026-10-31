import { z } from "zod";
import { EVENT_TYPE_VALUES, HOSTED_BY_VALUES } from "@/lib/events";
import { formatDay } from "@/lib/time";

// What a person types in the event form (FR-5). The same checks run on the server.
// The note is only for the team for now (UI design, 6.2). The budget comes with the Money release.

function isRealDate(value: string): boolean {
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Use at most ${max} letters.`)
    .transform((value) => (value === "" ? null : value));

// A map link must be a web address (http or https), never something like javascript:.
const optionalMapLink = z
  .string()
  .trim()
  .max(500, "Use at most 500 letters.")
  .refine((value) => {
    if (value === "") return true;
    try {
      const url = new URL(value);
      return url.protocol === "https:" || url.protocol === "http:";
    } catch {
      return false;
    }
  }, "Paste a web address, for example a link from Google Maps.")
  .transform((value) => (value === "" ? null : value));

export type EventSchemaContext = {
  today: string; // today in India, "2026-10-31"
  weddingDay: string; // the wedding date, "2027-01-15": no event can be after it
  // The day that is saved now ("" when the event is new). A saved day that has passed is not
  // refused again, so the note of a past event can still be changed. The "before today" rule is
  // only for a new day.
  savedDay: string;
};

export function makeEventSchema(context: EventSchemaContext) {
  return z
    .object({
      type: z.enum(EVENT_TYPE_VALUES, { error: "Choose the type of the event." }),
      name: z.string().trim().min(1, "Type the name of the event.").max(80, "Use at most 80 letters."),
      day: z.string().refine((value) => /^\d{4}-\d{2}-\d{2}$/.test(value) && isRealDate(value), "Choose the date."),
      time: z.string().refine((value) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value), "Choose the start time."),
      venueName: optionalText(120),
      mapLink: optionalMapLink,
      note: optionalText(500),
      hostedBy: z.enum(HOSTED_BY_VALUES, { error: "Choose who hosts the event." }),
    })
    .superRefine((value, ctx) => {
      const real = /^\d{4}-\d{2}-\d{2}$/.test(value.day) && isRealDate(value.day);
      if (real && value.day !== context.savedDay && value.day < context.today) {
        ctx.addIssue({ code: "custom", path: ["day"], message: "The date cannot be before today." });
      } else if (real && value.day > context.weddingDay) {
        // Every event is between today and the wedding date (decided 2026-10-31).
        ctx.addIssue({
          code: "custom",
          path: ["day"],
          message: `The date cannot be after the wedding date (${formatDay(context.weddingDay)}).`,
        });
      }
    });
}

export type EventInput = z.input<ReturnType<typeof makeEventSchema>>;
