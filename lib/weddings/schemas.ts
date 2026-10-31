import { z } from "zod";
import { todayInIndia } from "@/lib/time";

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
