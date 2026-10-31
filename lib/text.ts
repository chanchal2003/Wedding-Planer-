import { z } from "zod";

// PostgreSQL cannot store the character NUL (code 0). A name or a note with one made the save fail with
// "Something went wrong" (found by the review of 2026-10-31). NUL is removed before the other checks.
export const stripNul = (text: string) => text.replaceAll("\u0000", "");

// Use it around a text rule: cleaned(z.string().trim().max(60)) removes NUL first, then checks.
export const cleaned = <Output>(schema: z.ZodType<Output, string>) => z.string().transform(stripNul).pipe(schema);
