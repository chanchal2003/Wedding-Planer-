import { Suspense } from "react";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { EventDot } from "@/components/shared/event-dot";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/access/guards";
import { forPage } from "@/lib/access/respond";
import { db } from "@/lib/db";
import { eventHeaders } from "@/lib/import/columns";

export const metadata = { title: "Import | ShaadiDesk" };

// Import the guest list from an Excel file (FR-16). Admins only. In this step the page has the
// download of the template. The upload and the checks come at plan steps 6.3 to 6.5.
export default function ImportPage({ params }: PageProps<"/w/[weddingId]/import">) {
  return (
    <PageShell>
      <h1 className="text-3xl">Import guest list</h1>
      <Suspense fallback={<p>Loading…</p>}>
        <ImportContent params={params} />
      </Suspense>
    </PageShell>
  );
}

async function ImportContent({ params }: { params: PageProps<"/w/[weddingId]/import">["params"] }) {
  const { weddingId } = await params;
  const { member } = forPage(await requireAdmin(weddingId));

  const events = await db.event.findMany({
    where: { weddingId: member.wedding.id },
    orderBy: { startsAt: "asc" },
    select: { id: true, name: true, type: true, startsAt: true },
  });
  const headers = eventHeaders(events);

  if (events.length === 0) {
    return (
      <>
        <p className="text-lg">Families are invited to events, so add your events first. Then the template has one column for each event.</p>
        <Button size="lg" render={<Link href={`/w/${weddingId}/events`} />}>Go to events</Button>
      </>
    );
  }

  return (
    <>
      <ol className="flex list-decimal flex-col gap-3 pl-6 text-lg">
        <li>Download the template. It is an Excel file with one column for each of your events.</li>
        <li>Fill in one family in each row, and save the file.</li>
        <li>Upload the file here. The app checks it and shows every problem before anything is saved.</li>
      </ol>

      <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
        <h2 className="text-xl font-semibold">The event columns in the template</h2>
        <ul className="flex flex-col gap-2">
          {events.map((event, index) => (
            <li key={event.id} className="flex items-center gap-3">
              <EventDot type={event.type} />
              {headers[index]}
            </li>
          ))}
        </ul>
      </section>

      <Button size="lg" render={<a href={`/w/${weddingId}/import/template.xlsx`} download />}>
        Download template
      </Button>
      <p className="text-muted-foreground">Uploading the file is not ready yet. It comes in the next step.</p>
    </>
  );
}
