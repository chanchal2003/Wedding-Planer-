"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StatusChip } from "@/components/shared/status-chip";
import { Button } from "@/components/ui/button";
import { markInvitationSent, undoInvitationSent } from "@/lib/families/actions";

export type FamilyRowData = {
  id: string;
  familyName: string;
  line: string; // "Meena · Jaipur" or ""
  phone: string; // the main number, or "No number"
  place: string; // "Groom's side · Organizer: Ankit"
  noNumber: boolean;
  incorrect: boolean;
  replied: boolean;
  sentAt: string | null; // "2 December"
  sentBy: string | null;
};

const UNDO_SECONDS = 6;

// One family in the list (the same row for "Families" and "My families"). "Mark as sent" is on the
// row (FR-23): one tap, then "Marked as sent. Undo" for a few seconds. The list is read again when the
// seconds are over, so the row does not jump away while the person can still undo.
export function FamilyRow({ weddingId, family }: { weddingId: string; family: FamilyRowData }) {
  const router = useRouter();
  const [local, setLocal] = useState<{ sentAt: string; by: string } | "none" | null>(null); // what the person just did
  const [undoing, setUndoing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const sent = local === "none" ? null : local ?? (family.sentAt ? { sentAt: family.sentAt, by: family.sentBy ?? "" } : null);

  async function mark() {
    setBusy(true);
    setProblem(null);
    try {
      const result = await markInvitationSent(weddingId, family.id);
      if (result.ok) {
        setLocal({ sentAt: new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "long" }).format(new Date(result.data.sentAt)), by: result.data.by });
        setUndoing(true);
        timer.current = setTimeout(() => { setUndoing(false); router.refresh(); }, UNDO_SECONDS * 1000);
      } else {
        setProblem(result.error.message);
      }
    } catch {
      setProblem("Not saved. Check your internet and try again.");
    }
    setBusy(false);
  }

  async function undo() {
    if (timer.current) clearTimeout(timer.current);
    setBusy(true);
    try {
      const result = await undoInvitationSent(weddingId, family.id);
      if (result.ok) {
        setLocal("none");
        setUndoing(false);
        router.refresh();
      } else {
        setProblem(result.error.message);
      }
    } catch {
      setProblem("Not saved. Check your internet and try again.");
    }
    setBusy(false);
  }

  return (
    <li className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <Link href={`/w/${weddingId}/families/${family.id}`} className="flex flex-col gap-2 rounded-lg hover:bg-secondary focus-visible:outline-offset-4">
        <span className="font-heading text-xl font-semibold">{family.familyName}</span>
        {family.line && <span className="text-muted-foreground">{family.line}</span>}
        <span>{family.phone}</span>
        <span className="text-muted-foreground">{family.place}</span>
        <span className="flex flex-wrap gap-2">
          {family.noNumber && <StatusChip tone="warn">No number</StatusChip>}
          {family.incorrect && <StatusChip tone="error">Incorrect number</StatusChip>}
          {sent ? <StatusChip tone="good">Sent {sent.sentAt}{sent.by ? ` · ${sent.by}` : ""}</StatusChip> : <StatusChip>Not sent</StatusChip>}
          {family.replied ? <StatusChip tone="good">Replied</StatusChip> : <StatusChip>No reply</StatusChip>}
        </span>
      </Link>

      {undoing ? (
        <p role="status" className="flex items-center justify-between gap-3">
          <span className="font-medium">Marked as sent.</span>
          <Button variant="outline" disabled={busy} onClick={undo}>Undo</Button>
        </p>
      ) : (
        !sent && <Button size="lg" variant="outline" disabled={busy} onClick={mark}>{busy ? "Saving…" : "Mark as sent"}</Button>
      )}
      {problem && <p role="alert" className="text-destructive">{problem}</p>}
    </li>
  );
}
