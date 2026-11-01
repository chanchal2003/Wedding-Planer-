"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { assignFamilies } from "@/lib/families/actions";

type Scope = "all" | "bride" | "groom" | "both";
type Counts = Record<Scope, number>;
type Person = { id: string; name: string; pending: boolean };

const SCOPES: { value: Scope; label: string }[] = [
  { value: "all", label: "All families" },
  { value: "groom", label: "Groom's side" },
  { value: "bride", label: "Bride's side" },
  { value: "both", label: "Both sides" },
];

const card = "flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-input bg-card px-3 has-[:checked]:border-primary has-[:checked]:bg-secondary";

// Choose the families, choose the person, confirm (UI design, Families). The server checks again
// who may do it. After the save the counts are read again (router.refresh).
export function AssignForm({ weddingId, counts, people }: { weddingId: string; counts: { all: Counts; unassigned: Counts }; people: Person[] }) {
  const router = useRouter();
  const [scope, setScope] = useState<Scope>("groom");
  const [onlyUnassigned, setOnlyUnassigned] = useState(true);
  const [memberId, setMemberId] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [done, setDone] = useState<{ assigned: number; name: string; memberId: string } | null>(null);

  const count = (onlyUnassigned ? counts.unassigned : counts.all)[scope];
  const person = people.find((p) => p.id === memberId);
  const noun = count === 1 ? "family" : "families";

  async function assign() {
    setBusy(true);
    setMessage(null);
    const result = await assignFamilies(weddingId, { scope, onlyUnassigned, memberId });
    setBusy(false);
    setConfirming(false);
    if (result.ok) {
      setDone({ ...result.data, memberId });
      router.refresh();
    } else {
      setMessage(result.error.fields?.memberId ?? result.error.message);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {done && (
        <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4" role="status">
          <p className="text-lg font-medium">{done.assigned} {done.assigned === 1 ? "family" : "families"} assigned to {done.name}.</p>
          <Button size="lg" variant="outline" render={<Link href={`/w/${weddingId}/families?organizer=${done.memberId}`} />}>See the families of {done.name}</Button>
        </section>
      )}

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-base font-medium">Which families?</legend>
        {SCOPES.map((option) => (
          <label key={option.value} className={card}>
            <input type="radio" name="scope" checked={scope === option.value} onChange={() => { setScope(option.value); setConfirming(false); }} className="size-5 accent-primary" />
            <span>{option.label} ({(onlyUnassigned ? counts.unassigned : counts.all)[option.value]})</span>
          </label>
        ))}
        <label className={card}>
          <input type="checkbox" checked={onlyUnassigned} onChange={(event) => { setOnlyUnassigned(event.target.checked); setConfirming(false); }} className="size-5 accent-primary" />
          <span>Only families with no organizer yet</span>
        </label>
        {!onlyUnassigned && <p className="text-muted-foreground">Families that already have an organizer will move to the new person.</p>}
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-base font-medium">Who?</legend>
        {people.map((option) => (
          <label key={option.id} className={card}>
            <input type="radio" name="memberId" checked={memberId === option.id} onChange={() => { setMemberId(option.id); setConfirming(false); }} className="size-5 accent-primary" />
            <span>{option.name}{option.pending ? " (pending)" : ""}</span>
          </label>
        ))}
      </fieldset>

      {message && <p role="alert" className="font-medium text-destructive">{message}</p>}

      {confirming ? (
        <div className="flex flex-col gap-3">
          <p className="text-lg font-medium">Assign {count} {noun} to {person?.name}?</p>
          <Button size="lg" disabled={busy} onClick={assign}>{busy ? "Assigning…" : "Yes, assign"}</Button>
          <Button size="lg" variant="outline" disabled={busy} onClick={() => setConfirming(false)}>Go back</Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <Button size="lg" disabled={!person || count === 0} onClick={() => setConfirming(true)}>
            {person ? `Assign ${count} ${noun} to ${person.name}` : "Choose a person"}
          </Button>
          {person && count === 0 && <p className="text-muted-foreground">There is no family in this choice.</p>}
        </div>
      )}
    </div>
  );
}
