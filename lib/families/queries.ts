import type { Prisma } from "@/app/generated/prisma/client";
import { db } from "@/lib/db";
import { NO_ACCESS } from "@/lib/access/checks";
import { requireAdmin, requireMember } from "@/lib/access/guards";
import { myFamiliesProgress } from "@/lib/families/invitation";
import { findFamilyInWedding } from "@/lib/families/lookup";
import { getFamilyAccessInfo } from "@/lib/guest/reset";
import { PAGE_SIZE, type FamilyFilters } from "@/lib/families/schemas";

// API design, Section 8. Every read function calls the guard first and returns its answer, and
// every query includes the wedding (CLAUDE.md rule 2). A family of another wedding is "no access".
// A component that calls these must sit inside <Suspense>.

export async function listFamilies(weddingId: string, filters: FamilyFilters) {
  const access = await requireMember(weddingId);
  if (!access.ok) return access;
  return { ...access, ...(await readFamilies(access.member.wedding.id, filters)) };
}

// "My families" (FR-23, FR-24): the families assigned to the person who asks, with the progress and the
// numbers of the filter chips. The same list as above, with the organizer forced to this member.
export async function listMyFamilies(weddingId: string, filters: FamilyFilters) {
  const access = await requireMember(weddingId);
  if (!access.ok) return access;
  const wedding = access.member.wedding.id;

  const [list, progress] = await Promise.all([
    readFamilies(wedding, { ...filters, organizer: access.member.id }),
    myFamiliesProgress(wedding, access.member.id),
  ]);
  return { ...access, ...list, progress };
}

// Reads one page of families of ONE wedding. It does not check who is asking: the callers do.
async function readFamilies(wedding: string, filters: FamilyFilters) {
  // In a search, % and _ are letters of the text, not wildcards (found by the review of 2026-10-31).
  const q = filters.q.replace(/[\\%_]/g, "\\$&");
  const where: Prisma.FamilyWhereInput = {
    weddingId: wedding,
    ...(q && {
      OR: [
        { familyName: { contains: q, mode: "insensitive" } },
        { contactName: { contains: q, mode: "insensitive" } },
        { city: { contains: q, mode: "insensitive" } },
      ],
    }),
    ...(filters.side && { side: filters.side }),
    ...(filters.event && { familyEvents: { some: { eventId: filters.event } } }),
    ...(filters.organizer === "none" && { assignedMemberId: null }),
    ...(filters.organizer && filters.organizer !== "none" && { assignedMemberId: filters.organizer }),
    ...(filters.status === "no-number" && { phones: { none: {} } }),
    ...(filters.status === "incorrect" && { phones: { some: { isIncorrect: true } } }),
    ...(filters.status === "not-sent" && { invitationSentAt: null }),
    ...(filters.status === "no-reply" && { familyEvents: { every: { reply: null } } }),
  };

  const [total, families, events, members] = await Promise.all([
    db.family.count({ where }),
    db.family.findMany({
      where,
      orderBy: [{ familyName: "asc" }, { id: "asc" }],
      skip: (filters.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        familyName: true,
        contactName: true,
        city: true,
        side: true,
        invitationSentAt: true,
        invitationSentBy: { select: { displayName: true, user: { select: { name: true } } } },
        assignedMember: { select: { displayName: true, user: { select: { name: true } } } },
        phones: { select: { phone: true, kind: true, isIncorrect: true }, orderBy: { kind: "asc" } },
        familyEvents: { select: { reply: { select: { id: true } } } },
      },
    }),
    db.event.findMany({ where: { weddingId: wedding }, orderBy: { startsAt: "asc" }, select: { id: true, name: true, type: true } }),
    db.weddingMember.findMany({
      where: { weddingId: wedding, status: { not: "removed" } },
      select: { id: true, displayName: true, user: { select: { name: true } } },
    }),
  ]);

  return {
    total,
    pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    families: families.map((family) => ({
      ...family,
      organizerName: family.assignedMember ? (family.assignedMember.displayName ?? family.assignedMember.user?.name ?? "Team member") : null,
      replied: family.familyEvents.some((event) => event.reply),
      sentBy: family.invitationSentBy ? (family.invitationSentBy.displayName ?? family.invitationSentBy.user?.name ?? "Team member") : null,
    })),
    events,
    organizers: members.map((m) => ({ id: m.id, name: m.displayName ?? m.user?.name ?? "Team member" })),
  };
}

