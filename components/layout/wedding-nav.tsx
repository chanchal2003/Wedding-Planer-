"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, FileUp, Home, MoreHorizontal, Settings, UsersRound, Users } from "lucide-react";
import { cn } from "@/lib/utils";

// The menu of one wedding (UI design, Section 7): a bar at the bottom on phones, a sidebar on
// laptops. A section that does not exist yet is not in the list (it is hidden, not greyed out).
// Each later step adds its item here: Import (step 6). Team is in More on a phone.

type Item = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  // true when this item should be shown as the current one for this address
  active: (path: string, base: string) => boolean;
};

// Admins have "Families". Organizers have "My families" instead (UI design, Section 7); the two chips on
// those pages switch between the two lists, so both addresses count as this item.
const familiesItem = (base: string, isAdmin: boolean): Item =>
  isAdmin
    ? { href: `${base}/families`, label: "Families", icon: UsersRound, active: (path) => path.startsWith(`${base}/families`) || path.startsWith(`${base}/my-families`) }
    : { href: `${base}/my-families`, label: "My families", icon: UsersRound, active: (path) => path.startsWith(`${base}/my-families`) || path.startsWith(`${base}/families`) };

const phoneItems = (base: string, isAdmin: boolean): Item[] => [
  { href: base, label: "Home", icon: Home, active: (path) => path === base },
  familiesItem(base, isAdmin),
  { href: `${base}/events`, label: "Events", icon: CalendarDays, active: (path) => path.startsWith(`${base}/events`) },
  // "More" holds the rest (Settings for admins, My weddings). Settings counts as More on a phone.
  {
    href: `${base}/more`,
    label: "More",
    icon: MoreHorizontal,
    active: (path) => path.startsWith(`${base}/more`) || path.startsWith(`${base}/team`) || path.startsWith(`${base}/import`) || path.startsWith(`${base}/settings`),
  },
];

const sideItems = (base: string, isAdmin: boolean): Item[] => [
  { href: base, label: "Home", icon: Home, active: (path) => path === base },
  familiesItem(base, isAdmin),
  ...(isAdmin
    ? [{ href: `${base}/import`, label: "Import", icon: FileUp, active: (path: string) => path.startsWith(`${base}/import`) }]
    : []),
  { href: `${base}/events`, label: "Events", icon: CalendarDays, active: (path) => path.startsWith(`${base}/events`) },
  { href: `${base}/team`, label: "Team", icon: Users, active: (path) => path.startsWith(`${base}/team`) },
  ...(isAdmin
    ? [{ href: `${base}/settings`, label: "Settings", icon: Settings, active: (path: string) => path.startsWith(`${base}/settings`) }]
    : []),
];

export function WeddingNav({
  weddingId,
  isAdmin,
  variant,
}: {
  weddingId: string;
  isAdmin: boolean;
  variant: "bottom" | "side";
}) {
  const path = usePathname();
  const base = `/w/${weddingId}`;

  if (variant === "bottom") {
    return (
      <nav
        aria-label="Wedding menu"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <ul className="mx-auto grid max-w-xl grid-cols-4">
          {phoneItems(base, isAdmin).map((item) => {
            const active = item.active(path, base);
            return (
              <li key={item.label}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-16 flex-col items-center justify-center gap-1 text-sm",
                    active ? "font-semibold text-primary" : "text-muted-foreground",
                  )}
                >
                  <item.icon className="size-6" aria-hidden />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    );
  }

  return (
    <aside className="hidden w-56 shrink-0 border-r border-border bg-card md:block">
      <nav aria-label="Wedding menu" className="sticky top-0 p-3">
        <ul className="flex flex-col gap-1">
          {sideItems(base, isAdmin).map((item) => {
            const active = item.active(path, base);
            return (
              <li key={item.label}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-11 items-center gap-3 rounded-lg px-3 text-base",
                    active ? "bg-secondary font-semibold text-primary" : "text-foreground hover:bg-secondary",
                  )}
                >
                  <item.icon className="size-5" aria-hidden />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
