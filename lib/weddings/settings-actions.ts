"use server";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/access/guards";
import { denied } from "@/lib/access/respond";
import { fail, ok, type Result } from "@/lib/result";
import { detectImageType, MAX_BANNER_BYTES } from "@/lib/weddings/banner";
import { todayInIndia } from "@/lib/time";
import { makeSettingsSchema, slugSchema } from "@/lib/weddings/schemas";

// API design, Section 5. Every function here starts with the admin guard (CLAUDE.md rule 1).

function fieldsFrom(issues: { path: PropertyKey[]; message: string }[]) {
  const fields: Record<string, string> = {};
  for (const issue of issues) fields[String(issue.path[0] ?? "form")] ??= issue.message;
  return fields;
}

const SOMETHING_WRONG = "Something went wrong. Try again.";

// ---- Greeting, colour and last dates ----

export async function updateWeddingSettings(weddingId: string, input: unknown): Promise<Result<null>> {
  try {
    const access = await requireAdmin(weddingId);
    if (!access.ok) return denied(access);

    const current = await db.wedding.findUniqueOrThrow({
      where: { id: access.member.wedding.id },
      select: { weddingDate: true, rsvpLastDate: true, stayLastDate: true },
    });
    const day = (date: Date | null) => (date ? date.toISOString().slice(0, 10) : null);

    const schema = makeSettingsSchema({
      weddingDate: current.weddingDate.toISOString().slice(0, 10),
      today: todayInIndia(),
      saved: { rsvpLastDate: day(current.rsvpLastDate), stayLastDate: day(current.stayLastDate) },
    });
    const parsed = schema.safeParse(input);
    if (!parsed.success) return fail("INVALID_INPUT", "Please check the form.", fieldsFrom(parsed.error.issues));
    const { greeting, themeColor, rsvpLastDate, stayLastDate } = parsed.data;

    await db.wedding.update({
      where: { id: access.member.wedding.id },
      data: {
        greeting,
        themeColor,
        rsvpLastDate: rsvpLastDate ? new Date(`${rsvpLastDate}T00:00:00Z`) : null,
        stayLastDate: stayLastDate ? new Date(`${stayLastDate}T00:00:00Z`) : null,
      },
    });
    return ok(null);
  } catch (error) {
    console.error("updateWeddingSettings failed:", error instanceof Error ? error.message : error);
    return fail("SERVER_ERROR", SOMETHING_WRONG);
  }
}

// ---- The link name ----

export async function updateSlug(weddingId: string, input: unknown): Promise<Result<{ slug: string }>> {
  try {
    const access = await requireAdmin(weddingId);
    if (!access.ok) return denied(access);

    const parsed = slugSchema.safeParse(input);
    if (!parsed.success) return fail("INVALID_INPUT", parsed.error.issues[0].message, { slug: parsed.error.issues[0].message });
    const slug = parsed.data;

    // "slugLocked: false" is part of the update, so a lock that is set at the same moment wins.
    const result = await db.wedding.updateMany({
      where: { id: access.member.wedding.id, slugLocked: false },
      data: { slug },
    });
    if (result.count === 0) {
      return fail("NOT_ALLOWED_NOW", "The link is locked, because invitations were sent.");
    }
    return ok({ slug });
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      return fail("CONFLICT", "This link name is not available.", { slug: "This link name is not available." });
    }
    console.error("updateSlug failed:", error instanceof Error ? error.message : error);
    return fail("SERVER_ERROR", SOMETHING_WRONG);
  }
}

// ---- The banner photo ----

// The browser sends a photo that it has already shrunk. The server checks it again: the real
// type (from the first bytes), and the size. Then it saves it in the database.
export async function uploadBanner(weddingId: string, formData: FormData): Promise<Result<null>> {
  try {
    const access = await requireAdmin(weddingId);
    if (!access.ok) return denied(access);

    const file = formData.get("banner");
    if (!(file instanceof File) || file.size === 0) {
      return fail("INVALID_INPUT", "Choose a photo first.", { banner: "Choose a photo first." });
    }
    if (file.size > MAX_BANNER_BYTES) {
      return fail("INVALID_INPUT", "This photo is too big. Choose a smaller one.", { banner: "This photo is too big. Choose a smaller one." });
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    const contentType = detectImageType(bytes);
    if (!contentType) {
      return fail("INVALID_INPUT", "Use a JPEG, PNG or WebP photo.", { banner: "Use a JPEG, PNG or WebP photo." });
    }

    const data = { contentType, data: bytes };
    await db.weddingBanner.upsert({
      where: { weddingId: access.member.wedding.id },
      create: { weddingId: access.member.wedding.id, ...data },
      update: data,
    });
    return ok(null);
  } catch (error) {
    console.error("uploadBanner failed:", error instanceof Error ? error.message : error);
    return fail("SERVER_ERROR", SOMETHING_WRONG);
  }
}

export async function removeBanner(weddingId: string): Promise<Result<null>> {
  try {
    const access = await requireAdmin(weddingId);
    if (!access.ok) return denied(access);

    await db.weddingBanner.deleteMany({ where: { weddingId: access.member.wedding.id } });
    return ok(null);
  } catch (error) {
    console.error("removeBanner failed:", error instanceof Error ? error.message : error);
    return fail("SERVER_ERROR", SOMETHING_WRONG);
  }
}
