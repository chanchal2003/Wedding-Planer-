import { getGuestFamily } from "@/lib/access/guards";
import { loadInvitation } from "@/lib/rsvp/invitation";

// It is in its own file because the access guard needs the sign-in settings; the data functions
// of lib/rsvp stay light, so the tests can import them.
// Screen 2: the invitation of the family of THIS device. getGuestFamily reads the cookie, so a phone
// with no access gets null (Screen 1). A component that calls this must sit inside <Suspense>.
export async function getGuestInvitation(slug: string) {
  const guest = await getGuestFamily(slug);
  if (!guest) return null;
  return loadInvitation(guest.family.weddingId, guest.family.id);
}