// For the family page: the family, the events of the wedding (to tick), and the team (organizer).
export async function getFamily(weddingId: string, familyId: string) {
  const access = await requireMember(weddingId);
  if (!access.ok) return access;
  const wedding = access.member.wedding.id;

  const family = await findFamilyInWedding(wedding, familyId);
  if (!family) return NO_ACCESS;

  const [events, members, devices] = await Promise.all([
    db.event.findMany({ where: { weddingId: wedding }, orderBy: { startsAt: "asc" }, select: { id: true, name: true, type: true } }),
    db.weddingMember.findMany({
      where: { weddingId: wedding, status: { not: "removed" } },
      select: { id: true, displayName: true, user: { select: { name: true } } },
    }),
    getFamilyAccessInfo(wedding, family.id),
  ]);
  return {
    ...access,
    family,
    access: devices,
    events,
    organizers: members.map((m) => ({ id: m.id, name: m.displayName ?? m.user?.name ?? "Team member" })),
  };
}

// For the "add family" page: only the events and the team.
export async function getFamilyFormOptions(weddingId: string) {
  const access = await requireMember(weddingId);
  if (!access.ok) return access;
  const wedding = access.member.wedding.id;

  const [events, members] = await Promise.all([
    db.event.findMany({ where: { weddingId: wedding }, orderBy: { startsAt: "asc" }, select: { id: true, name: true, type: true } }),
    db.weddingMember.findMany({
      where: { weddingId: wedding, status: { not: "removed" } },
      select: { id: true, displayName: true, user: { select: { name: true } } },
    }),
  ]);
  return {
    ...access,
    events,
    organizers: members.map((m) => ({ id: m.id, name: m.displayName ?? m.user?.name ?? "Team member" })),
  };
}

// For the delete page (admins only): how much goes with the family.
export async function getFamilyDeleteInfo(weddingId: string, familyId: string) {
  const access = await requireAdmin(weddingId);
  if (!access.ok) return access;

  const family = await findFamilyInWedding(access.member.wedding.id, familyId);
  if (!family) return NO_ACCESS;
  const replies = family.familyEvents.filter((event) => event.reply).length;
  return { ...access, family, replies };
}

// For the "Assign families" page (admins only): how many families each choice would change, and the team.
export async function getAssignOptions(weddingId: string) {
  const access = await requireAdmin(weddingId);
  if (!access.ok) return access;
  const wedding = access.member.wedding.id;

  const [all, unassigned, members] = await Promise.all([
    db.family.groupBy({ by: ["side"], where: { weddingId: wedding }, _count: { _all: true } }),
    db.family.groupBy({ by: ["side"], where: { weddingId: wedding, assignedMemberId: null }, _count: { _all: true } }),
    db.weddingMember.findMany({
      where: { weddingId: wedding, status: { not: "removed" } },
      select: { id: true, displayName: true, status: true, user: { select: { name: true } } },
    }),
  ]);
  const counts = (rows: { side: "bride" | "groom" | "both"; _count: { _all: number } }[]) => {
    const bySide = { bride: 0, groom: 0, both: 0 };
    for (const row of rows) bySide[row.side] = row._count._all;
    return { ...bySide, all: bySide.bride + bySide.groom + bySide.both };
  };
  return {
    ...access,
    counts: { all: counts(all), unassigned: counts(unassigned) },
    people: members.map((m) => ({ id: m.id, name: m.displayName ?? m.user?.name ?? "Team member", pending: m.status === "pending" })),
  };
}
