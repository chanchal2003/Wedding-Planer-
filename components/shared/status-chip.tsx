import { cn } from "@/lib/utils";

// A small label. Status is always a word plus a colour, never colour alone (UI design 4.1).
const tones = {
  good: "bg-chip-good-bg text-chip-good",
  warn: "bg-chip-warn-bg text-chip-warn",
  error: "bg-chip-error-bg text-chip-error",
  neutral: "bg-chip-neutral-bg text-foreground",
} as const;

export function StatusChip({
  tone = "neutral",
  className,
  children,
}: {
  tone?: keyof typeof tones;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-sm font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
