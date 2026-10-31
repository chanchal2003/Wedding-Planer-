import { db } from "@/lib/db";
import { requireUser } from "@/lib/access/session";
import { linkPendingInvitations } from "@/lib/auth/link-invitations";

// API design, Section 5: listMyWeddings. It first connects the invitations that wait for the
// email of this person, so a wedding that someone added them to shows up now. Then it lists
// the weddings where the person is an active member. A component that calls it must sit
// inside <Suspense> (it reads the session cookie).
export async function listMyWeddings() {
  const user = await requireUser();
  const link = await linkPendingInvitations(user);

  const seats = await db.weddingMember.findMany({
    where: { userId: user.id, status: "active" },
    select: {
      role: true,
      wedding: {
        select: { id: true, brideName: true, groomName: true, weddingDate: true, isTest: true },
      },
    },
    orderBy: { wedding: { weddingDate: "asc" } },
  });

  return {
    user,
    link,
    weddings: seats.map((seat) => ({ ...seat.wedding, role: seat.role })),
  };
}
