import { Suspense } from "react";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { getSessionUser } from "@/lib/access/session";
import { SignInPanel } from "./_components/sign-in-panel";

export const metadata = { title: "Sign in | ShaadiDesk" };

export default function SignInPage() {
  return (
    <PageShell className="justify-center gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl">
          Shaadi<span className="text-primary">Desk</span>
        </h1>
        <p className="text-lg text-muted-foreground">Plan the shaadi, not the chaos.</p>
      </header>
      <Suspense fallback={null}>
        <SignInGate />
      </Suspense>
    </PageShell>
  );
}

// A person who is already signed in does not need this page.
async function SignInGate() {
  const user = await getSessionUser();
  if (user) redirect("/weddings");
  return <SignInPanel />;
}
