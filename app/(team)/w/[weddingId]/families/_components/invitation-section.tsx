"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { markInvitationSent, undoInvitationSent } from "@/lib/families/actions";

// "Invitation sent" on the family page (FR-23). Any team member can mark it and can undo it, also after
// the few seconds of the list (decided 2026-10-30). Undo does not unlock the link name.
export function InvitationSection({ weddingId, familyId, sentOn, sentBy }: { weddingId: string; familyId: string; sentOn: string | null; sentBy: string | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  async function run(action: typeof markInvitationSent | typeof undoInvitationSent) {
    setBusy(true);
    setProblem(null);
    try {
      const result = await action(weddingId, familyId);
      if (result.ok) router.refresh();
      else setProblem(result.error.message);
    } catch {
      setProblem("Not saved. Check your internet and try again.");
    }
    setBusy(false);
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-lg">{sentOn ? `Sent on ${sentOn}${sentBy ? ` by ${sentBy}` : ""}.` : "Not sent yet."}</p>
      {problem && <p role="alert" className="text-destructive">{problem}</p>}
      {sentOn ? (
        <Button size="lg" variant="outline" disabled={busy} onClick={() => run(undoInvitationSent)}>Mark as not sent</Button>
      ) : (
        <Button size="lg" disabled={busy} onClick={() => run(markInvitationSent)}>Mark as sent</Button>
      )}
    </div>
  );
}
