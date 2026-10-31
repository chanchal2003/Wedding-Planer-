import { Suspense } from "react";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { forPage } from "@/lib/access/respond";
import { getFamilyFormOptions } from "@/lib/families/queries";
import { EMPTY_FAMILY, FamilyForm } from "../_components/family-form";

export const metadata = { title: "Add family | ShaadiDesk" };

// Every team member can add a family (FR-20). Only an admin can choose the organizer.
export default function NewFamilyPage({ params }: PageProps<"/w/[weddingId]/families/new">) {
  return (
    <PageShell>
      <h1 className="text-3xl">Add family</h1>
      <Suspense fallback={<p>Loading…</p>}>
        <NewFamily params={params} />
      </Suspense>
    </PageShell>
  );
}

async function NewFamily({ params }: { params: PageProps<"/w/[weddingId]/families/new">["params"] }) {
  const { weddingId } = await params;
  const { member, events, organizers } = forPage(await getFamilyFormOptions(weddingId));

  return (
    <>
      <FamilyForm weddingId={weddingId} initial={EMPTY_FAMILY} events={events} organizers={organizers} canAssign={member.role === "admin"} />
      <Button variant="outline" size="lg" render={<Link href={`/w/${weddingId}/families`} />}>Cancel</Button>
    </>
  );
}
