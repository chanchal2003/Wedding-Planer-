"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EventDot } from "@/components/shared/event-dot";
import { Textarea } from "@/components/ui/textarea";
import { createEvent, updateEvent } from "@/lib/events/actions";
import { EVENT_TYPES, HOSTED_BY, eventType } from "@/lib/events";
import { formatDay } from "@/lib/time";

export type EventValues = {
  type: string;
  name: string;
  day: string;
  time: string;
  venueName: string;
  mapLink: string;
  note: string;
  hostedBy: string;
};

// baseline: the values that are saved now (only for an event that exists).
type State = { values: EventValues; baseline: EventValues; saved?: boolean; message?: string; fields?: Record<string, string> };

export const EMPTY_EVENT: EventValues = { type: "", name: "", day: "", time: "", venueName: "", mapLink: "", note: "", hostedBy: "" };

const same = (a: EventValues, b: EventValues) =>
  (Object.keys(a) as (keyof EventValues)[]).every((key) => a[key].trim() === b[key].trim());

function readValues(form: HTMLFormElement): EventValues {
  const data = new FormData(form);
  const get = (key: keyof EventValues) => String(data.get(key) ?? "");
  return {
    type: get("type"), name: get("name"), day: get("day"), time: get("time"),
    venueName: get("venueName"), mapLink: get("mapLink"), note: get("note"), hostedBy: get("hostedBy"),
  };
}

// The name that goes with a type. For "Other" the person types the name (AC-5.2).
const nameFor = (type: string) => (type === "" || type === "other" ? "" : eventType(type).label);

// The form to add an event (admins) and to edit one (every team member). The server checks who
// is allowed (createEvent: admin, updateEvent: member). Save stays off until something is changed.
export function EventForm({
  weddingId,
  eventId,
  initial,
  today,
  weddingDay,
}: {
  weddingId: string;
  eventId?: string; // empty: a new event
  initial: EventValues;
  today: string; // today in India; the earliest day the picker allows
  weddingDay: string; // the wedding date; the latest day the picker allows
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState<State, FormData>(
    async (previous, formData) => {
      const values: EventValues = {
        type: String(formData.get("type") ?? ""), name: String(formData.get("name") ?? ""),
        day: String(formData.get("day") ?? ""), time: String(formData.get("time") ?? ""),
        venueName: String(formData.get("venueName") ?? ""), mapLink: String(formData.get("mapLink") ?? ""),
        note: String(formData.get("note") ?? ""), hostedBy: String(formData.get("hostedBy") ?? ""),
      };
      const result = eventId ? await updateEvent(weddingId, eventId, values) : await createEvent(weddingId, values);
      if (!result.ok) {
        return { values, baseline: previous.baseline, message: result.error.message, fields: result.error.fields };
      }
      if (!eventId) router.push(`/w/${weddingId}/events`);
      return { values, baseline: values, saved: true };
    },
    { values: initial, baseline: initial },
  );
  const { values, fields } = state;

  // Type and name are linked: choosing a type fills in the name, unless the person typed their own.
  const [type, setType] = useState(initial.type);
  const [name, setName] = useState(initial.name);
  function chooseType(next: string) {
    setName((current) => (current === "" || current === nameFor(type) ? nameFor(next) : current));
    setType(next);
  }

  const [typed, setTyped] = useState<{ base: State; values: EventValues } | null>(null);
  const current = typed && typed.base === state ? typed.values : state.values;
  const changed = eventId ? !same(current, state.baseline) : true;

  return (
    <form
      action={action}
      // onChange (not onInput): for a dropdown, React runs this together with the dropdown's own
      // change, in one redraw. With onInput the form redrew in between and put the old choice back.
      onChange={(event) => setTyped({ base: state, values: readValues(event.currentTarget) })}
      className="flex flex-col gap-6"
      noValidate
    >
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-base font-medium">Type of event</legend>
        {/* Large options you tap, not a dropdown: what you chose is always visible. */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {EVENT_TYPES.map((option) => (
            <label
              key={option.value}
              className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-input bg-card px-3 has-[:checked]:border-primary has-[:checked]:bg-secondary"
            >
              <input
                type="radio"
                name="type"
                value={option.value}
                checked={type === option.value}
                onChange={() => chooseType(option.value)}
                className="size-5 accent-primary"
              />
              <EventDot type={option.value} />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
        {fields?.type && <p role="alert" className="text-destructive">{fields.type}</p>}
      </fieldset>

      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Name of the event</Label>
        <Input
          id="name"
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={type === "other" ? "For example: Mata ki Jagran" : undefined}
          autoComplete="off"
          aria-invalid={fields?.name ? true : undefined}
        />
        <p className="text-muted-foreground">Guests see this name. You can change it.</p>
        {fields?.name && <p role="alert" className="text-destructive">{fields.name}</p>}
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Field id="day" label="Date" type="date" min={today} max={weddingDay} defaultValue={values.day} error={fields?.day} hint={weddingDay < today ? "The wedding date has passed." : `Choose a day from ${formatDay(today)} to ${formatDay(weddingDay)}.`} />
        <Field id="time" label="Start time" type="time" defaultValue={values.time} error={fields?.time} hint="India time" />
      </div>

      <Field id="venueName" label="Venue" defaultValue={values.venueName} error={fields?.venueName} hint="Optional. For example: Grand Palace, Delhi" />
      <Field id="mapLink" label="Map link" type="url" inputMode="url" defaultValue={values.mapLink} error={fields?.mapLink} hint="Optional. Paste a link from Google Maps." />

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-base font-medium">Hosted by</legend>
        {HOSTED_BY.map((option) => (
          <label
            key={option.value}
            className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-input bg-card px-3 has-[:checked]:border-primary has-[:checked]:bg-secondary"
          >
            <input type="radio" name="hostedBy" value={option.value} defaultChecked={values.hostedBy === option.value} className="size-5 accent-primary" />
            <span>{option.label}</span>
          </label>
        ))}
        {fields?.hostedBy && <p role="alert" className="text-destructive">{fields.hostedBy}</p>}
      </fieldset>

      <div className="flex flex-col gap-2">
        <Label htmlFor="note">Note</Label>
        <Textarea id="note" name="note" defaultValue={values.note} maxLength={600} aria-invalid={fields?.note ? true : undefined} />
        <p className="text-muted-foreground">Only the team sees this for now. Optional.</p>
        {fields?.note && <p role="alert" className="text-destructive">{fields.note}</p>}
      </div>

      <div className="flex flex-col gap-2">
        {state.message && !fields && <p role="alert" className="text-destructive">{state.message}</p>}
        {state.saved && eventId && !changed && <p role="status">Saved.</p>}
        <Button type="submit" size="lg" disabled={pending || !changed}>
          {pending ? "Saving…" : eventId ? "Save" : "Add event"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  id, label, hint, error, ...props
}: { id: string; label: string; hint?: string; error?: string } & React.ComponentProps<typeof Input>) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={id} aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-error` : undefined} {...props} />
      {hint && <p className="text-muted-foreground">{hint}</p>}
      {error && <p id={`${id}-error`} role="alert" className="text-destructive">{error}</p>}
    </div>
  );
}
