// The RSVP link name of a wedding, for example "priya-rahul" (guests open /priya-rahul).

// The guest page is /<link name>, so a link name must never be the same as a top-level
// address of the app (the folders of app/) or a special file.
export const RESERVED_SLUGS: ReadonlySet<string> = new Set([
  "weddings",
  "w",
  "sign-in",
  "api",
  "_next",
  "not-found",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
]);

// "Priya Mehta" -> "priya-mehta". Accents are removed. Letters that are not a to z
// (for example Hindi script) are dropped.
export function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// The first suggestion: "priya-rahul". With no usable letters in the names: "wedding".
export function suggestSlug(brideName: string, groomName: string): string {
  const parts = [slugify(brideName), slugify(groomName)].filter(Boolean);
  let base = parts.join("-").slice(0, 60).replace(/-+$/, "") || "wedding";
  if (RESERVED_SLUGS.has(base)) base = `${base}-wedding`;
  return base;
}

// Try number 1 first, then "-2", "-3", ... when the name is taken.
export function slugCandidate(base: string, attempt: number): string {
  return attempt <= 1 ? base : `${base}-${attempt}`;
}
