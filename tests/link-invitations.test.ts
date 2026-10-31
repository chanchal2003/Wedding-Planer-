import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { linkPendingInvitations } from "@/lib/auth/link-invitations";

// Priya makes the wedding and invites Ankit and Rohan by email.
async function makeWedding(slug: string) {
  const priya = await db.user.upsert({
    where: { email: "priya@example.com" },
    update: {},
    create: { name: "Priya", email: "priya@example.com", emailVerified: true },
  });
  return db.wedding.create({
    data: {
      slug,
      brideName: "Priya",
      groomName: "Rahul",
      weddingDate: new Date("2027-01-15"),
      isTest: true,
      createdById: priya.id,
    },
  });
}

function invite(weddingId: string, email: string, status: "pending" | "removed" = "pending") {
  return db.weddingMember.create({
    data: { weddingId, email, role: "organizer", relation: "friend", status },
  });
}

describe("linkPendingInvitations", () => {
  beforeEach(async () => {
    await db.wedding.deleteMany();
    await db.user.deleteMany();
  });
  afterEach(async () => {
    await db.wedding.deleteMany();
    await db.user.deleteMany();
  });
  afterAll(() => db.$disconnect());

  it("connects a pending invitation when the Google email is verified", async () => {
    const wedding = await makeWedding("priya-rahul");
    const row = await invite(wedding.id, "ankit@example.com");
    const ankit = await db.user.create({
      data: { name: "Ankit", email: "ankit@example.com", emailVerified: true },
    });

    const result = await linkPendingInvitations(ankit);

    expect(result.linked).toBe(1);
    const after = await db.weddingMember.findUniqueOrThrow({ where: { id: row.id } });
    expect(after.status).toBe("active");
    expect(after.userId).toBe(ankit.id);
  });

  it("does nothing when the Google email is not verified", async () => {
    const wedding = await makeWedding("priya-rahul");
    const row = await invite(wedding.id, "ankit@example.com");
    const fake = await db.user.create({
      data: { name: "Not Ankit", email: "ankit@example.com", emailVerified: false },
    });

    const result = await linkPendingInvitations(fake);

    expect(result).toEqual({ linked: 0, emailNotVerified: true });
    const after = await db.weddingMember.findUniqueOrThrow({ where: { id: row.id } });
    expect(after.status).toBe("pending");
    expect(after.userId).toBeNull();
  });

  it("does not connect invitations for another email", async () => {
    const wedding = await makeWedding("priya-rahul");
    const row = await invite(wedding.id, "rohan@example.com");
    const ankit = await db.user.create({
      data: { name: "Ankit", email: "ankit@example.com", emailVerified: true },
    });

    const result = await linkPendingInvitations(ankit);

    expect(result.linked).toBe(0);
    const after = await db.weddingMember.findUniqueOrThrow({ where: { id: row.id } });
    expect(after.status).toBe("pending");
  });

  it("does not bring back a removed person", async () => {
    const wedding = await makeWedding("priya-rahul");
    const row = await invite(wedding.id, "ankit@example.com", "removed");
    const ankit = await db.user.create({
      data: { name: "Ankit", email: "ankit@example.com", emailVerified: true },
    });

    expect((await linkPendingInvitations(ankit)).linked).toBe(0);
    const after = await db.weddingMember.findUniqueOrThrow({ where: { id: row.id } });
    expect(after.status).toBe("removed");
  });

  it("connects every wedding that invited the same email, and is safe to call again", async () => {
    const one = await makeWedding("priya-rahul");
    const two = await makeWedding("meena-niece");
    await invite(one.id, "rohan@example.com");
    await invite(two.id, "rohan@example.com");
    const rohan = await db.user.create({
      data: { name: "Rohan", email: "rohan@example.com", emailVerified: true },
    });

    expect((await linkPendingInvitations(rohan)).linked).toBe(2);
    expect((await linkPendingInvitations(rohan)).linked).toBe(0);
  });

  it("matches the email in any letter case", async () => {
    const wedding = await makeWedding("priya-rahul");
    await invite(wedding.id, "ankit@example.com");
    const ankit = await db.user.create({
      data: { name: "Ankit", email: "ankit@example.com", emailVerified: true },
    });

    const result = await linkPendingInvitations({ ...ankit, email: "Ankit@Example.com" });

    expect(result.linked).toBe(1);
  });
});
