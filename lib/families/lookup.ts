import { db } from "@/lib/db";
import { isUuid } from "@/lib/access/checks";

// Finds ONE family of ONE wedding. The family must belong to that wedding: a family id of another
// wedding gives null, never the data (CLAUDE.md rule 2). Used by every read and action on a single
// family. It does not check who is asking; the caller calls the guard first.
export async function findFamilyInWedding(weddingId: string, familyId: string) {
  if (!isUuid(weddingId) || !isUuid(familyId)) return null;
  return db.family.findFirst({
    where: { id: familyId, weddingId },
    select: {
      id: true,
      familyName: true,
      contactName: true,
      city: true,
      side: true,
      notes: true,
      assignedMemberId: true,
      invitationSentAt: true,
      phones: { select: { id: true, phone: true, kind: true, isIncorrect: true } },
      familyEvents: {
        select: {
          eventId: true,
          reply: {
            select: {
              attending: true,
              persons: true,
              source: true,
              repliedByName: true,
              repliedAt: true,
              updatedAt: true,
              updatedBy: { select: { displayName: true, user: { select: { name: true } } } },
            },
          },
        },
      },
    },
  });
}
