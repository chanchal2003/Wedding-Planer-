// Who may change the team, and how (PRD FR-9 to FR-13). A pure file: it gets a plain list of
// the team and one change, and answers "ok" or "no, because ...". It reads no database, so the
// tests can check every rule with plain data. The actions load the team inside a transaction
// that locks the team rows, ask this file, and only then change anything.

export type Relation = "bride" | "groom" | "parent" | "sibling" | "relative" | "friend" | "other";
export type Role = "admin" | "organizer";
export type Status = "pending" | "active" | "removed";

export type TeamMember = {
  id: string;
  userId: string | null; // empty until the person signs in
  email: string;
  displayName: string | null;
  role: Role;
  relation: Relation;
  status: Status;
  families: number; // how many families are assigned to this person
};

// The admin who asks for the change.
export type Actor = { memberId: string; userId: string };

export type Change =
  | { kind: "invite"; email: string; relation: Relation; role: Role }
  | { kind: "update"; memberId: string; email?: string; relation?: Relation; role?: Role }
  | { kind: "remove"; memberId: string }
  | { kind: "restore"; memberId: string };

export type RuleResult =
  | { ok: true }
  | { ok: false; code: "INVALID_INPUT" | "CONFLICT" | "NOT_ALLOWED_NOW" | "NOT_FOUND"; message: string; field?: string };

// Only the family of the couple can be admin (FR-11).
const FAMILY: readonly Relation[] = ["bride", "groom", "parent", "sibling"];
export const canBeAdmin = (relation: Relation) => FAMILY.includes(relation);

export const memberName = (member: Pick<TeamMember, "displayName" | "email">) => member.displayName ?? member.email;

const no = (code: Extract<RuleResult, { ok: false }>["code"], message: string, field?: string): RuleResult => ({
  ok: false,
  code,
  message,
  ...(field && { field }),
});

// The bride or the groom, signed in, as admin: only they can change or remove their own entry
// (FR-12, AC-12.2).
const isProtected = (member: TeamMember) =>
  member.status === "active" &&
  member.userId !== null &&
  member.role === "admin" &&
  (member.relation === "bride" || member.relation === "groom");

// Active admins other than this person: the wedding must always keep one (FR-12, AC-12.1).
const otherActiveAdmins = (team: TeamMember[], member: TeamMember) =>
  team.filter((other) => other.id !== member.id && other.status === "active" && other.role === "admin").length;

export function checkTeamChange(team: TeamMember[], actor: Actor, change: Change): RuleResult {
  if (change.kind === "invite") {
    if (change.role === "admin" && !canBeAdmin(change.relation)) {
      return no("INVALID_INPUT", "Only family can be admins.", "role");
    }
    const same = team.find((member) => member.email === change.email);
    if (same) {
      return same.status === "removed"
        ? no("CONFLICT", "This person was removed. Restore them instead.", "email")
        : no("CONFLICT", "This email is already in the team.", "email");
    }
    return { ok: true };
  }

  const target = team.find((member) => member.id === change.memberId);
  if (!target) return no("NOT_FOUND", "This person was not found in the team.");

  if (change.kind === "restore") {
    return target.status === "removed" ? { ok: true } : no("NOT_ALLOWED_NOW", "This person is not removed.");
  }

  // Only the person themselves can change or remove the bride or groom admin who signed in.
  const byOther = target.userId !== actor.userId;
  const protectedByThem = isProtected(target) && byOther;

  if (change.kind === "remove") {
    if (target.status === "removed") return no("NOT_ALLOWED_NOW", "This person is already removed.");
    if (protectedByThem) return no("NOT_ALLOWED_NOW", `Only ${memberName(target)} can remove their own entry.`);
    if (target.status === "active" && target.role === "admin" && otherActiveAdmins(team, target) === 0) {
      return no("NOT_ALLOWED_NOW", "There must always be one admin. Make someone else an admin first.");
    }
    if (target.families > 0) {
      return no(
        "NOT_ALLOWED_NOW",
        `Move ${memberName(target)}'s ${target.families} ${target.families === 1 ? "family" : "families"} to someone else first.`,
      );
    }
    return { ok: true };
  }

  // update
  if (target.status === "removed") return no("NOT_ALLOWED_NOW", "Restore this person before you change them.");
  const next = { relation: change.relation ?? target.relation, role: change.role ?? target.role };

  if (change.email !== undefined && change.email !== target.email) {
    if (target.status !== "pending") {
      return no("NOT_ALLOWED_NOW", "The email of a person who already signed in cannot be changed.", "email");
    }
    if (team.some((member) => member.id !== target.id && member.email === change.email)) {
      return no("CONFLICT", "This email is already in the team.", "email");
    }
  }
  if (next.role === "admin" && !canBeAdmin(next.relation)) {
    return no("INVALID_INPUT", "Only family can be admins.", "role");
  }
  const changesRoleOrRelation = next.role !== target.role || next.relation !== target.relation;
  if (changesRoleOrRelation && protectedByThem) {
    return no("NOT_ALLOWED_NOW", `Only ${memberName(target)} can change their own role.`);
  }
  if (target.status === "active" && target.role === "admin" && next.role !== "admin" && otherActiveAdmins(team, target) === 0) {
    return no("NOT_ALLOWED_NOW", "There must always be one admin. Make someone else an admin first.");
  }
  return { ok: true };
}
