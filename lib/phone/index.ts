import { parsePhoneNumberFromString } from "libphonenumber-js/max";
import { z } from "zod";

// One standard form for every phone number (FR-15, FR-18, CLAUDE.md rule 6): "+919876511111".
// A number with no "+" is an Indian number (+91). A number with "+" can be from any country.
// Any real mobile or landline number is valid. The family form, the import and the 4-digit check
// of a guest all use this file, so "+91 98765-11111", "09876511111" and "98765 11111" are the
// same number everywhere.

export const PHONE_ERROR = "This is not a valid phone number";

// Kinds of number that are not a person's phone (premium rate, toll free, ...) are refused.
const REFUSED_TYPES = new Set(["PREMIUM_RATE", "TOLL_FREE", "SHARED_COST", "UAN", "PAGER", "VOICEMAIL"]);

// Returns "+919876511111", or null when the text is not a valid phone number.
export function normalizePhone(input: string): string | null {
  const text = input.trim();
  if (text === "") return null;

  const parsed = parsePhoneNumberFromString(text, "IN");
  if (!parsed || !parsed.isValid()) return null;
  // "98765 11111 ext 22" would become the same number as "98765 11111": refuse it.
  if (parsed.ext) return null;
  const type = parsed.getType();
  if (type && REFUSED_TYPES.has(type)) return null;
  return parsed.number;
}

// The last 4 digits of a standard number: the guest types them to open the invitation (FR-29).
export function lastFourDigits(phone: string): string {
  return phone.replace(/\D/g, "").slice(-4);
}

// For the screen: "+919876511111" shown as "+91 98765 11111".
export function displayPhone(phone: string): string {
  return parsePhoneNumberFromString(phone)?.formatInternational() ?? phone;
}

// A phone number that must be there. The result is the standard number.
export const phoneSchema = z
  .string()
  .trim()
  .transform((value, ctx) => {
    const phone = normalizePhone(value);
    if (!phone) {
      ctx.addIssue({ code: "custom", message: PHONE_ERROR });
      return z.NEVER;
    }
    return phone;
  });

// A phone number that may be empty (a family can have no number, FR-19). Empty becomes null.
export const optionalPhoneSchema = z
  .string()
  .trim()
  .transform((value, ctx) => {
    if (value === "") return null;
    const phone = normalizePhone(value);
    if (!phone) {
      ctx.addIssue({ code: "custom", message: PHONE_ERROR });
      return z.NEVER;
    }
    return phone;
  });
