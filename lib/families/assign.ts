import type { Prisma } from "@/app/generated/prisma/client";

// Assign many families to one organizer in one step (FR-21, AC-21.1). It does not check who is
// asking: the action calls requireAdmin first. Every query includes the wedding (rule 2).

export type AssignInput = {
  scope: "all" | "bride" | "groom" | "both";
  onlyUnassigned: boolean; // true: families that already have an organizer stay with that person
  memberId: string;
};

export type AssignResult = { ok: true; assigned: number; name: string } | { ok: false; message: string };

export async function assignByScope(tx: Prisma.TransactionClient, weddingId: string, input: AssignInput): Promise<AssignResult> {
  // FOR SHARE: this person cannot be removed while the families are assigned (changeTeam locks
  // FOR UPDATE and then counts the families), so no family goes to a removed person (FR-13).
  const members = await tx.$queryRaw<{ id: string }[]>`
    SELECT id FROM wedding_members WHERE id = ${input.memberId}::uuid AND wedding_id = ${weddingId}::uuid AND status <> 'removed' FOR SHARE`;
  if (members.length === 0) return { ok: false, message: "Choose a person from the team." };

  const person = await tx.weddingMember.findFirstOrThrow({
    where: { id: input.memberId, weddingId },
    select: { displayName: true, user: { select: { name: true } } },
  });

  const updated = await tx.family.updateMany({
    where: {
      weddingId,
      ...(input.scope !== "all" && { side: input.scope }),
      ...(input.onlyUnassigned && { assignedMemberId: null }),
    },
    data: { assignedMemberId: input.memberId },
  });
  return { ok: true, assigned: updated.count, name: person.displayName ?? person.user?.name ?? "Team member" };
}
