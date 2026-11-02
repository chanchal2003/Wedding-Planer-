import { db } from "@/lib/db";
import { requireMember } from "@/lib/access/guards";
import { getDashboardStats } from "@/lib/dashboard/stats";
import { myFamiliesProgress } from "@/lib/families/invitation";
import { formatDate, formatEventDate, todayInIndia } from "@/lib/time";

// API design, Section 13. The home page: the timeline, the setup steps (for admins), the counts and the
// "needs attention" rows. Every team member can read the counts. A component that calls this must sit
// inside <Suspense>.

export type SetupStep = { key: string; label: string; done: boolean; locked: boolean; note?: string; href: string; button: string };

export async function getDashboard(weddingId: string) {
  const access = await requireMember(weddingId);
  if (!access.ok) return access;
  const wedding = access.member.wedding.id;

  const [info, stats, otherPeople, mine] = await Promise.all([
    db.wedding.findUniqueOrThrow({ where: { id: wedding }, select: { brideName: true, groomName: true, weddingDate: true, rsvpLastDate: true } }),
    getDashboardStats(wedding),
    db.weddingMember.count({ where: { weddingId: wedding, status: { not: "removed" }, id: { not: access.member.id } } }),
    myFamiliesProgress(wedding, access.member.id),
  ]);

  // Days to go, counted in India time.
  const today = todayInIndia();
  const days = Math.round((Date.UTC(info.weddingDate.getUTCFullYear(), info.weddingDate.getUTCMonth(), info.weddingDate.getUTCDate()) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000);
  const daysText = days > 1 ? `${days} days to go` : days === 1 ? "Tomorrow" : days === 0 ? "Today" : `${-days} ${days === -1 ? "day" : "days"} ago`;

  const base = `/w/${wedding}`;
  const hasEvents = stats.events.length > 0;
  const steps: SetupStep[] = [
    { key: "wedding", label: "Make the wedding", done: true, locked: false, href: `${base}/settings`, button: "Open settings" },
    { key: "team", label: "Invite your helpers", done: otherPeople > 0, locked: false, href: `${base}/team/new`, button: "Add team" },
    { key: "events", label: "Add events", done: hasEvents, locked: false, href: `${base}/events/new`, button: "Add an event" },
    { key: "dates", label: "Set the reply dates", done: info.rsvpLastDate !== null, locked: false, href: `${base}/settings`, button: "Set the dates" },
    {
      key: "import",
      label: "Import your guest list",
      done: stats.families > 0,
      locked: !hasEvents || otherPeople === 0,
      note: "Add your events and your team first.",
      href: `${base}/import`,
      button: "Import families",
    },
    { key: "cards", label: "Send the cards", done: stats.sent > 0, locked: stats.families === 0, note: "Import your guest list first.", href: `${base}/families?status=not-sent`, button: "Mark cards as sent" },
  ];

  return {
    ...access,
    isAdmin: access.member.role === "admin",
    couple: `${info.brideName} & ${info.groomName}`,
    weddingDate: formatDate(info.weddingDate),
    daysText,
    timeline: {
      today: formatEventDate(new Date()),
      repliesClose: info.rsvpLastDate ? formatDate(info.rsvpLastDate) : null,
      wedding: formatDate(info.weddingDate),
    },
    steps,
    stats,
    mine: mine.total > 0 ? mine : null,
  };
}
