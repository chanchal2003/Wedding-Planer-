import { z } from "zod";
import { THEME_NAMES } from "@/lib/theme";
import { formatDay, todayInIndia } from "@/lib/time";
import {
  REPLY_DAYS_BEFORE_WEDDING,
  STAY_DAYS_BEFORE_WEDDING,
  latestReplyDate,
  latestStayDate,
} from "@/lib/weddings/rules";
import { RESERVED_SLUGS } from "@/lib/weddings/slug";

// What a person types in the "Make a wedding" form. The same checks run on the server
// (the browser is never trusted). The messages are plain words (NFR-24).

export const CREATOR_RELATIONS = ["bride", "groom", "parent", "sibling"] as const;

function isRealDate(value: string): boolean {
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export const createWeddingSchema = z
  .object({
    brideName: z.string().trim().min(1, "Type the bride's name.").max(60, "Use at most 60 letters."),
    groomName: z.string().trim().min(1, "Type the groom's name.").max(60, "Use at most 60 letters."),
    weddingDate: z
      .string()
      .refine((value) => /^\d{4}-\d{2}-\d{2}$/.test(value) && isRealDate(value), "Choose the wedding date."),
    relation: z.enum(CREATOR_RELATIONS, { error: "Choose who you are." }),
    isTest: z.boolean(),
  })
  .superRefine((value, ctx) => {
    // No wedding, real or test, can have a date before today in India (FR-2, FR-3). Today is allowed.
    // Both sides are "year-month-day" text, so comparing the text compares the dates.
    const dateOk = /^\d{4}-\d{2}-\d{2}$/.test(value.weddingDate) && isRealDate(value.weddingDate);
    if (dateOk && value.weddingDate < todayInIndia()) {
      ctx.addIssue({
        code: "custom",
        path: ["weddingDate"],
        message: "The wedding date cannot be before today.",
      });
    }
  });

export type CreateWeddingInput = z.infer<typeof createWeddingSchema>;

// ---- Settings (plan step 5.3) ----

const optionalDate = z
  .string()
  .trim()
  .refine((value) => value === "" || (/^\d{4}-\d{2}-\d{2}$/.test(value) && isRealDate(value)), "Choose a real date.")
  .transform((value) => (value === "" ? null : value));

export type SettingsContext = {
  weddingDate: string; // "2027-01-15"
  today: string; // today in India
  // The dates saved now. A saved date that has passed is not refused again (otherwise nobody
  // could change the greeting after the deadline). The "before today" rule is only for a new date.
  saved: { rsvpLastDate: string | null; stayLastDate: string | null };
};

// Greeting, colour and last dates. An empty greeting or date means "not set".
export function makeSettingsSchema(context: SettingsContext) {
  return z
    .object({
      greeting: z
        .string()
        .trim()
        .max(280, "Use at most 280 letters.")
        .transform((value) => (value === "" ? null : value)),
      themeColor: z.enum(THEME_NAMES, { error: "Choose a colour." }),
      rsvpLastDate: optionalDate,
      stayLastDate: optionalDate,
    })
    .superRefine((value, ctx) => {
      const problem = (field: "rsvpLastDate" | "stayLastDate", message: string) =>
        ctx.addIssue({ code: "custom", path: [field], message });
      const real = (day: string | null): day is string => !!day && isRealDate(day);
      const { weddingDate, today, saved } = context;

      if (real(value.rsvpLastDate)) {
        const latest = latestReplyDate(weddingDate);
        if (value.rsvpLastDate !== saved.rsvpLastDate && value.rsvpLastDate < today) {
          problem("rsvpLastDate", "The reply date cannot be before today.");
        } else if (value.rsvpLastDate > latest) {
          problem("rsvpLastDate", `The reply date must be at least ${REPLY_DAYS_BEFORE_WEDDING} days before the wedding. The latest day is ${formatDay(latest)}.`);
        }
      }

      if (real(value.stayLastDate)) {
        const latest = latestStayDate(weddingDate);
        if (value.stayLastDate !== saved.stayLastDate && value.stayLastDate < today) {
          problem("stayLastDate", "The stay date cannot be before today.");
        } else if (real(value.rsvpLastDate) && value.stayLastDate >= value.rsvpLastDate) {
          // FR-4, AC-4.1: the stay last date must be earlier than the reply last date.
          problem("stayLastDate", "The stay last date must be before the reply last date.");
        } else if (value.stayLastDate > latest) {
          problem("stayLastDate", `The stay date must be at least ${STAY_DAYS_BEFORE_WEDDING} days before the wedding. The latest day is ${formatDay(latest)}.`);
        }
      }
    });
}

export type UpdateSettingsInput = z.input<ReturnType<typeof makeSettingsSchema>>;

// The link name: lowercase letters, numbers and single dashes. Reserved names are refused with
// the same text as a taken name, so nobody learns which names are reserved.
export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Use at least 3 letters or numbers.")
  .max(60, "Use at most 60 letters or numbers.")
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use only letters, numbers and single dashes, for example priya-rahul.")
  .refine((value) => !RESERVED_SLUGS.has(value), "This link name is not available.");
