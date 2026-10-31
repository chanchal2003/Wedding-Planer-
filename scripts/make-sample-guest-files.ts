// Makes the two fake guest files in samples/ (plan step 6.2). All names, cities and numbers are
// invented: there is no real guest in this project (CLAUDE.md rule 11).
// Run it with: npm run samples
// The seed is fixed, so every run gives exactly the same two files.
import writeExcelFile from "write-excel-file/node";
import { fakerEN_IN as faker } from "@faker-js/faker";
import { importColumns } from "../lib/import/columns";
import { normalizePhone } from "../lib/phone";

faker.seed(2027);

const EVENTS = ["Haldi", "Mehendi", "Sangeet", "Wedding", "Reception"].map((name, index) => ({
  id: String(index),
  name,
  startsAt: new Date(Date.UTC(2027, 0, 12 + index)),
}));
const columns = importColumns(EVENTS);
const HEADERS = columns.map((column) => column.header);

const CITIES = ["Delhi", "Jaipur", "Mumbai", "Pune", "Lucknow", "Ahmedabad", "Kolkata", "Chandigarh", "Bhopal", "Indore", "Nagpur", "Hyderabad", "Bengaluru", "Chennai", "Surat"];
const NOTES = ["Needs a ground floor room", "Vegetarian only", "Coming from abroad", "Elderly guests, please seat near the entrance", "Two cars, needs parking"];

// The numbers in use. It starts with the number of the "Sharma family" that you add by hand
// before you import the messy file (see samples/README.md).
const used = new Set<string>(["+919876511111"]);

// A valid Indian mobile number that no other family has, written in a different way each time
// (the import must read all of them as the same standard number).
function phone(): string {
  for (;;) {
    const digits = String(faker.helpers.arrayElement([6, 7, 8, 9])) + faker.string.numeric(9);
    const standard = normalizePhone(digits);
    if (!standard || used.has(standard)) continue;
    used.add(standard);
    const style = faker.number.int({ min: 0, max: 3 });
    if (style === 0) return `${digits.slice(0, 5)} ${digits.slice(5)}`;
    if (style === 1) return `+91 ${digits.slice(0, 5)}-${digits.slice(5)}`;
    if (style === 2) return `0${digits}`;
    return digits;
  }
}

type Row = Record<string, string>;

// Turns a row (header -> text) into the cells of the file, in the order of the columns.
const cells = (headers: string[], row: Row) => headers.map((header) => (row[header] ? row[header] : null));

function familyRow(over: Row = {}): Row {
  const side = faker.helpers.weightedArrayElement([
    { weight: 45, value: "Bride" },
    { weight: 45, value: "Groom" },
    { weight: 10, value: "Both" },
  ]);
  const invited = new Set(
    EVENTS.filter((event) => faker.number.int({ min: 1, max: 100 }) <= { Haldi: 30, Mehendi: 30, Sangeet: 50, Wedding: 90, Reception: 60 }[event.name]!).map((e) => e.name),
  );
  if (invited.size === 0) invited.add("Wedding");

  const row: Row = {
    "Family name": `${faker.person.lastName()} family`,
    "Contact name": faker.person.firstName(),
    City: faker.helpers.arrayElement(CITIES),
    "Main number": phone(),
    "Second number": faker.number.int({ min: 1, max: 100 }) <= 30 ? phone() : "",
    Side: side,
    "Organizer email": faker.number.int({ min: 1, max: 100 }) <= 80 ? (side === "Bride" ? "rohan@example.com" : "ankit@example.com") : "",
    Notes: faker.number.int({ min: 1, max: 100 }) <= 10 ? faker.helpers.arrayElement(NOTES) : "",
  };
  for (const event of EVENTS) row[event.name] = invited.has(event.name) ? "yes" : "no";
  return { ...row, ...over };
}

const widths = (headers: string[]) => headers.map((header) => ({ width: Math.max(14, columns.find((c) => c.header === header)?.width ?? 14) }));
const headerCells = (headers: string[]) => headers.map((value) => ({ value, fontWeight: "bold" as const }));

