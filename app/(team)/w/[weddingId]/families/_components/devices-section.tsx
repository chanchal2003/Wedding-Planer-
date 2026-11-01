"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { resetFamilyDevices } from "@/lib/families/actions";

// The phones that have access to the guest page of this family, and the wrong tries of the last
// 24 hours (FR-30, FR-31). A team member can remove the phones and clear the tries: the guests of
// the family then type the 4 digits again (AC-30.3), also when a stranger locked the family out.
export function DevicesSection({
  weddingId,
  familyId,
  devices,
  wrongTries,
  triesLimit,
}: {
  weddingId: string;
  familyId: string;
  devices: number;
  wrongTries: number;
  triesLimit: number;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function reset() {
    setBusy(true);
    const result = await resetFamilyDevices(weddingId, familyId);
    setBusy(false);
    setConfirming(false);
    if (result.ok) {
      setMessage("Done. The family types the 4 digits again.");
      router.refresh();
    } else {
      setMessage(result.error.message);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-lg">
        {devices === 0 ? "No phone has access yet." : `${devices} ${devices === 1 ? "phone has" : "phones have"} access to the guest page.`}
      </p>
      {wrongTries > 0 && (
        <p className="text-lg">
          {wrongTries} wrong {wrongTries === 1 ? "try" : "tries"} in the last 24 hours (the page stops at {triesLimit}).
        </p>
      )}
      {message && <p role="status" className="text-muted-foreground">{message}</p>}
      {(devices > 0 || wrongTries > 0) &&
        (confirming ? (
          <div className="flex flex-col gap-3">
            <p className="font-medium">Remove access from all phones and clear the wrong tries? The family types the 4 digits again.</p>
            <Button size="lg" disabled={busy} onClick={reset}>{busy ? "Resetting…" : "Yes, reset"}</Button>
            <Button size="lg" variant="outline" disabled={busy} onClick={() => setConfirming(false)}>Go back</Button>
          </div>
        ) : (
          <Button size="lg" variant="outline" onClick={() => { setMessage(null); setConfirming(true); }}>Reset devices and tries</Button>
        ))}
    </div>
  );
}
