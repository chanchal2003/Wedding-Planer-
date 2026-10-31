// The person types the name of the wedding to confirm a delete (PRD AC-68.2).
// "Priya & Rahul" is awkward to type on a phone, so the match ignores capital letters and extra
// spaces, and accepts "and" or "&" (or nothing between the names).

export function weddingTitle(wedding: { brideName: string; groomName: string }): string {
  return `${wedding.brideName} & ${wedding.groomName}`;
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/&/g, " ")
    .replace(/\band\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function namesMatch(typed: string, expected: string): boolean {
  const a = normalize(typed);
  return a.length > 0 && a === normalize(expected);
}
