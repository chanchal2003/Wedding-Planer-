import { Suspense } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { EventDot } from "@/components/shared/event-dot";
import { forPage } from "@/lib/access/respond";
import { getEvent } from "@/lib/events/queries";
import { indiaParts, todayInIndia } from "@/lib/time";
import { EventForm } from "../_components/event-form";

export const metadata = { title: "Event | ShaadiDesk" };

// Every team member can change the details of an event (FR-7, AC-7.1). Only an admin sees the
// link to delete it. An event of another wedding is "page not found".
export default function EventPage({ params }: PageProps<"/w/[weddingId]/events/[eventId]">) {
  return (
    <PageShell>
      <Suspense fallback={<p>Loading…</p>}>
        <Event params={params} />
      </Suspense>
    </PageShell>
  );
}

async function Event({ params }: { params: PageProps<"/w/[weddingId]/events/[eventId]">["params"] }) {
  const { weddingId, eventId } = await params;
  const { member, event } = forPage(await getEvent(weddingId, eventId));
  const { day, time } = indiaParts(event.startsAt);

  return (
    <>
      <h1 className="flex items-center gap-3 text-3xl">
        <EventDot type={event.type} />
        {event.name}
      </h1>
      <EventForm
        weddingId={weddingId}
        eventId={event.id}
        today={todayInIndia()}
        weddingDay={member.wedding.weddingDate.toISOString().slice(0, 10)}
        initial={{
          type: event.type,
          name: event.name,
          day,
          time,
          venueName: event.venueName ?? "",
          mapLink: event.mapLink ?? "",
          note: event.note ?? "",
          hostedBy: event.hostedBy,
        }}
      />
      {member.role === "admin" && (
        <Link
          href={`/w/${weddingId}/events/${event.id}/delete`}
          className="inline-flex min-h-11 items-center gap-2 self-start text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          <Trash2 className="size-5" aria-hidden="true" />
          Delete event
        </Link>
      )}
    </>
  );
}
