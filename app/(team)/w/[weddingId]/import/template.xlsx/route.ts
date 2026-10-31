import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/access/guards";
import { buildTemplate } from "@/lib/import/template";

// The Excel template of the guest list (FR-16, AC-16.1), with one column for each event of this
// wedding. Admins only: anybody else gets "not found", the same as an address that does not exist.
// The framework does not cache it (CLAUDE.md rule 13): it always shows the events of today.
export async function GET(_request: Request, ctx: RouteContext<"/w/[weddingId]/import/template.xlsx">) {
  const { weddingId } = await ctx.params;

  const access = await requireAdmin(weddingId);
  if (!access.ok) return new Response("Not found", { status: 404 });
  const { id, slug } = access.member.wedding;

  const events = await db.event.findMany({
    where: { weddingId: id },
    orderBy: { startsAt: "asc" },
    select: { id: true, name: true, startsAt: true },
  });
  if (events.length === 0) return new Response("Add an event first.", { status: 409 });

  const file = await buildTemplate(events);
  return new Response(file as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="guest-list-template-${slug}.xlsx"`,
      "Cache-Control": "private, no-store",
    },
  });
}
