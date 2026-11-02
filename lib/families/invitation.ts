import { db } from "@/lib/db";
import { isUuid } from "@/lib/access/checks";

// FR-23, AC-23.1: "Invitation sent". It decides with plain inputs, so the tests can call it; the
// actions (lib/families/actions.ts) call the guard first. Every query includes the wedding (rule 2).
// The first tick also locks the link name of the wedding, so printed links never break. Undo does
// not unlock it, because a card may already be out.

export type SentResult =
  | { ok: true; sentAt: Date; by: string }
  | { ok: false; code: "NOT_FOUND" | "NOT_ALLOWED_NOW"; message: string };

const NOT_FOUND = { ok: false, code: "NOT_FOUND", message: "This family was not found. It may have been deleted." } as const;

const nameOf = (member: { displayName: string | null; user: { name: string | null } | null } | null) =>
  member?.displayName ?? member?.user?.name ?? "Team member";
const memberSelect = { displayName: true, user: { select: { name: true } } } as const;

export async function markSent(weddingId: string, familyId: string, memberId: string, now = new Date()): Promise<SentResult> {
  if (![weddingId, familyId, memberId].every(isUuid)) return NOT_FOUND;

  return db.$transaction(async (tx): Promise<SentResult> => {
    const member = await tx.weddingMember.findFirst({ where: { id: memberId, weddingId, status: "active" }, select: memberSelect });
    if (!member) return NOT_FOUND;
    const family = await tx.family.findFirst({ where: { id: familyId, weddingId }, select: { id: true } });
    if (!family) return NOT_FOUND;

    // Already sent: the first tick stays (who and when). Two ticks at the same moment: only one row is changed.
    const changed = await tx.family.updateMany({
      where: { id: familyId, weddingId, invitationSentAt: null },
      data: { invitationSentAt: now, invitationSentById: memberId },
    });
    await tx.wedding.update({ where: { id: weddingId }, data: { slugLocked: true } });

    if (changed.count === 1) return { ok: true, sentAt: now, by: nameOf(member) };
    const current = await tx.family.findFirstOrThrow({ where: { id: familyId, weddingId }, select: { invitationSentAt: true, invitationSentBy: { select: memberSelect } } });
    return { ok: true, sentAt: current.invitationSentAt ?? now, by: nameOf(current.invitationSentBy) };
  });
}

export async function undoSent(weddingId: string, familyId: string, memberId: string): Promise<SentResult> {
  if (![weddingId, familyId, memberId].every(isUuid)) return NOT_FOUND;

  return db.$transaction(async (tx): Promise<SentResult> => {
    const member = await tx.weddingMember.findFirst({ where: { id: memberId, weddingId, status: "active" }, select: { id: true } });
    if (!member) return NOT_FOUND;
    const family = await tx.family.findFirst({ where: { id: familyId, weddingId }, select: { invitationSentAt: true } });
    if (!family) return NOT_FOUND;
    if (!family.invitationSentAt) return { ok: false, code: "NOT_ALLOWED_NOW", message: "This invitation is not marked as sent." };

    await tx.family.updateMany({ where: { id: familyId, weddingId }, data: { invitationSentAt: null, invitationSentById: null } });
    return { ok: true, sentAt: family.invitationSentAt, by: "" };
  });
}

// The progress of one organizer (FR-24): how many families are assigned, sent and replied, and the numbers of
// the filter chips. Only the families of this wedding that are assigned to this member.
export async function myFamiliesProgress(weddingId: string, memberId: string) {
  const mine = { weddingId, assignedMemberId: memberId };
  const [total, sent, noReply, replied] = await Promise.all([
    db.family.count({ where: mine }),
    db.family.count({ where: { ...mine, invitationSentAt: { not: null } } }),
    db.family.count({ where: { ...mine, familyEvents: { every: { reply: null } } } }),
    db.family.count({ where: { ...mine, familyEvents: { some: { reply: { isNot: null } } } } }),
  ]);
  return { total, sent, notSent: total - sent, noReply, replied };
}
