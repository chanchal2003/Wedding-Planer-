import { cache } from "react";
import { db } from "@/lib/db";

// API design, Section 10. The public data of the guest page: no sign-in, so it returns ONLY what
// a guest and the WhatsApp preview may see (FR-38, NFR-9): the names, the date, the greeting, the
// colour, the test flag, the last date and the banner. No ids, no emails, no families.
// A component that calls this must sit inside <Suspense>.
// cache() only remembers the answer during ONE request (the preview tags and the page ask for the
// same wedding, so the database is asked once). It is not "use cache" (CLAUDE.md rule 13).
export const getRsvpLanding = cache(async (slug: string) => {
  const wedding = await db.wedding.findUnique({
    where: { slug },
    select: {
      brideName: true,
      groomName: true,
      weddingDate: true,
      greeting: true,
      themeColor: true,
      isTest: true,
      rsvpLastDate: true,
      banner: { select: { updatedAt: true } },
    },
  });
  if (!wedding) return null;

  const { banner, ...rest } = wedding;
  return { ...rest, bannerVersion: banner ? banner.updatedAt.getTime() : null };
});
