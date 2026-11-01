import type { Prisma } from "@/app/generated/prisma/client";
import { db } from "@/lib/db";
import { LIMITS } from "@/lib/limits";

// FR-30, AC-30.3: take away the access of ONE family: all its phones, and its wrong tries. Without
// the second part, a family that a stranger locked out (30 wrong tries in a day) could not be opened
// again by the team (review of 2026-11-01). It does not check who is asking: the action calls the
// guard first. The family must belong to the wedding (rule 2).
export async function resetFamilyAccess(weddingId: string, familyId: string) {
  return db.$transaction(async (tx: Prisma.TransactionClient) => {
    const devices = await tx.guestDevice.deleteMany({ where: { familyId, family: { weddingId } } });
    const attempts = await tx.accessAttempt.deleteMany({ where: { familyId, family: { weddingId } } });
    return { devices: devices.count, tries: attempts.count };
  });
}

// For the family page: how many phones have access, and how many wrong tries count against the family today.
export async function getFamilyAccessInfo(weddingId: string, familyId: string, now = new Date()) {
  const since = new Date(now.getTime() - 24 * 60 * 60_000);
  const [devices, wrongTries] = await Promise.all([
    db.guestDevice.count({ where: { familyId, family: { weddingId } } }),
    db.accessAttempt.count({ where: { familyId, family: { weddingId }, succeeded: false, attemptedAt: { gte: since } } }),
  ]);
  return { devices, wrongTries, limit: LIMITS.wrongTriesPerFamilyPerDay };
}
