"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { deleteFamily } from "@/lib/families/actions";

// The server checks that this person is an admin of this wedding (deleteFamily).
export function DeleteFamily({ weddingId, familyId }: { weddingId: string; familyId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function remove() {
    setBusy(true);
    setMessage(null);
    const result = await deleteFamily(weddingId, familyId);
    if (!result.ok) {
      setBusy(false);
      setMessage(result.error.message);
      return;
    }
    router.push(`/w/${weddingId}/families`);
  }

  return (
    <div className="flex flex-col gap-2">
      {message && <p role="alert" className="text-destructive">{message}</p>}
      <Button type="button" variant="outline" size="lg" onClick={remove} disabled={busy}>
        {busy ? "Deleting…" : "Delete family"}
      </Button>
    </div>
  );
}
