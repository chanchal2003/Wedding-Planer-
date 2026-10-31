"use server";

import { requireAdmin } from "@/lib/access/guards";
import { denied } from "@/lib/access/respond";
import { fail, type Result } from "@/lib/result";
import { changeTeam } from "@/lib/team/change";
import { personSchema } from "@/lib/team/schemas";
import type { Actor, Relation, Role } from "@/lib/team/rules";

// API design, Section 7. Only admins change the team. Every change goes through changeTeam
// (lib/team/change.ts): one locked transaction, the rules decide, and only then the row changes.

const SOMETHING_WRONG = "Something went wrong. Try again.";

function fieldsFrom(issues: { path: PropertyKey[]; message: string }[]) {
  const fields: Record<string, string> = {};
  for (const issue of issues) fields[String(issue.path[0] ?? "form")] ??= issue.message;
  return fields;
}

const actorOf = (access: { user: { id: string }; member: { id: string } }): Actor => ({
  memberId: access.member.id,
  userId: access.user.id,
});

export async function inviteMember(weddingId: string, input: unknown): Promise<Result<{ memberId: string }>> {
  try {
    const access = await requireAdmin(weddingId);
    if (!access.ok) return denied(access);

    const parsed = personSchema.safeParse(input);
    if (!parsed.success) return fail("INVALID_INPUT", "Please check the form.", fieldsFrom(parsed.error.issues));
    const { displayName, email, relation, role } = parsed.data;
    const wedding = access.member.wedding.id;

    return await changeTeam(wedding, actorOf(access), { kind: "invite", email, relation: relation as Relation, role }, async (tx) => {
      const created = await tx.weddingMember.create({
        data: { weddingId: wedding, displayName, email, relation: relation as Relation, role, status: "pending" },
        select: { id: true },
      });
      return { memberId: created.id };
    });
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      return fail("CONFLICT", "This email is already in the team.", { email: "This email is already in the team." });
    }
    console.error("inviteMember failed:", error instanceof Error ? error.message : error);
    return fail("SERVER_ERROR", SOMETHING_WRONG);
  }
}

export async function updateMember(weddingId: string, memberId: string, input: unknown): Promise<Result<null>> {
  try {
    const access = await requireAdmin(weddingId);
    if (!access.ok) return denied(access);

    const parsed = personSchema.safeParse(input);
    if (!parsed.success) return fail("INVALID_INPUT", "Please check the form.", fieldsFrom(parsed.error.issues));
    const { displayName, email, relation, role } = parsed.data;
    const wedding = access.member.wedding.id;

    return await changeTeam(
      wedding,
      actorOf(access),
      { kind: "update", memberId, email, relation: relation as Relation, role: role as Role },
      async (tx) => {
        // "weddingId" is part of the filter: a person of another wedding can never be changed here.
        await tx.weddingMember.updateMany({
          where: { id: memberId, weddingId: wedding },
          data: { displayName, email, relation: relation as Relation, role },
        });
        return null;
      },
    );
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      return fail("CONFLICT", "This email is already in the team.", { email: "This email is already in the team." });
    }
    console.error("updateMember failed:", error instanceof Error ? error.message : error);
    return fail("SERVER_ERROR", SOMETHING_WRONG);
  }
}

// Removing never deletes the row: the person is marked "removed", so old records keep their name.
export async function removeMember(weddingId: string, memberId: string): Promise<Result<null>> {
  try {
    const access = await requireAdmin(weddingId);
    if (!access.ok) return denied(access);
    const wedding = access.member.wedding.id;

    return await changeTeam(wedding, actorOf(access), { kind: "remove", memberId }, async (tx) => {
      await tx.weddingMember.updateMany({ where: { id: memberId, weddingId: wedding }, data: { status: "removed" } });
      return null;
    });
  } catch (error) {
    console.error("removeMember failed:", error instanceof Error ? error.message : error);
    return fail("SERVER_ERROR", "Something went wrong. Nobody was removed. Try again.");
  }
}

// A person who never signed in comes back as "pending", a person who did comes back as "active".
export async function restoreMember(weddingId: string, memberId: string): Promise<Result<null>> {
  try {
    const access = await requireAdmin(weddingId);
    if (!access.ok) return denied(access);
    const wedding = access.member.wedding.id;

    return await changeTeam(wedding, actorOf(access), { kind: "restore", memberId }, async (tx) => {
      const person = await tx.weddingMember.findFirst({ where: { id: memberId, weddingId: wedding }, select: { userId: true } });
      await tx.weddingMember.updateMany({
        where: { id: memberId, weddingId: wedding },
        data: { status: person?.userId ? "active" : "pending" },
      });
      return null;
    });
  } catch (error) {
    console.error("restoreMember failed:", error instanceof Error ? error.message : error);
    return fail("SERVER_ERROR", SOMETHING_WRONG);
  }
}
