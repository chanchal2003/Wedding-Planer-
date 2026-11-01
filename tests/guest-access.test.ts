import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { checkGuestDevice } from "@/lib/access/checks";
import { verifyDigits, type VerifyInput } from "@/lib/guest/verify";
import { resetFamilyAccess } from "@/lib/guest/reset";
import { LIMITS } from "@/lib/limits";
import { makeUser, makeWedding, resetDatabase } from "./helpers";

// FR-29 to FR-31, AC-29.1 to AC-31.2, NFR-9, NFR-10. The Sharma family has the numbers
// 98765 11111 and 98765 22222. The tests set the clock, so no test has to wait.
const T0 = new Date("2026-12-05T10:00:00Z");
const minutes = (n: number) => new Date(T0.getTime() + n * 60_000);

async function setup() {
  const priya = await makeUser("Priya");
  const wedding = await makeWedding("priya-rahul", priya.id);
  let next = 0;
  // The Sharma family has the two numbers above. Every other family gets numbers of its own
  // (a number can be in only one family of a wedding).
  const family = async (familyName: string, numbers: string[] = [`+9198000${String(++next).padStart(5, "0")}`], weddingId = wedding.id) => {
    const created = await db.family.create({ data: { weddingId, familyName, side: "groom" } });
    for (const [index, phone] of numbers.entries()) {
      await db.familyPhone.create({ data: { familyId: created.id, weddingId, phone, kind: index === 0 ? "primary" : "secondary" } });
    }
    return created;
  };
  const sharma = await family("Sharma family", ["+919876511111", "+919876522222"]);
  const guess = (digits: string, extra: Partial<VerifyInput> = {}) =>
    verifyDigits({ weddingId: wedding.id, familyId: sharma.id, digits, deviceHash: "device-1", ipHash: "ip-1", now: T0, ...extra });
  return { priya, wedding, family, sharma, guess };
}

