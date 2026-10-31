import { describe, expect, it } from "vitest";
import { checkTeamChange, type Actor, type TeamMember } from "@/lib/team/rules";

// The team rules (FR-9 to FR-13), checked with plain data: no database needed.
// The people: Priya is the bride and an admin. Dad is a parent and an admin. Rohan and Ankit are
// organizers. Meena's daughter is a friend.

const member = (id: string, patch: Partial<TeamMember> = {}): TeamMember => ({
  id,
  userId: `user-${id}`,
  email: `${id}@example.com`,
  displayName: id,
  role: "organizer",
  relation: "friend",
  status: "active",
  families: 0,
  ...patch,
});

const priya = member("priya", { role: "admin", relation: "bride" });
const dad = member("dad", { role: "admin", relation: "parent" });
const rohan = member("rohan", { relation: "relative" });
const ankit = member("ankit", { userId: null, status: "pending" });

const asDad: Actor = { memberId: "dad", userId: "user-dad" };
const asPriya: Actor = { memberId: "priya", userId: "user-priya" };

const refused = (result: ReturnType<typeof checkTeamChange>) => (result.ok ? null : result);

describe("inviting", () => {
  it("lets an admin invite an organizer", () => {
    expect(checkTeamChange([priya], asPriya, { kind: "invite", email: "ankit@example.com", relation: "friend", role: "organizer" }).ok).toBe(true);
  });

  it("does not make a friend an admin (AC-11.1), but lets a parent or sibling be one", () => {
    const friend = checkTeamChange([priya], asPriya, { kind: "invite", email: "f@example.com", relation: "friend", role: "admin" });
    expect(refused(friend)?.message).toBe("Only family can be admins.");
    const relative = checkTeamChange([priya], asPriya, { kind: "invite", email: "r@example.com", relation: "relative", role: "admin" });
    expect(relative.ok).toBe(false);
    for (const relation of ["bride", "groom", "parent", "sibling"] as const) {
      expect(checkTeamChange([priya], asPriya, { kind: "invite", email: `${relation}@example.com`, relation, role: "admin" }).ok).toBe(true);
    }
  });

  it("refuses an email that is already in the team, and tells how to bring back a removed person", () => {
    const team = [priya, rohan, member("sita", { status: "removed" })];
    expect(refused(checkTeamChange(team, asPriya, { kind: "invite", email: "rohan@example.com", relation: "friend", role: "organizer" }))?.message).toBe("This email is already in the team.");
    expect(refused(checkTeamChange(team, asPriya, { kind: "invite", email: "sita@example.com", relation: "friend", role: "organizer" }))?.message).toBe("This person was removed. Restore them instead.");
  });
});

describe("the last admin (AC-12.1)", () => {
  it("cannot remove or demote themselves when they are the only admin", () => {
    const alone = [dad, rohan];
    expect(refused(checkTeamChange(alone, asDad, { kind: "remove", memberId: "dad" }))?.message).toContain("one admin");
    expect(refused(checkTeamChange(alone, asDad, { kind: "update", memberId: "dad", role: "organizer" }))?.message).toContain("one admin");
  });

  it("can step down when another admin is active", () => {
    const two = [dad, member("uncle", { role: "admin", relation: "parent" })];
    expect(checkTeamChange(two, asDad, { kind: "remove", memberId: "dad" }).ok).toBe(true);
  });

  it("does not count a pending admin as an admin", () => {
    const pendingAdmin = member("aunt", { role: "admin", relation: "parent", status: "pending", userId: null });
    expect(checkTeamChange([dad, pendingAdmin], asDad, { kind: "remove", memberId: "dad" }).ok).toBe(false);
  });
});

describe("the bride or groom who signed in (AC-12.2)", () => {
  it("cannot be removed or demoted by another admin", () => {
    const team = [priya, dad];
    expect(refused(checkTeamChange(team, asDad, { kind: "remove", memberId: "priya" }))?.message).toBe("Only priya can remove their own entry.");
    expect(refused(checkTeamChange(team, asDad, { kind: "update", memberId: "priya", role: "organizer" }))?.message).toBe("Only priya can change their own role.");
    expect(refused(checkTeamChange(team, asDad, { kind: "update", memberId: "priya", relation: "friend" }))?.ok).toBe(false);
  });

  it("can step down by themselves when another admin exists", () => {
    expect(checkTeamChange([priya, dad], asPriya, { kind: "update", memberId: "priya", role: "organizer" }).ok).toBe(true);
  });

  it("can still have their name changed by another admin", () => {
    expect(checkTeamChange([priya, dad], asDad, { kind: "update", memberId: "priya" }).ok).toBe(true);
  });

  it("before they sign in, any admin can edit their entry", () => {
    const pendingBride = member("priya", { role: "admin", relation: "bride", status: "pending", userId: null });
    expect(checkTeamChange([pendingBride, dad], asDad, { kind: "update", memberId: "priya", email: "priya2@example.com" }).ok).toBe(true);
  });
});

describe("removing a person (AC-13.1)", () => {
  it("is refused while families are assigned to them", () => {
    const busy = member("rohan", { relation: "relative", families: 80 });
    expect(refused(checkTeamChange([priya, busy], asPriya, { kind: "remove", memberId: "rohan" }))?.message).toBe("Move rohan's 80 families to someone else first.");
    const one = member("rohan", { relation: "relative", families: 1 });
    expect(refused(checkTeamChange([priya, one], asPriya, { kind: "remove", memberId: "rohan" }))?.message).toBe("Move rohan's 1 family to someone else first.");
  });

  it("is allowed with no families, and a removed person can be restored", () => {
    expect(checkTeamChange([priya, rohan], asPriya, { kind: "remove", memberId: "rohan" }).ok).toBe(true);
    const gone = member("rohan", { status: "removed" });
    expect(checkTeamChange([priya, gone], asPriya, { kind: "restore", memberId: "rohan" }).ok).toBe(true);
    expect(checkTeamChange([priya, rohan], asPriya, { kind: "restore", memberId: "rohan" }).ok).toBe(false);
  });

  it("refuses an unknown person and a person who is already removed", () => {
    expect(refused(checkTeamChange([priya], asPriya, { kind: "remove", memberId: "nobody" }))?.code).toBe("NOT_FOUND");
    expect(checkTeamChange([priya, member("rohan", { status: "removed" })], asPriya, { kind: "remove", memberId: "rohan" }).ok).toBe(false);
  });
});

describe("editing a person", () => {
  it("lets an admin fix the email of a pending person, but not of a person who signed in", () => {
    expect(checkTeamChange([priya, ankit], asPriya, { kind: "update", memberId: "ankit", email: "ankit2@example.com" }).ok).toBe(true);
    expect(refused(checkTeamChange([priya, rohan], asPriya, { kind: "update", memberId: "rohan", email: "r2@example.com" }))?.field).toBe("email");
  });

  it("refuses a new email that another person already has", () => {
    expect(refused(checkTeamChange([priya, rohan, ankit], asPriya, { kind: "update", memberId: "ankit", email: "rohan@example.com" }))?.message).toBe("This email is already in the team.");
  });

  it("does not make a friend an admin by editing", () => {
    expect(refused(checkTeamChange([priya, rohan], asPriya, { kind: "update", memberId: "rohan", role: "admin" }))?.message).toBe("Only family can be admins.");
  });

  it("does not change a removed person", () => {
    expect(checkTeamChange([priya, member("rohan", { status: "removed" })], asPriya, { kind: "update", memberId: "rohan" }).ok).toBe(false);
  });
});
