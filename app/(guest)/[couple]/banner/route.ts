import { db } from "@/lib/db";

// The banner photo of a wedding, for the guest page and for the link preview in WhatsApp.
// This address is PUBLIC on purpose (a guest does not sign in, FR-1). It shows only the photo
// that the couple chose for the guest page, and nothing else. It is looked up by the link name.
// The framework does not cache it (CLAUDE.md rule 13). The browser may keep it for 5 minutes.
export async function GET(_request: Request, ctx: RouteContext<"/[couple]/banner">) {
  const { couple } = await ctx.params;

  const banner = await db.weddingBanner.findFirst({
    where: { wedding: { slug: couple } },
    select: { contentType: true, data: true },
  });
  if (!banner) return new Response(null, { status: 404 });

  return new Response(banner.data, {
    headers: {
      "Content-Type": banner.contentType,
      "Cache-Control": "public, max-age=300",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
