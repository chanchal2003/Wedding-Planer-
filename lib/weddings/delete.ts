import { db } from "@/lib/db";

// Deletes ALL data of one wedding, and nothing of any other wedding. The data is deleted in
// this order, in one transaction (all or nothing):
//  1. the guest-attempt logs of its families,
//  2. its families (their phones, invitations, replies and devices go with them),
//  3. the wedding itself (its events and team go with it).
// A plain "delete the wedding" does not work, because the database removes the team members
// before the families that point to them, and stops (tested on 2026-10-31).
// The accounts of the people (users) are never deleted. Every code that deletes a wedding,
// also the clean-up job 6 months after the wedding, must call this function.
export async function deleteWeddingData(weddingId: string): Promise<void> {
  await db.$transaction([
    db.accessAttempt.deleteMany({ where: { family: { weddingId } } }),
    db.family.deleteMany({ where: { weddingId } }),
    db.wedding.delete({ where: { id: weddingId } }),
  ]);
}

// What the warning shows before the delete: "3 events, 500 families, 4 team members".
export async function countWeddingData(weddingId: string) {
  const [events, families, replies, teamMembers] = await Promise.all([
    db.event.count({ where: { weddingId } }),
    db.family.count({ where: { weddingId } }),
    db.reply.count({ where: { familyEvent: { weddingId } } }),
    db.weddingMember.count({ where: { weddingId, status: { not: "removed" } } }),
  ]);
  return { events, families, replies, teamMembers };
}
