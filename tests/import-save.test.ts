import { readFileSync } from "node:fs";
import { zipSync } from "fflate";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { changeTeam } from "@/lib/team/change";
import { checkXlsxIsSafe, readImportFile, TOO_BIG } from "@/lib/import/read";
import { checkImportFile, NOTHING_SAVED, saveImportFile } from "@/lib/import/run";
import { validateImportFile } from "@/lib/import/validateImportFile";
import { makeUser, resetDatabase } from "./helpers";

// The second half of the import: the check against the app and the save in one transaction
// (FR-16, FR-17, AC-17.1 and AC-17.4 to AC-17.6). Real functions, real database (shadidesk_test).

const clean = new Uint8Array(readFileSync("samples/guests-clean-500.xlsx"));
const messy = new Uint8Array(readFileSync("samples/guests-messy.xlsx"));
const csv = (text: string) => new TextEncoder().encode(text);

let weddingId = "";
let eventIds: Record<string, string> = {};
let rohanId = "";

// A wedding with the five events of the sample files, and a team: Rohan (active), Ankit (pending),
// and Former (removed).
async function setup(slug = "priya-rahul") {
  const priya = await db.user.upsert({ where: { email: "priya@example.com" }, update: {}, create: { name: "Priya", email: "priya@example.com", emailVerified: true } });
  const wedding = await db.wedding.create({ data: { slug, brideName: "Priya", groomName: "Rahul", weddingDate: new Date("2027-01-15"), isTest: true, createdById: priya.id } });
  const events: Record<string, string> = {};
  for (const [index, name] of ["Haldi", "Mehendi", "Sangeet", "Wedding", "Reception"].entries()) {
    events[name] = (await db.event.create({ data: { weddingId: wedding.id, type: "other", name, startsAt: new Date(Date.UTC(2027, 0, 12 + index, 4, 30)), hostedBy: "both" } })).id;
  }
  const member = (email: string, status: "active" | "pending" | "removed", userId: string | null) =>
    db.weddingMember.create({ data: { weddingId: wedding.id, email, userId, role: "organizer", relation: "friend", status } });
  const rohanUser = await db.user.upsert({ where: { email: "rohan@example.com" }, update: {}, create: { name: "Rohan", email: "rohan@example.com", emailVerified: true } });
  const rohan = await member("rohan@example.com", "active", rohanUser.id);
  await member("ankit@example.com", "pending", null);
  await member("former@example.com", "removed", null);
  return { weddingId: wedding.id, events, rohanId: rohan.id };
}

const counts = async (id = weddingId) => ({
  families: await db.family.count({ where: { weddingId: id } }),
  phones: await db.familyPhone.count({ where: { weddingId: id } }),
  invitations: await db.familyEvent.count({ where: { weddingId: id } }),
});

// Facts from the clean file, computed with the file check (not typed by hand).
async function cleanFacts() {
  const read = await readImportFile("guests-clean-500.xlsx", clean);
  if (!read.ok) throw new Error(read.message);
  const rows = validateImportFile(read.table, Object.entries(eventIds).map(([name, id]) => ({ id, name, startsAt: new Date() }))).rows;
  return {
    families: rows.length,
    phones: rows.reduce((n, r) => n + (r.primaryPhone ? 1 : 0) + (r.secondaryPhone ? 1 : 0), 0),
    invitations: rows.reduce((n, r) => n + r.eventIds.length, 0),
    withRohan: rows.filter((r) => r.organizerEmail === "rohan@example.com").length,
    withAnkit: rows.filter((r) => r.organizerEmail === "ankit@example.com").length,
  };
}

beforeEach(async () => {
  await resetDatabase();
  ({ weddingId, events: eventIds, rohanId } = await setup());
});
afterAll(async () => {
  await resetDatabase();
  await db.$disconnect();
});

