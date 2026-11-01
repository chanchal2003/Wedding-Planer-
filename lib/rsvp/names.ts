// A guest sees only the FIRST name of a team member ("Contact Rohan"), never an email or a number.
export function firstNameOf(member: { displayName: string | null; user: { name: string | null } | null } | null | undefined): string | null {
  const full = member?.displayName ?? member?.user?.name ?? null;
  return full ? full.trim().split(/\s+/)[0] || null : null;
}

// The end of the sentence "Contact ..." in the messages of Screen 2.
export function contactText(organizerFirstName: string | null): string {
  return organizerFirstName ?? "the person who sent you the card";
}
