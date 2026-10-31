import { z } from "zod";

// What an admin types in the team form (FR-9). The email is saved in lowercase (the database
// refuses capital letters). Who may be admin is a rule of lib/team/rules.ts, not of this file.

export const RELATIONS = [
  { value: "bride", label: "Bride" },
  { value: "groom", label: "Groom" },
  { value: "parent", label: "Parent" },
  { value: "sibling", label: "Sibling" },
  { value: "relative", label: "Relative" },
  { value: "friend", label: "Friend" },
  { value: "other", label: "Other" },
] as const;

export const relationLabel = (value: string) => RELATIONS.find((relation) => relation.value === value)?.label ?? value;

export const personSchema = z.object({
  displayName: z.string().trim().min(1, "Type the person's name.").max(60, "Use at most 60 letters."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("Type a real email address, for example ankit@gmail.com.")),
  relation: z.enum(RELATIONS.map((relation) => relation.value) as [string, ...string[]], { error: "Choose the relation." }),
  role: z.enum(["admin", "organizer"], { error: "Choose a role." }),
});

export type PersonInput = z.input<typeof personSchema>;
