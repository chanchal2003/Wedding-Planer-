"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { inviteMember, updateMember } from "@/lib/team/actions";
import { canBeAdmin, type Relation } from "@/lib/team/rules";
import { RELATIONS } from "@/lib/team/schemas";

export type PersonValues = { displayName: string; email: string; relation: string; role: string };

// baseline: the values that are saved now (only for a person who exists).
type State = { values: PersonValues; baseline: PersonValues; saved?: boolean; message?: string; fields?: Record<string, string> };

export const EMPTY_PERSON: PersonValues = { displayName: "", email: "", relation: "", role: "organizer" };

const same = (a: PersonValues, b: PersonValues) =>
  (Object.keys(a) as (keyof PersonValues)[]).every((key) => a[key].trim() === b[key].trim());

function readValues(form: HTMLFormElement): PersonValues {
  const data = new FormData(form);
  const get = (key: keyof PersonValues) => String(data.get(key) ?? "");
  return { displayName: get("displayName"), email: get("email"), relation: get("relation"), role: get("role") };
}

// The form to invite a person (admins) and to change one (admins). The server checks who is
// allowed and the rules of the team (lib/team/rules.ts). Save stays off until something changes.
export function PersonForm({
  weddingId,
  memberId,
  initial,
  emailLocked,
}: {
  weddingId: string;
  memberId?: string; // empty: a new person
  initial: PersonValues;
  emailLocked?: boolean; // a person who already signed in keeps their email
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState<State, FormData>(
    async (previous, formData) => {
      const values: PersonValues = {
        displayName: String(formData.get("displayName") ?? ""),
        email: String(formData.get("email") ?? ""),
        relation: String(formData.get("relation") ?? ""),
        role: String(formData.get("role") ?? ""),
      };
      const result = memberId ? await updateMember(weddingId, memberId, values) : await inviteMember(weddingId, values);
      if (!result.ok) {
        return { values, baseline: previous.baseline, message: result.error.message, fields: result.error.fields };
      }
      if (!memberId) router.push(`/w/${weddingId}/team`);
      return { values, baseline: values, saved: true };
    },
    { values: initial, baseline: initial },
  );
  const { values, fields } = state;

  // Relation and role are linked: only family can be admin, so choosing a friend makes the role "organizer".
  const [relation, setRelation] = useState(initial.relation);
  const [role, setRole] = useState(initial.role);
  const adminAllowed = relation !== "" && canBeAdmin(relation as Relation);
  function chooseRelation(next: string) {
    setRelation(next);
    if (!canBeAdmin(next as Relation)) setRole("organizer");
  }

  const [typed, setTyped] = useState<{ base: State; values: PersonValues } | null>(null);
  const current = typed && typed.base === state ? typed.values : state.values;
  const changed = memberId ? !same(current, state.baseline) : true;

  return (
    <form
      action={action}
      onChange={(event) => setTyped({ base: state, values: readValues(event.currentTarget) })}
      className="flex flex-col gap-6"
      noValidate
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="displayName">Name</Label>
        <Input id="displayName" name="displayName" defaultValue={values.displayName} autoComplete="off" aria-invalid={fields?.displayName ? true : undefined} />
        {fields?.displayName && <p role="alert" className="text-destructive">{fields.displayName}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Google email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoCapitalize="none"
          defaultValue={values.email}
          readOnly={emailLocked}
          aria-invalid={fields?.email ? true : undefined}
          aria-describedby="email-help"
        />
        <p id="email-help" className="text-muted-foreground">
          {emailLocked
            ? "This person already signed in, so the email cannot be changed."
            : "The person must sign in with this Google email."}
        </p>
        {fields?.email && <p role="alert" className="text-destructive">{fields.email}</p>}
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-base font-medium">Relation to the couple</legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {RELATIONS.map((option) => (
            <label
              key={option.value}
              className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-input bg-card px-3 has-[:checked]:border-primary has-[:checked]:bg-secondary"
            >
              <input
                type="radio"
                name="relation"
                value={option.value}
                checked={relation === option.value}
                onChange={() => chooseRelation(option.value)}
                className="size-5 accent-primary"
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
        {fields?.relation && <p role="alert" className="text-destructive">{fields.relation}</p>}
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-base font-medium">Role</legend>
        {[
          { value: "organizer", label: "Organizer", help: "Looks after families and sends the invitations." },
          { value: "admin", label: "Admin", help: "Sets up the wedding and manages the team." },
        ].map((option) => {
          const disabled = option.value === "admin" && !adminAllowed;
          return (
            <label
              key={option.value}
              className={`flex min-h-11 items-center gap-3 rounded-lg border border-input bg-card px-3 py-2 has-[:checked]:border-primary has-[:checked]:bg-secondary ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
            >
              <input
                type="radio"
                name="role"
                value={option.value}
                checked={role === option.value}
                disabled={disabled}
                onChange={() => setRole(option.value)}
                className="size-5 accent-primary"
              />
              <span className="flex flex-col">
                <span>{option.label}</span>
                <span className="text-muted-foreground">{option.help}</span>
              </span>
            </label>
          );
        })}
        <p className="text-muted-foreground">Only family (bride, groom, parent or sibling) can be an admin.</p>
        {fields?.role && <p role="alert" className="text-destructive">{fields.role}</p>}
      </fieldset>

      <div className="flex flex-col gap-2">
        {state.message && !fields && <p role="alert" className="text-destructive">{state.message}</p>}
        {state.saved && memberId && !changed && <p role="status">Saved.</p>}
        <Button type="submit" size="lg" disabled={pending || !changed}>
          {pending ? "Saving…" : memberId ? "Save" : "Add person"}
        </Button>
      </div>
    </form>
  );
}
