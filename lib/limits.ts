// The limits of the guest access (FR-30, FR-31, NFR-10). One file, one place to change them.
// Decided 2026-10-30 (PRD Section 15, Q-1 and Q-2).

export const LIMITS = {
  devicesPerFamily: 12,
  // 5 wrong tries for one family on one device, in a sliding window, then a stop until the oldest leaves the window.
  wrongTriesPerFamilyOnDevice: 5,
  wrongTriesWindowMinutes: 15,
  // All tries (right or wrong) from one device.
  triesPerDevicePerHour: 20,
  // These two do not depend on the cookie, so a script that drops its cookie is still stopped.
  wrongTriesPerFamilyPerDay: 30,
  wrongTriesPerIpPerHour: 30,
} as const;

export const MESSAGES = {
  mismatch: "The number does not match. Check the last 4 digits and try again.",
  tooManyTries: "Too many tries. Please wait 15 minutes, then try again, or ask the person who sent you the card.",
  tooManyDevices: "Too many devices. Ask the person who sent you the card.",
  allDigits: "Type all 4 digits.",
} as const;