describe("the 4-digit check", () => {
  beforeEach(resetDatabase);
  afterAll(async () => {
    await resetDatabase();
    await db.$disconnect();
  });

  it("opens the family with the last 4 digits of the main or the second number (AC-29.1)", async () => {
    const { wedding, guess } = await setup();
    for (const [digits, device] of [["1111", "a"], ["2222", "b"]] as const) {
      const result = await guess(digits, { deviceHash: device });
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") expect(await checkGuestDevice(wedding.id, result.token!)).toMatchObject({ ok: true });
    }
  });

  it("refuses wrong digits and the digits of no number (AC-29.2)", async () => {
    const { guess } = await setup();
    expect((await guess("5555")).kind).toBe("mismatch");
  });

  it("stops after 5 wrong tries, also for the right digits, and lets the device in 15 minutes later (AC-31.1)", async () => {
    const { guess } = await setup();
    for (let i = 0; i < LIMITS.wrongTriesPerFamilyOnDevice; i++) expect((await guess("5555", { now: minutes(i) })).kind).toBe("mismatch");

    expect((await guess("1111", { now: minutes(5) })).kind).toBe("too-many-tries");
    expect((await guess("1111", { now: minutes(14) })).kind).toBe("too-many-tries"); // the window slides: the first try is 14 minutes old
    expect((await guess("1111", { now: minutes(16) })).kind).toBe("ok"); // tries 0 and 1 are older than 15 minutes
  });

  it("stops a device after 20 tries in one hour, also for another family (AC-31.2)", async () => {
    const { wedding, family, guess } = await setup();
    for (const name of ["A", "B", "C", "D"]) {
      const other = await family(`${name} family`);
      for (let i = 0; i < 5; i++) await verifyDigits({ weddingId: wedding.id, familyId: other.id, digits: "5555", deviceHash: "device-1", ipHash: `ip-${name}`, now: minutes(i) });
    }
    expect((await guess("1111", { now: minutes(10) })).kind).toBe("too-many-tries");
    expect((await guess("1111", { now: minutes(70) })).kind).toBe("ok");
  });

  it("stops a family after 30 wrong tries in a day from many devices (no cookie needed)", async () => {
    const { guess } = await setup();
    for (let i = 0; i < LIMITS.wrongTriesPerFamilyPerDay; i++) await guess("5555", { deviceHash: `d-${i}`, ipHash: `ip-${i}` });

    expect((await guess("1111", { deviceHash: "new-device", ipHash: "new-ip" })).kind).toBe("too-many-tries");
    expect((await guess("1111", { deviceHash: "new-device", ipHash: "new-ip", now: minutes(24 * 60 + 1) })).kind).toBe("ok");
  });

  it("stops an internet address after 30 wrong tries in an hour, for any family", async () => {
    const { wedding, family, guess } = await setup();
    for (let i = 0; i < LIMITS.wrongTriesPerIpPerHour; i++) {
      const other = await family(`Family ${i}`);
      await verifyDigits({ weddingId: wedding.id, familyId: other.id, digits: "5555", deviceHash: `d-${i}`, ipHash: "same-ip", now: T0 });
    }
    expect((await guess("1111", { deviceHash: "fresh", ipHash: "same-ip" })).kind).toBe("too-many-tries");
    expect((await guess("1111", { deviceHash: "fresh", ipHash: "other-ip" })).kind).toBe("ok");
  });

  it("allows 12 devices for a family, refuses the 13th, and a reset lets a new device in (AC-30.2, AC-30.3)", async () => {
    const { wedding, sharma, guess } = await setup();
    for (let i = 0; i < LIMITS.devicesPerFamily; i++) expect((await guess("1111", { deviceHash: `d-${i}`, ipHash: `ip-${i}` })).kind).toBe("ok");
    expect((await guess("1111", { deviceHash: "d-13", ipHash: "ip-13" })).kind).toBe("too-many-devices");

    await resetFamilyAccess(wedding.id, sharma.id);
    expect((await guess("1111", { deviceHash: "d-13", ipHash: "ip-13" })).kind).toBe("ok");
  });

  it("a reset also clears the wrong tries, so a family locked out by a stranger can try again", async () => {
    const { wedding, family, sharma, guess } = await setup();
    const other = await family("Verma family");
    await verifyDigits({ weddingId: wedding.id, familyId: other.id, digits: "5555", deviceHash: "x", ipHash: "ip-x", now: T0 });
    for (let i = 0; i < LIMITS.wrongTriesPerFamilyPerDay; i++) await guess("5555", { deviceHash: `d-${i}`, ipHash: `ip-${i}` });
    expect((await guess("1111", { deviceHash: "fresh", ipHash: "fresh-ip" })).kind).toBe("too-many-tries");

    const reset = await resetFamilyAccess(wedding.id, sharma.id);

    expect(reset.tries).toBe(LIMITS.wrongTriesPerFamilyPerDay);
    expect((await guess("1111", { deviceHash: "fresh", ipHash: "fresh-ip" })).kind).toBe("ok");
    expect(await db.accessAttempt.count({ where: { familyId: other.id } })).toBe(1); // another family keeps its tries
  });

  it("does not reset a family through another wedding", async () => {
    const { priya, sharma, guess } = await setup();
    const other = await makeWedding("other-wedding", priya.id);
    await guess("5555");

    const reset = await resetFamilyAccess(other.id, sharma.id);

    expect(reset).toEqual({ devices: 0, tries: 0 });
    expect(await db.accessAttempt.count({ where: { familyId: sharma.id } })).toBe(1);
  });

  it("skips the limit of the internet address when the request has no address", async () => {
    const { wedding, family, guess } = await setup();
    for (let i = 0; i < LIMITS.wrongTriesPerIpPerHour + 5; i++) {
      const other = await family(`Family ${i}`);
      await verifyDigits({ weddingId: wedding.id, familyId: other.id, digits: "5555", deviceHash: `d-${i}`, ipHash: null, now: T0 });
    }
    expect((await guess("1111", { deviceHash: "fresh", ipHash: null })).kind).toBe("ok");
  });

  it("never opens a family through the link of another wedding (NFR-9)", async () => {
    const { priya, family, sharma } = await setup();
    const other = await makeWedding("other-wedding", priya.id);
    const result = await verifyDigits({ weddingId: other.id, familyId: sharma.id, digits: "1111", deviceHash: "d", ipHash: "i", now: T0 });
    expect(result.kind).toBe("not-found");
    expect(await db.guestDevice.count()).toBe(0);
    void family;
  });

  it("does not add a device when the phone already has access to the family", async () => {
    const { guess } = await setup();
    const first = await guess("1111");
    if (first.kind !== "ok" || !first.token) throw new Error("the first try must work");
    const { hashToken } = await import("@/lib/access/hash");

    const again = await guess("1111", { currentTokenHash: hashToken(first.token) });

    expect(again).toEqual({ kind: "ok", token: null });
    expect(await db.guestDevice.count()).toBe(1);
  });

  it("checks only 5 of 20 wrong tries that arrive at the same moment", async () => {
    const { guess } = await setup();
    const results = await Promise.all(Array.from({ length: 20 }, () => guess("5555")));

    expect(results.filter((r) => r.kind === "mismatch")).toHaveLength(LIMITS.wrongTriesPerFamilyOnDevice);
    expect(await db.accessAttempt.count()).toBe(LIMITS.wrongTriesPerFamilyOnDevice);
  });

  it("never opens a family that has no number, and says the same as for wrong digits", async () => {
    const { wedding, family } = await setup();
    const empty = await family("Empty family", []);
    const result = await verifyDigits({ weddingId: wedding.id, familyId: empty.id, digits: "0000", deviceHash: "d", ipHash: "i", now: T0 });
    expect(result.kind).toBe("mismatch");
  });
});