async function write(path: string, headers: string[], rows: Row[]) {
  await writeExcelFile([{ sheet: "Guests", data: [headerCells(headers), ...rows.map((row) => cells(headers, row))], columns: widths(headers) }]).toFile(path);
  console.log(`${path}: ${rows.length} rows`);
}

// ---- 1. The clean file: 500 families, no mistakes ----
async function clean() {
  const rows = Array.from({ length: 500 }, () => familyRow());
  // 10 families have no number: only a warning, they can still be saved (FR-19).
  for (const index of faker.helpers.uniqueArray(Array.from({ length: 500 }, (_, i) => i), 10)) {
    rows[index]["Main number"] = "";
    rows[index]["Second number"] = "";
  }
  // Row 252 is the "Sharma family" that you add by hand before the import (samples/README.md). It is
  // one of the 500 rows, so the import says "499 new families, 1 already in the app" (AC-17.5).
  rows[250] = familyRow({ "Family name": "Sharma family", "Contact name": "Meena", City: "Jaipur", "Main number": "98765 11111", "Second number": "", Side: "Groom", "Organizer email": "ankit@example.com" });
  await write("samples/guests-clean-500.xlsx", HEADERS, rows);
}

// ---- 2. The messy file: good rows and rows with deliberate mistakes ----
async function messy() {
  const headers = [...HEADERS, "Mehndi"]; // an event column that does not exist in the app
  const repeated = phone();

  const rows: Row[] = [
    // 10 good rows
    ...Array.from({ length: 10 }, () => familyRow()),

    // a number that the Sharma family has (made by hand in the app, and also in the clean file): ERROR,
    // and it names the Sharma family. It is not in this file twice, so the file check passes it.
    familyRow({ "Family name": "Gupta family", "Main number": "+91 98765-11111" }),

    // the same number twice inside the file: ERROR on both rows
    familyRow({ "Family name": "Verma family", "Contact name": "Vikram", "Main number": repeated }),
    familyRow({ "Family name": "Verma family", "Contact name": "Vinay", City: "Pune", "Main number": repeated.replace(/\D/g, "") }),

    // no family name: ERROR (twice)
    familyRow({ "Family name": "" }),
    familyRow({ "Family name": "   ", "Contact name": "Asha" }),

    // no event with yes: ERROR (twice)
    familyRow({ "Family name": "Nair family", Haldi: "no", Mehendi: "no", Sangeet: "no", Wedding: "no", Reception: "no" }),
    familyRow({ "Family name": "Iyer family", Haldi: "", Mehendi: "", Sangeet: "", Wedding: "", Reception: "" }),

    // numbers in a wrong format: ERROR (three times)
    familyRow({ "Family name": "Bose family", "Main number": "98765 1111" }),
    familyRow({ "Family name": "Das family", "Main number": "hello" }),
    familyRow({ "Family name": "Rao family", "Main number": "12345" }),

    // a second number with no main number, and the same number twice in one family: ERROR
    familyRow({ "Family name": "Menon family", "Main number": "", "Second number": phone() }),
    (() => { const n = phone(); return familyRow({ "Family name": "Pillai family", "Main number": n, "Second number": n }); })(),

    // an organizer who is not on the team, and an organizer written as a name: ERROR
    familyRow({ "Family name": "Kapoor family", "Organizer email": "stranger@example.com" }),
    familyRow({ "Family name": "Khanna family", "Organizer email": "Rohan" }),

    // a side that is not allowed: ERROR. An empty side: only a WARNING (it becomes Both sides).
    familyRow({ "Family name": "Saxena family", Side: "middle" }),
    familyRow({ "Family name": "Bhatt family", Side: "" }),

    // no number at all: only a WARNING
    familyRow({ "Family name": "Joshi family", "Main number": "", "Second number": "" }),

    // an event column that does not exist ("Mehndi"): a problem of the whole file
    familyRow({ "Family name": "Chopra family", Mehndi: "yes" }),
  ];
  await write("samples/guests-messy.xlsx", headers, rows);
}

async function main() {
  await clean();
  await messy();
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
