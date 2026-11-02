import { Suspense } from "react";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { forPage } from "@/lib/access/respond";
import { listMyFamilies } from "@/lib/families/queries";
import { parseFilters, type FamilyFilters } from "@/lib/families/schemas";
import { FamilyRow } from "../families/_components/family-row";
import { FilterChip } from "../families/_components/filter-chip";
import { rowOf } from "../families/_components/row-data";

export const metadata = { title: "My families | ShaadiDesk" };

// The families that are assigned to the person who looks (FR-23, FR-24): the progress, the filter
// chips with their numbers, and "Mark as sent" on each row. The filters are in the address of the page.
export default function MyFamiliesPage({ params, searchParams }: PageProps<"/w/[weddingId]/my-families">) {
  return (
    <PageShell>
      <h1 className="text-3xl">My families</h1>
      <Suspense fallback={<p>Loading…</p>}>
        <MyFamilies params={params} searchParams={searchParams} />
      </Suspense>
    </PageShell>
  );
}

function href(weddingId: string, filters: FamilyFilters, patch: Partial<FamilyFilters>) {
  const next = { ...filters, page: 1, ...patch };
  const query = new URLSearchParams();
  if (next.q) query.set("q", next.q);
  if (next.status) query.set("status", next.status);
  if (next.page > 1) query.set("page", String(next.page));
  const text = query.toString();
  return `/w/${weddingId}/my-families${text ? `?${text}` : ""}`;
}

async function MyFamilies({
  params,
  searchParams,
}: {
  params: PageProps<"/w/[weddingId]/my-families">["params"];
  searchParams: PageProps<"/w/[weddingId]/my-families">["searchParams"];
}) {
  const { weddingId } = await params;
  // Only the search, the status chips and the page number count here: the list is always "my" families.
  const parsed = parseFilters(await searchParams);
  const filters: FamilyFilters = { ...parsed, side: "", event: "", organizer: "", status: parsed.status === "not-sent" || parsed.status === "no-reply" ? parsed.status : "" };
  const { total, pages, families, progress } = forPage(await listMyFamilies(weddingId, filters));
  const percent = progress.total === 0 ? 0 : Math.round((progress.sent / progress.total) * 100);

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <FilterChip href={`/w/${weddingId}/my-families`} active>My families</FilterChip>
        <FilterChip href={`/w/${weddingId}/families`} active={false}>All families</FilterChip>
      </div>

      <section aria-label="Progress" className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
        <p className="text-lg font-medium">
          {progress.total} {progress.total === 1 ? "family" : "families"} · {progress.sent} sent · {progress.replied} replied
        </p>
        <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} aria-label="Invitations sent" className="h-3 w-full overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
        </div>
        <p className="text-muted-foreground">{percent}% of your invitations are sent.</p>
      </section>

      <form action={`/w/${weddingId}/my-families`} className="flex flex-col gap-2 sm:flex-row" role="search">
        {filters.status && <input type="hidden" name="status" value={filters.status} />}
        <Input name="q" defaultValue={filters.q} placeholder="Search by family, contact or city" aria-label="Search my families" autoComplete="off" />
        <Button type="submit" size="lg">Search</Button>
      </form>

      <div className="flex flex-wrap gap-2">
        <FilterChip href={href(weddingId, filters, { status: "" })} active={!filters.status}>All {progress.total}</FilterChip>
        <FilterChip href={href(weddingId, filters, { status: "not-sent" })} active={filters.status === "not-sent"}>Not sent {progress.notSent}</FilterChip>
        <FilterChip href={href(weddingId, filters, { status: "no-reply" })} active={filters.status === "no-reply"}>No reply {progress.noReply}</FilterChip>
      </div>

      <p className="text-lg" role="status">
        {progress.total === 0
          ? "No family is assigned to you yet. An admin can assign families to you."
          : total === 0
            ? "No family matches."
            : `${total} ${total === 1 ? "family" : "families"}`}
      </p>

      <ul className="flex flex-col gap-4">
        {families.map((family) => (
          <FamilyRow key={family.id} weddingId={weddingId} family={rowOf(family)} />
        ))}
      </ul>

      {pages > 1 && (
        <nav aria-label="Pages" className="flex items-center justify-between gap-2">
          {filters.page > 1 ? (
            <Button variant="outline" size="lg" render={<Link href={href(weddingId, filters, { page: filters.page - 1 })} />}>Previous</Button>
          ) : <span />}
          <span>Page {filters.page} of {pages}</span>
          {filters.page < pages ? (
            <Button variant="outline" size="lg" render={<Link href={href(weddingId, filters, { page: filters.page + 1 })} />}>Next</Button>
          ) : <span />}
        </nav>
      )}
    </>
  );
}
