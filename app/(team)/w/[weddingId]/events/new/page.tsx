import { Suspense } from "react";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/access/guards";
import { forPage } from "@/lib/access/respond";
import { todayInIndia } from "@/lib/time";
import { EMPTY_EVENT, EventForm } from "../_components/event-form";

export const metadata = { title: "Add event | ShaadiDesk" };

// Only admins add events (FR-7). Anybody else sees "page not found".
export default function NewEventPage({ params }: PageProps<"/w/[weddingId]/events/new">) {
  return (
    <PageShell>
      <h1 className="text-3xl">Add event</h1>
      <Suspense fallback={<p>Loading…</p>}>
        <NewEvent params={params} />
      </Suspense>
    </PageShell>
  );
}

async function NewEvent({ params }: { params: PageProps<"/w/[weddingId]/events/new">["params"] }) {
  const { weddingId } = await params;
  const { member } = forPage(await requireAdmin(weddingId));

  return (
    <>
      <EventForm
        weddingId={weddingId}
        initial={EMPTY_EVENT}
        today={todayInIndia()}
        weddingDay={member.wedding.weddingDate.toISOString().slice(0, 10)}
      />
      <Button variant="outline" size="lg" render={<Link href={`/w/${weddingId}/events`} />}>
        Cancel
      </Button>
    </>
  );
}
