import writeExcelFile from "write-excel-file/node";
import { importColumns } from "@/lib/import/columns";

type EventForTemplate = { id: string; name: string; startsAt: Date };

// The Excel file that an admin downloads, fills in and uploads (FR-16, AC-16.1).
// Sheet 1 "Guests" has only the header row: one column for each event of the wedding.
// Sheet 2 "How to fill" explains every column, with an example row. The example is on its own
// sheet, so it can never be imported by mistake.
// Every cell is text, so Excel does not change 9876511111 into 9.88E+09.
export async function buildTemplate(events: EventForTemplate[]): Promise<Uint8Array> {
  const columns = importColumns(events);

  const header = columns.map((column) => ({ value: column.header, fontWeight: "bold" as const }));
  const guests = { sheet: "Guests", data: [header], columns: columns.map((column) => ({ width: column.width })) };

  const bold = (value: string) => ({ value, fontWeight: "bold" as const });
  const help = {
    sheet: "How to fill",
    columns: [{ width: 24 }, { width: 90 }, { width: 14 }, { width: 26 }],
    data: [
      [bold("How to fill the sheet Guests")],
      ["Write one family in each row. Do not change the names of the columns. Save the file and upload it in ShaadiDesk."],
      [],
      [bold("Column"), bold("What to write"), bold("Required?"), bold("Example")],
      ...columns.map((column) => [column.header, column.help, column.required ? "Yes" : "No", column.example]),
      [],
      [bold("Good to know")],
      ["Every family needs a name and at least one event with yes."],
      ["If a number is already used by another family of this wedding, the file is not saved. You see which family has it."],
      ["A family that is already in the app (the same name and the same number) is skipped, so you can upload an updated file again."],
    ],
  };

  const file = writeExcelFile([guests, help]);
  return new Uint8Array(await file.toBuffer());
}
