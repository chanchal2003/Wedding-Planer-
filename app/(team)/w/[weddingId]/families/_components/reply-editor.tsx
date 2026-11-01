"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus } from "lucide-react";
import { EventDot } from "@/components/shared/event-dot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setFamilyReply } from "@/lib/families/actions";
import { MAX_PERSONS } from "@/lib/rsvp/schemas";

export type ReplyView = { attending: boolean; persons: number | null; note: string } | null;

// One invited event on the family page: the reply, and the form to enter or change it (FR-41). The team can
// change a reply but never clear it, so there is no "clear" button. The last dates do not apply here.
export function ReplyEditor({
  weddingId,
  familyId,
  event,
  reply,
}: {
  weddingId: string;
  familyId: string;
  event: { id: string; name: string; type: string };
  reply: ReplyView;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [attending, setAttending] = useState<boolean | null>(reply?.attending ?? null);
  const [persons, setPersons] = useState(String(reply?.persons ?? 1));
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const count = Number(persons);
  const validPersons = Number.isInteger(count) && count >= 1 && count <= MAX_PERSONS;
  const changed =
    attending !== null && (reply === null || attending !== reply.attending || (attending && count !== reply.persons));
  const canSave = changed && (attending === false || validPersons);

  function open() {
    setAttending(reply?.attending ?? null);
    setPersons(String(reply?.persons ?? 1));
    setProblem(null);
    setEditing(true);
  }

  async function save() {
    setBusy(true);
    setProblem(null);
    try {
      const result = await setFamilyReply(weddingId, familyId, event.id, { attending: attending === true, persons: attending === true ? count : null });
      if (result.ok) {
        setEditing(false);
        router.refresh();
      } else {
        setProblem(result.error.fields?.persons ?? result.error.message);
      }
    } catch {
      setProblem("Not saved. Check your internet and try again.");
    }
    setBusy(false);
  }

  return (
    <li className="flex flex-col gap-3 rounded-lg border border-border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-lg">
          <EventDot type={event.type} />
          <span className="font-medium">{event.name}:</span>{" "}
          {reply ? (reply.attending ? `Yes, ${reply.persons} ${reply.persons === 1 ? "person" : "people"}` : "No") : "No reply yet"}
        </p>
        {!editing && (
          <Button variant="outline" onClick={open}>
            {reply ? "Change" : "Enter reply"}
          </Button>
        )}
      </div>
      {reply && <p className="text-muted-foreground">{reply.note}</p>}

      {editing && (
        <div className="flex flex-col gap-3">
          <fieldset className="grid grid-cols-2 gap-3">
            <legend className="sr-only">Will they come to the {event.name}?</legend>
            {[
              { label: "Yes", value: true },
              { label: "No", value: false },
            ].map((option) => (
              <label
                key={option.label}
                className="flex h-12 cursor-pointer items-center justify-center rounded-lg border border-input bg-card text-lg has-[:checked]:border-primary has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring"
              >
                <input type="radio" name={`attending-${event.id}`} className="sr-only" checked={attending === option.value} onChange={() => setAttending(option.value)} />
                {option.label}
              </label>
            ))}
          </fieldset>

          {attending === true && (
            <div className="flex flex-col gap-2">
              <Label htmlFor={`persons-${event.id}`}>How many people?</Label>
              <div className="flex items-center gap-3">
                <Button type="button" variant="outline" size="icon" className="size-12" aria-label="One person less" onClick={() => setPersons(String(Math.max(1, (count || 1) - 1)))}>
                  <Minus aria-hidden="true" />
                </Button>
                <Input
                  id={`persons-${event.id}`}
                  value={persons}
                  onChange={(e) => setPersons(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  inputMode="numeric"
                  autoComplete="off"
                  className="h-12 w-24 text-center text-xl"
                  aria-invalid={!validPersons}
                />
                <Button type="button" variant="outline" size="icon" className="size-12" aria-label="One person more" onClick={() => setPersons(String(Math.min(MAX_PERSONS, (count || 0) + 1)))}>
                  <Plus aria-hidden="true" />
                </Button>
              </div>
            </div>
          )}

          {reply && !reply.note.startsWith("Updated by") && <p className="text-muted-foreground">The family replied on its own. Your change replaces it.</p>}
          {problem && <p role="alert" className="text-destructive">{problem}</p>}
          <div className="flex gap-3">
            <Button size="lg" disabled={!canSave || busy} onClick={save}>{busy ? "Saving…" : "Save"}</Button>
            <Button size="lg" variant="outline" disabled={busy} onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </div>
      )}
    </li>
  );
}
