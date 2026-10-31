import { Suspense } from "react";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { requireDeleteWedding } from "@/lib/access/guards";
import { forPage } from "@/lib/access/respond";
import { countWeddingData } from "@/lib/weddings/delete";
import { weddingTitle } from "@/lib/weddings/names";
import { DeleteWedding } from "./_components/delete-wedding";

export const metadata = { title: "Delete wedding | ShaadiDesk" };

// The page for deleting a wedding (FR-68). Test wedding: any admin. Real wedding: only an admin who
// is the bride or the groom. Anybody else sees "page not found". The server checks it again
// when the button is pressed (deleteWedding).
export default function DeleteWeddingPage({ params }: PageProps<"/w/[weddingId]/settings/delete">) {
  return (
    <PageShell>
      <h1 className="text-3xl">Delete this wedding</h1>
      <Suspense fallback={<p>Loading…</p>}>
        <DeleteContent params={params} />
      </Suspense>
    </PageShell>
  );
}

async function DeleteContent({ params }: { params: PageProps<"/w/[weddingId]/settings/delete">["params"] }) {
  const { weddingId } = await params;
  const { member } = forPage(await requireDeleteWedding(weddingId));
  const counts = await countWeddingData(weddingId);

  return (
    <>
      <DeleteWedding weddingId={weddingId} title={weddingTitle(member.wedding)} counts={counts} />
      <Button variant="outline" size="lg" render={<Link href={`/w/${weddingId}/settings`} />}>
        Cancel
      </Button>
    </>
  );
}
