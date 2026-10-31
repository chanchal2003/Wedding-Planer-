import { Suspense } from "react";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { forPage } from "@/lib/access/respond";
import { requireMember } from "@/lib/access/guards";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/time";

// A placeholder. The real home page (setup checklist, counts) comes at plan step 8.3.
// It is the first page that uses the security guard: only an active team member sees it.
export default function WeddingHomePage({ params }: PageProps<"/w/[weddingId]">) {
  return (
    <PageShell>
      <Suspense fallback={<p>Loading…</p>}>
        <WeddingHome params={params} />
      </Suspense>
    </PageShell>
  );
}

async function WeddingHome({ params }: { params: PageProps<"/w/[weddingId]">["params"] }) {
  const { weddingId } = await params;
  const { member } = forPage(await requireMember(weddingId));

  const wedding = await db.wedding.findUniqueOrThrow({
    where: { id: member.wedding.id },
    select: { brideName: true, groomName: true, weddingDate: true, isTest: true },
  });

  return (
    <>
      <h1 className="text-3xl">
        {wedding.brideName} &amp; {wedding.groomName}
      </h1>
      <p className="text-lg">{formatDate(wedding.weddingDate)}</p>
      <p>You are {member.role === "admin" ? "an admin" : "an organizer"} of this wedding.</p>
      {/* Only admins see Settings (the settings page checks it again). The menu comes at step 5.4. */}
      {member.role === "admin" && (
        <Button size="lg" render={<Link href={`/w/${weddingId}/settings`} />}>
          Settings
        </Button>
      )}
      <Button variant="outline" size="lg" render={<Link href="/weddings" />}>
        Back to my weddings
      </Button>
    </>
  );
}
