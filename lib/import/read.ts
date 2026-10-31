import readExcelFile from "read-excel-file/node";
import Papa from "papaparse";
import type { Table } from "@/lib/import/types";

// Turns an uploaded file into a plain table of text (FR-16): an Excel file (.xlsx) or a CSV file.
// It checks the size and the shape of the file, but not what is in the cells: that is
// validateImportFile. The file is never saved anywhere (it has phone numbers).

export const MAX_FILE_BYTES = 2 * 1024 * 1024; // 2 MB
export const MAX_FAMILIES = 2000;
export const MAX_COLUMNS = 40;
const MAX_CELL = 2000; // letters; a longer text is cut (it is refused later as too long anyway)

export const TOO_BIG = "This file is too big. Use a file under 2 MB with at most 2,000 families.";

export type ReadResult = { ok: true; table: Table } | { ok: false; message: string };

const fail = (message: string): ReadResult => ({ ok: false, message });

// Every cell becomes trimmed text. A number typed in Excel (9876511111) becomes "9876511111".
function cellText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "boolean") return value ? "yes" : "no";
  return String(value).trim().slice(0, MAX_CELL);
}

const isEmptyRow = (row: string[]) => row.every((cell) => cell === "");

export async function readImportFile(fileName: string, bytes: Uint8Array): Promise<ReadResult> {
  if (bytes.length === 0) return fail("This file is empty.");
  if (bytes.length > MAX_FILE_BYTES) return fail(TOO_BIG);

  const name = fileName.toLowerCase();
  let raw: unknown[][];

  if (name.endsWith(".xlsx")) {
    try {
      const sheets = await readExcelFile(Buffer.from(bytes));
      // The sheet "Guests" of the template, or else the first sheet.
      const sheet = sheets.find((s) => s.sheet.toLowerCase() === "guests") ?? sheets[0];
      if (!sheet) return fail("This file has no sheet.");
      raw = sheet.data;
    } catch {
      return fail("We could not read this file. Is it a real Excel file? Try downloading the template again.");
    }
  } else if (name.endsWith(".csv")) {
    // TextDecoder removes the BOM that Excel adds to a CSV file.
    const text = new TextDecoder("utf-8").decode(bytes);
    const parsed = Papa.parse<string[]>(text, { delimitersToGuess: [",", ";", "\t", "|"], skipEmptyLines: false });
    if (parsed.errors.some((error) => error.type === "Quotes")) return fail("We could not read this CSV file. Check the quotes in it.");
    raw = parsed.data;
  } else if (name.endsWith(".xls")) {
    return fail("This is an old Excel file (.xls). Save it as .xlsx and try again.");
  } else {
    return fail("Use an Excel file (.xlsx) or a CSV file.");
  }

  const rows = raw.map((row) => (Array.isArray(row) ? row.map(cellText) : []));
  while (rows.length > 0 && isEmptyRow(rows[rows.length - 1])) rows.pop(); // empty rows at the end
  if (rows.length === 0 || isEmptyRow(rows[0])) return fail("The first row must have the names of the columns. Use the template.");

  const [headers, ...data] = rows;
  if (headers.length > MAX_COLUMNS) return fail("This file has too many columns. Use the template.");
  if (data.every(isEmptyRow)) return fail("This file has no families.");
  if (data.filter((row) => !isEmptyRow(row)).length > MAX_FAMILIES) return fail(TOO_BIG);

  return { ok: true, table: { headers, rows: data } };
}
