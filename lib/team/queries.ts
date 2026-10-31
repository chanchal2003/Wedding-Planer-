import { db } from "@/lib/db";
import { isUuid, NO_ACCESS } from "@/lib/access/checks";
import { requireAdmin, requireMember } from "@/lib/access/guards";
import { authEnv } from "@/lib/auth/env";
import { inviteMessage, whatsappUrl } from "@/lib/team/invite";

// API design, Section 7. Every read function calls the guard first and returns its answer.
// Every team member sees the list, but only an admin sees the emails (the server does not even
// send them to an organizer). A component that calls these must sit inside <Suspense>.

const statusRank = { active: 0, pending: 1, removed: 2 } as const;

export async function listTeam(weddingId: string) {
  const access = await requireMember(weddingId);
  if (!access.ok) return access;

  const isAdmin = access.member.role === "admin";
  const { wedding } = access.member;
  const coupleTitle = `${wedding.brideName} & ${wedding.groomName}`;

  const rows = await db.weddingMember.findMany({
    where: { weddingId: wedding.id },
    select: {
      id: true,
      userId: true,
      email: true,
      displayName: true,
      role: true,
      relation: true,
      status: true,
      user: { select: { name: true } },
    },
  });

  const people = rows
    .map((row) => {
      const name = row.displayName ?? row.user?.name ?? (isAdmin ? row.email : "Team member");
      const invite =
        isAdmin && row.status === "pending"
          ? inviteMessage({
              inviterName: access.user.name,
              personName: row.displayName ?? row.email,
              coupleTitle,
              signInUrl: `${authEnv.BETTER_AUTH_URL}/sign-in`,
              email: row.email,
            })
          : null;
      return {
        id: row.id,
        name,
        email: isAdmin ? row.email : null,
        role: row.role,
        relation: row.relation,
        status: row.status,
        isYou: row.userId === access.user.id,
        inviteMessage: invite,
        whatsappUrl: invite ? whatsappUrl(invite) : null,
      };
    })
    .sort((a, b) => statusRank[a.status] - statusRank[b.status] || a.name.localeCompare(b.name));

  return { ...access, isAdmin, people };
}

// For the edit page (admins only). The person must belong to this wedding.
export async function getTeamMember(weddingId: string, memberId: string) {
  const access = await requireAdmin(weddingId);
  if (!access.ok) return access;
  if (!isUuid(memberId)) return NO_ACCESS;

  const person = await db.weddingMember.findFirst({
    where: { id: memberId, weddingId: access.member.wedding.id },
    select: {
      id: true,
      userId: true,
      email: true,
      displayName: true,
      role: true,
      relation: true,
      status: true,
      user: { select: { name: true } },
      _count: { select: { assignedFamilies: true } },
    },
  });
  if (!person) return NO_ACCESS;
  return { ...access, person: { ...person, isYou: person.userId === access.user.id } };
}
