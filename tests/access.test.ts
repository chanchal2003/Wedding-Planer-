import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import {
  checkAdmin,
  checkDeleteWedding,
  checkGuestDevice,
  checkMember,
  checkMoneyAccess,
} from "@/lib/access/checks";
import { hashToken } from "@/lib/access/hash";
import { addMember, makeDevice, makeFamily, makeUser, makeWedding, resetDatabase } from "./helpers";

// The access rules (FR-64). The people: Priya is the bride and an admin, Rohan and Ankit
// are organizers. Two weddings, A and B, so we can check that one cannot open the other.
describe("team access", () => {
  beforeEach(resetDatabase);
  afterAll(async () => {
    await resetDatabase();
    await db.$disconnect();
  });

  it("lets an active admin in as member and as admin", async () => {
    const priya = await makeUser("Priya");
    const wedding = await makeWedding("priya-rahul", priya.id);
    await addMember(wedding.id, priya, { role: "admin" });

    expect((await checkMember(priya.id, wedding.id)).ok).toBe(true);
    expect((await checkAdmin(priya.id, wedding.id)).ok).toBe(true);
  });

  it("lets an active organizer in as member, but not as admin", async () => {
    const priya = await makeUser("Priya");
    const rohan = await makeUser("Rohan");
    const wedding = await makeWedding("priya-rahul", priya.id);
    await addMember(wedding.id, rohan, { role: "organizer" });

    expect((await checkMember(rohan.id, wedding.id)).ok).toBe(true);
    expect((await checkAdmin(rohan.id, wedding.id)).ok).toBe(false);
  });

  it("refuses a pending member and a removed member", async () => {
    const priya = await makeUser("Priya");
    const ankit = await makeUser("Ankit");
    const rohan = await makeUser("Rohan");
    const wedding = await makeWedding("priya-rahul", priya.id);
    await addMember(wedding.id, ankit, { status: "pending" });
    await addMember(wedding.id, rohan, { status: "removed" });

    expect((await checkMember(ankit.id, wedding.id)).ok).toBe(false);
    expect((await checkMember(rohan.id, wedding.id)).ok).toBe(false);
  });

  it("does not let a member of wedding A open wedding B (AC-64.2)", async () => {
    const priya = await makeUser("Priya");
    const meena = await makeUser("Meena");
    const weddingA = await makeWedding("priya-rahul", priya.id);
    const weddingB = await makeWedding("meena-niece", meena.id);
    await addMember(weddingA.id, priya, { role: "admin" });
    await addMember(weddingB.id, meena, { role: "admin" });

    expect((await checkMember(priya.id, weddingA.id)).ok).toBe(true);
    expect((await checkMember(priya.id, weddingB.id)).ok).toBe(false);
    expect((await checkAdmin(priya.id, weddingB.id)).ok).toBe(false);
    expect((await checkMoneyAccess(priya.id, weddingB.id)).ok).toBe(false);
  });

  it("refuses a person who is not on the team at all", async () => {
    const priya = await makeUser("Priya");
    const stranger = await makeUser("Stranger");
    const wedding = await makeWedding("priya-rahul", priya.id);
    await addMember(wedding.id, priya, { role: "admin" });

    expect((await checkMember(stranger.id, wedding.id)).ok).toBe(false);
  });

  it("refuses wrong ids without an error", async () => {
    const priya = await makeUser("Priya");
    const wedding = await makeWedding("priya-rahul", priya.id);
    await addMember(wedding.id, priya, { role: "admin" });
    const unknown = "00000000-0000-4000-8000-000000000000";

    expect((await checkMember(priya.id, unknown)).ok).toBe(false);
    expect((await checkMember(unknown, wedding.id)).ok).toBe(false);
    expect((await checkMember(priya.id, "not-an-id")).ok).toBe(false);
    expect((await checkMember("", wedding.id)).ok).toBe(false);
  });

  describe("money access", () => {
    it("lets an admin in, even with the switch off", async () => {
      const priya = await makeUser("Priya");
      const wedding = await makeWedding("priya-rahul", priya.id);
      await addMember(wedding.id, priya, { role: "admin", canSeeMoney: false });

      expect((await checkMoneyAccess(priya.id, wedding.id)).ok).toBe(true);
    });

    it("refuses an organizer with the switch off, and lets one with the switch on in", async () => {
      const priya = await makeUser("Priya");
      const rohan = await makeUser("Rohan");
      const ankit = await makeUser("Ankit");
      const wedding = await makeWedding("priya-rahul", priya.id);
      await addMember(wedding.id, rohan, { canSeeMoney: true });
      await addMember(wedding.id, ankit, { canSeeMoney: false });

      expect((await checkMoneyAccess(rohan.id, wedding.id)).ok).toBe(true);
      expect((await checkMoneyAccess(ankit.id, wedding.id)).ok).toBe(false);
    });

    it("refuses a removed organizer, even with the switch on", async () => {
      const priya = await makeUser("Priya");
      const rohan = await makeUser("Rohan");
      const wedding = await makeWedding("priya-rahul", priya.id);
      await addMember(wedding.id, rohan, { canSeeMoney: true, status: "removed" });

      expect((await checkMoneyAccess(rohan.id, wedding.id)).ok).toBe(false);
    });
  });
});

