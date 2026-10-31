import { PROBLEMS, type Problem, type ProblemCode, type ProblemKind } from "@/lib/import/types";

// The problems grouped by kind, for the screens of step 6.5 (UI design 6.9): errors of one kind
// often have one cause, so "Same number used twice: 12 rows" opens to show its rows.

export type ProblemGroup = {
  code: ProblemCode;
  kind: ProblemKind;
  title: string;
  count: number; // how many rows (or columns) have this problem
  items: { row: number | null; familyName: string; value: string; message: string }[];
};

export function groupProblems(problems: Problem[]): ProblemGroup[] {
  const groups = new Map<ProblemCode, ProblemGroup>();
  for (const item of problems) {
    const group = groups.get(item.code) ?? { code: item.code, kind: item.kind, title: item.title, count: 0, items: [] };
    group.items.push({ row: item.row, familyName: item.familyName, value: item.value, message: item.message });
    group.count = group.items.length;
    groups.set(item.code, group);
  }
  // Errors first, then warnings. Inside each, the order of the list in types.ts.
  const order = Object.keys(PROBLEMS);
  return [...groups.values()]
    .map((group) => ({ ...group, items: [...group.items].sort((a, b) => (a.row ?? 0) - (b.row ?? 0)) }))
    .sort((a, b) => (a.kind === b.kind ? order.indexOf(a.code) - order.indexOf(b.code) : a.kind === "error" ? -1 : 1));
}
