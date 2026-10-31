import Link from "next/link";
import { cn } from "@/lib/utils";

// A filter of the families list. It is a plain link: the filter is in the address of the page, so
// it works without scripts and a filtered list can be bookmarked or shared.
export function FilterChip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={cn(
        "inline-flex min-h-11 items-center rounded-full border px-4 text-base",
        active ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card hover:bg-secondary",
      )}
    >
      {children}
    </Link>
  );
}
