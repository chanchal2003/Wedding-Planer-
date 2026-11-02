import { Suspense } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { StatusChip } from "@/components/shared/status-chip";
import { Button } from "@/components/ui/button";
import { forPage } from "@/lib/access/respond";
import { hostedByLabel } from "@/lib/events";
import { getFamily } from "@/lib/families/queries";
import { displayPhone } from "@/lib/phone";
import { formatEventDate } from "@/lib/time";
import { FamilyForm } from "../_components/family-form";
import { DevicesSection } from "../_components/devices-section";
import { PhoneActions } from "../_components/phone-actions";
import { InvitationSection } from "../_components/invitation-section";
import { ReplyEditor } from "../_components/reply-editor";

export const metadata = { title: "Family | ShaadiDesk" };

// The family page (FR-15, FR-19, FR-20): the numbers, the replies, and the form to change it.
// A family of another wedding is "page not found".
export default function FamilyPage({ params }: PageProps<"/w/[weddingId]/families/[familyId]">) {
  return (
    <PageShell>
      <Suspense fallback={<p>Loading…</p>}>
        <Family params={params} />
      </Suspense>
    </PageShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
      <h2 className="text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

type ReplyRow = {
  source: string;
  repliedByName: string | null;
  repliedAt: Date;
  updatedAt: Date;
  updatedBy: { displayName: string | null; user: { name: string | null } | null } | null;
};

// "Replied by Meena, 5 December" for a guest, "Updated by Rohan Verma, 5 December" for the team.
function replyNote(reply: ReplyRow): string {
  if (reply.source === "team") {
    const who = reply.updatedBy?.displayName ?? reply.updatedBy?.user?.name ?? "the team";
    return `Updated by ${who}, ${formatEventDate(reply.updatedAt)}`;
  }
  return `Replied by ${reply.repliedByName ?? "the family"}, ${formatEventDate(reply.repliedAt)}`;
}

async function Family({ params }: { params: PageProps<"/w/[weddingId]/families/[familyId]">["params"] }) {
  const { weddingId, familyId } = await params;
  const { member, family, access, events, organizers } = forPage(await getFamily(weddingId, familyId));

  const phones = [...family.phones]
    .sort((a, b) => a.kind.localeCompare(b.kind))
    .map((phone) => ({ id: phone.id, display: displayPhone(phone.phone), kind: phone.kind, isIncorrect: phone.isIncorrect }));
  const primary = family.phones.find((phone) => phone.kind === "primary")?.phone ?? "";
  const secondary = family.phones.find((phone) => phone.kind === "secondary")?.phone ?? "";
  const replyOf = new Map(family.familyEvents.map((event) => [event.eventId, event.reply]));
  const invited = events.filter((event) => replyOf.has(event.id));
  const repliedEventIds = invited.filter((event) => replyOf.get(event.id)).map((event) => event.id);

  return (
    <>
      <h1 className="text-3xl">{family.familyName}</h1>
      <p className="flex flex-wrap items-center gap-2">
        <StatusChip>{hostedByLabel(family.side)}</StatusChip>
        {family.invitationSentAt ? <StatusChip tone="good">Invitation sent</StatusChip> : <StatusChip>Not sent</StatusChip>}
        {phones.length === 0 && <StatusChip tone="warn">No number</StatusChip>}
      </p>

      <Section title="Numbers">
        <PhoneActions weddingId={weddingId} familyId={family.id} phones={phones} />
      </Section>

      <Section title="Invitation">
        <InvitationSection
          weddingId={weddingId}
          familyId={family.id}
          sentOn={family.invitationSentAt ? formatEventDate(family.invitationSentAt) : null}
          sentBy={family.invitationSentBy ? (family.invitationSentBy.displayName ?? family.invitationSentBy.user?.name ?? null) : null}
        />
      </Section>

      <Section title="Replies">
        <ul className="flex flex-col gap-3">
          {invited.map((event) => {
            const reply = replyOf.get(event.id);
            return (
              <ReplyEditor
                key={event.id}
                weddingId={weddingId}
                familyId={family.id}
                event={{ id: event.id, name: event.name, type: event.type }}
                reply={reply ? { attending: reply.attending, persons: reply.persons, note: replyNote(reply) } : null}
              />
            );
          })}
        </ul>
      </Section>

      <Section title="Guest devices">
        <DevicesSection weddingId={weddingId} familyId={family.id} devices={access.devices} wrongTries={access.wrongTries} triesLimit={access.limit} />
      </Section>

      <Section title="Details">
        <FamilyForm
          weddingId={weddingId}
          familyId={family.id}
          events={events}
          organizers={organizers}
          canAssign={member.role === "admin"}
          repliedEventIds={repliedEventIds}
          initial={{
            familyName: family.familyName,
            contactName: family.contactName ?? "",
            city: family.city ?? "",
            side: family.side,
            primaryPhone: primary ? displayPhone(primary) : "",
            secondaryPhone: secondary ? displayPhone(secondary) : "",
            eventIds: invited.map((event) => event.id),
            organizerId: family.assignedMemberId ?? "",
            notes: family.notes ?? "",
          }}
        />
      </Section>

      {member.role === "admin" && (
        <Link
          href={`/w/${weddingId}/families/${family.id}/delete`}
          className="inline-flex min-h-11 items-center gap-2 self-start text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          <Trash2 className="size-5" aria-hidden="true" />
          Delete family
        </Link>
      )}
      <Button variant="ghost" size="lg" render={<Link href={`/w/${weddingId}/families`} />}>Back to the families</Button>
    </>
  );
}
