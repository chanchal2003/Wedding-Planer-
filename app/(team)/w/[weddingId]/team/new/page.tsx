import { Suspense } from "react";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/access/guards";
import { forPage } from "@/lib/access/respond";
import { EMPTY_PERSON, PersonForm } from "../_components/person-form";

export const metadata = { title: "Add person | ShaadiDesk" };

// Only admins invite people (FR-9). Anybody else sees "page not found".
export default function NewPersonPage({ params }: PageProps<"/w/[weddingId]/team/new">) {
  return (
    <PageShell>
      <h1 className="text-3xl">Add person</h1>
      <Suspense fallback={<p>Loading…</p>}>
        <NewPerson params={params} />
      </Suspense>
    </PageShell>
  );
}

async function NewPerson({ params }: { params: PageProps<"/w/[weddingId]/team/new">["params"] }) {
  const { weddingId } = await params;
  forPage(await requireAdmin(weddingId));

  return (
    <>
      <p className="text-lg">
        After you add the person, you get a ready WhatsApp message with the link to sign in. You send it yourself.
      </p>
      <PersonForm weddingId={weddingId} initial={EMPTY_PERSON} />
      <Button variant="outline" size="lg" render={<Link href={`/w/${weddingId}/team`} />}>
        Cancel
      </Button>
    </>
  );
}
