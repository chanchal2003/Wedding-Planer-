import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import writeExcelFile from "write-excel-file/node";
import { groupProblems } from "@/lib/import/report";
import { MAX_FILE_BYTES, readImportFile } from "@/lib/import/read";
import type { Table } from "@/lib/import/types";
import { validateImportFile } from "@/lib/import/validateImportFile";

// The first half of the import (FR-16, FR-17): reading a file and finding the problems that are in
// the file itself. No database. The events of the wedding are the five of the sample files.

const EVENTS = ["Haldi", "Mehendi", "Sangeet", "Wedding", "Reception"].map((name, i) => ({
  id: `event-${name.toLowerCase()}`,
  name,
  startsAt: new Date(Date.UTC(2027, 0, 12 + i)),
}));
const HEADERS = ["Family name", "Contact name", "City", "Main number", "Second number", "Side", "Haldi", "Mehendi", "Sangeet", "Wedding", "Reception", "Organizer email", "Notes"];

// A row of the file from a few fields; the rest are empty.
function row(fields: Record<string, string>): string[] {
  return HEADERS.map((header) => fields[header] ?? "");
}
const table = (...rows: Record<string, string>[]): Table => ({ headers: HEADERS, rows: rows.map(row) });
const check = (...rows: Record<string, string>[]) => validateImportFile(table(...rows), EVENTS);
const codes = (result: ReturnType<typeof check>) => result.problems.map((p) => p.code);

describe("reading a file", () => {
  it("reads the clean sample (500 families)", async () => {
    const read = await readImportFile("guests-clean-500.xlsx", new Uint8Array(readFileSync("samples/guests-clean-500.xlsx")));
    expect(read.ok).toBe(true);
    if (read.ok) {
      expect(read.table.headers).toEqual(HEADERS);
      expect(read.table.rows).toHaveLength(500);
    }
  });

  it("reads a CSV file with a BOM, with commas or semicolons", async () => {
    for (const separator of [",", ";"]) {
      const text = `﻿Family name${separator}Main number${separator}Haldi\nSharma family${separator}98765 11111${separator}yes\n`;
      const read = await readImportFile("guests.csv", new TextEncoder().encode(text));
      expect(read.ok).toBe(true);
      if (read.ok) {
        expect(read.table.headers).toEqual(["Family name", "Main number", "Haldi"]);
        expect(read.table.rows).toEqual([["Sharma family", "98765 11111", "yes"]]);
      }
    }
  });

  it("turns a number typed as a number in Excel into text", async () => {
    const bytes = new Uint8Array(await writeExcelFile([{ sheet: "Guests", data: [["Family name", "Main number", "Haldi"], ["Sharma family", 9876511111, "yes"]] }]).toBuffer());
    const read = await readImportFile("guests.xlsx", bytes);
    expect(read.ok && read.table.rows[0]).toEqual(["Sharma family", "9876511111", "yes"]);
  });

  it("refuses an old .xls file, a wrong type, an empty file and a file that is not a real Excel file", async () => {
    const some = new TextEncoder().encode("hello");
    expect(await readImportFile("guests.xls", some)).toEqual({ ok: false, message: "This is an old Excel file (.xls). Save it as .xlsx and try again." });
    expect(await readImportFile("guests.pdf", some)).toEqual({ ok: false, message: "Use an Excel file (.xlsx) or a CSV file." });
    expect(await readImportFile("guests.xlsx", new Uint8Array())).toEqual({ ok: false, message: "This file is empty." });
    const fake = await readImportFile("guests.xlsx", some);
    expect(!fake.ok && fake.message).toContain("could not read");
  });

  it("refuses a file over 2 MB and a file with more than 2,000 families", async () => {
    const tooBig = "This file is too big. Use a file under 2 MB with at most 2,000 families.";
    expect(await readImportFile("guests.csv", new Uint8Array(MAX_FILE_BYTES + 1))).toEqual({ ok: false, message: tooBig });
    const many = "Family name,Haldi\n" + Array.from({ length: 2001 }, (_, i) => `F${i},yes`).join("\n");
    expect(await readImportFile("guests.csv", new TextEncoder().encode(many))).toEqual({ ok: false, message: tooBig });
    const edge = "Family name,Haldi\n" + Array.from({ length: 2000 }, (_, i) => `F${i},yes`).join("\n");
    expect((await readImportFile("guests.csv", new TextEncoder().encode(edge))).ok).toBe(true);
  });

  it("refuses a file with only the header row, or with no header", async () => {
    const onlyHeader = await readImportFile("guests.csv", new TextEncoder().encode("Family name,Haldi\n"));
    expect(!onlyHeader.ok && onlyHeader.message).toBe("This file has no families.");
    const noHeader = await readImportFile("guests.csv", new TextEncoder().encode("\n\nSharma,yes\n"));
    expect(!noHeader.ok && noHeader.message).toContain("first row");
  });
});

