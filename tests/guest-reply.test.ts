import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { loadInvitation } from "@/lib/rsvp/invitation";
import { submitFamilyReplies } from "@/lib/rsvp/submit";
import { addMember, makeEvent, makeUser, makeWedding, resetDatabase } from "./helpers";

// FR-32 to FR-37, FR-42, AC-32.1 to AC-37.1, NFR-9. The Sharma family is invited to the Haldi and the
// Wedding only. The Sangeet is not on its invitation.
async function setup(rsvpLastDate: string | null = null) {
  const priya = await makeUser("Priya");
  const wedding = await makeWedding("priya-rahul", priya.id);
  if (rsvpLastDate) await db.wedding.update({ where: { id: wedding.id }, data: { rsvpLastDate: new Date(rsvpLastDate) } });
  const rohanUser = await makeUser("Rohan");
  const rohan = await addMember(wedding.id, rohanUser);
  const haldi = await makeEvent(wedding.id, "Haldi", "haldi");
  const wed = await makeEvent(wedding.id, "Wedding", "wedding");
  const sangeet = await makeEvent(wedding.id, "Sangeet", "other");
  const sharma = await db.family.create({ data: { weddingId: wedding.id, familyName: "Sharma family", side: "groom", assignedMemberId: rohan.id } });
  for (const event of [haldi, wed]) await db.familyEvent.create({ data: { familyId: sharma.id, eventId: event.id, weddingId: wedding.id } });

  const reply = (answers: { eventId: string; attending: boolean; persons: number | null }[], repliedByName = "Meena", now?: Date, familyId = sharma.id, weddingId = wedding.id) =>
    submitFamilyReplies({ weddingId, familyId, reply: { repliedByName, answers }, now });
  const both = [
    { eventId: haldi.id, attending: true, persons: 4 },
    { eventId: wed.id, attending: false, persons: null },
  ];
  return { priya, wedding, rohan, haldi, wed, sangeet, sharma, reply, both };
}

