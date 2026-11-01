import { db } from "@/lib/db";
import { isUuid } from "@/lib/access/checks";
import { teamReplySchema } from "@/lib/rsvp/schemas";

// FR-41, AC-41.1, AC-37.2: a team member enters or changes the reply of ONE event of a family. It
// decides with plain inputs, so the tests can call it; the action calls the guard first. The last
// dates do not apply to the team. A reply is changed, never cleared (decided 2026-10-30).

export type TeamReplyResult =
  | { ok: true }
  | { ok: false; code: "NOT_FOUND" | "INVALID_INPUT"; message: string; fields?: Record<string, string> };

export async function saveTeamReply(input: { weddingId: string; familyId: string; eventId: string; memberId: string; reply: unknown; now?: Date }): Promise<TeamReplyResult> {
  const { weddingId, familyId, eventId, memberId } = input;
  const notFound: TeamReplyResult = { ok: false, code: "NOT_FOUND", message: "This event is not on the invitation of this family." };
  if (![weddingId, familyId, eventId, memberId].every(isUuid)) return notFound;

  const parsed = teamReplySchema.safeParse(input.reply);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) fields[String(issue.path[0] ?? "form")] ??= issue.message;
    return { ok: false, code: "INVALID_INPUT", message: parsed.error.issues[0]?.message ?? "Please check the reply.", fields };
  }
  const { attending, persons } = parsed.data;
  const now = input.now ?? new Date();

  // If a guest saves the same event at the same moment, the unique rule stops the create. The second
  // round then finds the reply and changes it, so the team member never sees an error.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await db.$transaction(async (tx): Promise<TeamReplyResult> => {
        // The member must be an active member of THIS wedding (rule 2), so no foreign member id is ever saved.
        const member = await tx.weddingMember.findFirst({ where: { id: memberId, weddingId, status: "active" }, select: { id: true } });
        if (!member) return notFound;
        const row = await tx.familyEvent.findFirst({ where: { familyId, eventId, weddingId }, select: { id: true, reply: { select: { id: true } } } });
        if (!row) return notFound;

        if (row.reply) {
          await tx.reply.update({ where: { id: row.reply.id }, data: { attending, persons, source: "team", updatedById: member.id } });
        } else {
          await tx.reply.create({ data: { familyEventId: row.id, attending, persons, source: "team", updatedById: member.id, repliedAt: now } });
        }
        return { ok: true };
      });
    } catch (error) {
      if ((error as { code?: string }).code !== "P2002" || attempt === 1) throw error;
    }
  }
  return notFound; // not reached
}
