import { db } from "@/lib/db";
import { raw, toCsv } from "@/lib/export/csv";
import { HOSTED_BY } from "@/lib/events";
import { displayPhone } from "@/lib/phone";
import { relationLabel } from "@/lib/team/schemas";
import { indiaParts } from "@/lib/time";

// The three files of the export (FR-65): families with their phone numbers, replies, and the team.
// Every query includes the wedding (rule 2). These functions do not check who is asking: the route
// calls requireAdmin first. Dates are India time ("2026-12-05 10:30", rule 9).

const sideLabel = (side: string) => HOSTED_BY.find((option) => option.value === side)?.label ?? side;
const when = (date: Date | null) => {
  if (!date) return "";
  const { day, time } = indiaParts(date);
  return `${day} ${time}`;
};
const nameOf = (member: { displayName: string | null; user: { name: string | null } | null } | null) => member?.displayName ?? member?.user?.name ?? "";
const cap = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
const memberName = { select: { displayName: true, user: { select: { name: true } } } } as const;

// A phone number is checked by lib/phone (only + and digits), so it is safe as it is. The spaces make Excel keep it as text.
const phone = (value: string | undefined) => (value ? raw(displayPhone(value)) : "");

export async function buildFamiliesCsv(weddingId: string) {
  const families = await db.family.findMany({
    where: { weddingId },
    orderBy: [{ familyName: "asc" }, { id: "asc" }],
    select: {
      familyName: true,
      contactName: true,
      city: true,
      side: true,
      notes: true,
      invitationSentAt: true,
      invitationSentBy: memberName,
      assignedMember: memberName,
      phones: { select: { phone: true, kind: true } },
      familyEvents: { select: { event: { select: { name: true, startsAt: true } } } },
    },
  });

  return toCsv([
    ["Family name", "Contact name", "City", "Side", "Main number", "Second number", "Events", "Organizer", "Invitation sent", "Sent by", "Notes"],
    ...families.map((family) => [
      family.familyName,
      family.contactName,
      family.city,
      sideLabel(family.side),
      phone(family.phones.find((p) => p.kind === "primary")?.phone),
      phone(family.phones.find((p) => p.kind === "secondary")?.phone),
      family.familyEvents
        .map((row) => row.event)
        .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
        .map((event) => event.name)
        .join(", "),
      nameOf(family.assignedMember),
      when(family.invitationSentAt),
      nameOf(family.invitationSentBy),
      family.notes,
    ]),
  ]);
}

// One row for each invitation (family and event), also when there is no reply yet. The contact name and the
// city are there because many families have the same name ("Sharma family"), and a row must say which one.
export async function buildRepliesCsv(weddingId: string) {
  const rows = await db.familyEvent.findMany({
    where: { weddingId },
    select: {
      family: { select: { familyName: true, contactName: true, city: true } },
      event: { select: { name: true, startsAt: true } },
      reply: { select: { attending: true, persons: true, repliedByName: true, source: true, updatedAt: true, repliedAt: true, updatedBy: memberName } },
    },
  });
  rows.sort(
    (a, b) =>
      a.family.familyName.localeCompare(b.family.familyName) || a.event.startsAt.getTime() - b.event.startsAt.getTime(),
  );

  return toCsv([
    ["Family", "Contact name", "City", "Event", "Answer", "Persons", "Replied by", "Source", "Updated by", "Date"],
    ...rows.map(({ family, event, reply }) => [
      family.familyName,
      family.contactName,
      family.city,
      event.name,
      reply ? (reply.attending ? "Yes" : "No") : "No reply",
      reply?.persons,
      reply?.repliedByName,
      reply ? cap(reply.source) : "",
      reply?.source === "team" ? nameOf(reply.updatedBy) : "",
      reply ? when(reply.source === "team" ? reply.updatedAt : reply.repliedAt) : "",
    ]),
  ]);
}

export async function buildTeamCsv(weddingId: string) {
  const members = await db.weddingMember.findMany({
    where: { weddingId },
    orderBy: [{ status: "asc" }, { createdAt: "asc" }],
    select: { displayName: true, email: true, role: true, relation: true, status: true, user: { select: { name: true } } },
  });

  return toCsv([
    ["Name", "Email", "Role", "Relation", "Status"],
    ...members.map((member) => [member.displayName ?? member.user?.name ?? "", member.email, cap(member.role), relationLabel(member.relation), cap(member.status)]),
  ]);
}