describe("a good family (AC-16.2)", () => {
  it("accepts a row with only a family name and yes for one event", () => {
    const result = check({ "Family name": "Sharma family", Wedding: "yes" });
    expect(result.canSave).toBe(true);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toMatchObject({ row: 2, familyName: "Sharma family", side: "both", primaryPhone: null, eventIds: ["event-wedding"], organizerEmail: null });
    expect(codes(result).sort()).toEqual(["no-phone", "no-side"]); // only warnings
  });

  it("puts every number in the standard form", () => {
    const result = check({ "Family name": "Sharma family", Wedding: "yes", "Main number": "+91 98765-11111", "Second number": "09876522222", Side: "Groom" });
    expect(result.rows[0]).toMatchObject({ primaryPhone: "+919876511111", secondaryPhone: "+919876522222", side: "groom" });
    expect(result.problems).toEqual([]);
  });

  it("ignores capital letters and extra spaces in the names of the columns", () => {
    const messy: Table = { headers: ["  FAMILY   name ", "main NUMBER", " haldi ", "Wedding"], rows: [["Sharma family", "98765 11111", "Yes", "n"]] };
    const result = validateImportFile(messy, EVENTS);
    expect(result.problems).toEqual([{ code: "no-side", kind: "warning", title: "No side (goes to both sides)", row: 2, familyName: "Sharma family", value: "", message: "No side. The family goes to both sides." }]);
    expect(result.rows[0].eventIds).toEqual(["event-haldi"]);
  });

  it("understands yes, y, no, n and an empty answer, in any case", () => {
    const result = check({ "Family name": "A", Haldi: "YES", Mehendi: "y", Sangeet: "No", Wedding: "N", Reception: "" });
    expect(result.rows[0].eventIds).toEqual(["event-haldi", "event-mehendi"]);
  });

  it("understands the sides in different ways of writing", () => {
    const sides = ["Bride", "groom", "BOTH", "Bride's side", "groom side", "both sides"].map((side, i) => ({ "Family name": `F${i}`, Wedding: "yes", Side: side }));
    expect(check(...sides).rows.map((r) => r.side)).toEqual(["bride", "groom", "both", "bride", "groom", "both"]);
  });

  it("puts the organizer email in lowercase", () => {
    expect(check({ "Family name": "A", Wedding: "yes", "Organizer email": " Rohan@Example.com " }).rows[0].organizerEmail).toBe("rohan@example.com");
  });
});

describe("rows with an error", () => {
  it("refuses a row with no family name, and a row with no event (AC-17.2)", () => {
    const result = check({ "Family name": "", Wedding: "yes" }, { "Family name": "Nair family", Haldi: "no" }, { "Family name": "Iyer family" });
    expect(codes(result).filter((c) => c !== "no-phone" && c !== "no-side")).toEqual(["name-missing", "no-event", "no-event"]);
    expect(result.rows).toHaveLength(0);
    expect(result.canSave).toBe(false);
    expect(result.errorRows).toBe(3);
  });

  it("allows a family with no number: only a warning, and the row is kept (AC-17.3)", () => {
    const result = check({ "Family name": "Joshi family", Wedding: "yes", Side: "Bride" });
    expect(codes(result)).toEqual(["no-phone"]);
    expect(result.canSave).toBe(true);
    expect(result.rows).toHaveLength(1);
    expect(result.warningRows).toBe(1);
  });

  it("refuses a number that is not valid, naming the column", () => {
    const result = check({ "Family name": "A", Wedding: "yes", Side: "Bride", "Main number": "98765 1111", "Second number": "hello" });
    expect(result.problems.map((p) => p.message)).toEqual(["Main number: This is not a valid phone number.", "Second number: This is not a valid phone number."]);
  });

  it("refuses a second number with no main number, and two equal numbers", () => {
    const result = check(
      { "Family name": "A", Wedding: "yes", Side: "Bride", "Second number": "98765 11111" },
      { "Family name": "B", Wedding: "yes", Side: "Bride", "Main number": "98765 22222", "Second number": "+91 98765-22222" },
    );
    expect(codes(result)).toEqual(["second-without-main", "same-main-and-second"]);
  });

  it("refuses an answer that is not yes or no, and says which column", () => {
    const result = check({ "Family name": "A", Wedding: "maybe", Haldi: "yes", Side: "Bride" });
    const found = result.problems.find((p) => p.code === "answer-not-understood");
    expect(found?.value).toBe("Wedding: maybe");
    expect(found?.message).toBe('Write yes or no in the column "Wedding".');
  });

  it("refuses a side that is not allowed, and an organizer who is a name (not an email)", () => {
    const result = check({ "Family name": "A", Wedding: "yes", Side: "middle", "Organizer email": "Rohan" });
    expect(codes(result).filter((c) => c !== "no-phone")).toEqual(["bad-side", "organizer-not-email"]);
    expect(result.problems.find((p) => p.code === "organizer-not-email")?.message).toBe("Organizer not in the team. Use their email.");
  });

  it("refuses a text that is too long", () => {
    const result = check({ "Family name": "x".repeat(81), Wedding: "yes", Side: "Bride", Notes: "n".repeat(501) });
    expect(codes(result).filter((c) => c === "text-too-long")).toHaveLength(2);
  });
});

