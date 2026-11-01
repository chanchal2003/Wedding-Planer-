import { z } from "zod";
import { cleaned } from "@/lib/text";

// What a guest types in the search box (FR-28): at least 3 letters, extra spaces removed.
export const MIN_SEARCH_LETTERS = 3;
export const MAX_MATCHES = 10;

export const searchTextSchema = cleaned(
  z
    .string()
    .trim()
    .transform((text) => text.replace(/\s+/g, " "))
    .pipe(z.string().min(MIN_SEARCH_LETTERS, "Type at least 3 letters.").max(40, "Use at most 40 letters.")),
);

// The reply of a family (FR-33, FR-34). There is no maximum number of persons in the PRD; 9,999 is
// only a technical limit, so a typing mistake cannot break the number field of the database.
export const MAX_PERSONS = 9999;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const replySchema = z
  .object({
    repliedByName: cleaned(z.string().trim().min(1, "Type your name.").max(60, "Use at most 60 letters.")),
    answers: z
      .array(
        z.object({
          eventId: z.string().regex(UUID, "Choose an answer for every event."),
          attending: z.boolean(),
          persons: z.number().int("Type a whole number.").min(1, "Type at least 1 person.").max(MAX_PERSONS, `Use at most ${MAX_PERSONS} persons.`).nullable(),
        }),
      )
      .min(1, "Choose an answer for every event."),
  })
  .superRefine((value, ctx) => {
    value.answers.forEach((answer, index) => {
      if (answer.attending && answer.persons === null) {
        ctx.addIssue({ code: "custom", path: ["answers", index, "persons"], message: "Type how many people will come." });
      }
    });
  })
  .transform((value) => ({
    ...value,
    // "No" has no number of persons.
    answers: value.answers.map((answer) => ({ ...answer, persons: answer.attending ? answer.persons : null })),
  }));

export type ReplyInput = z.input<typeof replySchema>;