describe("who may delete a wedding", () => {
  beforeEach(resetDatabase);
  afterAll(async () => {
    await resetDatabase();
    await db.$disconnect();
  });

  it("lets any admin delete a TEST wedding", async () => {
    const dad = await makeUser("Dad");
    const wedding = await makeWedding("priya-rahul", dad.id, true);
    await addMember(wedding.id, dad, { role: "admin", relation: "parent" });

    expect((await checkDeleteWedding(dad.id, wedding.id)).ok).toBe(true);
  });

  it("lets the bride or the groom (as admin) delete a REAL wedding", async () => {
    const priya = await makeUser("Priya");
    const rahul = await makeUser("Rahul");
    const wedding = await makeWedding("priya-rahul", priya.id, false);
    await addMember(wedding.id, priya, { role: "admin", relation: "bride" });
    await addMember(wedding.id, rahul, { role: "admin", relation: "groom" });

    expect((await checkDeleteWedding(priya.id, wedding.id)).ok).toBe(true);
    expect((await checkDeleteWedding(rahul.id, wedding.id)).ok).toBe(true);
  });

  it("does not let a parent or sibling admin delete a REAL wedding", async () => {
    const priya = await makeUser("Priya");
    const dad = await makeUser("Dad");
    const sister = await makeUser("Sister");
    const wedding = await makeWedding("priya-rahul", priya.id, false);
    await addMember(wedding.id, priya, { role: "admin", relation: "bride" });
    await addMember(wedding.id, dad, { role: "admin", relation: "parent" });
    await addMember(wedding.id, sister, { role: "admin", relation: "sibling" });

    expect((await checkDeleteWedding(dad.id, wedding.id)).ok).toBe(false);
    expect((await checkDeleteWedding(sister.id, wedding.id)).ok).toBe(false);
  });

  it("never lets an organizer delete anything, even with relation bride", async () => {
    const priya = await makeUser("Priya");
    const rohan = await makeUser("Rohan");
    const test = await makeWedding("test-one", priya.id, true);
    const real = await makeWedding("real-one", priya.id, false);
    for (const w of [test, real]) {
      await addMember(w.id, rohan, { role: "organizer", relation: "bride" });
      expect((await checkDeleteWedding(rohan.id, w.id)).ok).toBe(false);
    }
  });

  it("refuses pending and removed people, and members of another wedding", async () => {
    const priya = await makeUser("Priya");
    const ankit = await makeUser("Ankit");
    const sita = await makeUser("Sita");
    const meena = await makeUser("Meena");
    const wedding = await makeWedding("priya-rahul", priya.id, true);
    const other = await makeWedding("meena-niece", meena.id, true);
    await addMember(wedding.id, ankit, { role: "admin", relation: "parent", status: "pending" });
    await addMember(wedding.id, sita, { role: "admin", relation: "parent", status: "removed" });
    await addMember(other.id, meena, { role: "admin", relation: "bride" });

    expect((await checkDeleteWedding(ankit.id, wedding.id)).ok).toBe(false);
    expect((await checkDeleteWedding(sita.id, wedding.id)).ok).toBe(false);
    expect((await checkDeleteWedding(meena.id, wedding.id)).ok).toBe(false);
  });
});

