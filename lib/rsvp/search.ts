import { db } from "@/lib/db";
import { MAX_MATCHES } from "@/lib/rsvp/schemas";

// The family search of the guest page (FR-28, AC-28.2). It does not check the length of the text:
// the action does it first. It searches the family name only, inside ONE wedding (rule 2), and
// returns only what a guest may see: the id, the family name and a hint to tell two families with
// the same name apart. Never a number, an organizer, an event or a note (NFR-9).
export type Match = { id: string; familyName: string; hint: string };

export async function findFamiliesByName(weddingId: string, text: string): Promise<Match[]> {
  // % and _ are letters of the text, not wildcards.
  const escaped = text.replace(/[\\%_]/g, "\\$&");
  const select = { id: true, familyName: true, contactName: true, city: true } as const;
  const order = [{ familyName: "asc" as const }, { id: "asc" as const }];

  // Names that start with the text come first. They are asked for first, so a family such as
  // "Sharma" is never cut off by 50 other names that only contain "sha" (found by the review).
  const starting = await db.family.findMany({
    where: { weddingId, familyName: { startsWith: escaped, mode: "insensitive" } },
    orderBy: order,
    take: MAX_MATCHES,
    select,
  });
  const others =
    starting.length >= MAX_MATCHES
      ? []
      : await db.family.findMany({
          where: {
            weddingId,
            familyName: { contains: escaped, mode: "insensitive" },
            id: { notIn: starting.map((row) => row.id) },
          },
          orderBy: order,
          take: MAX_MATCHES - starting.length,
          select,
        });

  return [...starting, ...others].map((row) => ({
    id: row.id,
    familyName: row.familyName,
    hint: [row.contactName, row.city].filter(Boolean).join(", "),
  }));
}
