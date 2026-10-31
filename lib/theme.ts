// The five colours a couple can choose for the guest page (UI design, Section 4.1).
// The wedding stores only the NAME. Each colour passes the contrast check with white text.

export const THEME_COLORS = [
  { name: "plum", label: "Plum", main: "#5b2a55", tint: "#f3ebf2" },
  { name: "rose", label: "Rose", main: "#8e3b5f", tint: "#f8ecf1" },
  { name: "indigo", label: "Indigo", main: "#4b3a78", tint: "#eeebf6" },
  { name: "slate", label: "Slate blue", main: "#4a5d73", tint: "#ebeff3" },
  { name: "charcoal", label: "Charcoal", main: "#3a4342", tint: "#eceeed" },
] as const;

export type ThemeColorName = (typeof THEME_COLORS)[number]["name"];

export const THEME_NAMES = THEME_COLORS.map((color) => color.name) as [ThemeColorName, ...ThemeColorName[]];
export const DEFAULT_THEME: ThemeColorName = "plum";

// A wedding with no colour, or with an unknown name, uses plum.
export function themeFor(name: string | null | undefined) {
  return THEME_COLORS.find((color) => color.name === name) ?? THEME_COLORS[0];
}