describe("guest access", () => {
  beforeEach(resetDatabase);
  afterAll(async () => {
    await resetDatabase();
    await db.$disconnect();
  });

  it("gives a device the family it belongs to, and not another family (AC-64.1)", async () => {
    const priya = await makeUser("Priya");
    const wedding = await makeWedding("priya-rahul", priya.id);
    const sharma = await makeFamily(wedding.id, "Sharma family");
    const verma = await makeFamily(wedding.id, "Verma family");
    await makeDevice(sharma.id, hashToken("sharma-phone-code"));
    await makeDevice(verma.id, hashToken("verma-phone-code"));

    const access = await checkGuestDevice(wedding.id, "sharma-phone-code");

    expect(access.ok).toBe(true);
    if (access.ok) {
      expect(access.family.id).toBe(sharma.id);
      expect(access.family.id).not.toBe(verma.id);
    }
  });

  it("does not accept a device of wedding A on wedding B (AC-64.2)", async () => {
    const priya = await makeUser("Priya");
    const weddingA = await makeWedding("priya-rahul", priya.id);
    const weddingB = await makeWedding("meena-niece", priya.id);
    const sharmaA = await makeFamily(weddingA.id, "Sharma family");
    await makeDevice(sharmaA.id, hashToken("sharma-phone-code"));

    expect((await checkGuestDevice(weddingA.id, "sharma-phone-code")).ok).toBe(true);
    expect((await checkGuestDevice(weddingB.id, "sharma-phone-code")).ok).toBe(false);
  });

  it("refuses a wrong, empty or missing code", async () => {
    const priya = await makeUser("Priya");
    const wedding = await makeWedding("priya-rahul", priya.id);
    const sharma = await makeFamily(wedding.id, "Sharma family");
    await makeDevice(sharma.id, hashToken("sharma-phone-code"));

    expect((await checkGuestDevice(wedding.id, "another-code")).ok).toBe(false);
    expect((await checkGuestDevice(wedding.id, "")).ok).toBe(false);
    expect((await checkGuestDevice(wedding.id, undefined)).ok).toBe(false);
    expect((await checkGuestDevice("not-an-id", "sharma-phone-code")).ok).toBe(false);
  });

  it("does not accept the stored hash as a code (the database holds only the hash)", async () => {
    const priya = await makeUser("Priya");
    const wedding = await makeWedding("priya-rahul", priya.id);
    const sharma = await makeFamily(wedding.id, "Sharma family");
    const hash = hashToken("sharma-phone-code");
    await makeDevice(sharma.id, hash);

    expect(hash).not.toBe("sharma-phone-code");
    expect((await checkGuestDevice(wedding.id, hash)).ok).toBe(false);
  });

  it("stops working when the family is deleted (the device goes with it)", async () => {
    const priya = await makeUser("Priya");
    const wedding = await makeWedding("priya-rahul", priya.id);
    const sharma = await makeFamily(wedding.id, "Sharma family");
    await makeDevice(sharma.id, hashToken("sharma-phone-code"));
    await db.family.delete({ where: { id: sharma.id } });

    expect((await checkGuestDevice(wedding.id, "sharma-phone-code")).ok).toBe(false);
  });
});
