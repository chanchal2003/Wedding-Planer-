"use server";

import { requireAdmin } from "@/lib/access/guards";
import { denied } from "@/lib/access/respond";
import { checkImportFile, saveImportFile } from "@/lib/import/run";
import type { ImportReport } from "@/lib/import/types";
import { fail, ok, type Result } from "@/lib/result";

// API design, Section 9. Only admins import (FR-16). The file comes from the form, is read, and is
// never kept. "saveImport" gets the file again from the browser and checks everything again.

const SOMETHING_WRONG = "Something went wrong. Nothing was saved. Try again.";

async function fileOf(formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return null;
  return { name: file.name, bytes: new Uint8Array(await file.arrayBuffer()) };
}

// Shows what would happen: new families, families already in the app, and every problem. Saves nothing.
export async function checkImport(weddingId: string, formData: FormData): Promise<Result<ImportReport>> {
  try {
    const access = await requireAdmin(weddingId);
    if (!access.ok) return denied(access);
    const file = await fileOf(formData);
    if (!file) return fail("INVALID_INPUT", "Choose a file first.", { file: "Choose a file first." });

    const result = await checkImportFile(access.member.wedding.id, file.name, file.bytes);
    return result.ok ? ok(result.report) : fail("INVALID_INPUT", result.message, { file: result.message });
  } catch (error) {
    console.error("checkImport failed:", error instanceof Error ? error.message : error);
    return fail("SERVER_ERROR", SOMETHING_WRONG);
  }
}

// Saves the new families in one transaction, only with 0 errors.
export async function saveImport(weddingId: string, formData: FormData): Promise<Result<{ saved: number; skipped: number }>> {
  try {
    const access = await requireAdmin(weddingId);
    if (!access.ok) return denied(access);
    const file = await fileOf(formData);
    if (!file) return fail("INVALID_INPUT", "Choose a file first.", { file: "Choose a file first." });

    const result = await saveImportFile(access.member.wedding.id, file.name, file.bytes);
    return result.ok ? ok({ saved: result.saved, skipped: result.skipped }) : fail("NOT_ALLOWED_NOW", result.message);
  } catch (error) {
    console.error("saveImport failed:", error instanceof Error ? error.message : error);
    return fail("SERVER_ERROR", SOMETHING_WRONG);
  }
}
