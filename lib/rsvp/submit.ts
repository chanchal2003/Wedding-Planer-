import { db } from "@/lib/db";
import { isUuid } from "@/lib/access/checks";
import { contactText, firstNameOf } from "@/lib/rsvp/names";
import { replySchema } from "@/lib/rsvp/schemas";
import { isAfterLastDate } from "@/lib/time";

// FR-33 to FR-37: the first reply of a family, in ONE transaction. It decides with plain inputs, so
// the tests can call it without a browser; the action (lib/rsvp/actions.ts) calls the guard first.
//
// Each event is treated on its own (FR-35): the input must have one answer for EVERY invited event
// that has no reply yet, and for no other event. A reply that exists is never changed (rule 5): the
// unique rule on family_event_id makes the second of two parallel submits fail, and nothing is saved.

export type SubmitResult =
  | { ok: true; saved: number }
  | { ok: false; code: "CLOSED" | "ALREADY_REPLIED" | "INVALID_INPUT"; message: string; fields?: Record<string, string> };

const ALREADY = "Someone from your family already replied. Here is their reply.";

export async function submitFamilyReplies(input: { weddingId: string; familyId: string; reply: unknown; now?: Date }): Promise<SubmitResult> {
  const now = input.now ?? new Date();
  if (!isUuid(input.weddingId) || !isUuid(input.familyId)) return { ok: false, code: "INVALID_INPUT", message: "This family was not found." };

  const parsed = replySchema.safeParse(input.reply);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) fields[String(issue.path[0] ?? "form")] ??= issue.message;
    return { ok: false, code: "INVALID_INPUT", message: parsed.error.issues[0]?.message ?? "Please check your answers.", fields };
  }
  const { repliedByName, answers } = parsed.data;

  try {
    return await db.$transaction(async (tx): Promise<SubmitResult> => {
      const family = await tx.family.findFirst({
        where: { id: input.familyId, weddingId: input.weddingId },
        select: {
          assignedMember: { select: { displayName: true, user: { select: { name: true } } } },
          wedding: { select: { rsvpLastDate: true } },
          familyEvents: { select: { id: true, eventId: true, reply: { select: { id: true } } } },
        },
      });
      if (!family) return { ok: false, code: "INVALID_INPUT", message: "This family was not found." };

      // After 23:59 India time on the last date a guest cannot reply (FR-37). The team can.
      const lastDate = family.wedding.rsvpLastDate;
      if (lastDate && isAfterLastDate(lastDate, now)) {
        return { ok: false, code: "CLOSED", message: `Replies are closed. Contact ${contactText(firstNameOf(family.assignedMember))}.` };
      }

      const open = family.familyEvents.filter((row) => !row.reply);
      if (open.length === 0) return { ok: false, code: "ALREADY_REPLIED", message: ALREADY };

      const answeredIds = answers.map((answer) => answer.eventId);
      const openIds = new Set(open.map((row) => row.eventId));
      const repliedIds = new Set(family.familyEvents.filter((row) => row.reply).map((row) => row.eventId));
      if (answeredIds.some((id) => repliedIds.has(id))) return { ok: false, code: "ALREADY_REPLIED", message: ALREADY };
      if (new Set(answeredIds).size !== answeredIds.length || answeredIds.length !== openIds.size || answeredIds.some((id) => !openIds.has(id))) {
        return { ok: false, code: "INVALID_INPUT", message: "Choose an answer for every event." };
      }

      const rowOf = new Map(open.map((row) => [row.eventId, row.id]));
      await tx.reply.createMany({
        data: answers.map((answer) => ({
          familyEventId: rowOf.get(answer.eventId)!,
          attending: answer.attending,
          persons: answer.persons,
          repliedByName,
          source: "guest" as const,
          repliedAt: now,
        })),
      });
      return { ok: true, saved: answers.length };
    });
  } catch (error) {
    // Another person saved a reply for one of these events a moment before: the unique rule stopped this save.
    if ((error as { code?: string }).code === "P2002") return { ok: false, code: "ALREADY_REPLIED", message: ALREADY };
    throw error;
  }
}
