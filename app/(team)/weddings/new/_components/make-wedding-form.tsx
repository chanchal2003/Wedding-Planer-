"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { makeWeddingAction, type MakeWeddingState } from "@/lib/weddings/actions";

const RELATIONS = [
  { value: "bride", label: "Bride" },
  { value: "groom", label: "Groom" },
  { value: "parent", label: "Parent" },
  { value: "sibling", label: "Sibling" },
] as const;

const empty: MakeWeddingState = {
  values: { brideName: "", groomName: "", weddingDate: "", relation: "", isTest: false },
};

// today: the earliest date the picker allows. The server checks the date again.
export function MakeWeddingForm({ today }: { today: string }) {
  const [state, action, pending] = useActionState(makeWeddingAction, empty);
  const { values, fields, message } = state;

  return (
    <form action={action} className="flex flex-col gap-6" noValidate>
      {message && !fields && (
        <p role="alert" className="text-destructive">
          {message}
        </p>
      )}

      <TextField id="brideName" label="Bride's name" defaultValue={values.brideName} error={fields?.brideName} autoComplete="off" />
      <TextField id="groomName" label="Groom's name" defaultValue={values.groomName} error={fields?.groomName} autoComplete="off" />
      <TextField id="weddingDate" label="Wedding date" type="date" min={today} defaultValue={values.weddingDate} error={fields?.weddingDate} />

      <fieldset className="flex flex-col gap-2" aria-describedby={fields?.relation ? "relation-error" : undefined}>
        <legend className="mb-2 text-base font-medium">You are the…</legend>
        {RELATIONS.map((relation) => (
          <label
            key={relation.value}
            className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-input bg-card px-3 has-[:checked]:border-primary has-[:checked]:bg-secondary"
          >
            <input
              type="radio"
              name="relation"
              value={relation.value}
              defaultChecked={values.relation === relation.value}
              className="size-5 accent-primary"
            />
            <span>{relation.label}</span>
          </label>
        ))}
        {fields?.relation && (
          <p id="relation-error" role="alert" className="text-destructive">
            {fields.relation}
          </p>
        )}
      </fieldset>

      <div className="flex flex-col gap-1">
        <label className="flex min-h-11 cursor-pointer items-center gap-3">
          <input type="checkbox" name="isTest" defaultChecked={values.isTest} className="size-5 accent-primary" />
          <span>This is a test wedding</span>
        </label>
        <p className="pl-8 text-muted-foreground">
          Use a test wedding to try the app with fake guests.
        </p>
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Making your wedding…" : "Make wedding"}
      </Button>
    </form>
  );
}

function TextField({
  id,
  label,
  error,
  ...props
}: { id: string; label: string; error?: string } & React.ComponentProps<typeof Input>) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={id} aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-error` : undefined} {...props} />
      {error && (
        <p id={`${id}-error`} role="alert" className="text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
