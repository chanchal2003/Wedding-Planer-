"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateSlug } from "@/lib/weddings/settings-actions";

// baseline: the link name that is saved now.
type State = { slug: string; baseline: string; saved?: boolean; message?: string };

// The RSVP link with a Copy button (FR-22), and the link name. The name is locked after the
// first "Invitation sent", so printed links never break.
export function LinkForm({ weddingId, baseUrl, slug, locked }: { weddingId: string; baseUrl: string; slug: string; locked: boolean }) {
  const [state, action, pending] = useActionState<State, FormData>(
    async (previous, formData) => {
      const typedName = String(formData.get("slug") ?? "");
      const result = await updateSlug(weddingId, typedName);
      return result.ok
        ? { slug: result.data.slug, baseline: result.data.slug, saved: true }
        : { slug: typedName, baseline: previous.baseline, message: result.error.message };
    },
    { slug, baseline: slug },
  );

  // What is in the box now (typed values belong to the state they were typed against).
  const [typed, setTyped] = useState<{ base: State; value: string } | null>(null);
  const current = typed && typed.base === state ? typed.value : state.slug;
  const changed = current.trim().toLowerCase() !== state.baseline;
  const [copied, setCopied] = useState(false);
  const link = `${baseUrl}/${state.baseline}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <p className="text-muted-foreground">Your guests open this link:</p>
        <p className="break-all rounded-lg bg-secondary p-3 font-medium">{link}</p>
        <Button type="button" variant="outline" size="lg" onClick={copy}>
          {copied ? "Copied" : "Copy link"}
        </Button>
      </div>

      <form action={action} className="flex flex-col gap-2" noValidate>
        <Label htmlFor="slug">Link name</Label>
        <Input
          id="slug"
          name="slug"
          defaultValue={state.slug}
          onInput={(event) => setTyped({ base: state, value: event.currentTarget.value })}
          disabled={locked}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          aria-invalid={state.message ? true : undefined}
          aria-describedby="slug-help"
        />
        <p id="slug-help" className="text-muted-foreground">
          {locked
            ? "The link is locked, because invitations were sent."
            : "Letters, numbers and dashes. You can change it until the first invitation is marked as sent."}
        </p>
        {state.message && <p role="alert" className="text-destructive">{state.message}</p>}
        {state.saved && !changed && <p role="status">Saved.</p>}
        {!locked && (
          <Button type="submit" size="lg" disabled={pending || !changed}>
            {pending ? "Saving…" : "Save link name"}
          </Button>
        )}
      </form>
    </div>
  );
}
