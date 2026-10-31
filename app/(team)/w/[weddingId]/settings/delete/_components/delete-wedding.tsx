"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteWeddingAction, type DeleteWeddingState } from "@/lib/weddings/actions";
import { namesMatch } from "@/lib/weddings/names";

type Counts = { events: number; families: number; replies: number; teamMembers: number };

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

// The warning and the confirmation. The page around it is only for a person who may delete this
// wedding, and the server checks it again when the button is pressed.
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
    <div className="flex flex-col gap-4">
      <p className="text-lg">
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
    </div>
  );
}
