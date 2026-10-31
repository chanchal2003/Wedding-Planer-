"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { EventDot } from "@/components/shared/event-dot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createFamily, updateFamily } from "@/lib/families/actions";
import { HOSTED_BY } from "@/lib/events";

export type FamilyValues = {
  familyName: string;
  contactName: string;
  city: string;
  side: string;
  primaryPhone: string;
  secondaryPhone: string;
  eventIds: string[];
  organizerId: string;
  notes: string;
};

// baseline: the values that are saved now (only for a family that exists).
type State = { values: FamilyValues; baseline: FamilyValues; saved?: boolean; message?: string; fields?: Record<string, string> };

export const EMPTY_FAMILY: FamilyValues = {
  familyName: "", contactName: "", city: "", side: "", primaryPhone: "", secondaryPhone: "", eventIds: [], organizerId: "", notes: "",
};

const same = (a: FamilyValues, b: FamilyValues) =>
  (Object.keys(a) as (keyof FamilyValues)[]).every((key) =>
    key === "eventIds" ? [...a.eventIds].sort().join() === [...b.eventIds].sort().join() : String(a[key]).trim() === String(b[key]).trim(),
  );

function readValues(form: HTMLFormElement): FamilyValues {
  const data = new FormData(form);
  const get = (key: keyof FamilyValues) => String(data.get(key) ?? "");
  return {
    familyName: get("familyName"), contactName: get("contactName"), city: get("city"), side: get("side"),
    primaryPhone: get("primaryPhone"), secondaryPhone: get("secondaryPhone"),
    eventIds: data.getAll("eventIds").map(String), organizerId: get("organizerId"), notes: get("notes"),
  };
}

type Option = { id: string; name: string };

