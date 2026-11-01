import { Suspense } from "react";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { forPage } from "@/lib/access/respond";
import { getAssignOptions } from "@/lib/families/queries";
import { AssignForm } from "./_components/assign-form";

export const metadata = { title: "Assign families | ShaadiDesk" };

// Assign many families to one organizer (FR-21). Admins only: getAssignOptions calls requireAdmin.
export default function AssignFamiliesPage({ params }: PageProps<"/w/[weddingId]/families/assign">) {
  return (
    <PageShell>
      <h1 className="text-3xl">Assign families</h1>
      <Suspense fallback={<p>Loading…</p>}>
        <AssignFamilies params={params} />
      </Suspense>
    </PageShell>
  );
}

async function AssignFamilies({ params }: { params: PageProps<"/w/[weddingId]/families/assign">["params"] }) {
  const { weddingId } = await params;
  const { counts, people } = forPage(await getAssignOptions(weddingId));

  return (
    <>
      <AssignForm weddingId={weddingId} counts={counts} people={people} />
      <Button variant="outline" size="lg" render={<Link href={`/w/${weddingId}/families`} />}>Back to families</Button>
    </>
  );
}