describe("checking a file against the app", () => {
  it("shows what would happen, and saves nothing", async () => {
    const result = await checkImportFile(weddingId, "guests-clean-500.xlsx", clean);
    expect(result.ok && result.report).toMatchObject({ totalRows: 500, newRows: 500, skippedRows: 0, errorRows: 0, warningRows: 10, canSave: true });
    expect((await counts()).families).toBe(0);
  });

  it("refuses a number that another family has, and names that family (AC-17.6)", async () => {
    const sharma = await db.family.create({ data: { weddingId, familyName: "Sharma family", side: "groom" } });
    await db.familyPhone.create({ data: { familyId: sharma.id, weddingId, phone: "+919876511111", kind: "primary" } });

    const result = await checkImportFile(weddingId, "guests-messy.xlsx", messy);
    if (!result.ok) throw new Error(result.message);
    const gupta = result.report.problems.find((p) => p.code === "number-used-by-other-family");
    expect(gupta).toMatchObject({ familyName: "Gupta family", message: "This number is already used by the Sharma family." });
    expect(result.report.canSave).toBe(false);
  });

  it("refuses an organizer who is not on the team, or who was removed, but accepts a pending one", async () => {
    const file = csv("Family name,Side,Wedding,Organizer email\nA,Bride,yes,ankit@example.com\nB,Bride,yes,former@example.com\nC,Bride,yes,stranger@example.com\nD,Bride,yes,ROHAN@example.com\n");
    const result = await checkImportFile(weddingId, "guests.csv", file);
    if (!result.ok) throw new Error(result.message);
    expect(result.report.problems.filter((p) => p.code === "organizer-not-in-team").map((p) => p.familyName)).toEqual(["B", "C"]);
    expect(result.report.newRows).toBe(2);
  });

  it("says a family is already in the app when the name and the number are the same, even with other capital letters (AC-17.5)", async () => {
    const sharma = await db.family.create({ data: { weddingId, familyName: "Sharma family", side: "groom" } });
    await db.familyPhone.create({ data: { familyId: sharma.id, weddingId, phone: "+919876511111", kind: "primary" } });
    const file = csv("Family name,Main number,Side,Wedding\n  SHARMA   family ,098765 11111,Groom,yes\nSharma family,98765 55555,Groom,yes\n");
    const result = await checkImportFile(weddingId, "guests.csv", file);
    if (!result.ok) throw new Error(result.message);
    expect(result.report).toMatchObject({ newRows: 1, skippedRows: 1, errorRows: 0 }); // the second Sharma has another number: a new family
    expect(result.report.problems.map((p) => p.code)).toEqual(["already-in-app"]);
  });

  it("recognises a family with no number by its name, contact name and city", async () => {
    await db.family.create({ data: { weddingId, familyName: "Joshi family", contactName: "Asha", city: "Pune", side: "bride" } });
    const file = csv("Family name,Contact name,City,Side,Wedding\njoshi family,ASHA,pune,Bride,yes\nJoshi family,Asha,Delhi,Bride,yes\nJoshi family,Ravi,Pune,Bride,yes\nNew family,,,Bride,yes\nNew family,,,Bride,yes\n");
    const result = await checkImportFile(weddingId, "guests.csv", file);
    if (!result.ok) throw new Error(result.message);
    expect(result.report).toMatchObject({ newRows: 3, skippedRows: 2 });
    expect(result.report.problems.map((p) => p.code).sort()).toEqual(["already-in-app", "no-phone", "no-phone", "no-phone", "no-phone", "no-phone", "same-family-twice-in-file"].sort());
  });

  it("does not look at other weddings: the same number is fine in another wedding", async () => {
    const other = await setup("meena-niece");
    const sharma = await db.family.create({ data: { weddingId: other.weddingId, familyName: "Gupta family", side: "groom" } });
    await db.familyPhone.create({ data: { familyId: sharma.id, weddingId: other.weddingId, phone: "+919876511111", kind: "primary" } });

    const result = await checkImportFile(weddingId, "guests-clean-500.xlsx", clean);
    expect(result.ok && result.report.skippedRows).toBe(0);
    expect(result.ok && result.report.newRows).toBe(500);
  });
});

