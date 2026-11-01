"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { searchFamilies } from "@/lib/rsvp/actions";
import type { Match } from "@/lib/rsvp/search";

// Screen 1 fields (FR-27, FR-28): the family name with its matches, and four separate boxes for
// the last 4 digits. The boxes open the number keypad on a phone and jump to the next box by
// themselves. Step 7.3 adds the check of the digits; until then the button stays off.

const MIN_LETTERS = 3;

type Answer = { text: string; matches: Match[]; error: string | null };

export function FindFamily({ slug }: { slug: string }) {
  const [name, setName] = useState("");
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [chosen, setChosen] = useState<Match | null>(null);
  const [digits, setDigits] = useState(["", "", "", ""]);
  const boxes = useRef<(HTMLInputElement | null)[]>([]);

  const text = name.trim().replace(/\s+/g, " ");
  // What the screen shows is worked out from the text and the last answer.
  const short = !chosen && text.length > 0 && text.length < MIN_LETTERS;
  const ready = !chosen && text.length >= MIN_LETTERS;
  const searching = ready && answer?.text !== text;

  useEffect(() => {
    if (!ready) return;
    let stale = false; // an old answer must never replace a newer one
    const timer = setTimeout(async () => {
      let next: Answer;
      try {
        const result = await searchFamilies(slug, text);
        next = result.ok ? { text, matches: result.data, error: null } : { text, matches: [], error: result.error.message };
      } catch {
        // The network failed: say so, so the screen never waits for ever.
        next = { text, matches: [], error: "Something went wrong. Check your internet and try again." };
      }
      if (!stale) setAnswer(next);
    }, 300);
    return () => {
      stale = true;
      clearTimeout(timer);
    };
  }, [ready, text, slug]);

  function choose(match: Match) {
    setChosen(match);
  }

  function change() {
    setChosen(null);
    setName("");
    setDigits(["", "", "", ""]);
  }

  function setDigit(index: number, value: string) {
    let typed = value.replace(/\D/g, "");
    if (typed === "" && value !== "") return; // a letter: ignore
    // A box that already has a digit and gets one more (the cursor was placed inside it): keep only
    // the new digit, so it never spills into the next box. A paste of 3 or 4 digits still spreads.
    if (digits[index] !== "" && typed.length === 2) typed = typed.replace(digits[index], "");
    // Several digits at once (a paste, or a keypad that fills in): spread them over the boxes.
    const next = [...digits];
    const chars = typed.slice(0, 4 - index).split("");
    if (chars.length === 0) next[index] = "";
    chars.forEach((char, offset) => (next[index + offset] = char));
    setDigits(next);
    const focusAt = Math.min(index + Math.max(chars.length, 0), 3);
    if (chars.length > 0) boxes.current[focusAt]?.focus();
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={(event) => event.preventDefault()}>
      <div className="flex flex-col gap-2">
        <Label htmlFor="familyName">Family name</Label>
        {chosen ? (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-primary bg-secondary p-3">
            <p className="text-lg">
              <span className="font-medium">{chosen.familyName}</span>
              {chosen.hint && <span className="text-muted-foreground"> · {chosen.hint}</span>}
            </p>
            <Button type="button" variant="outline" onClick={change}>Change</Button>
          </div>
        ) : (
          <Input
            id="familyName"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="off"
            placeholder="Type your family name"
            className="h-12 text-lg"
            maxLength={40}
          />
        )}

        <div aria-live="polite" className="flex flex-col gap-2">
          {short && <p className="text-muted-foreground">Type at least 3 letters.</p>}
          {searching && <p className="text-muted-foreground">Searching…</p>}
          {ready && !searching && answer?.error && <p role="alert">{answer.error}</p>}
          {ready && !searching && answer && !answer.error && answer.matches.length === 0 && (
            <p className="text-muted-foreground">No family found. Check the spelling, or ask the person who sent you the card.</p>
          )}
          {ready && !searching && answer && answer.matches.length > 0 && (
            <ul className="flex flex-col gap-2">
              {answer.matches.map((match) => (
                <li key={match.id}>
                  <button
                    type="button"
                    onClick={() => choose(match)}
                    className="flex min-h-14 w-full flex-col justify-center rounded-lg border border-input bg-card px-4 py-2 text-left hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    <span className="text-lg font-medium">{match.familyName}</span>
                    {match.hint && <span className="text-muted-foreground">{match.hint}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-base font-medium">Last 4 digits of your family&apos;s phone number</legend>
        <div className="flex justify-center gap-3">
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(element) => {
                boxes.current[index] = element;
              }}
              value={digit}
              onChange={(event) => setDigit(index, event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Backspace" && digit === "" && index > 0) boxes.current[index - 1]?.focus();
              }}
              onFocus={(event) => event.target.select()}
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              aria-label={`Digit ${index + 1} of 4`}
              className="h-14 w-12 rounded-lg border border-input bg-card text-center text-2xl focus-visible:border-ring focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            />
          ))}
        </div>
      </fieldset>

      <Button type="submit" size="lg" className="h-14 text-lg" disabled>
        See my invitation
      </Button>
    </form>
  );
}
