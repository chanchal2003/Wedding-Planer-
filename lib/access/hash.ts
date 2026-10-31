import { createHash } from "node:crypto";

// The guest cookie holds a random code. The database keeps only its SHA-256 hash, so a
// copy of the database cannot be used to open a family's invitation.
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
