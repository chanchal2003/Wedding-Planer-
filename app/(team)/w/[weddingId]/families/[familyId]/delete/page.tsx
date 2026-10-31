import { Suspense } from "react";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { forPage } from "@/lib/access/respond";
import { getFamilyDeleteInfo } from "@/lib/families/queries";
import { DeleteFamily } from "./_components/delete-family";

export const metadata = { title: "Delete family | ShaadiDesk" };

// Only admins delete a family. The page says what goes with it first.
export default function DeleteFamilyPage({ params }: PageProps<"/w/[weddingId]/families/[familyId]/delete">) {
  return (
    <PageShell>
      <Suspense fallback={<p>Loading…</p>}>
        <DeleteContent params={params} />
      </Suspense>
    </PageShell>
  );
}

async function DeleteContent({ params }: { params: PageProps<"/w/[weddingId]/families/[familyId]/delete">["params"] }) {
  const { weddingId, familyId } = await params;
  const { family, replies } = forPage(await getFamilyDeleteInfo(weddingId, familyId));

  return (
    <>
      <h1 className="text-3xl">Delete {family.familyName}?</h1>
      <p className="text-lg">
        Its phone numbers, invitations
        {replies > 0 ? ` and ${replies === 1 ? "1 reply" : `${replies} replies`}` : " and replies"} are deleted too. This cannot be undone.
      </p>
      <DeleteFamily weddingId={weddingId} familyId={family.id} />
      <Button variant="outline" size="lg" render={<Link href={`/w/${weddingId}/families/${family.id}`} />}>Cancel</Button>
    </>
  );
}
