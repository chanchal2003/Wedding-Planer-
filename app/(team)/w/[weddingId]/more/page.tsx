import { Suspense } from "react";
import Link from "next/link";
import { ChevronRight, Settings, Home } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { requireMember } from "@/lib/access/guards";
import { forPage } from "@/lib/access/respond";

export const metadata = { title: "More | ShaadiDesk" };

// The "More" tab of the phone menu: everything that does not fit in the bar. Settings is for
// admins only. Team and Import join this list at their steps.
export default function MorePage({ params }: PageProps<"/w/[weddingId]/more">) {
  return (
    <PageShell>
      <h1 className="text-3xl">More</h1>
      <Suspense fallback={<p>Loading…</p>}>
        <MoreLinks params={params} />
      </Suspense>
    </PageShell>
  );
}

async function MoreLinks({ params }: { params: PageProps<"/w/[weddingId]/more">["params"] }) {
  const { weddingId } = await params;
  const { member } = forPage(await requireMember(weddingId));

  const links = [
    ...(member.role === "admin" ? [{ href: `/w/${weddingId}/settings`, label: "Settings", icon: Settings }] : []),
    { href: "/weddings", label: "My weddings", icon: Home },
  ];

  return (
    <ul className="flex flex-col gap-2">
      {links.map(({ href, label, icon: Icon }) => (
        <li key={href}>
          <Link
            href={href}
            className="flex min-h-14 items-center gap-3 rounded-xl border border-border bg-card px-4 text-lg hover:bg-secondary"
          >
            <Icon className="size-6 text-muted-foreground" aria-hidden />
            <span className="flex-1">{label}</span>
            <ChevronRight className="size-5 text-muted-foreground" aria-hidden />
          </Link>
        </li>
      ))}
    </ul>
  );
}
