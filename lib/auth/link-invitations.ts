import { db } from "@/lib/db";

type SignedInUser = { id: string; email: string; emailVerified: boolean };

// Turns pending team invitations into active team seats (API design, Section 4).
// Priya invites Ankit by email, so his row waits as "pending" with no user. When Ankit
// signs in with that Google email, the row gets his user and becomes "active".
// Only a verified Google email links, so nobody can take Ankit's seat with a made-up email.
// It does nothing when nothing is pending, so it is safe to call often.
export async function linkPendingInvitations(
  user: SignedInUser,
): Promise<{ linked: number; emailNotVerified: boolean }> {
  if (!user.emailVerified) return { linked: 0, emailNotVerified: true };

  // One statement, so the database check (pending has no user, active has a user) holds.
  const { count } = await db.weddingMember.updateMany({
    where: { email: user.email.toLowerCase(), status: "pending", userId: null },
    data: { userId: user.id, status: "active" },
  });
  return { linked: count, emailNotVerified: false };
}
