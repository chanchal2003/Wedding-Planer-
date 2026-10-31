import { Suspense } from "react";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { StatusChip } from "@/components/shared/status-chip";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { signOutAction } from "@/lib/auth/actions";
import { formatDate } from "@/lib/time";
import { listMyWeddings } from "@/lib/weddings/queries";

export const metadata = { title: "My weddings | ShaadiDesk" };

export default function WeddingsPage({ searchParams }: PageProps<"/weddings">) {
  return (
    <PageShell>
      <h1 className="text-3xl">My weddings</h1>
      <Suspense fallback={<p>Loading…</p>}>
        <WeddingList searchParams={searchParams} />
      </Suspense>
    </PageShell>
  );
}

async function WeddingList({ searchParams }: { searchParams: PageProps<"/weddings">["searchParams"] }) {
  const { user, link, weddings } = await listMyWeddings();
  const { deleted } = await searchParams;

  return (
    <>
      {deleted && <p role="status">The wedding was deleted.</p>}
      {link.linked > 0 && (
        <p role="status">
          You were added to {link.linked} wedding team{link.linked > 1 ? "s" : ""}.
        </p>
      )}
      {link.emailNotVerified && <p role="alert">Your Google email is not verified.</p>}

      {weddings.length === 0 ? (
        <p className="text-lg">You have no weddings yet. Make a wedding to begin.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {weddings.map((wedding) => (
            <li key={wedding.id}>
              <Link
                href={`/w/${wedding.id}`}
                className="block rounded-xl focus-visible:outline-offset-4"
              >
                <Card className="transition-colors hover:bg-secondary">
                  <CardContent className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-heading text-xl font-semibold">
                        {wedding.brideName} &amp; {wedding.groomName}
                      </span>
                      {wedding.isTest && <StatusChip>TEST</StatusChip>}
                    </div>
                    <span className="text-muted-foreground">{formatDate(wedding.weddingDate)}</span>
                    <span className="text-muted-foreground">
                      You are {wedding.role === "admin" ? "an admin" : "an organizer"}
                    </span>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Button size="lg" render={<Link href="/weddings/new" />}>
        Make a wedding
      </Button>

      <p className="text-muted-foreground">Signed in as {user.name} ({user.email})</p>
      <form action={signOutAction}>
        <Button type="submit" variant="outline" size="lg" className="w-full">
          Sign out
        </Button>
      </form>
    </>
  );
}
