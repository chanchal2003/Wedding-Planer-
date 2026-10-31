"use server";

import { db } from "@/lib/db";
import { requireAdmin, requireMember } from "@/lib/access/guards";
import { denied } from "@/lib/access/respond";
import { findEventInWedding } from "@/lib/events/lookup";
import { makeEventSchema } from "@/lib/events/schemas";
import { fail, ok, type Result } from "@/lib/result";
import { indiaParts, parseIndiaDateTime, todayInIndia } from "@/lib/time";

// API design, Section 6. Admins add and delete events. Every team member edits the details
// (FR-7, AC-7.1). Every function starts with its guard, and every query includes the wedding.

const SOMETHING_WRONG = "Something went wrong. Try again.";

function fieldsFrom(issues: { path: PropertyKey[]; message: string }[]) {
  const fields: Record<string, string> = {};
  for (const issue of issues) fields[String(issue.path[0] ?? "form")] ??= issue.message;
  return fields;
}

export async function createEvent(weddingId: string, input: unknown): Promise<Result<{ eventId: string }>> {
  try {
    const access = await requireAdmin(weddingId);
    if (!access.ok) return denied(access);

    const weddingDay = access.member.wedding.weddingDate.toISOString().slice(0, 10);
    const parsed = makeEventSchema({ today: todayInIndia(), weddingDay, savedDay: "" }).safeParse(input);
    if (!parsed.success) return fail("INVALID_INPUT", "Please check the form.", fieldsFrom(parsed.error.issues));
    const { day, time, ...data } = parsed.data;

    const event = await db.event.create({
      data: { ...data, weddingId: access.member.wedding.id, startsAt: parseIndiaDateTime(day, time) },
      select: { id: true },
    });
    return ok({ eventId: event.id });
  } catch (error) {
    console.error("createEvent failed:", error instanceof Error ? error.message : error);
    return fail("SERVER_ERROR", SOMETHING_WRONG);
  }
}

export async function updateEvent(weddingId: string, eventId: string, input: unknown): Promise<Result<null>> {
  try {
    const access = await requireMember(weddingId);
    if (!access.ok) return denied(access);

    const current = await findEventInWedding(access.member.wedding.id, eventId);
    if (!current) return fail("NOT_FOUND", "This event was not found. It may have been deleted.");

    const weddingDay = access.member.wedding.weddingDate.toISOString().slice(0, 10);
    const parsed = makeEventSchema({ today: todayInIndia(), weddingDay, savedDay: indiaParts(current.startsAt).day }).safeParse(input);
    if (!parsed.success) return fail("INVALID_INPUT", "Please check the form.", fieldsFrom(parsed.error.issues));
    const { day, time, ...data } = parsed.data;

    // "weddingId" is part of the filter: an event of another wedding can never be changed here.
    await db.event.updateMany({
      where: { id: current.id, weddingId: access.member.wedding.id },
      data: { ...data, startsAt: parseIndiaDateTime(day, time) },
    });
    return ok(null);
  } catch (error) {
    console.error("updateEvent failed:", error instanceof Error ? error.message : error);
    return fail("SERVER_ERROR", SOMETHING_WRONG);
  }
}

// The replies and the invitations of this event go with it (the database does it: cascade).
export async function deleteEvent(weddingId: string, eventId: string): Promise<Result<null>> {
  try {
    const access = await requireAdmin(weddingId);
    if (!access.ok) return denied(access);

    const current = await findEventInWedding(access.member.wedding.id, eventId);
    if (!current) return fail("NOT_FOUND", "This event was not found. It may have been deleted already.");

    await db.event.deleteMany({ where: { id: current.id, weddingId: access.member.wedding.id } });
    return ok(null);
  } catch (error) {
    console.error("deleteEvent failed:", error instanceof Error ? error.message : error);
    return fail("SERVER_ERROR", "Something went wrong. Nothing was deleted. Try again.");
  }
}
