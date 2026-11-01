import { z } from "zod";
import { optionalPhoneSchema } from "@/lib/phone";
import { cleaned } from "@/lib/text";

// What a person types in the family form (FR-15). The numbers are checked and made standard by
// lib/phone. A family can have no number (it is flagged, FR-19), but a second number needs a
// main number. At least one event is on every invitation (AC-15.1).

const optionalText = (max: number) =>
  cleaned(z.string().trim().max(max, `Use at most ${max} letters.`)).transform((value) => (value === "" ? null : value));

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const familySchema = z
  .object({
    familyName: cleaned(z.string().trim().min(1, "Type the family name.").max(80, "Use at most 80 letters.")),
    contactName: optionalText(60),
    city: optionalText(60),
    side: z.enum(["bride", "groom", "both"], { error: "Choose the side." }),
    primaryPhone: optionalPhoneSchema,
    secondaryPhone: optionalPhoneSchema,
    eventIds: z.array(z.string().regex(UUID, "Choose the events.")).min(1, "Choose at least one event."),
    // Only admins can set the organizer; for everybody else the server ignores it.
    organizerId: z.string().trim().transform((value) => (value === "" ? null : value)),
    notes: optionalText(500),
  })
  .superRefine((value, ctx) => {
    if (value.secondaryPhone && !value.primaryPhone) {
      ctx.addIssue({ code: "custom", path: ["secondaryPhone"], message: "Add the main number first." });
    }
    if (value.secondaryPhone && value.secondaryPhone === value.primaryPhone) {
      ctx.addIssue({ code: "custom", path: ["secondaryPhone"], message: "Use two different numbers." });
    }
    if (value.organizerId && !UUID.test(value.organizerId)) {
      ctx.addIssue({ code: "custom", path: ["organizerId"], message: "Choose a person from the team." });
    }
  });

export type FamilyInput = z.input<typeof familySchema>;

// ---- The filters of the list (they are in the address of the page) ----

export const FAMILY_STATUSES = [
  { value: "no-number", label: "No number" },
  { value: "incorrect", label: "Incorrect number" },
  { value: "not-sent", label: "Not sent" },
  { value: "no-reply", label: "No reply" },
] as const;

export const PAGE_SIZE = 50;
// A page number in the address is never more than this. A huge number (page=99999999999999999999) made
// the database query fail (found by the review of 2026-10-31).
export const MAX_PAGE = 10_000;

export type FamilyFilters = {
  q: string;
  side: "bride" | "groom" | "both" | "";
  event: string; // an event id, or ""
  organizer: string; // a member id, "none", or ""
  status: (typeof FAMILY_STATUSES)[number]["value"] | "";
  page: number;
};

// Reads the address of the page. Anything that is not allowed is ignored, never an error.
export function parseFilters(params: Record<string, string | string[] | undefined>): FamilyFilters {
  const one = (key: string) => {
    const value = params[key];
    return (Array.isArray(value) ? value[0] : value) ?? "";
  };
  const side = one("side");
  const status = one("status");
  const event = one("event");
  const organizer = one("organizer");
  const page = Number.parseInt(one("page"), 10);
  return {
    q: one("q").trim().slice(0, 80),
    side: side === "bride" || side === "groom" || side === "both" ? side : "",
    event: UUID.test(event) ? event : "",
    organizer: organizer === "none" || UUID.test(organizer) ? organizer : "",
    status: FAMILY_STATUSES.some((s) => s.value === status) ? (status as FamilyFilters["status"]) : "",
    page: Number.isFinite(page) && page > 0 ? Math.min(page, MAX_PAGE) : 1,
  };
}

// Assign many families to one organizer (step 6.6).
export const assignSchema = z.object({
  scope: z.enum(["all", "bride", "groom", "both"], { error: "Choose which families." }),
  onlyUnassigned: z.boolean(),
  memberId: z.string().regex(UUID, "Choose a person from the team."),
});
