import { db } from "@/lib/db";

// Fake data for the tests. They run on shadidesk_test only (tests/setup.ts).

// Weddings first (they delete their members, families and devices), then users.
export async function resetDatabase() {
  await db.wedding.deleteMany();
  await db.user.deleteMany();
}

export function makeUser(name: string) {
  return db.user.create({
    data: { name, email: `${name.toLowerCase()}@example.com`, emailVerified: true },
  });
}

export function makeWedding(slug: string, createdById: string, isTest = true) {
  return db.wedding.create({
    data: {
      slug,
      brideName: "Priya",
      groomName: "Rahul",
      weddingDate: new Date("2027-01-15"),
      isTest,
      createdById,
    },
  });
}

type MemberOptions = {
  role?: "admin" | "organizer";
  relation?: "bride" | "groom" | "parent" | "sibling" | "relative" | "friend" | "other";
  status?: "pending" | "active" | "removed";
  canSeeMoney?: boolean;
};

// A team member. A pending member has no user (a database check requires it).
export function addMember(weddingId: string, user: { id: string; email: string }, o: MemberOptions = {}) {
  const status = o.status ?? "active";
  return db.weddingMember.create({
    data: {
      weddingId,
      email: user.email,
      userId: status === "pending" ? null : user.id,
      role: o.role ?? "organizer",
      relation: o.relation ?? "friend",
      status,
      canSeeMoney: o.canSeeMoney ?? false,
    },
  });
}

export function makeEvent(weddingId: string, name: string, type: "haldi" | "wedding" | "other" = "haldi") {
  return db.event.create({
    data: { weddingId, type, name, startsAt: new Date("2027-01-12T04:30:00Z"), hostedBy: "bride" },
  });
}

export function makeFamily(weddingId: string, familyName: string) {
  return db.family.create({ data: { weddingId, familyName, side: "groom" } });
}

export function makeDevice(familyId: string, tokenHash: string) {
  return db.guestDevice.create({ data: { familyId, tokenHash } });
}
