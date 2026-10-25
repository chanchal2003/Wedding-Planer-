import { cn } from "@/lib/utils";

// The standard page container. Phones first: one column, 16 px side padding.
// On wider screens the column stays narrow so lines stay easy to read.
export function PageShell({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <main
      className={cn(
        "mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6",
        className,
      )}
    >
      {children}
    </main>
  );
}
