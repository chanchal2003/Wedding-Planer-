import { requireAdmin } from "@/lib/access/guards";
import { buildFamiliesCsv, buildRepliesCsv, buildTeamCsv } from "@/lib/export/build";
import { todayInIndia } from "@/lib/time";

// The CSV export (FR-65, AC-65.1): families.csv, replies.csv and team.csv. Admins only: anybody else, and
// any other file name, gets "not found", the same as an address that does not exist. The framework does
// not cache it (CLAUDE.md rule 13): the file always shows the data of today.
const FILES = {
  "families.csv": buildFamiliesCsv,
  "replies.csv": buildRepliesCsv,
  "team.csv": buildTeamCsv,
} as const;

export async function GET(_request: Request, ctx: RouteContext<"/w/[weddingId]/export/[file]">) {
  const { weddingId, file } = await ctx.params;

  const access = await requireAdmin(weddingId);
  if (!access.ok) return new Response("Not found", { status: 404 });
  if (!Object.hasOwn(FILES, file)) return new Response("Not found", { status: 404 });

  const { id, slug } = access.member.wedding;
  const csv = await FILES[file as keyof typeof FILES](id);
  const name = `${slug}-${file.replace(".csv", "")}-${todayInIndia()}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
