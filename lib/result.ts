// The answer of every Server Action (API design, Section 2.3). An action never throws an
// error to the browser. It returns ok, or an error with a code (for the program) and a
// message (for the person, in plain words, saying what to do next).

export type ErrorCode =
  | "NOT_SIGNED_IN"
  | "NO_ACCESS"
  | "NOT_FOUND"
  | "INVALID_INPUT"
  | "CONFLICT"
  | "NOT_ALLOWED_NOW"
  | "CLOSED"
  | "TOO_MANY_TRIES"
  | "ALREADY_REPLIED"
  | "SERVER_ERROR";

export type ActionError = {
  code: ErrorCode;
  message: string;
  // One message for each wrong form field, for example { primaryPhone: "..." }.
  fields?: Record<string, string>;
};

export type Result<T> = { ok: true; data: T } | { ok: false; error: ActionError };

export function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}

export function fail(
  code: ErrorCode,
  message: string,
  fields?: Record<string, string>,
): { ok: false; error: ActionError } {
  return { ok: false, error: { code, message, ...(fields && { fields }) } };
}
