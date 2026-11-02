import { Suspense } from "react";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { forPage } from "@/lib/access/respond";
import { getDashboard } from "@/lib/dashboard/queries";
import { Attention, Card, CountsCard, Organizers, RepliesSummary, SetupCard, Timeline } from "./_components/dashboard-parts";

export const metadata = { title: "Home | ShaadiDesk" };

// The home page of a wedding (FR-24, FR-43, FR-44): the timeline, the setup steps for admins, the replies,
// "needs attention", the guest counts and the progress of each organizer. Every team member sees the counts.
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
  const home = forPage(await getDashboard(weddingId));
  const { stats } = home;
  const id = home.member.wedding.id;

  return (
    <>
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl">{home.couple}</h1>
        <p className="text-lg">{home.weddingDate} · {home.daysText}</p>
        <Timeline {...home.timeline} />
      </header>

      {home.isAdmin && <SetupCard steps={home.steps} />}

      {home.mine && (
        <Card title="Your families">
          <p className="text-lg">{home.mine.total} {home.mine.total === 1 ? "family" : "families"} · {home.mine.sent} sent · {home.mine.replied} replied</p>
          <Button variant="outline" size="lg" render={<Link href={`/w/${id}/my-families`} />}>Open my families</Button>
        </Card>
      )}

      {stats.families > 0 && (
        <>
          <RepliesSummary replied={stats.replied} families={stats.families} />
          <Attention weddingId={id} {...stats.attention} />
          <CountsCard title="Whole wedding" counts={stats.wedding} />
          {stats.events.map((event) => (
            <CountsCard key={event.id} title={event.name} type={event.type} counts={event.counts} />
          ))}
          <Organizers organizers={stats.organizers} />
        </>
      )}
    </>
  );
}