describe("the same number twice in the file (AC-17.1)", () => {
  it("is an error on both rows, even when it is written in different ways, and each row names the other", () => {
    const result = check(
      { "Family name": "Verma family", Wedding: "yes", Side: "Groom", "Main number": "98765 11111" },
      { "Family name": "Gupta family", Wedding: "yes", Side: "Groom", "Main number": "good" },
      { "Family name": "Verma family", Wedding: "yes", Side: "Groom", "Second number": "+91 98765-11111", "Main number": "98765 33333" },
    );
    const twice = result.problems.filter((p) => p.code === "same-number-twice");
    expect(twice.map((p) => [p.row, p.message])).toEqual([[2, "This number is also in row 4."], [4, "This number is also in row 2."]]);
    expect(result.rows.map((r) => r.row)).toEqual([]); // row 3 has a bad number, rows 2 and 4 repeat a number
  });

  it("does not count the same number in the main and second place of one row as twice across rows", () => {
    const result = check({ "Family name": "A", Wedding: "yes", Side: "Bride", "Main number": "98765 11111", "Second number": "98765 11111" });
    expect(codes(result)).toEqual(["same-main-and-second"]);
  });

  it("lets every row stay good when the numbers are all different", () => {
    const result = check(
      { "Family name": "A", Wedding: "yes", Side: "Bride", "Main number": "98765 11111" },
      { "Family name": "B", Wedding: "yes", Side: "Bride", "Main number": "98765 22222" },
    );
    expect(result.problems).toEqual([]);
    expect(result.rows).toHaveLength(2);
  });
});

describe("the columns", () => {
  it("refuses a column that is not an event of the wedding, for the whole file (but still checks the rows)", () => {
    const result = validateImportFile({ headers: [...HEADERS, "Mehndi"], rows: [[...row({ "Family name": "A", Wedding: "yes", Side: "Bride" }), "yes"]] }, EVENTS);
    expect(result.problems.find((p) => p.code === "unknown-column")).toMatchObject({ row: null, value: "Mehndi" });
    expect(result.canSave).toBe(false);
    expect(result.rows).toHaveLength(1);
  });

  it("refuses a column that appears twice", () => {
    const result = validateImportFile({ headers: ["Family name", "Wedding", "wedding"], rows: [["A", "yes", "yes"]] }, EVENTS);
    expect(codes(result)).toContain("duplicate-column");
  });

  it("stops when the family name column or all the event columns are missing", () => {
    expect(codes(validateImportFile({ headers: ["Name", "Wedding"], rows: [["A", "yes"]] }, EVENTS))).toEqual(["unknown-column", "missing-column"]);
    const noEvents = validateImportFile({ headers: ["Family name", "City"], rows: [["A", "Delhi"]] }, EVENTS);
    expect(codes(noEvents)).toEqual(["missing-column"]);
    expect(noEvents.rows).toEqual([]);
  });

  it("uses the date in the header when two events have the same name", () => {
    const twins = [{ id: "a", name: "Haldi", startsAt: new Date("2027-01-12T04:30:00Z") }, { id: "b", name: "Haldi", startsAt: new Date("2027-01-13T04:30:00Z") }];
    const result = validateImportFile({ headers: ["Family name", "Haldi (12 Jan)", "Haldi (13 Jan)"], rows: [["A", "no", "yes"]] }, twins);
    expect(result.rows[0].eventIds).toEqual(["b"]);
  });
});

