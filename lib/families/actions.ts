"use server";

import type { Prisma } from "@/app/generated/prisma/client";
import { db } from "@/lib/db";
import { isUuid } from "@/lib/access/checks";
import { requireAdmin, requireMember } from "@/lib/access/guards";
import { denied } from "@/lib/access/respond";
import { assignByScope } from "@/lib/families/assign";
import { resetFamilyAccess } from "@/lib/guest/reset";
import { saveTeamReply } from "@/lib/rsvp/team-reply";
import { findFamilyInWedding } from "@/lib/families/lookup";
import { assignSchema, familySchema } from "@/lib/families/schemas";
import { fail, ok, type Result } from "@/lib/result";

// API design, Section 8. Every team member adds and edits families (FR-20), only admins delete
// them. Every function starts with its guard, every query includes the wedding, and a family with
// its numbers and events is saved in ONE transaction.

const SOMETHING_WRONG = "Something went wrong. Try again.";

function fieldsFrom(issues: { path: PropertyKey[]; message: string }[]) {
  const fields: Record<string, string> = {};
  for (const issue of issues) fields[String(issue.path[0] ?? "form")] ??= issue.message;
  return fields;
}

type Access = Awaited<ReturnType<typeof requireMember>> & { ok: true };

// A number can be in only one family of a wedding (FR-18). The message names the other family.
async function numberTakenBy(tx: Prisma.TransactionClient, weddingId: string, phones: string[], exceptFamilyId?: string) {
  if (phones.length === 0) return null;
  return tx.familyPhone.findFirst({
    where: { weddingId, phone: { in: phones }, ...(exceptFamilyId && { familyId: { not: exceptFamilyId } }) },
    select: { phone: true, family: { select: { familyName: true } } },
  });
}

// Only an admin sets the organizer (FR-21). undefined means "do not change it".
type OrganizerChoice = { value: string | null | undefined; error?: undefined } | { error: string; value?: undefined };

async function organizerFor(tx: Prisma.TransactionClient, access: Access, weddingId: string, organizerId: string | null): Promise<OrganizerChoice> {
  if (access.member.role !== "admin") return { value: undefined };
  if (organizerId === null) return { value: null };
  // FOR SHARE: this person cannot be removed while the family is saved (changeTeam locks FOR UPDATE and
  // then counts the families), so a family is never assigned to a removed person (FR-13).
  const members = await tx.$queryRaw<{ id: string }[]>`
    SELECT id FROM wedding_members WHERE id = ${organizerId}::uuid AND wedding_id = ${weddingId}::uuid AND status <> 'removed' FOR SHARE`;
  return members.length > 0 ? { value: members[0].id } : { error: "Choose a person from the team." };
}

export async function createFamily(weddingId: string, input: unknown): Promise<Result<{ familyId: string }>> {
  try {
    const access = await requireMember(weddingId);
    if (!access.ok) return denied(access);
    const wedding = access.member.wedding.id;

    const parsed = familySchema.safeParse(input);
    if (!parsed.success) return fail("INVALID_INPUT", "Please check the form.", fieldsFrom(parsed.error.issues));
    const data = parsed.data;
    const eventIds = [...new Set(data.eventIds)];

    return await db.$transaction(async (tx) => {
      const events = await tx.event.count({ where: { id: { in: eventIds }, weddingId: wedding } });
      if (events !== eventIds.length) return fail("INVALID_INPUT", "One of the events was not found.", { eventIds: "One of the events was not found." });

      const phones = [data.primaryPhone, data.secondaryPhone].filter((phone): phone is string => !!phone);
      const taken = await numberTakenBy(tx, wedding, phones);
      if (taken) {
        const message = `This number is already used by the ${taken.family.familyName}.`;
        const field = taken.phone === data.primaryPhone ? "primaryPhone" : "secondaryPhone";
        return fail("CONFLICT", message, { [field]: message });
      }

      const organizer = await organizerFor(tx, access, wedding, data.organizerId);
      if (organizer.error !== undefined) return fail("INVALID_INPUT", organizer.error, { organizerId: organizer.error });

      const family = await tx.family.create({
        data: {
          weddingId: wedding,
          familyName: data.familyName,
          contactName: data.contactName,
          city: data.city,
          side: data.side,
          notes: data.notes,
          assignedMemberId: organizer.value ?? null,
        },
        select: { id: true },
      });
      await tx.familyPhone.createMany({
        data: [
          ...(data.primaryPhone ? [{ familyId: family.id, weddingId: wedding, phone: data.primaryPhone, kind: "primary" as const }] : []),
          ...(data.secondaryPhone ? [{ familyId: family.id, weddingId: wedding, phone: data.secondaryPhone, kind: "secondary" as const }] : []),
        ],
      });
      await tx.familyEvent.createMany({ data: eventIds.map((eventId) => ({ familyId: family.id, eventId, weddingId: wedding })) });
      return ok({ familyId: family.id });
    });
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      return fail("CONFLICT", "This number is already used by another family.", { primaryPhone: "This number is already used by another family." });
    }
    console.error("createFamily failed:", error instanceof Error ? error.message : error);
    return fail("SERVER_ERROR", SOMETHING_WRONG);
  }
}

