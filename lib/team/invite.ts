// The invitation of a team member goes by WhatsApp, never by email (FR-9). The app writes the
// message, and an admin sends it by hand. The app never sends a message itself.

export function inviteMessage({
  inviterName,
  personName,
  coupleTitle,
  signInUrl,
  email,
}: {
  inviterName: string;
  personName: string;
  coupleTitle: string; // "Priya & Rahul"
  signInUrl: string; // "https://.../sign-in"
  email: string; // the Google email the person must use
}): string {
  return `Namaste ${personName}! ${inviterName} has added you to the team for the wedding of ${coupleTitle} on ShaadiDesk. Open ${signInUrl}, tap "Continue with Google" and use this email: ${email}`;
}

// Opens WhatsApp with the text ready. The person at the screen taps send.
export const whatsappUrl = (text: string) => `https://wa.me/?text=${encodeURIComponent(text)}`;
