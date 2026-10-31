"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { removeMember, restoreMember } from "@/lib/team/actions";

// Remove from the team (the row is kept as "removed") or bring a removed person back.
// The server checks the rules: the last admin, the bride or groom, and assigned families.
export function RemoveRestore({
  weddingId,
  memberId,
  name,
  removed,
}: {
  weddingId: string;
  memberId: string;
  name: string;
  removed: boolean;
}) {
  const router = useRouter();
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function run(action: typeof removeMember) {
    setBusy(true);
    setMessage(null);
    const result = await action(weddingId, memberId);
    setBusy(false);
    if (!result.ok) {
      setMessage(result.error.message);
      setAsking(false);
      return;
    }
    router.push(`/w/${weddingId}/team`);
    router.refresh();
  }

  if (removed) {
    return (
      <div className="flex flex-col gap-2">
        {message && <p role="alert" className="text-destructive">{message}</p>}
        <Button type="button" variant="outline" size="lg" onClick={() => run(restoreMember)} disabled={busy}>
          {busy ? "Restoring…" : "Restore to the team"}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {message && <p role="alert" className="text-destructive">{message}</p>}
      {asking ? (
        <>
          <p>{name} will not be able to open this wedding any more. You can restore them later.</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="button" variant="outline" size="lg" className="flex-1" onClick={() => run(removeMember)} disabled={busy}>
              {busy ? "Removing…" : "Yes, remove"}
            </Button>
            <Button type="button" variant="ghost" size="lg" className="flex-1" onClick={() => setAsking(false)} disabled={busy}>
              Cancel
            </Button>
          </div>
        </>
      ) : (
        <Button type="button" variant="outline" size="lg" onClick={() => setAsking(true)}>
          Remove from team
        </Button>
      )}
    </div>
  );
}
