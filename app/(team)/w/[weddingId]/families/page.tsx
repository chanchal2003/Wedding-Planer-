import { Suspense } from "react";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { forPage } from "@/lib/access/respond";
import { hostedByLabel } from "@/lib/events";
import { listFamilies } from "@/lib/families/queries";
import { FAMILY_STATUSES, parseFilters, type FamilyFilters } from "@/lib/families/schemas";
import { FamilyRow } from "./_components/family-row";
import { FilterChip } from "./_components/filter-chip";
import { rowOf } from "./_components/row-data";

export const metadata = { title: "Families | ShaadiDesk" };

// The guest families of the wedding (FR-15, FR-19). Every team member sees the list. The search and
// the filters are in the address of the page, so they work without scripts.
export default function FamiliesPage({ params, searchParams }: PageProps<"/w/[weddingId]/families">) {
  return (
    <PageShell>
      <h1 className="text-3xl">Families</h1>
      <Suspense fallback={<p>Loading…</p>}>
        <FamilyList params={params} searchParams={searchParams} />
      </Suspense>
    </PageShell>
  );
}

// The address of the list with one filter changed. A new filter starts again at page 1.
function href(weddingId: string, filters: FamilyFilters, patch: Partial<FamilyFilters>) {
  const next = { ...filters, page: 1, ...patch };
  const query = new URLSearchParams();
  for (const key of ["q", "side", "event", "organizer", "status"] as const) if (next[key]) query.set(key, next[key]);
  if (next.page > 1) query.set("page", String(next.page));
  const text = query.toString();
  return `/w/${weddingId}/families${text ? `?${text}` : ""}`;
}

async function FamilyList({
  params,
  searchParams,
}: {
  params: PageProps<"/w/[weddingId]/families">["params"];
  searchParams: PageProps<"/w/[weddingId]/families">["searchParams"];
}) {
  const { weddingId } = await params;
  const filters = parseFilters(await searchParams);
  const { member, total, pages, families, events, organizers } = forPage(await listFamilies(weddingId, filters));

  const filtering = filters.side || filters.event || filters.organizer || filters.status;
  const group = (label: string, children: React.ReactNode) => (
    <div className="flex flex-col gap-2">
      <p className="font-medium">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <FilterChip href={`/w/${weddingId}/families`} active>All families</FilterChip>
        <FilterChip href={`/w/${weddingId}/my-families`} active={false}>My families</FilterChip>
      </div>

      <form action={`/w/${weddingId}/families`} className="flex flex-col gap-2 sm:flex-row" role="search">
        {/* The filters stay when you search: they are sent along with the search text. */}
        {(["side", "event", "organizer", "status"] as const).map((key) => filters[key] && <input key={key} type="hidden" name={key} value={filters[key]} />)}
        <Input name="q" defaultValue={filters.q} placeholder="Search by family, contact or city" aria-label="Search families" autoComplete="off" />
        <Button type="submit" size="lg">Search</Button>
      </form>

      <details open={!!filtering} className="rounded-xl border border-border bg-card p-4">
        <summary className="min-h-11 cursor-pointer text-lg font-medium">Filters{filtering ? " (on)" : ""}</summary>
        <div className="mt-4 flex flex-col gap-4">
          {group("Show", <>
            <FilterChip href={href(weddingId, filters, { status: "" })} active={!filters.status}>All</FilterChip>
            {FAMILY_STATUSES.map((status) => (
              <FilterChip key={status.value} href={href(weddingId, filters, { status: status.value })} active={filters.status === status.value}>{status.label}</FilterChip>
            ))}
          </>)}
          {group("Side", <>
            <FilterChip href={href(weddingId, filters, { side: "" })} active={!filters.side}>All</FilterChip>
            {(["bride", "groom", "both"] as const).map((side) => (
              <FilterChip key={side} href={href(weddingId, filters, { side })} active={filters.side === side}>{hostedByLabel(side)}</FilterChip>
            ))}
          </>)}
          {events.length > 0 && group("Event", <>
            <FilterChip href={href(weddingId, filters, { event: "" })} active={!filters.event}>All</FilterChip>
            {events.map((event) => (
              <FilterChip key={event.id} href={href(weddingId, filters, { event: event.id })} active={filters.event === event.id}>{event.name}</FilterChip>
            ))}
          </>)}
          {group("Organizer", <>
            <FilterChip href={href(weddingId, filters, { organizer: "" })} active={!filters.organizer}>All</FilterChip>
            <FilterChip href={href(weddingId, filters, { organizer: "none" })} active={filters.organizer === "none"}>No organizer</FilterChip>
            {organizers.map((organizer) => (
              <FilterChip key={organizer.id} href={href(weddingId, filters, { organizer: organizer.id })} active={filters.organizer === organizer.id}>{organizer.name}</FilterChip>
            ))}
          </>)}
        </div>
      </details>

      <p className="text-lg" role="status">
        {total === 0 ? (filtering || filters.q ? "No family matches." : "No families yet. Add a family, or import your guest list.") : `${total} ${total === 1 ? "family" : "families"}`}
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

      <Button size="lg" render={<Link href={`/w/${weddingId}/families/new`} />}>Add family</Button>
      {/* Only admins import a guest list (the import page checks it again). */}
      {member.role === "admin" && (
        <>
          <Button variant="outline" size="lg" render={<Link href={`/w/${weddingId}/import`} />}>Import from Excel</Button>
          <Button variant="outline" size="lg" render={<Link href={`/w/${weddingId}/families/assign`} />}>Assign to organizers</Button>
        </>
      )}
    </>
  );
}
