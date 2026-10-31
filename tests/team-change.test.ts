import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { changeTeam } from "@/lib/team/change";
import { addMember, makeUser, makeWedding, resetDatabase } from "./helpers";

// Two admins press "Remove" on each other at the same moment. The rule "the last admin stays"
// must hold: exactly one removal works (changeTeam locks the team rows).
describe("changeTeam", () => {
  beforeEach(resetDatabase);
  afterAll(async () => {
    await resetDatabase();
    await db.$disconnect();
  });

  it("lets only one of two admins remove the other", async () => {
    const dad = await makeUser("Dad");
    const mom = await makeUser("Mom");
    const wedding = await makeWedding("priya-rahul", dad.id);
    const dadMember = await addMember(wedding.id, dad, { role: "admin", relation: "parent" });
    const momMember = await addMember(wedding.id, mom, { role: "admin", relation: "parent" });

    const remove = (actor: { id: string; userId: string | null }, target: string) =>
      changeTeam(
        wedding.id,
        { memberId: actor.id, userId: actor.userId! },
        { kind: "remove", memberId: target },
        (tx) => tx.weddingMember.update({ where: { id: target }, data: { status: "removed" } }),
      );

    const results = await Promise.all([remove(dadMember, momMember.id), remove(momMember, dadMember.id)]);

    expect(results.filter((r) => r.ok)).toHaveLength(1);
    const admins = await db.weddingMember.count({ where: { weddingId: wedding.id, role: "admin", status: "active" } });
    expect(admins).toBe(1);
  });
});
