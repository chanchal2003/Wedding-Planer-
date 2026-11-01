"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Minus, Plus } from "lucide-react";
import { EventDot } from "@/components/shared/event-dot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { leaveFamily, submitReplies } from "@/lib/rsvp/actions";
import { MAX_PERSONS } from "@/lib/rsvp/schemas";
import type { loadInvitation } from "@/lib/rsvp/invitation";

type Invitation = NonNullable<Awaited<ReturnType<typeof loadInvitation>>>;
type Choice = { attending: boolean | null; persons: string };
type Mode = "fill" | "review" | "sending";

const PRIVACY_NOTE =
  "We keep only your family name, your reply and the number of guests. Only the wedding team can see them. We delete them 6 months after the wedding.";

// Screen 2 (FR-32 to FR-37, FR-42): one card for each invited event. An event with a reply is read-only
// (a reply is never changed, FR-36). An event with no reply is open, unless the last date has passed.
// Nothing is chosen at the start. The page says "Thank you" only after the server confirmed the save.
export function ReplyForm({ slug, invitation }: { slug: string; invitation: Invitation }) {
  const router = useRouter();
  const [, startRefresh] = useTransition();
  const open = invitation.events.filter((event) => !event.reply);
  const [choices, setChoices] = useState<Record<string, Choice>>({});
  const [name, setName] = useState("");
  const [mode, setMode] = useState<Mode>("fill");
  const [problem, setProblem] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  const canReply = open.length > 0 && !invitation.isClosed;
  const choiceOf = (id: string): Choice => choices[id] ?? { attending: null, persons: "1" };
  const personsOf = (id: string) => Number(choiceOf(id).persons);
  const validPersons = (id: string) => Number.isInteger(personsOf(id)) && personsOf(id) >= 1 && personsOf(id) <= MAX_PERSONS;
  const everyAnswered = open.every((event) => {
    const choice = choiceOf(event.id);
    return choice.attending === false || (choice.attending === true && validPersons(event.id));
  });
  const ready = everyAnswered && name.trim().length > 0;

  function update(id: string, change: Partial<Choice>) {
    setChoices((previous) => ({ ...previous, [id]: { ...choiceOf(id), ...change } }));
  }

  async function send() {
    setMode("sending");
    setProblem(null);
    try {
      const result = await submitReplies(slug, {
        repliedByName: name,
        answers: open.map((event) => ({
          eventId: event.id,
          attending: choiceOf(event.id).attending === true,
          persons: choiceOf(event.id).attending === true ? personsOf(event.id) : null,
        })),
      });
      if (result.ok) {
        setJustSaved(true);
        startRefresh(() => router.refresh()); // the page now shows the saved replies, read-only
        return;
      }
      setProblem(result.error.message);
      // Someone else replied first, or the replies closed: show what is saved now.
      if (result.error.code === "ALREADY_REPLIED" || result.error.code === "CLOSED") startRefresh(() => router.refresh());
    } catch {
      setProblem("Not sent. Try again.");
    }
    setMode("fill"); // the answers stay on the page
  }

  async function changeFamily() {
    await leaveFamily(slug);
    startRefresh(() => router.refresh());
  }

  const hasReply = invitation.events.some((event) => event.reply);

  return (
    <div className="flex flex-col gap-6 pb-32">
      <header className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-4xl">Namaste, {invitation.familyName}</h1>
        <p className="text-lg">
          You&apos;re invited to {invitation.events.length} {invitation.events.length === 1 ? "event" : "events"}
        </p>
        {justSaved && hasReply && (
          <p role="status" className="mt-2 flex items-center gap-2 font-medium">
            <Check className="size-5" aria-hidden="true" /> Thank you. Your reply is saved.
          </p>
        )}
      </header>

      {mode === "review" || mode === "sending" ? (
        <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4" aria-label="Your reply">
          <h2 className="text-xl font-semibold">Check your reply</h2>
          <ul className="flex flex-col gap-1 text-lg">
            {open.map((event) => (
              <li key={event.id}>
                <span className="font-medium">{event.name}:</span>{" "}
                {choiceOf(event.id).attending ? `Yes, ${personsOf(event.id)} ${personsOf(event.id) === 1 ? "person" : "people"}` : "No"}
              </li>
            ))}
          </ul>
          <p>Replied by {name.trim()}</p>
          <p className="font-medium">You cannot change this reply later. Do you want to submit?</p>
        </section>
      ) : (
        invitation.events.map((event) => (
          <article key={event.id} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="flex items-center gap-2 text-xl font-semibold">
                <EventDot type={event.type} />
                {event.name}
              </h2>
              <p className="text-lg">{event.date}</p>
            </div>
            <p className="text-muted-foreground">
              {event.time}
              {event.venueName ? ` · ${event.venueName}` : ""}
            </p>
            {event.mapLink && (
              <a href={event.mapLink} target="_blank" rel="noopener noreferrer" className="w-fit text-primary underline underline-offset-4">
                Open in Maps
              </a>
            )}

            {event.reply ? (
              <div className="rounded-lg bg-secondary p-3" role="status">
                <p className="text-lg font-medium">
                  {event.reply.attending ? `Yes, ${event.reply.persons} ${event.reply.persons === 1 ? "person" : "people"}` : "No"}
                </p>
                <p className="text-muted-foreground">
                  {event.reply.byTeam
                    ? `Updated by ${event.reply.updatedBy ?? "the team"}`
                    : `Replied by ${event.reply.repliedByName ?? "your family"}, ${event.reply.repliedOn}`}
                </p>
              </div>
            ) : invitation.isClosed ? (
              <p className="rounded-lg bg-secondary p-3 font-medium">Replies are closed. Contact {invitation.contact}.</p>
            ) : (
              <fieldset className="flex flex-col gap-3">
                <legend className="mb-1 text-base font-medium">Will you come?</legend>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Yes", value: true },
                    { label: "No", value: false },
                  ].map((option) => (
                    <label
                      key={option.label}
                      className="flex h-12 cursor-pointer items-center justify-center rounded-lg border border-input bg-card text-lg has-[:checked]:border-primary has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring"
                    >
                      <input
                        type="radio"
                        name={`attending-${event.id}`}
                        className="sr-only"
                        checked={choiceOf(event.id).attending === option.value}
                        onChange={() => update(event.id, { attending: option.value })}
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
                {choiceOf(event.id).attending === true && (
                  <div className="flex flex-col gap-2">
                    <Label htmlFor={`persons-${event.id}`}>How many people?</Label>
                    <div className="flex items-center justify-center gap-3">
                      <Button type="button" variant="outline" size="icon" className="size-12" aria-label="One person less" onClick={() => update(event.id, { persons: String(Math.max(1, (personsOf(event.id) || 1) - 1)) })}>
                        <Minus aria-hidden="true" />
                      </Button>
                      <Input
                        id={`persons-${event.id}`}
                        value={choiceOf(event.id).persons}
                        onChange={(e) => update(event.id, { persons: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                        inputMode="numeric"
                        autoComplete="off"
                        className="h-12 w-24 text-center text-xl"
                        aria-invalid={!validPersons(event.id)}
                      />
                      <Button type="button" variant="outline" size="icon" className="size-12" aria-label="One person more" onClick={() => update(event.id, { persons: String(Math.min(MAX_PERSONS, (personsOf(event.id) || 0) + 1)) })}>
                        <Plus aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                )}
              </fieldset>
            )}
          </article>
        ))
      )}

      {canReply && mode === "fill" && (
        <div className="flex flex-col gap-2">
          {invitation.lastDate && <p className="text-center text-lg">Please reply by {invitation.lastDate}.</p>}
          <Label htmlFor="repliedByName">Your name</Label>
          <Input id="repliedByName" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" maxLength={60} className="h-12 text-lg" placeholder="Who is replying?" />
        </div>
      )}

      {hasReply && !canReply && <p className="text-center text-lg">To change your reply, contact {invitation.contact}.</p>}
      {hasReply && canReply && <p className="text-center text-lg">Your other replies are saved. To change them, contact {invitation.contact}.</p>}

      {problem && <p role="alert" className="text-center font-medium">{problem}</p>}

      <p className="text-center text-muted-foreground">{PRIVACY_NOTE}</p>

      <button type="button" onClick={changeFamily} className="mx-auto min-h-11 text-muted-foreground underline underline-offset-4">
        Not the {invitation.familyName}? Change
      </button>

      {canReply && (
        <div className="fixed inset-x-0 bottom-0 border-t border-border bg-background p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto flex max-w-md flex-col gap-2">
            {mode === "fill" ? (
              <Button size="lg" className="h-14 text-lg" disabled={!ready} onClick={() => { setProblem(null); setMode("review"); }}>
                Review and submit
              </Button>
            ) : (
              <>
                <Button size="lg" className="h-14 text-lg" disabled={mode === "sending"} onClick={send}>
                  {mode === "sending" ? "Sending…" : "Yes, submit"}
                </Button>
                <Button size="lg" variant="outline" disabled={mode === "sending"} onClick={() => setMode("fill")}>Go back</Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
