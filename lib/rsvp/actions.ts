"use server";

import { db } from "@/lib/db";
import { findFamiliesByName, type Match } from "@/lib/rsvp/search";
import { searchTextSchema } from "@/lib/rsvp/schemas";
import { fail, ok, type Result } from "@/lib/result";

// API design, Section 10. A guest does not sign in, so there is no member guard here: the person
// is "Anyone". The link name picks the wedding, and the search sees only the families of it.
// There is no limit on the number of searches: the owner accepts this risk (NFR-11, R-6).

export async function searchFamilies(slug: string, text: string): Promise<Result<Match[]>> {
  try {
    // The server checks the 3 letters too, so a script cannot skip the rule.
    const parsed = searchTextSchema.safeParse(text);
    if (!parsed.success) return fail("INVALID_INPUT", parsed.error.issues[0]?.message ?? "Type at least 3 letters.");

    const wedding = await db.wedding.findUnique({ where: { slug: String(slug) }, select: { id: true } });
    if (!wedding) return fail("NOT_FOUND", "This page was not found.");

    return ok(await findFamiliesByName(wedding.id, parsed.data));
  } catch (error) {
    console.error("searchFamilies failed:", error instanceof Error ? error.message : error);
    return fail("SERVER_ERROR", "Something went wrong. Try again.");
  }
}
