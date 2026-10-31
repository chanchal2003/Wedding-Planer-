"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/access/session";
import { fail, ok, type Result } from "@/lib/result";
import { createWeddingSchema } from "@/lib/weddings/schemas";
import { slugCandidate, suggestSlug } from "@/lib/weddings/slug";

// API design, Section 5: createWedding. One transaction makes the wedding and the seat of
// the person as an active admin. Nobody is half made.

const MAX_SLUG_TRIES = 30;

function isSlugTaken(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { code?: string }).code === "P2002";
}

export async function createWedding(input: unknown): Promise<Result<{ weddingId: string }>> {
  try {
    const user = await getSessionUser();
    if (!user) return fail("NOT_SIGNED_IN", "Please sign in again.");

    const parsed = createWeddingSchema.safeParse(input);
    if (!parsed.success) {
      const fields: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        fields[key] ??= issue.message;
      }
      return fail("INVALID_INPUT", "Please check the form.", fields);
    }
    const data = parsed.data;
    const base = suggestSlug(data.brideName, data.groomName);

    // "priya-rahul", then "priya-rahul-2", "priya-rahul-3"... If two people save at the same
    // moment, the unique rule of the database stops the clash and we try the next number.
    for (let attempt = 1; attempt <= MAX_SLUG_TRIES; attempt++) {
      try {
        const wedding = await db.$transaction(async (tx) => {
          const created = await tx.wedding.create({
            data: {
              slug: slugCandidate(base, attempt),
              brideName: data.brideName,
              groomName: data.groomName,
              weddingDate: new Date(`${data.weddingDate}T00:00:00Z`),
              isTest: data.isTest,
              createdById: user.id,
            },
          });
          await tx.weddingMember.create({
            data: {
              weddingId: created.id,
              userId: user.id,
              email: user.email.toLowerCase(),
              role: "admin",
              relation: data.relation,
              status: "active",
            },
          });
          return created;
        });
        return ok({ weddingId: wedding.id });
      } catch (error) {
        if (!isSlugTaken(error)) throw error;
      }
    }
    return fail("CONFLICT", "We could not find a free link name. Change the names a little and try again.");
  } catch (error) {
    console.error("createWedding failed:", error instanceof Error ? error.message : error);
    return fail("SERVER_ERROR", "Something went wrong. Try again.");
  }
}

// What the form shows again after a failed save. React clears the form after an action,
// so the typed values come back in this state (the form keeps what the person typed).
export type MakeWeddingState = {
  values: {
    brideName: string;
    groomName: string;
    weddingDate: string;
    relation: string;
    isTest: boolean;
  };
  message?: string;
  fields?: Record<string, string>;
};

// The form calls this one. It reads the form, calls createWedding and opens the new wedding.
export async function makeWeddingAction(
  _previous: MakeWeddingState,
  formData: FormData,
): Promise<MakeWeddingState> {
  const values = {
    brideName: String(formData.get("brideName") ?? ""),
    groomName: String(formData.get("groomName") ?? ""),
    weddingDate: String(formData.get("weddingDate") ?? ""),
    relation: String(formData.get("relation") ?? ""),
    isTest: formData.get("isTest") === "on",
  };

  const result = await createWedding(values);
  if (!result.ok) {
    if (result.error.code === "NOT_SIGNED_IN") redirect("/sign-in");
    return { values, message: result.error.message, fields: result.error.fields };
  }
  redirect(`/w/${result.data.weddingId}`);
}
