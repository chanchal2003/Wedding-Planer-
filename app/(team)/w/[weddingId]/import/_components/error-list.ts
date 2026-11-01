import type { ProblemGroup } from "@/lib/import/report";

// The "Download error list" file (step 6.5). It is made in the browser from the report, so the
// server keeps nothing. One line for each problem: the person fixes the Excel file row by row.

const cell = (text: string) => `"${text.replaceAll('"', '""')}"`;

export function errorListCsv(groups: ProblemGroup[]) {
  const lines = [["Kind", "Problem", "Row", "Family", "Value", "What to do"].map(cell).join(",")];
  for (const group of groups) {
    for (const item of group.items) {
      lines.push(
        [group.kind === "error" ? "Error" : "Warning", group.title, item.row === null ? "" : String(item.row), item.familyName, item.value, item.message]
          .map(cell)
          .join(","),
      );
    }
  }
  // The first character (BOM) makes Excel read the file as UTF-8.
  return "﻿" + lines.join("\r\n");
}
