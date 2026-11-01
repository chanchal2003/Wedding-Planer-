import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { loadInvitation } from "@/lib/rsvp/invitation";
import { submitFamilyReplies } from "@/lib/rsvp/submit";
import { saveTeamReply } from "@/lib/rsvp/team-reply";
import { addMember, makeEvent, makeUser, makeWedding, resetDatabase } from "./helpers";

// FR-41, AC-41.1, AC-37.2, NFR-9: a team member enters or changes a reply. The last dates do not stop the team.
async function setup() {
  const priya = await makeUser("Priya");
  const wedding = await makeWedding("priya-rahul", priya.id);
  await db.wedding.update({ where: { id: wedding.id }, data: { rsvpLastDate: new Date("2026-12-31") } });
  const rohan = await addMember(wedding.id, await makeUser("Rohan"));
  const haldi = await makeEvent(wedding.id, "Haldi", "haldi");
  const wed = await makeEvent(wedding.id, "Wedding", "wedding");
  const sangeet = await makeEvent(wedding.id, "Sangeet", "other");
  const verma = await db.family.create({ data: { weddingId: wedding.id, familyName: "Verma family", side: "bride" } });
  for (const event of [haldi, wed]) await db.familyEvent.create({ data: { familyId: verma.id, eventId: event.id, weddingId: wedding.id } });

  const enter = (eventId: string, reply: unknown, over: { memberId?: string; familyId?: string; weddingId?: string; now?: Date } = {}) =>
    saveTeamReply({ weddingId: over.weddingId ?? wedding.id, familyId: over.familyId ?? verma.id, eventId, memberId: over.memberId ?? rohan.id, reply, now: over.now });
  const replyOf = (eventId: string) => db.reply.findFirst({ where: { familyEvent: { familyId: verma.id, eventId } } });
  return { priya, wedding, rohan, haldi, wed, sangeet, verma, enter, replyOf };
}

describe("the team enters a reply", () => {
  beforeEach(resetDatabase);
  afterAll(async () => {
    await resetDatabase();
    await db.$disconnect();
  });

  it("saves 'Wedding: yes, 5 persons' for Rohan, and the guest page shows 'Updated by Rohan' (AC-41.1)", async () => {
    const { wedding, rohan, wed, verma, enter, replyOf } = await setup();
    expect(await enter(wed.id, { attending: true, persons: 5 })).toEqual({ ok: true });

    expect(await replyOf(wed.id)).toMatchObject({ attending: true, persons: 5, source: "team", updatedById: rohan.id, repliedByName: null });
    const invitation = await loadInvitation(wedding.id, verma.id);
    expect(invitation?.events[1].reply).toMatchObject({ byTeam: true, updatedBy: "Rohan" });
  });

  it("works after the last date (AC-37.2)", async () => {
    const { wedding, verma, haldi, enter } = await setup();
    const afterLastDate = new Date("2027-01-05T10:00:00Z");
    expect((await loadInvitation(wedding.id, verma.id, afterLastDate))?.isClosed).toBe(true);
    expect(await enter(haldi.id, { attending: false, persons: null }, { now: afterLastDate })).toEqual({ ok: true });
  });

  it("changes a guest reply, keeps the guest's name in the record, and counts it as a team reply", async () => {
    const { wedding, rohan, haldi, wed, verma, enter, replyOf } = await setup();
    await submitFamilyReplies({
      weddingId: wedding.id,
      familyId: verma.id,
      reply: { repliedByName: "Uncle Verma", answers: [{ eventId: haldi.id, attending: true, persons: 2 }, { eventId: wed.id, attending: true, persons: 2 }] },
    });

    expect(await enter(wed.id, { attending: false, persons: null })).toEqual({ ok: true });

    expect(await replyOf(wed.id)).toMatchObject({ attending: false, persons: null, source: "team", updatedById: rohan.id, repliedByName: "Uncle Verma" });
    expect(await replyOf(haldi.id)).toMatchObject({ source: "guest", persons: 2 }); // the other event is untouched
    expect(await db.reply.count()).toBe(2); // changed, never added twice
  });

  it("refuses Yes with no persons, and saves No without persons", async () => {
    const { haldi, enter, replyOf } = await setup();
    expect((await enter(haldi.id, { attending: true, persons: null })).ok).toBe(false);
    expect((await enter(haldi.id, { attending: true, persons: 0 })).ok).toBe(false);
    expect(await replyOf(haldi.id)).toBeNull();

    await enter(haldi.id, { attending: false, persons: 7 });
    expect(await replyOf(haldi.id)).toMatchObject({ attending: false, persons: null });
  });

  it("refuses an event that is not on the invitation, and a family, an event or a member of another wedding (NFR-9)", async () => {
    const { priya, wedding, haldi, sangeet, verma, enter } = await setup();
    const other = await makeWedding("other-wedding", priya.id);
    const outsider = await addMember(other.id, await makeUser("Outsider"));
    const foreignEvent = await makeEvent(other.id, "Haldi", "haldi");
    const yes = { attending: true, persons: 1 };

    expect((await enter(sangeet.id, yes)).ok).toBe(false); // the Sangeet is not on this invitation
    expect((await enter(foreignEvent.id, yes)).ok).toBe(false);
    expect((await enter(haldi.id, yes, { memberId: outsider.id })).ok).toBe(false); // a member of another wedding
    expect((await enter(haldi.id, yes, { weddingId: other.id })).ok).toBe(false); // a family of another wedding
    expect(await db.reply.count()).toBe(0);
    void wedding;
    void verma;
  });

  it("refuses a removed team member", async () => {
    const { wedding, haldi, enter } = await setup();
    const gone = await addMember(wedding.id, await makeUser("Gone"), { status: "removed" });
    expect((await enter(haldi.id, { attending: true, persons: 1 }, { memberId: gone.id })).ok).toBe(false);
  });

  it("ends with one reply and no error when the team and a guest save the same event at the same moment", async () => {
    const { wedding, haldi, wed, verma, enter } = await setup();
    const guest = submitFamilyReplies({
      weddingId: wedding.id,
      familyId: verma.id,
      reply: { repliedByName: "Meena", answers: [{ eventId: haldi.id, attending: true, persons: 3 }, { eventId: wed.id, attending: true, persons: 3 }] },
    });
    const team = enter(haldi.id, { attending: false, persons: null });

    const [guestResult, teamResult] = await Promise.all([guest, team]);

    expect(teamResult.ok).toBe(true);
    expect(guestResult.ok || guestResult.code === "ALREADY_REPLIED").toBe(true);
    expect(await db.reply.count({ where: { familyEvent: { eventId: haldi.id } } })).toBe(1);
  });
});
