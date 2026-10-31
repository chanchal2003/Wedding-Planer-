import { describe, expect, it } from "vitest";
import { displayPhone, lastFourDigits, normalizePhone, optionalPhoneSchema, phoneSchema } from "@/lib/phone";

// The phone rules (FR-15, FR-18). The import and the 4-digit check use the same rules.
describe("normalizePhone", () => {
  it("gives the same number for every way of writing it (AC-18.1)", () => {
    for (const text of ["+91 98765-11111", "09876511111", "98765 11111", "9876511111", "+919876511111", "(98765) 11111"]) {
      expect(normalizePhone(text)).toBe("+919876511111");
    }
  });

  it("treats a number with no + as an Indian number", () => {
    expect(normalizePhone("98765 11111")).toBe("+919876511111");
  });

  it("accepts a number from another country when it starts with +", () => {
    expect(normalizePhone("+1 415 555 2671")).toBe("+14155552671");
    expect(normalizePhone("+971 50 123 4567")).toBe("+971501234567");
    expect(normalizePhone("+44 20 7946 0958")).toBe("+442079460958");
  });

  it("accepts an Indian landline", () => {
    expect(normalizePhone("011 2345 6789")).toBe("+911123456789");
    expect(normalizePhone("+91 11 2345 6789")).toBe("+911123456789");
  });

  it("refuses a number that is too short, only zeros, letters, or empty", () => {
    for (const text of ["98765 1111", "12345", "0000000000", "hello", "", "   "]) {
      expect(normalizePhone(text)).toBeNull();
    }
  });

  it("refuses a number with an extension, so two texts never become one number", () => {
    expect(normalizePhone("9876511111 ext 22")).toBeNull();
  });
});

describe("lastFourDigits and displayPhone", () => {
  it("gives the last 4 digits for the guest check", () => {
    expect(lastFourDigits("+919876511111")).toBe("1111");
    expect(lastFourDigits("+919876522222")).toBe("2222");
  });

  it("shows a number in a readable way", () => {
    expect(displayPhone("+919876511111")).toBe("+91 98765 11111");
  });
});

describe("the form rules", () => {
  it("phoneSchema returns the standard number, or the message", () => {
    expect(phoneSchema.parse(" 098765 11111 ")).toBe("+919876511111");
    const bad = phoneSchema.safeParse("98765 1111");
    expect(bad.success).toBe(false);
    if (!bad.success) expect(bad.error.issues[0].message).toBe("This is not a valid phone number");
  });

  it("optionalPhoneSchema lets a number be empty, and checks it when it is there", () => {
    expect(optionalPhoneSchema.parse("  ")).toBeNull();
    expect(optionalPhoneSchema.parse("98765 11111")).toBe("+919876511111");
    expect(optionalPhoneSchema.safeParse("hello").success).toBe(false);
  });
});
