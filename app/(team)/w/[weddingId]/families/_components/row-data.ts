import { hostedByLabel } from "@/lib/events";
import { displayPhone } from "@/lib/phone";
import { formatEventDate } from "@/lib/time";
import type { FamilyRowData } from "./family-row";

// What a list row needs, as plain text (so it can go to the client component).
export function rowOf(family: {
  id: string;
  familyName: string;
  contactName: string | null;
  city: string | null;
  side: string;
  invitationSentAt: Date | null;
  sentBy: string | null;
  organizerName: string | null;
  replied: boolean;
  phones: { phone: string; kind: string; isIncorrect: boolean }[];
}): FamilyRowData {
  const primary = family.phones.find((phone) => phone.kind === "primary") ?? family.phones[0];
  return {
    id: family.id,
    familyName: family.familyName,
    line: [family.contactName, family.city].filter(Boolean).join(" · "),
    phone: primary ? displayPhone(primary.phone) : "No number",
    place: `${hostedByLabel(family.side)} · ${family.organizerName ? `Organizer: ${family.organizerName}` : "No organizer yet"}`,
    noNumber: !primary,
    incorrect: family.phones.some((phone) => phone.isIncorrect),
    replied: family.replied,
    sentAt: family.invitationSentAt ? formatEventDate(family.invitationSentAt) : null,
    sentBy: family.sentBy,
  };
}
