import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { findFamiliesByName } from "@/lib/rsvp/search";
import { searchTextSchema } from "@/lib/rsvp/schemas";
import { makeUser, makeWedding, resetDatabase } from "./helpers";

// FR-28, AC-28.1, AC-28.2, NFR-9: a guest finds a family by name and sees nothing else.
describe("family search for guests", () => {
  beforeEach(resetDatabase);
  afterAll(async () => {
    await resetDatabase();
    await db.$disconnect();
  });

  async function setup() {
    const priya = await makeUser("Priya");
    const wedding = await makeWedding("priya-rahul", priya.id);
    const family = (weddingId: string, familyName: string, extra: { contactName?: string; city?: string } = {}) =>
      db.family.create({ data: { weddingId, familyName, side: "groom", ...extra } });
    return { priya, wedding, family };
  }

  it("needs at least 3 letters", () => {
    expect(searchTextSchema.safeParse("Sh").success).toBe(false);
    expect(searchTextSchema.safeParse("  Sh  ").success).toBe(false);
    expect(searchTextSchema.safeParse("Sha").success).toBe(true);
  });

  it("finds a family and gives the contact name and city as the hint", async () => {
    const { wedding, family } = await setup();
    await family(wedding.id, "Sharma family", { contactName: "Meena", city: "Jaipur" });
    await family(wedding.id, "Verma family");

    const matches = await findFamiliesByName(wedding.id, "sha");

    expect(matches).toHaveLength(1);
    expect(matches[0]).toMatchObject({ familyName: "Sharma family", hint: "Meena, Jaipur" });
    expect(Object.keys(matches[0]).sort()).toEqual(["familyName", "hint", "id"]);
  });

  it("gives at most 10 matches, and names that start with the text come first", async () => {
    const { wedding, family } = await setup();
    await family(wedding.id, "Aa Sharma family");
    for (let i = 0; i < 12; i++) await family(wedding.id, `Sharma ${String(i).padStart(2, "0")} family`);

    const matches = await findFamiliesByName(wedding.id, "Sharma");

    expect(matches).toHaveLength(10);
    expect(matches[0].familyName).toBe("Sharma 00 family");
    expect(matches.map((m) => m.familyName)).not.toContain("Aa Sharma family");
  });

  it("finds a family that starts with the text even when 50 or more other names only contain it", async () => {
    const { wedding, family } = await setup();
    for (let i = 0; i < 60; i++) await family(wedding.id, `Bh${String(i).padStart(2, "0")}sha family`);
    await family(wedding.id, "Sharma family");

    const names = (await findFamiliesByName(wedding.id, "sha")).map((m) => m.familyName);

    expect(names[0]).toBe("Sharma family");
    expect(names).toHaveLength(10);
  });

  it("never finds a family of another wedding", async () => {
    const { priya, wedding, family } = await setup();
    const other = await makeWedding("other-wedding", priya.id);
    await family(other.id, "Sharma family");

    expect(await findFamiliesByName(wedding.id, "Sharma")).toEqual([]);
  });

  it("treats % and _ as letters, so they never match everybody", async () => {
    const { wedding, family } = await setup();
    await family(wedding.id, "Sharma family");

    expect(await findFamiliesByName(wedding.id, "%%%")).toEqual([]);
    expect(await findFamiliesByName(wedding.id, "S_a")).toEqual([]);
  });
});
