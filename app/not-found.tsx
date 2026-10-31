import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";

// Shown for an address that does not exist, and also when a signed-in person has no access
// to a wedding. The text is the same on purpose: a person cannot find out whether a wedding
// exists (see lib/access/respond.ts).
export default function NotFound() {
  return (
    <PageShell className="justify-center">
      <h1 className="text-3xl">Page not found</h1>
      <p className="text-lg">This page was not found. It may not exist, or you may not have access.</p>
      <Button size="lg" render={<Link href="/" />}>
        Go to the start
      </Button>
    </PageShell>
  );
}
