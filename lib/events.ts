// The event types, their colours and the "hosted by" choices (FR-5, FR-6).
// The colour of an event is a small dot, never text (UI design, Section 4.1).

export const EVENT_TYPES = [
  { value: "haldi", label: "Haldi", color: "var(--event-haldi)" },
  { value: "mehendi", label: "Mehendi", color: "var(--event-mehendi)" },
  { value: "sangeet", label: "Sangeet", color: "var(--event-sangeet)" },
  { value: "mata_ki_chowki", label: "Mata ki Chowki", color: "var(--event-mata-ki-chowki)" },
  { value: "wedding", label: "Wedding", color: "var(--event-wedding)" },
  { value: "reception", label: "Reception", color: "var(--event-reception)" },
  { value: "other", label: "Other", color: "var(--event-other)" },
] as const;

export type EventTypeValue = (typeof EVENT_TYPES)[number]["value"];

export const EVENT_TYPE_VALUES = EVENT_TYPES.map((type) => type.value) as [EventTypeValue, ...EventTypeValue[]];

export function eventType(value: string) {
  return EVENT_TYPES.find((type) => type.value === value) ?? EVENT_TYPES[EVENT_TYPES.length - 1];
}

export const HOSTED_BY = [
  { value: "bride", label: "Bride's side" },
  { value: "groom", label: "Groom's side" },
  { value: "both", label: "Both sides" },
] as const;

export type HostedByValue = (typeof HOSTED_BY)[number]["value"];

export const HOSTED_BY_VALUES = HOSTED_BY.map((option) => option.value) as [HostedByValue, ...HostedByValue[]];

export function hostedByLabel(value: string) {
  return HOSTED_BY.find((option) => option.value === value)?.label ?? value;
}
