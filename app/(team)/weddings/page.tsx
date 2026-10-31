import { Suspense } from "react";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/access/session";
import { signOutAction } from "@/lib/auth/actions";
import { linkPendingInvitations } from "@/lib/auth/link-invitations";

export const metadata = { title: "My weddings | ShaadiDesk" };

// A placeholder that proves sign-in works. The real "My weddings" list comes at plan step 5.1.
export default function WeddingsPage() {
  return (
    <PageShell>
      <Suspense fallback={<p>Loading…</p>}>
        <SignedIn />
      </Suspense>
    </PageShell>
  );
}

async function SignedIn() {
  const user = await requireUser();
  // Every sign-in lands here, so invitations that wait for this email are connected now.
  const link = await linkPendingInvitations(user);

  return (
    <>
      <h1 className="text-3xl">My weddings</h1>
      <p>
        Signed in as <strong>{user.name}</strong> ({user.email}).
      </p>
      {link.linked > 0 && (
        <p>You were added to {link.linked} wedding team{link.linked > 1 ? "s" : ""}.</p>
      )}
      {link.emailNotVerified && <p role="alert">Your Google email is not verified.</p>}
      <form action={signOutAction}>
        <Button type="submit" variant="outline" size="lg">
          Sign out
        </Button>
      </form>
    </>
  );
}