describe("the reply of a family", () => {
  beforeEach(resetDatabase);
  afterAll(async () => {
    await resetDatabase();
    await db.$disconnect();
  });

  it("shows only the events on the invitation of the family (AC-32.1)", async () => {
    const { wedding, sharma } = await setup();
    const invitation = await loadInvitation(wedding.id, sharma.id);
    expect(invitation?.events.map((event) => event.name)).toEqual(["Haldi", "Wedding"]);
    expect(invitation?.contact).toBe("Rohan");
    expect(JSON.stringify(invitation)).not.toMatch(/Sangeet|note|budget|example\.com/i);
  });

  it("never loads a family through another wedding (NFR-9)", async () => {
    const { priya, sharma } = await setup();
    const other = await makeWedding("other-wedding", priya.id);
    expect(await loadInvitation(other.id, sharma.id)).toBeNull();
  });

  it("accepts any number of persons up to the technical limit (AC-33.1)", async () => {
    const { haldi, wed, reply } = await setup();
    const result = await reply([{ eventId: haldi.id, attending: true, persons: 12 }, { eventId: wed.id, attending: true, persons: 500 }]);
    expect(result).toEqual({ ok: true, saved: 2 });
  });

  it("saves the answers with the name, and a No has no persons (AC-34.2)", async () => {
    const { wedding, sharma, reply, both } = await setup();
    expect(await reply(both)).toEqual({ ok: true, saved: 2 });

    const invitation = await loadInvitation(wedding.id, sharma.id);
    expect(invitation?.events[0].reply).toMatchObject({ attending: true, persons: 4, repliedByName: "Meena", byTeam: false });
    expect(invitation?.events[1].reply).toMatchObject({ attending: false, persons: null });
  });

  it("refuses Yes with no persons, an empty name and a missing event", async () => {
    const { haldi, wed, reply } = await setup();
    expect((await reply([{ eventId: haldi.id, attending: true, persons: null }, { eventId: wed.id, attending: false, persons: null }])).ok).toBe(false);
    expect((await reply([{ eventId: haldi.id, attending: true, persons: 0 }, { eventId: wed.id, attending: false, persons: null }])).ok).toBe(false);
    expect((await reply([{ eventId: haldi.id, attending: false, persons: null }, { eventId: wed.id, attending: false, persons: null }], "   ")).ok).toBe(false);
    expect((await reply([{ eventId: haldi.id, attending: false, persons: null }])).ok).toBe(false); // the Wedding has no answer
    expect(await db.reply.count()).toBe(0);
  });

  it("refuses an event that is not on the invitation, or of another wedding (NFR-9)", async () => {
    const { priya, haldi, wed, sangeet, reply } = await setup();
    const other = await makeWedding("other-wedding", priya.id);
    const foreign = await makeEvent(other.id, "Haldi", "haldi");
    const no = (eventId: string) => ({ eventId, attending: false, persons: null });

    expect((await reply([no(haldi.id), no(wed.id), no(sangeet.id)])).ok).toBe(false);
    expect((await reply([no(haldi.id), no(foreign.id)])).ok).toBe(false);
    expect(await db.reply.count()).toBe(0);
  });

  it("never changes a reply that exists (AC-36.1, AC-36.2)", async () => {
    const { wedding, sharma, haldi, wed, reply, both } = await setup();
    await reply(both);

    const again = await reply([{ eventId: haldi.id, attending: false, persons: null }, { eventId: wed.id, attending: true, persons: 9 }], "Rohan");

    expect(again).toMatchObject({ ok: false, code: "ALREADY_REPLIED" });
    const invitation = await loadInvitation(wedding.id, sharma.id);
    expect(invitation?.events[0].reply).toMatchObject({ attending: true, persons: 4, repliedByName: "Meena" });
  });

  it("keeps the first reply when two people submit at the same moment (AC-35.1)", async () => {
    const { reply, haldi, wed } = await setup();
    const meena = reply([{ eventId: haldi.id, attending: true, persons: 2 }, { eventId: wed.id, attending: true, persons: 2 }], "Meena");
    const son = reply([{ eventId: haldi.id, attending: false, persons: null }, { eventId: wed.id, attending: false, persons: null }], "Rohan");

    const results = await Promise.all([meena, son]);

    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(results.filter((r) => !r.ok && r.code === "ALREADY_REPLIED")).toHaveLength(1);
    expect(await db.reply.count()).toBe(2); // one set only
    expect(new Set((await db.reply.findMany()).map((r) => r.repliedByName)).size).toBe(1);
  });

  it("lets the guest answer only the open events when the team entered one (FR-35)", async () => {
    const { wedding, sharma, rohan, haldi, wed, reply } = await setup();
    const row = await db.familyEvent.findFirstOrThrow({ where: { familyId: sharma.id, eventId: wed.id } });
    await db.reply.create({ data: { familyEventId: row.id, attending: true, persons: 5, source: "team", updatedById: rohan.id } });

    const invitation = await loadInvitation(wedding.id, sharma.id);
    expect(invitation?.events[1].reply).toMatchObject({ byTeam: true, updatedBy: "Rohan" });

    expect((await reply([{ eventId: haldi.id, attending: true, persons: 3 }, { eventId: wed.id, attending: false, persons: null }])).ok).toBe(false); // the Wedding has a reply
    expect(await reply([{ eventId: haldi.id, attending: true, persons: 3 }])).toEqual({ ok: true, saved: 1 });
    expect((await db.reply.findFirstOrThrow({ where: { familyEventId: row.id } })).persons).toBe(5); // the team's reply stays
  });

  it("closes at 23:59 India time on the last date, for guests only (AC-37.1)", async () => {
    const { wedding, sharma, reply, both } = await setup("2026-12-31");
    const lastMinute = new Date("2026-12-31T18:29:00Z"); // 23:59 in India
    const nextMinute = new Date("2026-12-31T18:30:00Z"); // 00:00 on 1 January in India

    const closed = await reply(both, "Meena", nextMinute);
    expect(closed).toMatchObject({ ok: false, code: "CLOSED", message: "Replies are closed. Contact Rohan." });
    expect((await loadInvitation(wedding.id, sharma.id, nextMinute))?.isClosed).toBe(true);
    expect((await loadInvitation(wedding.id, sharma.id, lastMinute))?.isClosed).toBe(false);

    expect(await reply(both, "Meena", lastMinute)).toEqual({ ok: true, saved: 2 });
  });

  it("says who to contact when the family has no organizer", async () => {
    const { wedding, sharma, reply, both } = await setup("2026-12-31");
    await db.family.update({ where: { id: sharma.id }, data: { assignedMemberId: null } });
    const closed = await reply(both, "Meena", new Date("2027-01-02T00:00:00Z"));
    expect(closed).toMatchObject({ code: "CLOSED", message: "Replies are closed. Contact the person who sent you the card." });
    void wedding;
  });
});
