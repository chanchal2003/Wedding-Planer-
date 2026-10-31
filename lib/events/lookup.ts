import { db } from "@/lib/db";
import { isUuid } from "@/lib/access/checks";

// Finds ONE event of ONE wedding. The event must belong to that wedding: an event id of another
// wedding gives null, never the data (CLAUDE.md rule 2). Used by every read and action on a single
// event. It does not check who is asking; the caller calls the guard first.
export async function findEventInWedding(weddingId: string, eventId: string) {
  if (!isUuid(weddingId) || !isUuid(eventId)) return null;
  return db.event.findFirst({
    where: { id: eventId, weddingId },
    select: {
      id: true,
      type: true,
      name: true,
      startsAt: true,
      venueName: true,
      mapLink: true,
      note: true,
      hostedBy: true,
    },
  });
}
