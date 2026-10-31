"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StatusChip } from "@/components/shared/status-chip";
import { Button } from "@/components/ui/button";
import { setPhoneIncorrect, swapPhones } from "@/lib/families/actions";

type Phone = { id: string; display: string; kind: "primary" | "secondary"; isIncorrect: boolean };

// The numbers of a family: mark a number as incorrect (it goes to the list to correct, FR-19), or
// correct again, and swap the main and the second number (FR-20). Every team member can do it.
export function PhoneActions({ weddingId, familyId, phones }: { weddingId: string; familyId: string; phones: Phone[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function run(job: () => ReturnType<typeof swapPhones>) {
    setBusy(true);
    setMessage(null);
    const result = await job();
    setBusy(false);
    if (!result.ok) return setMessage(result.error.message);
    router.refresh();
  }

  if (phones.length === 0) return <p className="text-lg">No number yet. Add one in the form below.</p>;

  return (
    <div className="flex flex-col gap-4">
      {phones.map((phone) => (
        <div key={phone.id} className="flex flex-col gap-2">
          <p className="flex flex-wrap items-center gap-2 text-lg">
            <span className="font-medium">{phone.display}</span>
            <StatusChip>{phone.kind === "primary" ? "Main number" : "Second number"}</StatusChip>
            {phone.isIncorrect && <StatusChip tone="error">Incorrect</StatusChip>}
          </p>
          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={busy}
            onClick={() => run(() => setPhoneIncorrect(weddingId, phone.id, !phone.isIncorrect))}
          >
            {phone.isIncorrect ? "This number is correct" : "Mark as incorrect"}
          </Button>
        </div>
      ))}
      {phones.length === 2 && (
        <Button type="button" variant="outline" size="lg" disabled={busy} onClick={() => run(() => swapPhones(weddingId, familyId))}>
          Swap the main and the second number
        </Button>
      )}
      {message && <p role="alert" className="text-destructive">{message}</p>}
    </div>
  );
}
