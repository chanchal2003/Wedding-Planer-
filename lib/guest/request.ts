import { createHmac, randomBytes } from "node:crypto";
import { authEnv } from "@/lib/auth/env";

// Helpers for the guest cookies and the internet address (step 7.3).

export function deviceCookieName(slug: string) {
  return `device-${slug}`;
}

// A new random code for the anonymous device cookie.
export function newDeviceCode() {
  return randomBytes(24).toString("base64url");
}

// The internet address is never saved: only a keyed hash of it (HMAC). Locally there is no
// address header (the limit is skipped then). A change of the secret only resets the counters.
export function ipHashOf(headers: Headers): string | null {
  const address = headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip");
  // No address (only on the laptop): null, so the limit of the internet address is not used. Otherwise
  // all guests would share one bucket and could block each other (review of 2026-11-01).
  if (!address) return null;
  return createHmac("sha256", authEnv.BETTER_AUTH_SECRET).update(`ip:${address}`).digest("hex");
}

// The options of both guest cookies: not readable by scripts on the page, only for this wedding's address.
export function guestCookieOptions(slug: string) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: `/${slug}`,
    maxAge: 60 * 60 * 24 * 180, // 180 days: guest data is deleted 6 months after the wedding (NFR-15)
  };
}