export async function updateFamily(weddingId: string, familyId: string, input: unknown): Promise<Result<null>> {
  try {
    const access = await requireMember(weddingId);
    if (!access.ok) return denied(access);
    const wedding = access.member.wedding.id;

    const current = await findFamilyInWedding(wedding, familyId);
    if (!current) return fail("NOT_FOUND", "This family was not found. It may have been deleted.");

    const parsed = familySchema.safeParse(input);
    if (!parsed.success) return fail("INVALID_INPUT", "Please check the form.", fieldsFrom(parsed.error.issues));
    const data = parsed.data;
    const eventIds = [...new Set(data.eventIds)];

    return await db.$transaction(async (tx) => {
      const events = await tx.event.count({ where: { id: { in: eventIds }, weddingId: wedding } });
      if (events !== eventIds.length) return fail("INVALID_INPUT", "One of the events was not found.", { eventIds: "One of the events was not found." });

      const phones = [data.primaryPhone, data.secondaryPhone].filter((phone): phone is string => !!phone);
      const taken = await numberTakenBy(tx, wedding, phones, current.id);
      if (taken) {
        const message = `This number is already used by the ${taken.family.familyName}.`;
        const field = taken.phone === data.primaryPhone ? "primaryPhone" : "secondaryPhone";
        return fail("CONFLICT", message, { [field]: message });
      }

      const organizer = await organizerFor(tx, access, wedding, data.organizerId);
      if (organizer.error !== undefined) return fail("INVALID_INPUT", organizer.error, { organizerId: organizer.error });

      const updated = await tx.family.updateMany({
        where: { id: current.id, weddingId: wedding },
        data: {
          familyName: data.familyName,
          contactName: data.contactName,
          city: data.city,
          side: data.side,
          notes: data.notes,
          ...(organizer.value !== undefined && { assignedMemberId: organizer.value }),
        },
      });
      // Another person deleted the family a moment ago: say so (nothing else is changed).
      if (updated.count === 0) return fail("NOT_FOUND", "This family was not found. It may have been deleted.");

      // The numbers: the old ones go and the new ones come, in this transaction. A number that stays
      // keeps its "incorrect" mark.
      const wasIncorrect = new Map(current.phones.map((p) => [p.phone, p.isIncorrect]));
      await tx.familyPhone.deleteMany({ where: { familyId: current.id, weddingId: wedding } });
      await tx.familyPhone.createMany({
        data: [
          ...(data.primaryPhone ? [{ familyId: current.id, weddingId: wedding, phone: data.primaryPhone, kind: "primary" as const, isIncorrect: wasIncorrect.get(data.primaryPhone) ?? false }] : []),
          ...(data.secondaryPhone ? [{ familyId: current.id, weddingId: wedding, phone: data.secondaryPhone, kind: "secondary" as const, isIncorrect: wasIncorrect.get(data.secondaryPhone) ?? false }] : []),
        ],
      });

      // The events: an event that is taken off the invitation takes its reply with it (FR-20, AC-20.1,
      // the database does it: cascade). New events are added.
      const before = new Set(current.familyEvents.map((e) => e.eventId));
      const removed = [...before].filter((id) => !eventIds.includes(id));
      const added = eventIds.filter((id) => !before.has(id));
      if (removed.length) await tx.familyEvent.deleteMany({ where: { familyId: current.id, weddingId: wedding, eventId: { in: removed } } });
      if (added.length) await tx.familyEvent.createMany({ data: added.map((eventId) => ({ familyId: current.id, eventId, weddingId: wedding })) });
      return ok(null);
    });
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      return fail("CONFLICT", "This number is already used by another family.", { primaryPhone: "This number is already used by another family." });
    }
    console.error("updateFamily failed:", error instanceof Error ? error.message : error);
    return fail("SERVER_ERROR", SOMETHING_WRONG);
  }
}

// Swaps the main and the second number (FR-20). Each number keeps its "incorrect" mark.
export async function swapPhones(weddingId: string, familyId: string): Promise<Result<null>> {
  try {
    const access = await requireMember(weddingId);
    if (!access.ok) return denied(access);
    const wedding = access.member.wedding.id;

    const family = await findFamilyInWedding(wedding, familyId);
    if (!family) return fail("NOT_FOUND", "This family was not found. It may have been deleted.");
    const primary = family.phones.find((p) => p.kind === "primary");
    const secondary = family.phones.find((p) => p.kind === "secondary");
    if (!primary || !secondary) return fail("NOT_ALLOWED_NOW", "This family has only one number.");

    await db.$transaction([
      db.familyPhone.deleteMany({ where: { familyId: family.id, weddingId: wedding } }),
      db.familyPhone.createMany({
        data: [
          { familyId: family.id, weddingId: wedding, phone: secondary.phone, kind: "primary", isIncorrect: secondary.isIncorrect },
          { familyId: family.id, weddingId: wedding, phone: primary.phone, kind: "secondary", isIncorrect: primary.isIncorrect },
        ],
      }),
    ]);
    return ok(null);
  } catch (error) {
    console.error("swapPhones failed:", error instanceof Error ? error.message : error);
    return fail("SERVER_ERROR", SOMETHING_WRONG);
  }
}

