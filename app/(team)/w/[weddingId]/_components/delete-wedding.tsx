"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteWeddingAction, type DeleteWeddingState } from "@/lib/weddings/actions";
import { namesMatch } from "@/lib/weddings/names";

type Counts = { events: number; families: number; replies: number; teamMembers: number };

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

// Shown only to a person who may delete this wedding. The server checks it again.
export function DeleteWedding({
  weddingId,
  title,
  counts,
}: {
  weddingId: string;
  title: string;
  counts: Counts;
}) {
  const [state, action, pending] = useActionState<DeleteWeddingState, FormData>(deleteWeddingAction, {
    typedName: "",
  });
  const [typed, setTyped] = useState("");
  const error = state.fields?.confirmName ?? state.message;

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
      <h2 className="text-xl font-semibold">Delete this wedding</h2>
      <p>
        This deletes everything in this wedding: {plural(counts.events, "event", "events")},{" "}
        {plural(counts.families, "family", "families")}, {plural(counts.replies, "reply", "replies")} and{" "}
        {plural(counts.teamMembers, "team member", "team members")}. This cannot be undone.
      </p>
      <form action={action} className="flex flex-col gap-4">
        <input type="hidden" name="weddingId" value={weddingId} />
        <div className="flex flex-col gap-2">
          <Label htmlFor="confirmName">
            Type <strong>{title}</strong> to confirm
          </Label>
          <Input
            id="confirmName"
            name="confirmName"
            autoComplete="off"
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "confirmName-error" : undefined}
          />
          {error && (
            <p id="confirmName-error" role="alert" className="text-destructive">
              {error}
            </p>
          )}
        </div>
        <Button type="submit" variant="outline" size="lg" disabled={pending || !namesMatch(typed, title)}>
          {pending ? "Deleting…" : "Delete wedding"}
        </Button>
      </form>
    </section>
  );
}
