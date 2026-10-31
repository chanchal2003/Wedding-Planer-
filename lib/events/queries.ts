import { db } from "@/lib/db";
import { NO_ACCESS } from "@/lib/access/checks";
import { requireAdmin, requireMember } from "@/lib/access/guards";
import { findEventInWedding } from "@/lib/events/lookup";

// API design, Section 6. Every read function calls the guard first and returns its answer:
// a page turns a "no" into "page not found" with forPage(). An event that does not belong to
// the wedding is also a "no", so nobody can find out which events exist elsewhere.
// A component that calls these must sit inside <Suspense>.

export async function listEvents(weddingId: string) {
  const access = await requireMember(weddingId);
  if (!access.ok) return access;

  const events = await db.event.findMany({
    where: { weddingId: access.member.wedding.id },
    orderBy: { startsAt: "asc" },
    select: {
      id: true,
      type: true,
      name: true,
      startsAt: true,
      venueName: true,
      hostedBy: true,
      _count: { select: { familyEvents: true } },
    },
  });
  return { ...access, events };
}

export async function getEvent(weddingId: string, eventId: string) {
  const access = await requireMember(weddingId);
  if (!access.ok) return access;

  const event = await findEventInWedding(access.member.wedding.id, eventId);
  if (!event) return NO_ACCESS;
  return { ...access, event };
}

// For the delete page (admins only): how many families are invited and how many replies go.
export async function getEventDeleteImpact(weddingId: string, eventId: string) {
  const access = await requireAdmin(weddingId);
  if (!access.ok) return access;

  const event = await findEventInWedding(access.member.wedding.id, eventId);
  if (!event) return NO_ACCESS;

  const [families, replies] = await Promise.all([
    db.familyEvent.count({ where: { eventId: event.id } }),
    db.reply.count({ where: { familyEvent: { eventId: event.id } } }),
  ]);
  return { ...access, event, families, replies };
}
