import { randomUUID } from "node:crypto";
import type { Prisma } from "@/app/generated/prisma/client";
import { db } from "@/lib/db";
import { readImportFile } from "@/lib/import/read";
import { validateImportAgainstDb } from "@/lib/import/validateImportAgainstDb";
import { validateImportFile } from "@/lib/import/validateImportFile";
import type { ImportReport, Table } from "@/lib/import/types";

// The import from the file to the database (CLAUDE.md rule 7, architecture flow 3.3):
//   file check (no database) -> database check (read only) -> save in ONE transaction, which runs
//   both checks again first. It saves only with 0 errors. This file does not check who is asking:
//   the actions (lib/import/actions.ts) call the admin guard first. The file is never kept.

// Runs both checks. `client` is the database, or the transaction of the save.
async function analyse(client: Prisma.TransactionClient, weddingId: string, table: Table) {
  const events = await client.event.findMany({ where: { weddingId }, orderBy: { startsAt: "asc" }, select: { id: true, name: true, startsAt: true } });
  const fileCheck = validateImportFile(table, events);
  const dbCheck = await validateImportAgainstDb(client, weddingId, fileCheck.rows);

  const problems = [...fileCheck.problems, ...dbCheck.problems];
  const errorRows = new Set(problems.filter((p) => p.kind === "error" && p.row !== null).map((p) => p.row));
  const warningRows = new Set(problems.filter((p) => p.kind === "warning" && p.row !== null && !errorRows.has(p.row)).map((p) => p.row));
  const hasError = problems.some((p) => p.kind === "error");

  const report: ImportReport = {
    totalRows: fileCheck.totalRows,
    newRows: dbCheck.toSave.length,
    skippedRows: dbCheck.skipped.length,
    warningRows: warningRows.size,
    errorRows: errorRows.size,
    problems,
    canSave: !hasError && dbCheck.toSave.length > 0,
  };
  return { report, toSave: dbCheck.toSave, hasError };
}

export type CheckResult = { ok: true; report: ImportReport } | { ok: false; message: string };

// Step 1 and 2: only reads. Shows what would happen.
export async function checkImportFile(weddingId: string, fileName: string, bytes: Uint8Array): Promise<CheckResult> {
  const read = await readImportFile(fileName, bytes);
  if (!read.ok) return { ok: false, message: read.message };
  const { report } = await analyse(db, weddingId, read.table);
  return { ok: true, report };
}

export const NOTHING_SAVED = "Nothing was saved. Check again.";

export type SaveResult =
  | { ok: true; saved: number; skipped: number }
  | { ok: false; message: string; report?: ImportReport };

// Step 3: saves all the new families, or none.
export async function saveImportFile(weddingId: string, fileName: string, bytes: Uint8Array): Promise<SaveResult> {
  const read = await readImportFile(fileName, bytes);
  if (!read.ok) return { ok: false, message: read.message };

  try {
    return await db.$transaction(
      async (tx) => {
        // Two imports of one wedding at the same moment (a double click, two admins) wait for each other.
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${weddingId}))`;
        // An organizer cannot be removed while this save assigns families to them (FR-13).
        await tx.$queryRaw`SELECT id FROM wedding_members WHERE wedding_id = ${weddingId}::uuid AND status <> 'removed' FOR SHARE`;

        // Both checks again, inside the transaction: the data may have changed since the check.
        const { report, toSave, hasError } = await analyse(tx, weddingId, read.table);
        if (hasError) return { ok: false as const, message: NOTHING_SAVED, report };
        if (toSave.length === 0) return { ok: false as const, message: "There is nothing new to save: every family is already in the app.", report };

        const families = toSave.map((row) => ({ ...row, id: randomUUID() }));
        await tx.family.createMany({
          data: families.map((family) => ({
            id: family.id,
            weddingId,
            familyName: family.familyName,
            contactName: family.contactName,
            city: family.city,
            side: family.side,
            notes: family.notes,
            assignedMemberId: family.organizerMemberId,
          })),
        });
        await tx.familyPhone.createMany({
          data: families.flatMap((family) => [
            ...(family.primaryPhone ? [{ familyId: family.id, weddingId, phone: family.primaryPhone, kind: "primary" as const }] : []),
            ...(family.secondaryPhone ? [{ familyId: family.id, weddingId, phone: family.secondaryPhone, kind: "secondary" as const }] : []),
          ]),
        });
        await tx.familyEvent.createMany({
          data: families.flatMap((family) => family.eventIds.map((eventId) => ({ familyId: family.id, eventId, weddingId }))),
        });
        return { ok: true as const, saved: families.length, skipped: report.skippedRows };
      },
      { timeout: 60_000, maxWait: 15_000 },
    );
  } catch (error) {
    // The database has the last word (one number once in a wedding). Everything is undone.
    console.error("saveImportFile failed:", error instanceof Error ? error.message : error);
    return { ok: false, message: NOTHING_SAVED };
  }
}
