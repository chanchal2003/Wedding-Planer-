import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { authEnv } from "@/lib/auth/env";
import { getGuestInvitation } from "@/lib/rsvp/guest";
import { getRsvpLanding } from "@/lib/rsvp/queries";
import { themeFor } from "@/lib/theme";
import { formatDate, formatMonthYear } from "@/lib/time";
import { FindFamily } from "./_components/find-family";
import { ReplyForm } from "./_components/reply-form";

// The guest page (FR-27): Screen 1, "find your family". Guests never sign in, so this page is
// public and shows only what getRsvpLanding returns. Step 7.2 adds the search, step 7.3 the check
// of the 4 digits and Screen 2.

// The link preview in WhatsApp (FR-38, AC-38.1): the banner, "<Bride> & <Groom>'s Wedding" and the
// month and year. Never family names, events or the greeting. The page is not for search engines.
export async function generateMetadata({ params }: PageProps<"/[couple]">): Promise<Metadata> {
  const { couple } = await params;
  const wedding = await getRsvpLanding(couple);
  if (!wedding) return { title: "Page not found", robots: { index: false } };

  const title = `${wedding.brideName} & ${wedding.groomName}'s Wedding`;
  const description = formatMonthYear(wedding.weddingDate);
  const images = wedding.bannerVersion ? [`/${couple}/banner?v=${wedding.bannerVersion}`] : undefined;
  return {
    // The preview image needs a full web address. Change BETTER_AUTH_URL when the app is deployed.
    metadataBase: new URL(authEnv.BETTER_AUTH_URL),
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: { title, description, type: "website", images },
    twitter: { card: images ? "summary_large_image" : "summary", title, description, images },
  };
}

export default function GuestPage({ params }: PageProps<"/[couple]">) {
  return (
    <Suspense fallback={<main className="flex-1" />}>
      <Landing params={params} />
    </Suspense>
  );
}

async function Landing({ params }: { params: PageProps<"/[couple]">["params"] }) {
  const { couple } = await params;
  const wedding = await getRsvpLanding(couple);
  if (!wedding) notFound();

  // A device with access sees the invitation (Screen 2, step 7.4). Everybody else sees Screen 1.
  const invitation = await getGuestInvitation(couple);

  const theme = themeFor(wedding.themeColor);
  // The couple's colour replaces the app's plum on this page only.
  const style = {
    "--primary": theme.main,
    "--primary-hover": `color-mix(in oklch, ${theme.main}, black 20%)`,
    "--ring": theme.main,
    "--secondary": theme.tint,
    "--secondary-foreground": theme.main,
  } as React.CSSProperties;

  return (
    <main style={style} className="relative mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-8">
      {wedding.isTest && (
        <p className="absolute right-4 top-4 rounded-full bg-chip-neutral-bg px-3 py-1 text-sm font-medium">
          TEST<span className="sr-only"> wedding</span>
        </p>
      )}

      {!invitation && wedding.bannerVersion && (
        // The photo is unknown, so no text goes on it (UI design 6.1). A plain img is used on purpose:
        // the file is already made small in the browser when the couple uploads it.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`/${couple}/banner?v=${wedding.bannerVersion}`} alt="" className="mt-8 aspect-[3/2] w-full rounded-2xl object-cover" />
      )}

      {invitation ? (
        <ReplyForm slug={couple} invitation={invitation} />
      ) : (
        <>
      <header className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-4xl">{wedding.brideName} &amp; {wedding.groomName}</h1>
        <p className="text-lg text-muted-foreground">{formatDate(wedding.weddingDate)}</p>
      </header>

      <p className="text-center text-lg">{wedding.greeting ?? "Namaste!"} Find your family to see your invitation.</p>

      <FindFamily slug={couple} />

      <p className="text-center text-muted-foreground">
        Don&apos;t know the number? Ask the person who sent you the card.
      </p>
        </>
      )}
    </main>
  );
}
