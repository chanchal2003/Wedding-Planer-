"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { THEME_COLORS } from "@/lib/theme";
import { formatDay } from "@/lib/time";
import { latestReplyDate, latestStayDateFor } from "@/lib/weddings/rules";
import { updateWeddingSettings } from "@/lib/weddings/settings-actions";

type Values = { greeting: string; themeColor: string; rsvpLastDate: string; stayLastDate: string };
// baseline: the values that are saved now. The Save button is on only when the form differs from it.
type State = { values: Values; baseline: Values; saved?: boolean; message?: string; fields?: Record<string, string> };

const same = (a: Values, b: Values) =>
  a.greeting.trim() === b.greeting.trim() &&
  a.themeColor === b.themeColor &&
  a.rsvpLastDate === b.rsvpLastDate &&
  a.stayLastDate === b.stayLastDate;

function readValues(form: HTMLFormElement): Values {
  const data = new FormData(form);
  return {
    greeting: String(data.get("greeting") ?? ""),
    themeColor: String(data.get("themeColor") ?? ""),
    rsvpLastDate: String(data.get("rsvpLastDate") ?? ""),
    stayLastDate: String(data.get("stayLastDate") ?? ""),
  };
}

// Greeting, colour and the two last dates (FR-4). The admin guard runs on the server.
export function GuestPageForm({
  weddingId,
  initial,
  weddingDate,
  today,
}: {
  weddingId: string;
  initial: Values;
  weddingDate: string; // "2027-01-15"
  today: string; // today in India, "2026-10-31"
}) {
  const [state, action, pending] = useActionState<State, FormData>(
    async (previous, formData) => {
      const values: Values = {
        greeting: String(formData.get("greeting") ?? ""),
        themeColor: String(formData.get("themeColor") ?? ""),
        rsvpLastDate: String(formData.get("rsvpLastDate") ?? ""),
        stayLastDate: String(formData.get("stayLastDate") ?? ""),
      };
      const result = await updateWeddingSettings(weddingId, values);
      return result.ok
        ? { values, baseline: values, saved: true }
        : { values, baseline: previous.baseline, message: result.error.message, fields: result.error.fields };
    },
    { values: initial, baseline: initial },
  );
  const { values, fields } = state;

  // What is in the form now. Typed values belong to the state they were typed against: when a save
  // finishes (a new state), the form shows that state again.
  const [typed, setTyped] = useState<{ base: State; values: Values } | null>(null);
  const current = typed && typed.base === state ? typed.values : state.values;
  const changed = !same(current, state.baseline);

  // The pickers grey out the days that are not allowed. The server checks the same rules again.
  const [reply, setReply] = useState(initial.rsvpLastDate);
  const replyLatest = latestReplyDate(weddingDate);
  const stayLatest = latestStayDateFor(weddingDate, reply);

  return (
    <form
      action={action}
      onInput={(event) => setTyped({ base: state, values: readValues(event.currentTarget) })}
      className="flex flex-col gap-6"
      noValidate
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="greeting">Greeting for your guests</Label>
        <Textarea
          id="greeting"
          name="greeting"
          defaultValue={values.greeting}
          maxLength={400}
          placeholder="Namaste! We would love to celebrate with you."
          aria-invalid={fields?.greeting ? true : undefined}
        />
        <p className="text-muted-foreground">Optional. Up to 280 letters.</p>
        {fields?.greeting && <p role="alert" className="text-destructive">{fields.greeting}</p>}
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-base font-medium">Colour of the guest page</legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {THEME_COLORS.map((color) => (
            <label
              key={color.name}
              className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-input bg-card px-3 has-[:checked]:border-primary has-[:checked]:bg-secondary"
            >
              <input
                type="radio"
                name="themeColor"
                value={color.name}
                defaultChecked={values.themeColor === color.name}
                className="size-5 accent-primary"
              />
              <span aria-hidden="true" className="size-6 rounded-full border border-border" style={{ backgroundColor: color.main }} />
              <span>{color.label}</span>
            </label>
          ))}
        </div>
        {fields?.themeColor && <p role="alert" className="text-destructive">{fields.themeColor}</p>}
      </fieldset>

      <DateField id="rsvpLastDate" label="Reply by" hint={rangeHint(today, replyLatest, "Guests can reply until 23:59 India time on this day.")} min={today} max={replyLatest} defaultValue={values.rsvpLastDate} onChange={setReply} error={fields?.rsvpLastDate} />
      <DateField id="stayLastDate" label="Stay requests by" hint={rangeHint(today, stayLatest, "Must be earlier than the reply date.")} min={today} max={stayLatest} defaultValue={values.stayLastDate} error={fields?.stayLastDate} />

      <div className="flex flex-col gap-2">
        {state.message && !fields && <p role="alert" className="text-destructive">{state.message}</p>}
        {state.saved && !changed && <p role="status">Saved.</p>}
        <Button type="submit" size="lg" disabled={pending || !changed}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}

// "Choose a day from 31 October 2026 to 13 January 2027." (or: too close to the wedding).
function rangeHint(first: string, last: string, extra: string) {
  if (last < first) return "The wedding is too close to set this date.";
  return `Choose a day from ${formatDay(first)} to ${formatDay(last)}. ${extra}`;
}

function DateField({
  id,
  label,
  hint,
  error,
  defaultValue,
  min,
  max,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  error?: string;
  defaultValue: string;
  min: string;
  max: string;
  onChange?: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={id}
        type="date"
        min={min}
        max={max}
        defaultValue={defaultValue}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={`${id}-hint${error ? ` ${id}-error` : ""}`}
      />
      <p id={`${id}-hint`} className="text-muted-foreground">{hint} Optional.</p>
      {error && <p id={`${id}-error`} role="alert" className="text-destructive">{error}</p>}
    </div>
  );
}
