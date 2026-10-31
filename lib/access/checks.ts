import { db } from "@/lib/db";
import { hashToken } from "@/lib/access/hash";

// The inner part of the security guard (API design, Section 3). It decides with plain
// inputs, so the tests can call it without a browser and without a signed-in session.
// The outer part (guards.ts) reads the session or the cookie and calls these functions.
// Every check refuses by returning { ok: false }; it never throws for a wrong input.

export type Denied = { ok: false; code: "NOT_SIGNED_IN" | "NO_ACCESS" };
export type Allowed<T> = { ok: true } & T;
export type Access<T> = Allowed<T> | Denied;

export const NO_ACCESS: Denied = { ok: false, code: "NO_ACCESS" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// An address like /w/abc must not reach the database (it would be an error, not a refusal).
export function isUuid(value: string): boolean {
  return UUID.test(value);
}

// An ACTIVE member of this wedding. Pending and removed rows do not count.
export async function checkMember(userId: string, weddingId: string) {
  if (!isUuid(userId) || !isUuid(weddingId)) return NO_ACCESS;

  const member = await db.weddingMember.findFirst({
    where: { weddingId, userId, status: "active" },
    select: {
      id: true,
      role: true,
      relation: true,
      canSeeMoney: true,
      displayName: true,
      wedding: { select: { id: true, slug: true, isTest: true } },
    },
  });
  if (!member) return NO_ACCESS;
  return { ok: true, member } as const;
}

export async function checkAdmin(userId: string, weddingId: string) {
  const access = await checkMember(userId, weddingId);
  if (!access.ok) return access;
  if (access.member.role !== "admin") return NO_ACCESS;
  return access;
}

// An admin, or an organizer whose "can see money" switch is on.
export async function checkMoneyAccess(userId: string, weddingId: string) {
  const access = await checkMember(userId, weddingId);
  if (!access.ok) return access;
  if (access.member.role !== "admin" && !access.member.canSeeMoney) return NO_ACCESS;
  return access;
}

// A guest device (a cookie code) that belongs to a family of THIS wedding.
// The result holds only the family of the device. Nothing here lets a guest reach
// another family or another wedding (FR-64).
export async function checkGuestDevice(weddingId: string, token: string | undefined) {
  if (!token || !isUuid(weddingId)) return NO_ACCESS;

  const device = await db.guestDevice.findUnique({
    where: { tokenHash: hashToken(token) },
    select: {
      id: true,
      family: { select: { id: true, weddingId: true, familyName: true } },
    },
  });
  if (!device || device.family.weddingId !== weddingId) return NO_ACCESS;
  return { ok: true, device: { id: device.id }, family: device.family } as const;
}