describe("saving (AC-17.4, AC-17.5)", () => {
  it("saves the whole clean file, with the numbers, the events and the organizers", async () => {
    const facts = await cleanFacts();
    const result = await saveImportFile(weddingId, "guests-clean-500.xlsx", clean);
    expect(result).toEqual({ ok: true, saved: 500, skipped: 0 });
    expect(await counts()).toEqual({ families: facts.families, phones: facts.phones, invitations: facts.invitations });
    const ankit = await db.weddingMember.findFirstOrThrow({ where: { weddingId, email: "ankit@example.com" } });
    expect(await db.family.count({ where: { weddingId, assignedMemberId: rohanId } })).toBe(facts.withRohan);
    expect(await db.family.count({ where: { weddingId, assignedMemberId: ankit.id } })).toBe(facts.withAnkit);
  });

  it("saves only the new families, and does not change the family that is already there (AC-17.5)", async () => {
    const sharma = await db.family.create({ data: { weddingId, familyName: "Sharma family", contactName: "Old contact", side: "bride", notes: "made by hand" } });
    await db.familyPhone.create({ data: { familyId: sharma.id, weddingId, phone: "+919876511111", kind: "primary" } });
    await db.familyEvent.create({ data: { familyId: sharma.id, eventId: eventIds.Haldi, weddingId } });

    const result = await saveImportFile(weddingId, "guests-clean-500.xlsx", clean);
    expect(result).toEqual({ ok: true, saved: 499, skipped: 1 });
    const after = await db.family.findUniqueOrThrow({ where: { id: sharma.id }, include: { phones: true, familyEvents: true } });
    expect([after.contactName, after.side, after.notes, after.assignedMemberId]).toEqual(["Old contact", "bride", "made by hand", null]);
    expect(after.phones).toHaveLength(1);
    expect(after.familyEvents).toHaveLength(1);
  });

  it("saves nothing when the second import of the same file has no new family", async () => {
    await saveImportFile(weddingId, "guests-clean-500.xlsx", clean);
    const before = await counts();
    const check = await checkImportFile(weddingId, "guests-clean-500.xlsx", clean);
    expect(check.ok && check.report).toMatchObject({ newRows: 0, skippedRows: 500, canSave: false }); // also the 10 families with no number
    const again = await saveImportFile(weddingId, "guests-clean-500.xlsx", clean);
    expect(again.ok).toBe(false);
    expect(await counts()).toEqual(before);
  });

  it("saves NOTHING when the file has an error (AC-17.4)", async () => {
    const result = await saveImportFile(weddingId, "guests-messy.xlsx", messy);
    expect(result).toMatchObject({ ok: false, message: NOTHING_SAVED });
    expect(await counts()).toEqual({ families: 0, phones: 0, invitations: 0 });
  });

  it("saves nothing when the data changes between the check and the save", async () => {
    const check = await checkImportFile(weddingId, "guests-clean-500.xlsx", clean);
    expect(check.ok && check.report.canSave).toBe(true);
    // Rohan adds a family by hand, with a number that is in the file, under another name.
    const read = await readImportFile("x.xlsx", clean);
    if (!read.ok) throw new Error();
    const number = read.table.rows[0][3].replace(/\D/g, "").slice(-10);
    const intruder = await db.family.create({ data: { weddingId, familyName: "Intruder family", side: "bride" } });
    await db.familyPhone.create({ data: { familyId: intruder.id, weddingId, phone: `+91${number}`, kind: "primary" } });

    const result = await saveImportFile(weddingId, "guests-clean-500.xlsx", clean);
    expect(result).toMatchObject({ ok: false, message: NOTHING_SAVED });
    expect((await counts()).families).toBe(1); // only the intruder
  });

  it("undoes everything when a step in the middle fails", async () => {
    await db.$executeRawUnsafe(`CREATE OR REPLACE FUNCTION _import_test_fail() RETURNS trigger AS $$ BEGIN RAISE EXCEPTION 'test failure'; END $$ LANGUAGE plpgsql`);
    await db.$executeRawUnsafe(`CREATE TRIGGER _import_test_trigger BEFORE INSERT ON family_events FOR EACH ROW EXECUTE FUNCTION _import_test_fail()`);
    try {
      const result = await saveImportFile(weddingId, "guests-clean-500.xlsx", clean);
      expect(result).toMatchObject({ ok: false, message: NOTHING_SAVED });
      // The families and the numbers were inserted before the failing step, and are gone again.
      expect(await counts()).toEqual({ families: 0, phones: 0, invitations: 0 });
    } finally {
      await db.$executeRawUnsafe(`DROP TRIGGER IF EXISTS _import_test_trigger ON family_events`);
      await db.$executeRawUnsafe(`DROP FUNCTION IF EXISTS _import_test_fail()`);
    }
  });

  it("two saves of the same file at the same moment: one saves, nothing is doubled", async () => {
    const facts = await cleanFacts();
    const [a, b] = await Promise.all([saveImportFile(weddingId, "guests-clean-500.xlsx", clean), saveImportFile(weddingId, "guests-clean-500.xlsx", clean)]);
    expect([a.ok, b.ok].sort()).toEqual([false, true]);
    expect((await counts()).families).toBe(facts.families); // not 1000, also not for the families with no number
  });

  it("two saves at the same moment of a file with only no-number families: nothing is doubled (the database cannot help here)", async () => {
    const file = csv("Family name,Contact name,City,Side,Wedding\n" + Array.from({ length: 30 }, (_, i) => `Family ${i},Contact ${i},Pune,Bride,yes`).join("\n"));
    const [a, b] = await Promise.all([saveImportFile(weddingId, "guests.csv", file), saveImportFile(weddingId, "guests.csv", file)]);
    expect([a.ok, b.ok].sort()).toEqual([false, true]);
    expect((await counts()).families).toBe(30);
  });

  it("waits while an organizer is being removed, and then refuses that organizer (FR-13)", async () => {
    // The removal holds the lock of the team for a while, and commits. The save starts in the middle.
    const removal = db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM wedding_members WHERE wedding_id = ${weddingId}::uuid FOR UPDATE`;
      await new Promise((resolve) => setTimeout(resolve, 700));
      await tx.weddingMember.update({ where: { id: rohanId }, data: { status: "removed" } });
    });
    await new Promise((resolve) => setTimeout(resolve, 150));
    const started = Date.now();
    const file = csv("Family name,Side,Wedding,Organizer email\nSharma family,Groom,yes,rohan@example.com\n");
    const result = await saveImportFile(weddingId, "guests.csv", file);
    await removal;
    expect(Date.now() - started).toBeGreaterThan(300); // it really waited
    expect(result).toMatchObject({ ok: false, message: NOTHING_SAVED }); // and then saw that Rohan is removed
    expect((await counts()).families).toBe(0);
  });

  it("never assigns a family to an organizer who is removed at the same moment (FR-13)", async () => {
    const admin = await db.weddingMember.create({ data: { weddingId, email: "dad@example.com", userId: (await makeUser("Dad")).id, role: "admin", relation: "parent", status: "active" } });
    const actor = { memberId: admin.id, userId: admin.userId! };
    const remove = () =>
      changeTeam(weddingId, actor, { kind: "remove", memberId: rohanId }, async (tx) => {
        await tx.weddingMember.updateMany({ where: { id: rohanId, weddingId }, data: { status: "removed" } });
        return null;
      });

    const [saved, removed] = await Promise.all([saveImportFile(weddingId, "guests-clean-500.xlsx", clean), remove()]);
    const rohanNow = await db.weddingMember.findUniqueOrThrow({ where: { id: rohanId } });
    const withRohan = await db.family.count({ where: { weddingId, assignedMemberId: rohanId } });
    if (rohanNow.status === "removed") {
      expect(withRohan).toBe(0); // removed first: the import saw it and refused Rohan's emails
      expect(saved.ok).toBe(false);
    } else {
      expect(removed.ok).toBe(false); // saved first: the removal saw the families and refused
      expect(withRohan).toBeGreaterThan(0);
    }
  });
});

describe("a hostile file", () => {
  const sheet = (xml: string) => zipSync({ "[Content_Types].xml": new TextEncoder().encode("<Types/>"), "xl/worksheets/sheet1.xml": new TextEncoder().encode(xml) });

  it("is refused before it is read: one cell at the far corner of the sheet", async () => {
    const bytes = sheet('<worksheet><sheetData><row r="1048576"><c r="XFD1048576" t="inlineStr"><is><t>x</t></is></c></row></sheetData></worksheet>');
    const started = Date.now();
    const result = await readImportFile("guests.xlsx", bytes);
    expect(result).toEqual({ ok: false, message: TOO_BIG });
    expect(Date.now() - started).toBeLessThan(2000);
  });

  it("is refused before it is read: a file that unpacks to 25 MB", async () => {
    const bomb = zipSync({ "xl/worksheets/sheet1.xml": new Uint8Array(25 * 1024 * 1024) });
    expect(bomb.length).toBeLessThan(200_000); // small to send, big to unpack
    expect(checkXlsxIsSafe(bomb)).toBe(TOO_BIG);
    expect(await readImportFile("guests.xlsx", bomb)).toEqual({ ok: false, message: TOO_BIG });
  });

  it("is refused: too many columns in the sheet, and not a zip file at all", async () => {
    expect(checkXlsxIsSafe(sheet('<worksheet><sheetData><row r="1"><c r="ZZ1"><v>1</v></c></row></sheetData></worksheet>'))).toContain("too many columns");
    expect(checkXlsxIsSafe(new TextEncoder().encode("not a zip"))).toContain("could not read");
  });

  it("lets the real sample files through", () => {
    expect(checkXlsxIsSafe(clean)).toBeNull();
    expect(checkXlsxIsSafe(messy)).toBeNull();
  });
});
