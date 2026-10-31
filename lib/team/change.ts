import type { Prisma } from "@/app/generated/prisma/client";
import { db } from "@/lib/db";
import { fail, ok, type ErrorCode, type Result } from "@/lib/result";
import { checkTeamChange, type Actor, type Change, type TeamMember } from "@/lib/team/rules";

// Every change of the team goes through this function. It runs in ONE transaction that locks the
// team rows of the wedding (SELECT ... FOR UPDATE), so two admins cannot remove each other at the
// same moment. It loads the team as plain data, asks lib/team/rules.ts, and runs `apply` only on
// "ok". It does not check who the actor is: the caller (an action) calls the admin guard first.

// Locks the team, loads it as plain data, asks the rules, and runs `apply` only on "ok".
export async function changeTeam<T>(
  weddingId: string,
  actor: Actor,
  change: Change,
  apply: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<Result<T>> {
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM wedding_members WHERE wedding_id = ${weddingId}::uuid FOR UPDATE`;

    const rows = await tx.weddingMember.findMany({
      where: { weddingId },
      select: {
        id: true,
        userId: true,
        email: true,
        displayName: true,
        role: true,
        relation: true,
        status: true,
        _count: { select: { assignedFamilies: true } },
      },
    });
    const team: TeamMember[] = rows.map((row) => ({
      id: row.id,
      userId: row.userId,
      email: row.email,
      displayName: row.displayName,
      role: row.role,
      relation: row.relation,
      status: row.status,
      families: row._count.assignedFamilies,
    }));

    const verdict = checkTeamChange(team, actor, change);
    if (!verdict.ok) {
      return fail(verdict.code as ErrorCode, verdict.message, verdict.field ? { [verdict.field]: verdict.message } : undefined);
    }
    return ok(await apply(tx));
  });
}
