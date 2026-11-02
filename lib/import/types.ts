// The shapes of the import (PRD FR-16, FR-17). Step 6.3 finds the problems of the file itself
// (validateImportFile); step 6.4 adds the problems against the app (validateImportAgainstDb).
// Every problem has a code and a title, so the screens can group the problems by kind
// ("Same number used twice: 12 rows", UI design 6.9).

export type ProblemKind = "error" | "warning";

// Problems of the file. The ones of step 6.4 are listed here too, so there is one list.
export const PROBLEMS = {
  // ---- found in the file itself (step 6.3) ----
  "unknown-column": { kind: "error", title: "Column is not an event of this wedding" },
  "duplicate-column": { kind: "error", title: "Column appears twice" },
  "missing-column": { kind: "error", title: "A needed column is missing" },
  "name-missing": { kind: "error", title: "Family name is missing" },
  "no-event": { kind: "error", title: "No event with yes" },
  "answer-not-understood": { kind: "error", title: "Answer is not yes or no" },
  "bad-phone": { kind: "error", title: "Number is not valid" },
  "second-without-main": { kind: "error", title: "Second number has no main number" },
  "same-main-and-second": { kind: "error", title: "Main and second number are the same" },
  "same-number-twice": { kind: "error", title: "Same number used twice in the file" },
  "bad-side": { kind: "error", title: "Side is not Bride, Groom or Both" },
  "organizer-not-email": { kind: "error", title: "Organizer is not an email" },
  "text-too-long": { kind: "error", title: "Text is too long" },
  "no-phone": { kind: "warning", title: "No phone number" },
  "no-side": { kind: "warning", title: "No side (goes to both sides)" },
  // ---- found by comparing with the app (step 6.4) ----
  "number-used-by-other-family": { kind: "error", title: "Number is used by another family" },
  "organizer-not-in-team": { kind: "error", title: "Organizer is not in the team" },
  "already-in-app": { kind: "warning", title: "Already in the app (skipped)" },
  "same-family-twice-in-file": { kind: "warning", title: "Same family twice in the file (only the first is saved)" },
} as const satisfies Record<string, { kind: ProblemKind; title: string }>;

export type ProblemCode = keyof typeof PROBLEMS;

export type Problem = {
  code: ProblemCode;
  kind: ProblemKind;
  title: string;
  row: number | null; // the row of the file, as Excel shows it (the first family is row 2). Empty for a problem of the whole file.
  familyName: string;
  value: string; // what was written in the file
  message: string; // what to do, in plain words
};

export type Side = "bride" | "groom" | "both";

// A good row, already in the standard form. It can still be refused in step 6.4.
export type ImportRow = {
  row: number;
  familyName: string;
  contactName: string | null;
  city: string | null;
  side: Side;
  primaryPhone: string | null; // "+919876511111"
  secondaryPhone: string | null;
  eventIds: string[];
  organizerEmail: string | null; // lowercase
  notes: string | null;
};

// The file as a plain table of text. The first row has the names of the columns.
export type Table = { headers: string[]; rows: string[][] };

export type FileCheck = {
  rows: ImportRow[]; // the rows without an error
  problems: Problem[];
  totalRows: number; // families in the file (empty rows are not counted)
  okRows: number; // rows without an error (warnings are allowed)
  warningRows: number; // of these, the rows with a warning
  errorRows: number; // rows with at least one error
  canSave: boolean; // no error anywhere (also not in the columns)
};

export type EventForImport = { id: string; name: string; startsAt: Date; hostedBy?: string };

export function problem(code: ProblemCode, row: number | null, familyName: string, value: string, message: string): Problem {
  return { code, kind: PROBLEMS[code].kind, title: PROBLEMS[code].title, row, familyName, value, message };
}

// What the screens show after the check (step 6.4), and what the save returns.
export type ImportReport = {
  totalRows: number; // families in the file
  newRows: number; // will be saved
  skippedRows: number; // already in the app (or twice in the file)
  warningRows: number; // good rows with a warning (no number, no side)
  errorRows: number; // rows with at least one error
  problems: Problem[];
  canSave: boolean; // no error anywhere, and at least one new family
};