// Marks a number as incorrect (it goes to the list to correct, FR-19, AC-19.1), or as correct again.
export async function setPhoneIncorrect(weddingId: string, phoneId: string, incorrect: boolean): Promise<Result<null>> {
  try {
    const access = await requireMember(weddingId);
    if (!access.ok) return denied(access);
    if (!isUuid(phoneId)) return fail("NOT_FOUND", "This number was not found.");

    const result = await db.familyPhone.updateMany({
      where: { id: phoneId, weddingId: access.member.wedding.id },
      data: { isIncorrect: incorrect },
    });
    return result.count === 0 ? fail("NOT_FOUND", "This number was not found.") : ok(null);
  } catch (error) {
    console.error("setPhoneIncorrect failed:", error instanceof Error ? error.message : error);
    return fail("SERVER_ERROR", SOMETHING_WRONG);
  }
}

// Only admins delete a family. Its numbers, invitations, replies and devices go with it (cascade).
export async function deleteFamily(weddingId: string, familyId: string): Promise<Result<null>> {
  try {
    const access = await requireAdmin(weddingId);
    if (!access.ok) return denied(access);
    const wedding = access.member.wedding.id;

    const family = await findFamilyInWedding(wedding, familyId);
    if (!family) return fail("NOT_FOUND", "This family was not found. It may have been deleted already.");

    await db.family.deleteMany({ where: { id: family.id, weddingId: wedding } });
    return ok(null);
  } catch (error) {
    console.error("deleteFamily failed:", error instanceof Error ? error.message : error);
    return fail("SERVER_ERROR", "Something went wrong. Nothing was deleted. Try again.");
  }
}

// Only admins assign (FR-21). One transaction; the families of this wedding only.
export async function assignFamilies(weddingId: string, input: unknown): Promise<Result<{ assigned: number; name: string }>> {
  try {
    const access = await requireAdmin(weddingId);
    if (!access.ok) return denied(access);
    const wedding = access.member.wedding.id;

    const parsed = assignSchema.safeParse(input);
    if (!parsed.success) return fail("INVALID_INPUT", "Please check the form.", fieldsFrom(parsed.error.issues));

    const result = await db.$transaction((tx) => assignByScope(tx, wedding, parsed.data));
    return result.ok ? ok({ assigned: result.assigned, name: result.name }) : fail("INVALID_INPUT", result.message, { memberId: result.message });
  } catch (error) {
    console.error("assignFamilies failed:", error instanceof Error ? error.message : error);
    return fail("SERVER_ERROR", SOMETHING_WRONG);
  }
}

// FR-30, AC-30.3: a team member removes all devices that have access to ONE family, and its wrong
// tries (so a family that a stranger locked out can try again). The guests type the 4 digits again.
// Only the family of this wedding is touched (rule 2).
export async function resetFamilyDevices(weddingId: string, familyId: string): Promise<Result<{ removed: number; tries: number }>> {
  try {
    const access = await requireMember(weddingId);
    if (!access.ok) return denied(access);
    const wedding = access.member.wedding.id;

    const family = await findFamilyInWedding(wedding, familyId);
    if (!family) return fail("NOT_FOUND", "This family was not found. It may have been deleted.");

    const reset = await resetFamilyAccess(wedding, family.id);
    return ok({ removed: reset.devices, tries: reset.tries });
  } catch (error) {
    console.error("resetFamilyDevices failed:", error instanceof Error ? error.message : error);
    return fail("SERVER_ERROR", SOMETHING_WRONG);
  }
}

// FR-41: a team member enters or changes the reply of one event of a family, at any time (the last
// dates do not apply to the team). The family page shows "Updated by <name>". The saving is in
// lib/rsvp/team-reply.ts.
export async function setFamilyReply(weddingId: string, familyId: string, eventId: string, input: unknown): Promise<Result<null>> {
  try {
    const access = await requireMember(weddingId);
    if (!access.ok) return denied(access);

    const result = await saveTeamReply({
      weddingId: access.member.wedding.id,
      familyId: String(familyId),
      eventId: String(eventId),
      memberId: access.member.id,
      reply: input,
    });
    return result.ok ? ok(null) : fail(result.code, result.message, result.fields);
  } catch (error) {
    console.error("setFamilyReply failed:", error instanceof Error ? error.message : error);
    return fail("SERVER_ERROR", SOMETHING_WRONG);
  }
}
