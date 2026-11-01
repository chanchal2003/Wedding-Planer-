import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { isUuid } from "@/lib/access/checks";
import { hashToken } from "@/lib/access/hash";
import { LIMITS } from "@/lib/limits";
import { lastFourDigits } from "@/lib/phone";

// The check of the 4 digits (FR-29, FR-30, FR-31). It decides with plain inputs, so the tests can
// call it without a browser. The action (lib/rsvp/actions.ts) reads the cookies and the request,
// and sets the new cookie.
//
// Everything runs in ONE transaction that first takes three advisory locks (the device, the
// family and the internet address, always in this order). Without the locks, 100 requests sent at
// the same moment would all count "0 wrong tries" and all be checked: the limit would not work.

export type VerifyInput = {
  weddingId: string;
  familyId: string;
  digits: string;
  deviceHash: string; // hash of the anonymous device cookie
  ipHash: string | null; // hash of the internet address; null when the request has none (the limit is skipped)
  currentTokenHash?: string; // hash of the guest cookie this device already has, if any
  now?: Date; // the tests set the clock
};

export type VerifyResult =
  | { kind: "ok"; token: string | null } // token: the new cookie value; null when the device had access already
  | { kind: "mismatch" }
  | { kind: "too-many-tries" }
  | { kind: "too-many-devices" }
  | { kind: "not-found" };

const MINUTE = 60_000;

export async function verifyDigits(input: VerifyInput): Promise<VerifyResult> {
  const { weddingId, familyId, digits, deviceHash, ipHash, currentTokenHash } = input;
  const now = input.now ?? new Date();
  if (!isUuid(weddingId) || !isUuid(familyId)) return { kind: "not-found" };

  return db.$transaction(async (tx) => {
    for (const key of [`device:${deviceHash}`, `family:${familyId}`, ...(ipHash ? [`ip:${ipHash}`] : [])]) {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))`;
    }

    // The family must belong to the wedding of the link (rule 2).
    const family = await tx.family.findFirst({
      where: { id: familyId, weddingId },
      select: { id: true, phones: { select: { phone: true } } },
    });
    if (!family) return { kind: "not-found" } as const;

    // This device has access already: nothing to check, and no new device row.
    if (currentTokenHash) {
      const device = await tx.guestDevice.findUnique({ where: { tokenHash: currentTokenHash }, select: { familyId: true } });
      if (device?.familyId === family.id) return { kind: "ok", token: null } as const;
    }

    const ago = (minutes: number) => new Date(now.getTime() - minutes * MINUTE);
    const [onDevice, wrongOnDeviceForFamily, wrongForFamily, wrongFromIp] = await Promise.all([
      tx.accessAttempt.count({ where: { deviceHash, attemptedAt: { gte: ago(60) } } }),
      tx.accessAttempt.count({ where: { deviceHash, familyId: family.id, succeeded: false, attemptedAt: { gte: ago(LIMITS.wrongTriesWindowMinutes) } } }),
      tx.accessAttempt.count({ where: { familyId: family.id, succeeded: false, attemptedAt: { gte: ago(24 * 60) } } }),
      ipHash ? tx.accessAttempt.count({ where: { ipHash, succeeded: false, attemptedAt: { gte: ago(60) } } }) : Promise.resolve(0),
    ]);
    if (
      onDevice >= LIMITS.triesPerDevicePerHour ||
      wrongOnDeviceForFamily >= LIMITS.wrongTriesPerFamilyOnDevice ||
      wrongForFamily >= LIMITS.wrongTriesPerFamilyPerDay ||
      wrongFromIp >= LIMITS.wrongTriesPerIpPerHour
    ) {
      return { kind: "too-many-tries" } as const; // the digits are not checked
    }

    const matches = family.phones.some((row) => lastFourDigits(row.phone) === digits);
    await tx.accessAttempt.create({ data: { deviceHash, ipHash: ipHash ?? "unknown", familyId: family.id, succeeded: matches, attemptedAt: now } });
    if (!matches) return { kind: "mismatch" } as const;

    // At most 12 devices for each family. The row lock stops two taps at the same time from passing 12.
    await tx.$queryRaw`SELECT id FROM families WHERE id = ${family.id}::uuid FOR UPDATE`;
    const devices = await tx.guestDevice.count({ where: { familyId: family.id } });
    if (devices >= LIMITS.devicesPerFamily) return { kind: "too-many-devices" } as const;

    const token = randomBytes(32).toString("base64url");
    await tx.guestDevice.create({ data: { familyId: family.id, tokenHash: hashToken(token), createdAt: now, lastSeenAt: now } });
    return { kind: "ok", token } as const;
  });
}
