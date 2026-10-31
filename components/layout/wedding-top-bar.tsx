import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { StatusChip } from "@/components/shared/status-chip";

// The bar at the top of every page of one wedding (UI design, Section 7). It shows the
// names of the couple and, for a test wedding, the TEST label (FR-3, AC-3.1).
// With no title it draws only the bar and the back link (used while the page loads).
export function WeddingTopBar({ title, isTest }: { title?: string; isTest?: boolean }) {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background">
      <div className="mx-auto flex w-full max-w-xl items-center gap-3 px-4 sm:px-6">
        <Link
          href="/weddings"
          className="inline-flex min-h-11 shrink-0 items-center gap-1 font-medium text-primary"
        >
          <ChevronLeft className="size-5" aria-hidden="true" />
          My weddings
        </Link>
        <span className="min-w-0 flex-1 truncate text-center font-heading text-lg font-semibold">
          {title}
        </span>
        {isTest && (
          <StatusChip className="shrink-0">
            TEST<span className="sr-only"> wedding</span>
          </StatusChip>
        )}
      </div>
    </header>
  );
}