// The form to add a family and to change one (every team member, FR-20). The server checks who is
// allowed. Only an admin can change the organizer. Save stays off until something changes.
export function FamilyForm({
  weddingId,
  familyId,
  initial,
  events,
  organizers,
  canAssign,
  repliedEventIds = [],
}: {
  weddingId: string;
  familyId?: string; // empty: a new family
  initial: FamilyValues;
  events: { id: string; name: string; type: string }[];
  organizers: Option[];
  canAssign: boolean;
  repliedEventIds?: string[]; // events that already have a reply (taking them off deletes the reply)
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState<State, FormData>(
    async (previous, formData) => {
      const values: FamilyValues = {
        familyName: String(formData.get("familyName") ?? ""), contactName: String(formData.get("contactName") ?? ""),
        city: String(formData.get("city") ?? ""), side: String(formData.get("side") ?? ""),
        primaryPhone: String(formData.get("primaryPhone") ?? ""), secondaryPhone: String(formData.get("secondaryPhone") ?? ""),
        eventIds: formData.getAll("eventIds").map(String), organizerId: String(formData.get("organizerId") ?? ""),
        notes: String(formData.get("notes") ?? ""),
      };
      const result = familyId ? await updateFamily(weddingId, familyId, values) : await createFamily(weddingId, values);
      if (!result.ok) {
        return { values, baseline: previous.baseline, message: result.error.message, fields: result.error.fields };
      }
      if (!familyId) router.push(`/w/${weddingId}/families`);
      else router.refresh();
      return { values, baseline: values, saved: true };
    },
    { values: initial, baseline: initial },
  );
  const { values, fields } = state;

  const [selected, setSelected] = useState<string[]>(initial.eventIds);
  const [organizer, setOrganizer] = useState(initial.organizerId);

  const [typed, setTyped] = useState<{ base: State; values: FamilyValues } | null>(null);
  const current = typed && typed.base === state ? typed.values : state.values;
  const changed = familyId ? !same(current, state.baseline) : true;

  const dropped = events.filter((event) => repliedEventIds.includes(event.id) && !selected.includes(event.id));

  if (events.length === 0) {
    return (
      <p className="text-lg">
        There are no events yet. A family is invited to events, so an admin must{" "}
        <a className="text-primary underline" href={`/w/${weddingId}/events`}>add an event first</a>.
      </p>
    );
  }

  return (
    <form
      action={action}
      onChange={(event) => setTyped({ base: state, values: readValues(event.currentTarget) })}
      className="flex flex-col gap-6"
      noValidate
    >
      <Field id="familyName" label="Family name" defaultValue={values.familyName} error={fields?.familyName} autoComplete="off" />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Field id="contactName" label="Contact name" defaultValue={values.contactName} error={fields?.contactName} hint="Optional. Helps to tell two Sharma families apart." autoComplete="off" />
        <Field id="city" label="City" defaultValue={values.city} error={fields?.city} hint="Optional." autoComplete="off" />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-base font-medium">Side</legend>
        {HOSTED_BY.map((option) => (
          <label key={option.value} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-input bg-card px-3 has-[:checked]:border-primary has-[:checked]:bg-secondary">
            <input type="radio" name="side" value={option.value} defaultChecked={values.side === option.value} className="size-5 accent-primary" />
            <span>{option.label}</span>
          </label>
        ))}
        {fields?.side && <p role="alert" className="text-destructive">{fields.side}</p>}
      </fieldset>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Field id="primaryPhone" label="Main number" type="tel" inputMode="tel" defaultValue={values.primaryPhone} error={fields?.primaryPhone} hint="Optional. An Indian number needs no +91." />
        <Field id="secondaryPhone" label="Second number" type="tel" inputMode="tel" defaultValue={values.secondaryPhone} error={fields?.secondaryPhone} hint="Optional." />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-base font-medium">Events on the invitation</legend>
        {events.map((event) => (
          <label key={event.id} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-input bg-card px-3 has-[:checked]:border-primary has-[:checked]:bg-secondary">
            <input
              type="checkbox"
              name="eventIds"
              value={event.id}
              checked={selected.includes(event.id)}
              onChange={(e) => setSelected((list) => (e.target.checked ? [...list, event.id] : list.filter((id) => id !== event.id)))}
              className="size-5 accent-primary"
            />
            <EventDot type={event.type} />
            <span>{event.name}</span>
          </label>
        ))}
        {fields?.eventIds && <p role="alert" className="text-destructive">{fields.eventIds}</p>}
        {dropped.length > 0 && (
          <p role="status" className="rounded-lg bg-chip-warn-bg p-3 text-chip-warn">
            {dropped.map((event) => event.name).join(" and ")}: this family already replied. If you save, the reply is deleted too.
          </p>
        )}
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-base font-medium">Organizer</legend>
        {[{ id: "", name: "No organizer yet" }, ...organizers].map((option) => (
          <label
            key={option.id || "none"}
            className={`flex min-h-11 items-center gap-3 rounded-lg border border-input bg-card px-3 has-[:checked]:border-primary has-[:checked]:bg-secondary ${canAssign ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}
          >
            <input
              type="radio"
              name="organizerId"
              value={option.id}
              checked={organizer === option.id}
              disabled={!canAssign}
              onChange={() => setOrganizer(option.id)}
              className="size-5 accent-primary"
            />
            <span>{option.name}</span>
          </label>
        ))}
        {!canAssign && <p className="text-muted-foreground">Only admins can change this.</p>}
        {fields?.organizerId && <p role="alert" className="text-destructive">{fields.organizerId}</p>}
      </fieldset>

      <div className="flex flex-col gap-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" defaultValue={values.notes} maxLength={500} />
        <p className="text-muted-foreground">Optional. Only the team sees this.</p>
        {fields?.notes && <p role="alert" className="text-destructive">{fields.notes}</p>}
      </div>

      <div className="flex flex-col gap-2">
        {state.message && !fields && <p role="alert" className="text-destructive">{state.message}</p>}
        {state.saved && familyId && !changed && <p role="status">Saved.</p>}
        <Button type="submit" size="lg" disabled={pending || !changed}>
          {pending ? "Saving…" : familyId ? "Save" : "Add family"}
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
