"use server";

import { cookies, headers } from "next/headers";
import { guestCookieName } from "@/lib/access/guards";
import { hashToken } from "@/lib/access/hash";
import { db } from "@/lib/db";
import { deviceCookieName, guestCookieOptions, ipHashOf, newDeviceCode } from "@/lib/guest/request";
import { verifyDigits } from "@/lib/guest/verify";
import { MESSAGES } from "@/lib/limits";
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

// FR-29 to FR-31. The guest picked a family and typed 4 digits. The limits and the check are in
// lib/guest/verify.ts. A request with no device cookie gets a new one, and counts as a new device:
// the limits that do not use the cookie are what stop a script.
export async function verifyFamilyDigits(slug: string, familyId: string, digits: string): Promise<Result<null>> {
  try {
    if (!/^\d{4}$/.test(String(digits))) return fail("INVALID_INPUT", MESSAGES.allDigits);
    const wedding = await db.wedding.findUnique({ where: { slug: String(slug) }, select: { id: true } });
    if (!wedding) return fail("NOT_FOUND", "This page was not found.");

    const jar = await cookies();
    const options = guestCookieOptions(slug);
    let deviceCode = jar.get(deviceCookieName(slug))?.value;
    if (!deviceCode || deviceCode.length > 100) {
      deviceCode = newDeviceCode();
      jar.set(deviceCookieName(slug), deviceCode, options);
    }
    const guestToken = jar.get(guestCookieName(slug))?.value;

    const result = await verifyDigits({
      weddingId: wedding.id,
      familyId: String(familyId),
      digits: String(digits),
      deviceHash: hashToken(deviceCode),
      ipHash: ipHashOf(await headers()),
      currentTokenHash: guestToken ? hashToken(guestToken) : undefined,
    });

    switch (result.kind) {
      case "ok":
        if (result.token) jar.set(guestCookieName(slug), result.token, options);
        return ok(null);
      case "mismatch":
        return fail("INVALID_INPUT", MESSAGES.mismatch);
      case "too-many-tries":
        return fail("TOO_MANY_TRIES", MESSAGES.tooManyTries);
      case "too-many-devices":
        return fail("NOT_ALLOWED_NOW", MESSAGES.tooManyDevices);
      default:
        return fail("NOT_FOUND", "This family was not found. Search again.");
    }
  } catch (error) {
    console.error("verifyFamilyDigits failed:", error instanceof Error ? error.message : error);
    return fail("SERVER_ERROR", "Something went wrong. Try again.");
  }
}
