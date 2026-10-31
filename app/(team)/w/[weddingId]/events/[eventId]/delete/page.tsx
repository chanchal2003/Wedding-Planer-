import { Suspense } from "react";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { forPage } from "@/lib/access/respond";
import { getEventDeleteImpact } from "@/lib/events/queries";
import { DeleteEvent } from "./_components/delete-event";

export const metadata = { title: "Delete event | ShaadiDesk" };

// Only admins delete events (FR-7). The page shows what will be lost first (FR-8).
export default function DeleteEventPage({ params }: PageProps<"/w/[weddingId]/events/[eventId]/delete">) {
  return (
    <PageShell>
      <Suspense fallback={<p>Loading…</p>}>
        <DeleteContent params={params} />
      </Suspense>
    </PageShell>
  );
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

async function DeleteContent({ params }: { params: PageProps<"/w/[weddingId]/events/[eventId]/delete">["params"] }) {
  const { weddingId, eventId } = await params;
  const { event, families, replies } = forPage(await getEventDeleteImpact(weddingId, eventId));

  return (
    <>
      <h1 className="text-3xl">Delete {event.name}?</h1>
      <p className="text-lg">
        {families === 0
          ? "No family is invited to this event yet."
          : `${plural(families, "family is", "families are")} invited to ${event.name} and ${replies} ${replies === 1 ? "has" : "have"} replied. Their ${replies === 1 ? "reply" : "replies"} for ${event.name} will be deleted too.`}{" "}
        This cannot be undone.
      </p>
      <DeleteEvent weddingId={weddingId} eventId={event.id} />
      <Button variant="outline" size="lg" render={<Link href={`/w/${weddingId}/events/${event.id}`} />}>
        Cancel
      </Button>
    </>
  );
}
