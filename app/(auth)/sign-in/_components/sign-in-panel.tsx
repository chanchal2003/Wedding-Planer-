"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";

export function SignInPanel() {
  const [opening, setOpening] = useState(false);
  const failed = useSearchParams().has("error");

  async function continueWithGoogle() {
    setOpening(true);
    // Sends the browser to Google. Google sends it back to /api/auth/callback/google.
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/weddings",
      errorCallbackURL: "/sign-in?error=1",
    });
    setOpening(false);
  }

  return (
    <div className="flex flex-col gap-4">
      {failed && (
        <p role="alert" className="text-base text-destructive">
          Sign-in did not work. Please try again.
        </p>
      )}
      <Button size="lg" className="w-full" onClick={continueWithGoogle} disabled={opening}>
        {opening ? "Opening Google…" : "Continue with Google"}
      </Button>
    </div>
  );
}
