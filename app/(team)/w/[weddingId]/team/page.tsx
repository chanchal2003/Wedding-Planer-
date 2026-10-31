import { Suspense } from "react";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { StatusChip } from "@/components/shared/status-chip";
import { Button } from "@/components/ui/button";
import { forPage } from "@/lib/access/respond";
import { listTeam } from "@/lib/team/queries";
import { relationLabel } from "@/lib/team/schemas";
import { InviteButtons } from "./_components/invite-buttons";

export const metadata = { title: "Team | ShaadiDesk" };

// The team of the wedding (FR-9 to FR-13). Every member sees the list. Only admins see emails,
// the invite buttons and the link to change a person, and only admins add people.
export default function TeamPage({ params }: PageProps<"/w/[weddingId]/team">) {
  return (
    <PageShell>
      <h1 className="text-3xl">Team</h1>
      <Suspense fallback={<p>Loading…</p>}>
        <TeamList params={params} />
      </Suspense>
    </PageShell>
  );
}

const statusChip = {
  active: { tone: "good", label: "Active" },
  pending: { tone: "warn", label: "Pending" },
  removed: { tone: "neutral", label: "Removed" },
} as const;

async function TeamList({ params }: { params: PageProps<"/w/[weddingId]/team">["params"] }) {
  const { weddingId } = await params;
  const { isAdmin, people } = forPage(await listTeam(weddingId));

  return (
    <>
      <ul className="flex flex-col gap-4">
        {people.map((person) => {
          const chip = statusChip[person.status];
          const details = (
            <div className="flex flex-col gap-2">
              <span className="font-heading text-xl font-semibold">
                {person.name}
                {person.isYou && <span className="font-sans text-base font-normal text-muted-foreground"> (you)</span>}
              </span>
              {person.email && <span className="break-all text-muted-foreground">{person.email}</span>}
              <span className="flex flex-wrap gap-2">
                <StatusChip tone={chip.tone}>{chip.label}</StatusChip>
                <StatusChip>{person.role === "admin" ? "Admin" : "Organizer"}</StatusChip>
                <StatusChip>{relationLabel(person.relation)}</StatusChip>
              </span>
            </div>
          );
          return (
            <li key={person.id} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
              {isAdmin ? (
                <Link href={`/w/${weddingId}/team/${person.id}`} className="rounded-lg focus-visible:outline-offset-4">
                  {details}
                </Link>
              ) : (
                details
              )}
              {person.inviteMessage && person.whatsappUrl && (
                <InviteButtons message={person.inviteMessage} whatsappUrl={person.whatsappUrl} />
              )}
            </li>
          );
        })}
      </ul>
      {isAdmin && (
        <Button size="lg" render={<Link href={`/w/${weddingId}/team/new`} />}>
          Add person
        </Button>
      )}
    </>
  );
}
