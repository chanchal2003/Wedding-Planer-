import { Suspense } from "react";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { EventDot } from "@/components/shared/event-dot";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { forPage } from "@/lib/access/respond";
import { hostedByLabel } from "@/lib/events";
import { listEvents } from "@/lib/events/queries";
import { formatDateTime } from "@/lib/time";

export const metadata = { title: "Events | ShaadiDesk" };

// The events of the wedding, oldest first (FR-5). Every team member sees the list; only admins
// can add an event. Every member can open an event to change its details (FR-7).
export default function EventsPage({ params }: PageProps<"/w/[weddingId]/events">) {
  return (
    <PageShell>
      <h1 className="text-3xl">Events</h1>
      <Suspense fallback={<p>Loading…</p>}>
        <EventList params={params} />
      </Suspense>
    </PageShell>
  );
}

async function EventList({ params }: { params: PageProps<"/w/[weddingId]/events">["params"] }) {
  const { weddingId } = await params;
  const { member, events } = forPage(await listEvents(weddingId));
  const isAdmin = member.role === "admin";

  return (
    <>
      {events.length === 0 ? (
        <p className="text-lg">
          {isAdmin ? "No events yet. Add your first event." : "No events yet. An admin adds them."}
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {events.map((event) => (
            <li key={event.id}>
              <Link href={`/w/${weddingId}/events/${event.id}`} className="block rounded-xl focus-visible:outline-offset-4">
                <Card className="transition-colors hover:bg-secondary">
                  <CardContent className="flex flex-col gap-1">
                    <span className="flex items-center gap-3 font-heading text-xl font-semibold">
                      <EventDot type={event.type} />
                      {event.name}
                    </span>
                    <span>{formatDateTime(event.startsAt)}</span>
                    {event.venueName && <span className="text-muted-foreground">{event.venueName}</span>}
                    <span className="text-muted-foreground">
                      Hosted by {hostedByLabel(event.hostedBy)}
                      {event._count.familyEvents > 0 && ` · ${event._count.familyEvents} families invited`}
                    </span>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {isAdmin && (
        <Button size="lg" render={<Link href={`/w/${weddingId}/events/new`} />}>
          Add event
        </Button>
      )}
    </>
  );
}
