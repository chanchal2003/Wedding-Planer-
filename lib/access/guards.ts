import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/access/session";
import {
  checkAdmin,
  checkGuestDevice,
  checkMember,
  checkMoneyAccess,
  type Access,
  type Denied,
} from "@/lib/access/checks";

// The outer part of the security guard (API design, Section 3). Every page and every
// Server Action calls one of these first (CLAUDE.md rule 1). They read the session
// cookie (team) or the guest cookie, then ask the inner part in checks.ts.
//
// Each guard RETURNS an answer, it does not throw. A page turns a "no" into a redirect or
// "not found" with forPage() (respond.ts). An action turns it into an error with denied().
// TypeScript does not let you use the member before you handled the "no".
// A component that calls a guard must sit inside <Suspense> (CLAUDE.md rule 13).

async function withUser<T>(
  check: (userId: string) => Promise<Access<T>>,
): Promise<Access<T & { user: NonNullable<Awaited<ReturnType<typeof getSessionUser>>> }>> {
  const user = await getSessionUser();
  if (!user) return { ok: false, code: "NOT_SIGNED_IN" } satisfies Denied;
  const access = await check(user.id);
  if (!access.ok) return access;
  return { ...access, user };
}

export const requireMember = (weddingId: string) =>
  withUser((userId) => checkMember(userId, weddingId));

export const requireAdmin = (weddingId: string) =>
  withUser((userId) => checkAdmin(userId, weddingId));

// Defined now; the first screen that uses it comes with the Money release.
export const requireMoneyAccess = (weddingId: string) =>
  withUser((userId) => checkMoneyAccess(userId, weddingId));

// Guests: the cookie is named for the wedding ("guest-priya-rahul"), so a family that is
// invited to two weddings keeps access to both.
export function guestCookieName(slug: string) {
  return `guest-${slug}`;
}

// Screen 1 or Screen 2? Returns the family of this device, or null (no access yet).
export async function getGuestFamily(slug: string) {
  const wedding = await db.wedding.findUnique({ where: { slug }, select: { id: true } });
  if (!wedding) return null;
  const token = (await cookies()).get(guestCookieName(slug))?.value;
  const access = await checkGuestDevice(wedding.id, token);
  return access.ok ? access : null;
}

export async function requireGuestFamily(slug: string) {
  const guest = await getGuestFamily(slug);
  if (!guest) return { ok: false, code: "NO_ACCESS" } satisfies Denied;
  return guest;
}
