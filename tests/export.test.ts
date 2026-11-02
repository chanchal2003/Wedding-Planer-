import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { buildFamiliesCsv, buildRepliesCsv, buildTeamCsv } from "@/lib/export/build";
import { raw, toCsv } from "@/lib/export/csv";
import { addMember, makeEvent, makeUser, makeWedding, resetDatabase } from "./helpers";

// FR-65, AC-65.1: the three CSV files. Fake data only.
const lines = (csv: string) => csv.replace(/^﻿/, "").trimEnd().split("\r\n");

describe("the CSV format", () => {
  it("starts with a BOM and ends each line with CRLF, so Excel reads Hindi names", () => {
    const csv = toCsv([["Name"], ["शर्मा परिवार"]]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toBe("﻿Name\r\nशर्मा परिवार\r\n");
  });

  it("quotes commas, quotes and line breaks", () => {
    expect(toCsv([['A, B', 'say "hi"', "two\nlines"]])).toBe('﻿"A, B","say ""hi""","two\nlines"\r\n');
  });

  it("puts a ' before a cell that Excel could read as a formula", () => {
    const rows = [['=HYPERLINK("http://example.com","click")', "+91 1", "-2+3", "@SUM(A1)", "\t=1", "Sharma = family"]];
    const cells = lines(toCsv(rows))[0];
    expect(cells).toContain(`"'=HYPERLINK(""http://example.com"",""click"")"`);
    expect(cells).toContain("'+91 1");
    expect(cells).toContain("'-2+3");
    expect(cells).toContain("'@SUM(A1)");
    expect(cells).toContain("Sharma = family"); // a sign in the middle is harmless
  });

  it("leaves a raw value (a checked phone number) as it is", () => {
    expect(lines(toCsv([[raw("+91 98765 11111")]]))[0]).toBe("+91 98765 11111");
  });
});

describe("the three files", () => {
  beforeEach(resetDatabase);
  afterAll(async () => {
    await resetDatabase();
    await db.$disconnect();
  });

  async function setup() {
    const priya = await makeUser("Priya");
    const wedding = await makeWedding("priya-rahul", priya.id);
    const rohan = await addMember(wedding.id, await makeUser("Rohan"));
    const gone = await addMember(wedding.id, await makeUser("Gone"), { status: "removed" });
    const haldi = await makeEvent(wedding.id, "Haldi", "haldi");
    const wed = await makeEvent(wedding.id, "Wedding", "wedding");
    await db.event.update({ where: { id: wed.id }, data: { startsAt: new Date("2027-01-15T04:30:00Z") } });

    const sharma = await db.family.create({
      data: { weddingId: wedding.id, familyName: "Sharma, Meena", contactName: "Meena", city: "Jaipur", side: "groom", assignedMemberId: rohan.id, invitationSentAt: new Date("2026-12-05T05:00:00Z"), invitationSentById: rohan.id, notes: "Ground floor" },
    });
    await db.familyPhone.create({ data: { familyId: sharma.id, weddingId: wedding.id, phone: "+919876511111", kind: "primary" } });
    await db.familyPhone.create({ data: { familyId: sharma.id, weddingId: wedding.id, phone: "+919876522222", kind: "secondary" } });
    const sharmaWed = await db.familyEvent.create({ data: { familyId: sharma.id, eventId: wed.id, weddingId: wedding.id } });
    await db.familyEvent.create({ data: { familyId: sharma.id, eventId: haldi.id, weddingId: wedding.id } });
    await db.reply.create({ data: { familyEventId: sharmaWed.id, attending: true, persons: 5, repliedByName: "Meena", source: "guest", repliedAt: new Date("2026-12-06T10:00:00Z") } });

    const formula = await db.family.create({ data: { weddingId: wedding.id, familyName: '=HYPERLINK("http://example.com","click")', side: "bride" } });
    await db.familyEvent.create({ data: { familyId: formula.id, eventId: haldi.id, weddingId: wedding.id } });
    return { priya, wedding, rohan, gone, haldi, wed, sharma, formula };
  }

  it("families.csv: one row for each family, phone numbers as text, events in order, dates in India time", async () => {
    const { wedding } = await setup();
    const rows = lines(await buildFamiliesCsv(wedding.id));

    expect(rows[0]).toBe("Family name,Contact name,City,Side,Main number,Second number,Events,Organizer,Invitation sent,Sent by,Notes");
    expect(rows).toHaveLength(3);
    const sharma = rows.find((row) => row.includes("Meena"))!;
    expect(sharma).toBe('"Sharma, Meena",Meena,Jaipur,Groom\'s side,+91 98765 11111,+91 98765 22222,"Haldi, Wedding",Rohan,2026-12-05 10:30,Rohan,Ground floor');
    expect(rows.some((row) => row.startsWith(`"'=HYPERLINK(`))).toBe(true); // the formula is text
  });

  it("replies.csv: one row for each invitation, also with no reply", async () => {
    const { wedding } = await setup();
    const rows = lines(await buildRepliesCsv(wedding.id));

    expect(rows[0]).toBe("Family,Contact name,City,Event,Answer,Persons,Replied by,Source,Updated by,Date");
    expect(rows).toHaveLength(4); // Sharma x2 and the formula family x1
    expect(rows).toContain('"Sharma, Meena",Meena,Jaipur,Wedding,Yes,5,Meena,Guest,,2026-12-06 15:30');
    expect(rows).toContain('"Sharma, Meena",Meena,Jaipur,Haldi,No reply,,,,,');
  });

  it("replies.csv shows a reply of the team with the name of the person", async () => {
    const { wedding, rohan, haldi, sharma } = await setup();
    const row = await db.familyEvent.findFirstOrThrow({ where: { familyId: sharma.id, eventId: haldi.id } });
    await db.reply.create({ data: { familyEventId: row.id, attending: false, source: "team", updatedById: rohan.id } });

    const rows = lines(await buildRepliesCsv(wedding.id));
    expect(rows.find((r) => r.includes(",Haldi,No,"))).toMatch(/,Team,Rohan,/);
  });

  it("team.csv: every person, also a removed one, with the status", async () => {
    const { wedding } = await setup();
    const rows = lines(await buildTeamCsv(wedding.id));

    expect(rows[0]).toBe("Name,Email,Role,Relation,Status");
    expect(rows).toHaveLength(3);
    expect(rows).toContain("Rohan,rohan@example.com,Organizer,Friend,Active");
    expect(rows).toContain("Gone,gone@example.com,Organizer,Friend,Removed");
  });

  it("never has the data of another wedding", async () => {
    const { priya, wedding } = await setup();
    const other = await makeWedding("other-wedding", priya.id);
    const stranger = await db.family.create({ data: { weddingId: other.id, familyName: "Stranger family", side: "groom" } });
    const event = await makeEvent(other.id, "Mehendi", "other");
    await db.familyEvent.create({ data: { familyId: stranger.id, eventId: event.id, weddingId: other.id } });
    await addMember(other.id, await makeUser("Outsider"));

    for (const csv of [await buildFamiliesCsv(wedding.id), await buildRepliesCsv(wedding.id), await buildTeamCsv(wedding.id)]) {
      expect(csv).not.toMatch(/Stranger|Mehendi|Outsider/);
    }
  });
});
