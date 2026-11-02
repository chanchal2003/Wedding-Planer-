// CSV files for the export (FR-65, plan 9.1). They open in Excel and Google Sheets.
//
// Formula safety: a cell whose text starts with = + - @ (or a tab or a carriage return) is read by Excel
// as a formula. A family called =HYPERLINK("http://...","click") would run. So such a cell gets a ' in
// front, and Excel shows it as text. The one exception is raw(): only for a value that the app
// checked and made itself (a phone number from lib/phone holds only + and digits), so a number does
// not show as '+91...

export type Raw = { raw: string };
export type Cell = string | number | null | undefined | Raw;

// Use it ONLY for a value that cannot hold a formula, for example a phone number from lib/phone.
export const raw = (value: string): Raw => ({ raw: value });

const FORMULA_START = /^[=+\-@\t\r]/;

function cellText(cell: Cell): string {
  if (cell === null || cell === undefined) return "";
  if (typeof cell === "object") return cell.raw;
  const text = String(cell);
  return FORMULA_START.test(text) ? `'${text}` : text;
}

function quote(text: string): string {
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

// The BOM at the start makes Excel read the file as UTF-8, so Hindi names are not broken.
export function toCsv(rows: Cell[][]): string {
  return "﻿" + rows.map((row) => row.map((cell) => quote(cellText(cell))).join(",")).join("\r\n") + "\r\n";
}
