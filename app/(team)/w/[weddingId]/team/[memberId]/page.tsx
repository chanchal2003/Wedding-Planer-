import { Suspense } from "react";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { StatusChip } from "@/components/shared/status-chip";
import { Button } from "@/components/ui/button";
import { forPage } from "@/lib/access/respond";
import { getTeamMember } from "@/lib/team/queries";
import { PersonForm } from "../_components/person-form";
import { RemoveRestore } from "../_components/remove-restore";

export const metadata = { title: "Person | ShaadiDesk" };

// Change a person of the team, or remove them (admins only). A person of another wedding is
// "page not found". The server checks the team rules again when anything is saved.
export default function PersonPage({ params }: PageProps<"/w/[weddingId]/team/[memberId]">) {
  return (
    <PageShell>
      <Suspense fallback={<p>Loading…</p>}>
        <Person params={params} />
      </Suspense>
    </PageShell>
  );
}

async function Person({ params }: { params: PageProps<"/w/[weddingId]/team/[memberId]">["params"] }) {
  const { weddingId, memberId } = await params;
  const { person } = forPage(await getTeamMember(weddingId, memberId));
  const name = person.displayName ?? person.user?.name ?? person.email;
  const removed = person.status === "removed";

  return (
    <>
      <h1 className="text-3xl">{name}</h1>
      {removed && <StatusChip className="self-start">Removed</StatusChip>}
      {removed ? (
        <p className="text-lg">This person was removed and cannot open this wedding. Restore them to change their details.</p>
      ) : (
        <PersonForm
          weddingId={weddingId}
          memberId={person.id}
          emailLocked={person.status !== "pending"}
          initial={{
            displayName: person.displayName ?? person.user?.name ?? "",
            email: person.email,
            relation: person.relation,
            role: person.role,
          }}
        />
      )}
      <RemoveRestore weddingId={weddingId} memberId={person.id} name={name} removed={removed} />
      <Button variant="ghost" size="lg" render={<Link href={`/w/${weddingId}/team`} />}>
        Back to the team
      </Button>
    </>
  );
}
