import { Suspense } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { mayDeleteWedding } from "@/lib/access/checks";
import { forPage } from "@/lib/access/respond";
import { authEnv } from "@/lib/auth/env";
import { DEFAULT_THEME } from "@/lib/theme";
import { todayInIndia } from "@/lib/time";
import { getWeddingSettings } from "@/lib/weddings/queries";
import { BannerForm } from "./_components/banner-form";
import { GuestPageForm } from "./_components/guest-page-form";
import { LinkForm } from "./_components/link-form";

export const metadata = { title: "Settings | ShaadiDesk" };

// Wedding settings (FR-4, FR-22). Admins only: anybody else sees "page not found".
export default function SettingsPage({ params }: PageProps<"/w/[weddingId]/settings">) {
  return (
    <PageShell>
      <h1 className="text-3xl">Settings</h1>
      <Suspense fallback={<p>Loading…</p>}>
        <Settings params={params} />
      </Suspense>
    </PageShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
      <h2 className="text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

const day = (date: Date | null) => (date ? date.toISOString().slice(0, 10) : "");

async function Settings({ params }: { params: PageProps<"/w/[weddingId]/settings">["params"] }) {
  const { weddingId } = await params;
  const { member, settings } = forPage(await getWeddingSettings(weddingId));

  // Only a person who may delete sees the link (the delete page and the server check it again).
  const canDelete = mayDeleteWedding(member, member.wedding);
  const bannerUrl = settings.banner ? `/${settings.slug}/banner?v=${settings.banner.updatedAt.getTime()}` : null;

  return (
    <>
      <Section title="Banner photo">
        <BannerForm weddingId={weddingId} bannerUrl={bannerUrl} />
      </Section>
      <Section title="Guest page">
        <GuestPageForm
          weddingId={weddingId}
          weddingDate={day(settings.weddingDate)}
          today={todayInIndia()}
          initial={{
            greeting: settings.greeting ?? "",
            themeColor: settings.themeColor ?? DEFAULT_THEME,
            rsvpLastDate: day(settings.rsvpLastDate),
            stayLastDate: day(settings.stayLastDate),
          }}
        />
      </Section>
      <Section title="RSVP link">
        <LinkForm weddingId={weddingId} baseUrl={authEnv.BETTER_AUTH_URL} slug={settings.slug} locked={settings.slugLocked} />
      </Section>
      {canDelete && (
        <Link
          href={`/w/${weddingId}/settings/delete`}
          className="inline-flex min-h-11 items-center gap-2 self-start text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          <Trash2 className="size-5" aria-hidden="true" />
          Delete wedding
        </Link>
      )}
    </>
  );
}
