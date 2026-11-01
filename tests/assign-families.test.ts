import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { assignByScope } from "@/lib/families/assign";
import { addMember, makeUser, makeWedding, resetDatabase } from "./helpers";

// FR-21, AC-21.1: Priya assigns "all groom side" to Ankit.
async function setup() {
  const priya = await makeUser("Priya");
  const ankitUser = await makeUser("Ankit");
  const rohanUser = await makeUser("Rohan");
  const wedding = await makeWedding("priya-rahul", priya.id);
  const ankit = await addMember(wedding.id, ankitUser);
  const rohan = await addMember(wedding.id, rohanUser);
  const family = (name: string, side: "bride" | "groom" | "both", assignedMemberId: string | null = null, weddingId = wedding.id) =>
    db.family.create({ data: { weddingId, familyName: name, side, assignedMemberId } });
  return { priya, wedding, ankit, rohan, family };
}

const assignedTo = (weddingId: string) =>
  db.family.findMany({ where: { weddingId }, select: { familyName: true, assignedMemberId: true }, orderBy: { familyName: "asc" } });

describe("assignByScope", () => {
  beforeEach(resetDatabase);
  afterAll(async () => {
    await resetDatabase();
    await db.$disconnect();
  });

  it("assigns only the families of one side", async () => {
    const { wedding, ankit, family } = await setup();
    await family("Sharma", "groom");
    await family("Verma", "groom");
    await family("Gupta", "bride");

    const result = await db.$transaction((tx) => assignByScope(tx, wedding.id, { scope: "groom", onlyUnassigned: true, memberId: ankit.id }));

    expect(result).toMatchObject({ ok: true, assigned: 2 });
    const rows = await assignedTo(wedding.id);
    expect(rows.map((r) => r.assignedMemberId)).toEqual([null, ankit.id, ankit.id]); // Gupta, Sharma, Verma
  });

  it("keeps an existing organizer when onlyUnassigned is on, and moves the family when it is off", async () => {
    const { wedding, ankit, rohan, family } = await setup();
    await family("Sharma", "groom", rohan.id);
    await family("Verma", "groom");

    await db.$transaction((tx) => assignByScope(tx, wedding.id, { scope: "all", onlyUnassigned: true, memberId: ankit.id }));
    expect((await assignedTo(wedding.id)).map((r) => r.assignedMemberId)).toEqual([rohan.id, ankit.id]); // Sharma, Verma

    const moved = await db.$transaction((tx) => assignByScope(tx, wedding.id, { scope: "all", onlyUnassigned: false, memberId: ankit.id }));
    expect(moved).toMatchObject({ ok: true, assigned: 2 });
    expect((await assignedTo(wedding.id)).every((r) => r.assignedMemberId === ankit.id)).toBe(true);
  });

  it("never changes the families of another wedding", async () => {
    const { priya, wedding, ankit, family } = await setup();
    const other = await makeWedding("other-wedding", priya.id);
    await family("Sharma", "groom");
    await family("Mehta", "groom", null, other.id);

    await db.$transaction((tx) => assignByScope(tx, wedding.id, { scope: "all", onlyUnassigned: false, memberId: ankit.id }));

    expect((await assignedTo(other.id))[0].assignedMemberId).toBeNull();
  });

  it("refuses a removed person and a person of another wedding, and changes nothing", async () => {
    const { priya, wedding, family } = await setup();
    const gone = await makeUser("Gone");
    const removed = await addMember(wedding.id, gone, { status: "removed" });
    const other = await makeWedding("other-wedding", priya.id);
    const stranger = await addMember(other.id, await makeUser("Stranger"));
    await family("Sharma", "groom");

    for (const memberId of [removed.id, stranger.id]) {
      const result = await db.$transaction((tx) => assignByScope(tx, wedding.id, { scope: "all", onlyUnassigned: false, memberId }));
      expect(result.ok).toBe(false);
    }
    expect((await assignedTo(wedding.id))[0].assignedMemberId).toBeNull();
  });
});