describe("the rows of the file", () => {
  it("numbers the rows as Excel does, skips empty rows, and does not count them", () => {
    const result = check({ "Family name": "First family", Wedding: "yes", Side: "Bride" }, {}, { "Family name": "", Wedding: "no" });
    expect(result.totalRows).toBe(2);
    expect(result.rows[0].row).toBe(2);
    expect(result.problems.find((p) => p.code === "name-missing")?.row).toBe(4); // the empty row 3 is skipped
  });
});

describe("the sample files", () => {
  it("the clean file has no error, and a warning for the 10 families with no number", async () => {
    const read = await readImportFile("guests-clean-500.xlsx", new Uint8Array(readFileSync("samples/guests-clean-500.xlsx")));
    if (!read.ok) throw new Error(read.message);
    const result = validateImportFile(read.table, EVENTS);
    expect(result.totalRows).toBe(500);
    expect(result.okRows).toBe(500);
    expect(result.errorRows).toBe(0);
    expect(result.canSave).toBe(true);
    expect(result.warningRows).toBe(10);
    expect(result.problems.every((p) => p.code === "no-phone")).toBe(true);
    for (const family of result.rows) {
      expect(family.eventIds.length).toBeGreaterThan(0);
      for (const phone of [family.primaryPhone, family.secondaryPhone]) if (phone) expect(phone).toMatch(/^\+\d{8,15}$/);
    }
    // The Sharma family of samples/README.md (the one with 98765 11111) is in the file exactly once.
    // Other families may also be called Sharma: they have other numbers.
    expect(result.rows.filter((r) => r.familyName === "Sharma family" && r.primaryPhone === "+919876511111")).toHaveLength(1);
  });

  it("the messy file shows exactly the mistakes of samples/README.md", async () => {
    const read = await readImportFile("guests-messy.xlsx", new Uint8Array(readFileSync("samples/guests-messy.xlsx")));
    if (!read.ok) throw new Error(read.message);
    const result = validateImportFile(read.table, EVENTS);

    expect(result.totalRows).toBe(28);
    expect(result.canSave).toBe(false);
    expect(result.errorRows).toBe(13);
    expect(result.okRows).toBe(15);
    expect(result.warningRows).toBe(2);

    const groups = Object.fromEntries(groupProblems(result.problems).map((g) => [g.code, g.items.map((i) => i.familyName || i.value)]));
    expect(groups).toEqual({
      "unknown-column": ["Mehndi"],
      "name-missing": ["", ""],
      "no-event": ["Nair family", "Iyer family"],
      "bad-phone": ["Bose family", "Das family", "Rao family"],
      "second-without-main": ["Menon family"],
      "same-main-and-second": ["Pillai family"],
      "same-number-twice": ["Verma family", "Verma family"],
      "bad-side": ["Saxena family"],
      "organizer-not-email": ["Khanna family"],
      "no-phone": ["Joshi family"],
      "no-side": ["Bhatt family"],
    });
    // The mistakes that only the app can find are still in the good rows (step 6.4 checks them):
    const names = result.rows.map((r) => r.familyName);
    expect(names).toContain("Gupta family"); // its number belongs to the Sharma family in the app
    expect(names).toContain("Kapoor family"); // its organizer is not on the team
  });
});

describe("the report", () => {
  it("groups the problems by kind: errors first, then warnings, each in the order of its rows", () => {
    const result = check(
      { "Family name": "A", Wedding: "yes" },
      { "Family name": "", Wedding: "yes", Side: "Bride", "Main number": "98765 11111" },
      { "Family name": "C", Wedding: "no", Side: "Bride", "Main number": "98765 22222" },
    );
    const groups = groupProblems(result.problems);
    expect(groups.map((g) => [g.kind, g.code, g.count])).toEqual([
      ["error", "name-missing", 1],
      ["error", "no-event", 1],
      ["warning", "no-phone", 1],
      ["warning", "no-side", 1],
    ]);
  });
});
