import { db } from "@/lib/db";

// The numbers of the dashboard (FR-24, FR-43, FR-44; API design, Section 13). They are counted in the
// database (COUNT, SUM and GROUP BY), so 500 families stay fast. Every query includes the wedding
// (rule 2). It does not check who is asking: getDashboard (queries.ts) calls the guard first.

export type Counts = { invited: number; yes: number; persons: number; no: number; noReply: number };
export type BySide = { total: Counts; bride: Counts; groom: Counts; both: Counts };

const SIDES = ["bride", "groom", "both"] as const;
type Side = (typeof SIDES)[number];
type Row = { side: Side; invited: number; yes: number; persons: number; no: number };

const empty = (): Counts => ({ invited: 0, yes: 0, persons: 0, no: 0, noReply: 0 });

// Adds the three sides into the total, and works out "no reply" (invited without a yes or a no).
function bySide(rows: Row[]): BySide {
  const result: BySide = { total: empty(), bride: empty(), groom: empty(), both: empty() };
  for (const row of rows) {
    const target = result[row.side];
    target.invited += row.invited;
    target.yes += row.yes;
    target.persons += row.persons;
    target.no += row.no;
  }
  for (const side of SIDES) {
    for (const key of ["invited", "yes", "persons", "no"] as const) result.total[key] += result[side][key];
  }
  for (const key of ["total", ...SIDES] as const) result[key].noReply = result[key].invited - result[key].yes - result[key].no;
  return result;
}

export async function getDashboardStats(weddingId: string) {
  // One event, by side. A family is invited to an event once, so "invited" counts invitations of this event.
  const eventRows = await db.$queryRaw<(Row & { eventId: string })[]>`
    SELECT fe.event_id AS "eventId", f.side::text AS side,
      count(*)::int AS invited,
      (count(r.id) FILTER (WHERE r.attending))::int AS yes,
      (COALESCE(sum(r.persons) FILTER (WHERE r.attending), 0))::int AS persons,
      (count(r.id) FILTER (WHERE NOT r.attending))::int AS no
    FROM family_events fe
    JOIN families f ON f.id = fe.family_id AND f.wedding_id = fe.wedding_id
    LEFT JOIN replies r ON r.family_event_id = fe.id
    WHERE fe.wedding_id = ${weddingId}::uuid
    GROUP BY fe.event_id, f.side`;

  // The whole wedding: each family counts ONCE (decided 2026-10-30). Yes = yes to any event, with its largest
  // headcount. No = answered at least one event and said no to every answered event. No reply = answered none.
  const wholeRows = await db.$queryRaw<Row[]>`
    WITH per_family AS (
      SELECT f.id, f.side::text AS side,
        count(r.id) AS answered,
        bool_or(r.attending) FILTER (WHERE r.id IS NOT NULL) AS any_yes,
        max(r.persons) FILTER (WHERE r.attending) AS max_persons
      FROM families f
      LEFT JOIN family_events fe ON fe.family_id = f.id
      LEFT JOIN replies r ON r.family_event_id = fe.id
      WHERE f.wedding_id = ${weddingId}::uuid
      GROUP BY f.id, f.side
    )
    SELECT side,
      count(*)::int AS invited,
      (count(*) FILTER (WHERE any_yes))::int AS yes,
      (COALESCE(sum(max_persons) FILTER (WHERE any_yes), 0))::int AS persons,
      (count(*) FILTER (WHERE answered > 0 AND NOT any_yes))::int AS no
    FROM per_family
    GROUP BY side`;

  // The progress of each organizer (FR-24). "Replied" = at least one reply, the same rule as "My families".
  const organizerRows = await db.$queryRaw<{ memberId: string | null; families: number; sent: number; replied: number }[]>`
    SELECT f.assigned_member_id AS "memberId",
      count(*)::int AS families,
      (count(*) FILTER (WHERE f.invitation_sent_at IS NOT NULL))::int AS sent,
      (count(*) FILTER (WHERE EXISTS (
        SELECT 1 FROM family_events fe JOIN replies r ON r.family_event_id = fe.id WHERE fe.family_id = f.id
      )))::int AS replied
    FROM families f
    WHERE f.wedding_id = ${weddingId}::uuid
    GROUP BY f.assigned_member_id`;

  const [events, members, noReply, noPhone, notSent, families] = await Promise.all([
    db.event.findMany({ where: { weddingId }, orderBy: { startsAt: "asc" }, select: { id: true, name: true, type: true } }),
    db.weddingMember.findMany({ where: { weddingId, status: { not: "removed" } }, select: { id: true, displayName: true, user: { select: { name: true } } } }),
    // The same rules as the filters of the Families list, so the numbers agree with the list.
    db.family.count({ where: { weddingId, familyEvents: { every: { reply: null } } } }),
    db.family.count({ where: { weddingId, phones: { none: {} } } }),
    db.family.count({ where: { weddingId, invitationSentAt: null } }),
    db.family.count({ where: { weddingId } }),
  ]);

  const nameOf = new Map(members.map((m) => [m.id, m.displayName ?? m.user?.name ?? "Team member"]));
  const organizers = organizerRows
    .map((row) => ({ id: row.memberId, name: row.memberId ? (nameOf.get(row.memberId) ?? "Team member") : "No organizer yet", families: row.families, sent: row.sent, replied: row.replied }))
    .sort((a, b) => (a.id === null ? 1 : 0) - (b.id === null ? 1 : 0) || a.name.localeCompare(b.name));

  return {
    wedding: bySide(wholeRows),
    events: events.map((event) => ({ ...event, counts: bySide(eventRows.filter((row) => row.eventId === event.id)) })),
    organizers,
    attention: { noReply, noPhone, notSent },
    families,
    replied: families - noReply,
    sent: families - notSent,
  };
}
