import { HOSTED_BY } from "@/lib/events";

// One event of a name for each side (decided 2026-11-02). A wedding can have one Haldi for the bride's
// side and one Haldi for the groom's side, but not two for the same side. "Both sides" overlaps with
// the two others, so a Haldi for both sides cannot exist together with a Haldi for either side.
// The names are compared without capital letters and extra spaces. It is a plain function, so the tests
// can call it; the actions (lib/events/actions.ts) call it before they save.

export type Side = "bride" | "groom" | "both";
export type EventKey = { id?: string; name: string; hostedBy: Side };

const same = (a: string, b: string) => a.trim().replace(/\s+/g, " ").toLowerCase() === b.trim().replace(/\s+/g, " ").toLowerCase();
// "the bride's side", "the groom's side", "both sides": it reads well after "for".
const sideText = (side: Side) => (side === "both" ? "both sides" : `the ${HOSTED_BY.find((option) => option.value === side)?.label.toLowerCase() ?? side}`);

// Returns the message for the person, or null when the event can be saved. "others" are the other
// events of the same wedding; the event that is being changed is skipped by its id.
export function eventClash(candidate: EventKey, others: EventKey[]): string | null {
  const name = candidate.name.trim().replace(/\s+/g, " ");
  for (const other of others) {
    if (candidate.id && other.id === candidate.id) continue;
    if (!same(other.name, candidate.name)) continue;
    const overlaps = candidate.hostedBy === "both" || other.hostedBy === "both" || candidate.hostedBy === other.hostedBy;
    if (!overlaps) continue;
    return other.hostedBy === candidate.hostedBy
      ? `There is already a ${name} for ${sideText(other.hostedBy)}. A second one is not allowed.`
      : `There is already a ${name} for ${sideText(other.hostedBy)}, so you cannot add one for ${sideText(candidate.hostedBy)}.`;
  }
  return null;
}
