import { eventType } from "@/lib/events";

// A small colour dot for an event type. It never carries the meaning alone: the name is always
// written next to it (UI design, Section 1, principle 6).
export function EventDot({ type }: { type: string }) {
  return (
    <span
      aria-hidden="true"
      className="inline-block size-3 shrink-0 rounded-full"
      style={{ backgroundColor: eventType(type).color }}
    />
  );
}
