import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { markSent, myFamiliesProgress, undoSent } from "@/lib/families/invitation";
import { addMember, makeEvent, makeUser, makeWedding, resetDatabase } from "./helpers";

// FR-23, FR-24, AC-23.1: "Invitation sent" records the date and the person, and locks the link name.
async function setup() {
  const priya = await makeUser("Priya");
  const wedding = await makeWedding("priya-rahul", priya.id);
  const ankit = await addMember(wedding.id, await makeUser("Ankit"));
  const rohan = await addMember(wedding.id, await makeUser("Rohan"));
  const haldi = await makeEvent(wedding.id, "Haldi", "haldi");
  const family = async (familyName: string, assignedMemberId: string | null, weddingId = wedding.id) => {
    const created = await db.family.create({ data: { weddingId, familyName, side: "groom", assignedMemberId } });
    return created;
  };
  const withEvent = (familyId: string) => db.familyEvent.create({ data: { familyId, eventId: haldi.id, weddingId: wedding.id } });
  return { priya, wedding, ankit, rohan, haldi, family, withEvent };
}

describe("Invitation sent", () => {
  beforeEach(resetDatabase);
  afterAll(async () => {
    await resetDatabase();
    await db.$disconnect();
  });

  it("records the date and the person, and locks the link name (AC-23.1)", async () => {
    const { wedding, ankit, family } = await setup();
    const sharma = await family("Sharma family", ankit.id);
    const at = new Date("2026-12-02T10:00:00Z");

    const result = await markSent(wedding.id, sharma.id, ankit.id, at);

    expect(result).toMatchObject({ ok: true, by: "Ankit", sentAt: at });
    expect(await db.family.findUniqueOrThrow({ where: { id: sharma.id } })).toMatchObject({ invitationSentAt: at, invitationSentById: ankit.id });
    expect((await db.wedding.findUniqueOrThrow({ where: { id: wedding.id } })).slugLocked).toBe(true);
  });

  it("keeps the first tick when a second person ticks too", async () => {
    const { wedding, ankit, rohan, family } = await setup();
    const sharma = await family("Sharma family", ankit.id);
    const first = new Date("2026-12-02T10:00:00Z");
    await markSent(wedding.id, sharma.id, ankit.id, first);

    const second = await markSent(wedding.id, sharma.id, rohan.id, new Date("2026-12-03T10:00:00Z"));

    expect(second).toMatchObject({ ok: true, by: "Ankit", sentAt: first });
    expect((await db.family.findUniqueOrThrow({ where: { id: sharma.id } })).invitationSentById).toBe(ankit.id);
  });

  it("undo clears the date and the person, but the link name stays locked", async () => {
    const { wedding, rohan, ankit, family } = await setup();
    const sharma = await family("Sharma family", ankit.id);
    await markSent(wedding.id, sharma.id, ankit.id);

    expect((await undoSent(wedding.id, sharma.id, rohan.id)).ok).toBe(true); // any team member can undo

    expect(await db.family.findUniqueOrThrow({ where: { id: sharma.id } })).toMatchObject({ invitationSentAt: null, invitationSentById: null });
    expect((await db.wedding.findUniqueOrThrow({ where: { id: wedding.id } })).slugLocked).toBe(true);
  });

  it("refuses an undo of a family that is not sent", async () => {
    const { wedding, ankit, family } = await setup();
    const sharma = await family("Sharma family", ankit.id);
    expect(await undoSent(wedding.id, sharma.id, ankit.id)).toMatchObject({ ok: false, code: "NOT_ALLOWED_NOW" });
  });

  it("refuses a family or a member of another wedding, and a removed member (rule 2)", async () => {
    const { priya, wedding, ankit, family } = await setup();
    const sharma = await family("Sharma family", ankit.id);
    const other = await makeWedding("other-wedding", priya.id);
    const outsider = await addMember(other.id, await makeUser("Outsider"));
    const gone = await addMember(wedding.id, await makeUser("Gone"), { status: "removed" });

    expect(await markSent(other.id, sharma.id, outsider.id)).toMatchObject({ ok: false, code: "NOT_FOUND" }); // a family of another wedding
    expect(await markSent(wedding.id, sharma.id, outsider.id)).toMatchObject({ ok: false, code: "NOT_FOUND" }); // a member of another wedding
    expect(await markSent(wedding.id, sharma.id, gone.id)).toMatchObject({ ok: false, code: "NOT_FOUND" });
    expect((await db.family.findUniqueOrThrow({ where: { id: sharma.id } })).invitationSentAt).toBeNull();
    expect((await db.wedding.findUniqueOrThrow({ where: { id: wedding.id } })).slugLocked).toBe(false);
  });

  it("counts only the families assigned to the organizer: sent, replied and the chips (FR-24)", async () => {
    const { wedding, ankit, rohan, family, withEvent } = await setup();
    const a = await family("A family", ankit.id);
    const b = await family("B family", ankit.id);
    const c = await family("C family", ankit.id);
    await family("R family", rohan.id); // another organizer's family
    for (const f of [a, b, c]) await withEvent(f.id);
    await markSent(wedding.id, a.id, ankit.id);
    await markSent(wedding.id, b.id, ankit.id);
    const row = await db.familyEvent.findFirstOrThrow({ where: { familyId: a.id } });
    await db.reply.create({ data: { familyEventId: row.id, attending: true, persons: 2, repliedByName: "Meena", source: "guest" } });

    expect(await myFamiliesProgress(wedding.id, ankit.id)).toEqual({ total: 3, sent: 2, notSent: 1, noReply: 2, replied: 1 });
    expect(await myFamiliesProgress(wedding.id, rohan.id)).toMatchObject({ total: 1, sent: 0 });
  });
});
