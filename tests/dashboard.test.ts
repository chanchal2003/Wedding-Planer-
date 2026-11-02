import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { getDashboardStats } from "@/lib/dashboard/stats";
import { addMember, makeEvent, makeUser, makeWedding, resetDatabase } from "./helpers";

// FR-24, FR-43, FR-44, AC-24.1, AC-43.1: the numbers of the dashboard. A small wedding with 6 families.
async function setup() {
  const priya = await makeUser("Priya");
  const wedding = await makeWedding("priya-rahul", priya.id);
  const ankit = await addMember(wedding.id, await makeUser("Ankit"));
  const rohan = await addMember(wedding.id, await makeUser("Rohan"));
  const haldi = await makeEvent(wedding.id, "Haldi", "haldi");
  const wed = await makeEvent(wedding.id, "Wedding", "wedding");

  type Answer = { attending: boolean; persons?: number };
  const family = async (
    familyName: string,
    side: "bride" | "groom" | "both",
    options: { organizer?: string; sent?: boolean; phone?: string; haldi?: Answer | null | "off"; wedding?: Answer | null },
  ) => {
    const created = await db.family.create({
      data: { weddingId: wedding.id, familyName, side, assignedMemberId: options.organizer ?? null, invitationSentAt: options.sent ? new Date() : null },
    });
    if (options.phone) await db.familyPhone.create({ data: { familyId: created.id, weddingId: wedding.id, phone: options.phone, kind: "primary" } });
    for (const [event, answer] of [[haldi, options.haldi], [wed, options.wedding]] as const) {
      if (answer === "off") continue; // not invited to this event
      const row = await db.familyEvent.create({ data: { familyId: created.id, eventId: event.id, weddingId: wedding.id } });
      if (answer) await db.reply.create({ data: { familyEventId: row.id, attending: answer.attending, persons: answer.attending ? (answer.persons ?? 1) : null, source: "guest" } });
    }
    return created;
  };

  await family("Sharma", "groom", { organizer: ankit.id, sent: true, phone: "+919876500001", haldi: { attending: true, persons: 2 }, wedding: { attending: true, persons: 4 } });
  await family("Verma", "bride", { organizer: ankit.id, sent: true, phone: "+919876500002", haldi: { attending: false }, wedding: { attending: false } });
  await family("Gupta", "groom", { organizer: ankit.id, phone: "+919876500003", haldi: "off", wedding: { attending: false } });
  await family("Rao", "both", { organizer: rohan.id, phone: "+919876500004", haldi: { attending: true, persons: 3 }, wedding: { attending: false } });
  await family("Nair", "bride", { organizer: rohan.id, haldi: null, wedding: null });
  await family("Iyer", "groom", { haldi: "off", wedding: null });
  return { priya, wedding, ankit, rohan, haldi, wed };
}

describe("the dashboard numbers", () => {
  beforeEach(resetDatabase);
  afterAll(async () => {
    await resetDatabase();
    await db.$disconnect();
  });

  it("counts an event: invited, yes with persons, no and no reply, by side and in total (AC-43.1)", async () => {
    const { wedding, haldi, wed } = await setup();
    const stats = await getDashboardStats(wedding.id);
    const of = (id: string) => stats.events.find((event) => event.id === id)!.counts;

    expect(of(wed.id).total).toEqual({ invited: 6, yes: 1, persons: 4, no: 3, noReply: 2 });
    expect(of(wed.id).groom).toEqual({ invited: 3, yes: 1, persons: 4, no: 1, noReply: 1 });
    expect(of(haldi.id).total).toEqual({ invited: 4, yes: 2, persons: 5, no: 1, noReply: 1 });
    expect(of(haldi.id).both).toEqual({ invited: 1, yes: 1, persons: 3, no: 0, noReply: 0 });
  });

  it("counts every family once for the whole wedding, with its largest headcount", async () => {
    const { wedding } = await setup();
    const { wedding: whole } = await getDashboardStats(wedding.id);

    // Sharma (Haldi 2, Wedding 4) counts 4, not 6. Rao (yes Haldi, no Wedding) is a yes. Verma and Gupta are no.
    expect(whole.total).toEqual({ invited: 6, yes: 2, persons: 7, no: 2, noReply: 2 });
    expect(whole.bride).toEqual({ invited: 2, yes: 0, persons: 0, no: 1, noReply: 1 });
    expect(whole.groom).toEqual({ invited: 3, yes: 1, persons: 4, no: 1, noReply: 1 });
    expect(whole.both).toEqual({ invited: 1, yes: 1, persons: 3, no: 0, noReply: 0 });
  });

  it("shows families, sent and replied for each organizer, and a line for families with no organizer (AC-24.1)", async () => {
    const { wedding } = await setup();
    const { organizers } = await getDashboardStats(wedding.id);

    expect(organizers.map((o) => [o.name, o.families, o.sent, o.replied])).toEqual([
      ["Ankit", 3, 2, 3],
      ["Rohan", 2, 0, 1],
      ["No organizer yet", 1, 0, 0],
    ]);
  });

  it("counts the three 'needs attention' rows like the filters of the Families list (FR-44)", async () => {
    const { wedding } = await setup();
    const stats = await getDashboardStats(wedding.id);

    expect(stats.attention).toEqual({ noReply: 2, noPhone: 2, notSent: 4 });
    expect(stats).toMatchObject({ families: 6, replied: 4, sent: 2 });
  });

  it("never counts a family of another wedding", async () => {
    const { priya, wedding } = await setup();
    const other = await makeWedding("other-wedding", priya.id);
    const event = await makeEvent(other.id, "Haldi", "haldi");
    const stranger = await db.family.create({ data: { weddingId: other.id, familyName: "Stranger", side: "groom" } });
    await db.familyEvent.create({ data: { familyId: stranger.id, eventId: event.id, weddingId: other.id } });

    const stats = await getDashboardStats(wedding.id);
    expect(stats.families).toBe(6);
    expect(stats.wedding.total.invited).toBe(6);
    expect(stats.events.map((e) => e.id)).not.toContain(event.id);
    expect((await getDashboardStats(other.id)).wedding.total.invited).toBe(1);
  });
});
