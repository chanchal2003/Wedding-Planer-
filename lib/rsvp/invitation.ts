import { db } from "@/lib/db";
import { contactText, firstNameOf } from "@/lib/rsvp/names";
import { formatDate, formatEventDate, formatEventTime, isAfterLastDate } from "@/lib/time";

// Screen 2 (FR-32): the invitation of ONE family, read with plain ids so the tests can call it. It
// does not check who is asking: getGuestInvitation (queries.ts) reads the cookie first. Only the
// family's own invited events are read, and only what a guest may see: no event note, no budget,
// no other family (FR-64, NFR-9).
export async function loadInvitation(weddingId: string, familyId: string, now = new Date()) {
  const family = await db.family.findFirst({
    where: { id: familyId, weddingId },
    select: {
      familyName: true,
      assignedMember: { select: { displayName: true, user: { select: { name: true } } } },
      wedding: { select: { rsvpLastDate: true } },
      familyEvents: {
        select: {
          event: { select: { id: true, name: true, type: true, startsAt: true, venueName: true, mapLink: true } },
          reply: {
            select: {
              attending: true,
              persons: true,
              repliedByName: true,
              repliedAt: true,
              source: true,
              updatedBy: { select: { displayName: true, user: { select: { name: true } } } },
            },
          },
        },
      },
    },
  });
  if (!family) return null;

  const lastDate = family.wedding.rsvpLastDate;
  const organizer = firstNameOf(family.assignedMember);
  const events = family.familyEvents
    .map((row) => ({
      id: row.event.id,
      name: row.event.name,
      type: row.event.type,
      startsAt: row.event.startsAt,
      date: formatEventDate(row.event.startsAt),
      time: formatEventTime(row.event.startsAt),
      venueName: row.event.venueName,
      mapLink: row.event.mapLink,
      reply: row.reply
        ? {
            attending: row.reply.attending,
            persons: row.reply.persons,
            repliedByName: row.reply.repliedByName,
            repliedOn: formatEventDate(row.reply.repliedAt),
            byTeam: row.reply.source === "team",
            updatedBy: firstNameOf(row.reply.updatedBy),
          }
        : null,
    }))
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
    .map(({ startsAt, ...event }) => {
      void startsAt; // only used to sort
      return event;
    });

  return {
    familyName: family.familyName,
    organizer, // first name or null
    contact: contactText(organizer), // the end of "Contact ..."
    lastDate: lastDate ? formatDate(lastDate).replace(/ \d{4}$/, "") : null, // "31 December"
    isClosed: !!lastDate && isAfterLastDate(lastDate, now),
    events,
  };
}
