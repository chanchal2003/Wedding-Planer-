import type { Prisma } from "@/app/generated/prisma/client";
import { problem, type ImportRow, type Problem } from "@/lib/import/types";
import { displayPhone } from "@/lib/phone";

// Step 2 of the import (CLAUDE.md rule 7): compares the good rows of the file with what is already in
// the app. It only READS, and every query includes the wedding (rule 2).
// A row is one of four things: NEW (it will be saved), ALREADY IN THE APP (skipped, only a warning),
// an ERROR (a number of another family, an organizer who is not on the team), or the SAME FAMILY TWICE
// in the file (a warning: only the first is saved).

const norm = (text: string | null) => (text ?? "").toLowerCase().replace(/\s+/g, " ").trim();

// A family with no number is recognised by its name, its contact name and its city (decided 2026-10-31).
const withoutNumberKey = (family: { familyName: string; contactName: string | null; city: string | null }) =>
  [norm(family.familyName), norm(family.contactName), norm(family.city)].join("|");

export type DbCheck = {
  toSave: (ImportRow & { organizerMemberId: string | null })[]; // the new families, with the organizer found
  skipped: ImportRow[];
  problems: Problem[];
};

export async function validateImportAgainstDb(db: Prisma.TransactionClient, weddingId: string, rows: ImportRow[]): Promise<DbCheck> {
  const [families, team] = await Promise.all([
    db.family.findMany({
      where: { weddingId },
      select: { familyName: true, contactName: true, city: true, phones: { select: { phone: true } } },
    }),
    // A pending person can be an organizer. A removed person cannot.
    db.weddingMember.findMany({ where: { weddingId, status: { not: "removed" } }, select: { id: true, email: true } }),
  ]);

  const ownerOf = new Map<string, string>(); // standard number -> name of the family that has it
  const noNumberFamilies = new Set<string>();
  for (const family of families) {
    for (const { phone } of family.phones) ownerOf.set(phone, family.familyName);
    noNumberFamilies.add(withoutNumberKey(family)); // also families that have numbers: same name, contact and city
  }
  const memberByEmail = new Map(team.map((member) => [member.email.toLowerCase(), member.id]));

  const problems: Problem[] = [];
  const toSave: DbCheck["toSave"] = [];
  const skipped: ImportRow[] = [];
  const seenInFile = new Set<string>();

  for (const row of rows) {
    const numbers = [row.primaryPhone, row.secondaryPhone].filter((phone): phone is string => !!phone);
    const owners = numbers.map((phone) => ({ phone, family: ownerOf.get(phone) })).filter((owner) => owner.family !== undefined);

    // A number that another family has: an error, and it names that family.
    const other = owners.find((owner) => norm(owner.family!) !== norm(row.familyName));
    if (other) {
      problems.push(problem("number-used-by-other-family", row.row, row.familyName, displayPhone(other.phone), `This number is already used by the ${other.family}.`));
      continue;
    }

    // The same family (same name and same number): it is in the app already, so it is skipped.
    const alreadyThere = owners.length > 0 || (numbers.length === 0 && noNumberFamilies.has(withoutNumberKey(row)));
    if (alreadyThere) {
      skipped.push(row);
      problems.push(problem("already-in-app", row.row, row.familyName, "", "This family is already in the app. It is skipped."));
      continue;
    }

    // Two rows of the file with no number, the same name, contact and city: only the first is saved.
    if (numbers.length === 0) {
      const key = withoutNumberKey(row);
      if (seenInFile.has(key)) {
        skipped.push(row);
        problems.push(problem("same-family-twice-in-file", row.row, row.familyName, "", "This family is in the file twice. Only the first row is saved."));
        continue;
      }
      seenInFile.add(key);
    }

    let organizerMemberId: string | null = null;
    if (row.organizerEmail) {
      organizerMemberId = memberByEmail.get(row.organizerEmail) ?? null;
      if (!organizerMemberId) {
        problems.push(problem("organizer-not-in-team", row.row, row.familyName, row.organizerEmail, "This email is not on the team. Add the person to the team first, or change the email."));
        continue;
      }
    }
    toSave.push({ ...row, organizerMemberId });
  }

  return { toSave, skipped, problems };
}
