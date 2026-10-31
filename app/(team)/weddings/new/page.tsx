import { Suspense } from "react";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/access/session";
import { todayInIndia } from "@/lib/time";
import { MakeWeddingForm } from "./_components/make-wedding-form";

export const metadata = { title: "Make a wedding | ShaadiDesk" };

export default function NewWeddingPage() {
  return (
    <PageShell>
      <h1 className="text-3xl">Make a wedding</h1>
      <Suspense fallback={<p>Loading…</p>}>
        <Form />
      </Suspense>
      <Button variant="ghost" size="lg" render={<Link href="/weddings" />}>
        Back to my weddings
      </Button>
    </PageShell>
  );
}

// Only a signed-in person can make a wedding.
async function Form() {
  await requireUser();
  return <MakeWeddingForm today={todayInIndia()} />;
}
