import { z } from "zod";
import { eventHeaders, FIXED_HEADERS, type FixedKey } from "@/lib/import/columns";
import { problem, type EventForImport, type FileCheck, type ImportRow, type Problem, type Side, type Table } from "@/lib/import/types";
import { normalizePhone, PHONE_ERROR } from "@/lib/phone";

// Step 1 of the import (CLAUDE.md rule 7): finds every problem that is in the file itself.
// It reads NO database: the events of the wedding come in as a plain list. A pure function, so the
// tests can check every rule with plain data.
// Row numbers are the rows of the file as Excel shows them: the first family is row 2.

const norm = (text: string) => text.toLowerCase().replace(/\s+/g, " ").trim();

const MAX = { familyName: 80, contactName: 60, city: 60, notes: 500 } as const;

function parseSide(text: string): Side | null {
  // "Bride", "bride's side", "Both sides" ... all work.
  const word = norm(text).replace(/['’]s\b/g, "").replace(/\bsides?\b/g, "").trim();
  return word === "bride" || word === "groom" || word === "both" ? word : null;
}

// "yes" and "y" are yes. "no", "n" and an empty cell are no. Anything else is not understood.
function parseAnswer(text: string): boolean | null {
  const word = norm(text);
  if (word === "yes" || word === "y") return true;
  if (word === "no" || word === "n" || word === "") return false;
  return null;
}

const emailSchema = z.email();

export function validateImportFile(table: Table, events: EventForImport[]): FileCheck {
  const problems: Problem[] = [];

  // ---- The columns ----
  const known = new Map<string, { key: FixedKey } | { eventId: string; header: string }>();
  for (const [key, header] of Object.entries(FIXED_HEADERS)) known.set(norm(header), { key: key as FixedKey });
  eventHeaders(events).forEach((header, index) => known.set(norm(header), { eventId: events[index].id, header }));

  const fixedAt: Partial<Record<FixedKey, number>> = {};
  const eventAt: { index: number; eventId: string; header: string }[] = [];
  const seen = new Set<string>();

  table.headers.forEach((header, index) => {
    if (header.trim() === "") return; // an empty column name is ignored
    const found = known.get(norm(header));
    if (!found) {
      problems.push(problem("unknown-column", null, "", header, `Column "${header}" is not an event of this wedding. Add the event first, or delete the column.`));
      return;
    }
    const id = "key" in found ? found.key : found.eventId;
    if (seen.has(id)) {
      problems.push(problem("duplicate-column", null, "", header, `The column "${header}" appears twice. Delete one of them.`));
      return;
    }
    seen.add(id);
    if ("key" in found) fixedAt[found.key] = index;
    else eventAt.push({ index, eventId: found.eventId, header: found.header });
  });

  if (fixedAt.familyName === undefined) {
    problems.push(problem("missing-column", null, "", FIXED_HEADERS.familyName, `The column "${FIXED_HEADERS.familyName}" is missing. Use the template.`));
    return summary([], problems, 0);
  }
  if (eventAt.length === 0) {
    problems.push(problem("missing-column", null, "", "Events", "The file has no column for an event. Use the template: it has one column for each event."));
    return summary([], problems, 0);
  }

  // ---- The rows ----
  const cell = (row: string[], key: FixedKey) => (fixedAt[key] === undefined ? "" : (row[fixedAt[key]!] ?? "").trim());
  const good: ImportRow[] = [];
  const rowNumbersWithError = new Set<number>();
  const rowNumbersWithWarning = new Set<number>();
  const numberRows = new Map<string, { row: number; shown: string; familyName: string }[]>(); // standard number -> where it is
  let totalRows = 0;

  table.rows.forEach((cells, index) => {
    if (cells.every((text) => text.trim() === "")) return; // an empty row is skipped
    totalRows++;
    const row = index + 2;
    const familyName = cell(cells, "familyName");
    const mine: Problem[] = [];
    const add = (code: Parameters<typeof problem>[0], value: string, message: string) => mine.push(problem(code, row, familyName, value, message));

    // The family
    if (familyName === "") add("name-missing", "", "Write the name of the family.");
    for (const key of ["familyName", "contactName", "city", "notes"] as const) {
      const text = cell(cells, key);
      if (text.length > MAX[key]) add("text-too-long", text.slice(0, 30) + "…", `${FIXED_HEADERS[key]}: use at most ${MAX[key]} letters.`);
    }

    // The events
    const invited: string[] = [];
    for (const { index: at, eventId, header } of eventAt) {
      const text = (cells[at] ?? "").trim();
      const answer = parseAnswer(text);
      if (answer === null) add("answer-not-understood", `${header}: ${text}`, `Write yes or no in the column "${header}".`);
      else if (answer) invited.push(eventId);
    }
    if (invited.length === 0 && !mine.some((p) => p.code === "answer-not-understood")) {
      add("no-event", "", "Write yes in at least one event column.");
    }

    // The numbers
    const mainText = cell(cells, "primaryPhone");
    const secondText = cell(cells, "secondaryPhone");
    const main = mainText ? normalizePhone(mainText) : null;
    const second = secondText ? normalizePhone(secondText) : null;
    if (mainText && !main) add("bad-phone", mainText, `${FIXED_HEADERS.primaryPhone}: ${PHONE_ERROR}.`);
    if (secondText && !second) add("bad-phone", secondText, `${FIXED_HEADERS.secondaryPhone}: ${PHONE_ERROR}.`);
    if (secondText && second && !mainText) add("second-without-main", secondText, "Write the main number first. A second number needs a main number.");
    if (main && second && main === second) add("same-main-and-second", secondText, "Use two different numbers, or leave the second one empty.");
    if (!mainText && !secondText) add("no-phone", "", "This family has no number. You can add one later.");

    // The side
    const sideText = cell(cells, "side");
    let side: Side = "both";
    if (sideText === "") add("no-side", "", "No side. The family goes to both sides.");
    else {
      const parsed = parseSide(sideText);
      if (parsed) side = parsed;
      else add("bad-side", sideText, "Write Bride, Groom or Both.");
    }

    // The organizer: it must be an email. Whether this person is on the team is checked in step 6.4.
    const organizerText = cell(cells, "organizerEmail").toLowerCase();
    if (organizerText && !emailSchema.safeParse(organizerText).success) {
      add("organizer-not-email", cell(cells, "organizerEmail"), "Organizer not in the team. Use their email.");
    }

    // Where each number is, for the check "the same number twice in the file". The same number in
    // the main and the second place of ONE row is its own problem (above), so it counts once.
    for (const [standard, shown] of [[main, mainText], [second, secondText]] as const) {
      if (!standard) continue;
      const places = numberRows.get(standard) ?? [];
      if (places.some((place) => place.row === row)) continue;
      numberRows.set(standard, [...places, { row, shown, familyName }]);
    }

    problems.push(...mine);
    if (mine.some((p) => p.kind === "error")) rowNumbersWithError.add(row);
    else {
      if (mine.some((p) => p.kind === "warning")) rowNumbersWithWarning.add(row);
      good.push({
        row,
        familyName,
        contactName: cell(cells, "contactName") || null,
        city: cell(cells, "city") || null,
        side,
        primaryPhone: main,
        secondaryPhone: second,
        eventIds: invited,
        organizerEmail: organizerText || null,
        notes: cell(cells, "notes") || null,
      });
    }
  });

  // ---- The same number in two rows of the file: an error on every one of these rows ----
  const twice = new Set<number>();
  for (const places of numberRows.values()) {
    if (places.length < 2) continue;
    for (const place of places) {
      const others = places.filter((other) => other.row !== place.row).map((other) => other.row);
      problems.push(problem("same-number-twice", place.row, place.familyName, place.shown, `This number is also in row ${others.slice(0, 5).join(", ")}${others.length > 5 ? " and more" : ""}.`));
      twice.add(place.row);
    }
  }
  for (const row of twice) {
    rowNumbersWithError.add(row);
    rowNumbersWithWarning.delete(row);
  }
  const rows = good.filter((family) => !twice.has(family.row));

  return summary(rows, problems, totalRows, rowNumbersWithError.size, [...rowNumbersWithWarning].filter((row) => !twice.has(row)).length);
}

function summary(rows: ImportRow[], problems: Problem[], totalRows: number, errorRows = 0, warningRows = 0): FileCheck {
  return {
    rows,
    problems,
    totalRows,
    okRows: rows.length,
    warningRows,
    errorRows,
    canSave: !problems.some((p) => p.kind === "error"),
  };
}
