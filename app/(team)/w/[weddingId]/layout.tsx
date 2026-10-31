import { Suspense } from "react";
import { WeddingTopBar } from "@/components/layout/wedding-top-bar";
import { requireMember } from "@/lib/access/guards";

// The frame of every page under /w/<wedding id>/... The TEST label of a test wedding lives
// here, so a page that is added later shows it without extra work (AC-3.1).
//
// A layout does NOT protect its pages: it is not drawn again when a person moves between
// pages. It asks the guard only to decide what the bar shows. Every page and every action
// calls the guard itself, and a person without access sees "page not found" from the page.
export default function WeddingLayout({ children, params }: LayoutProps<"/w/[weddingId]">) {
  return (
    <>
      <Suspense fallback={<WeddingTopBar />}>
        <TopBar params={params} />
      </Suspense>
      {children}
    </>
  );
}

async function TopBar({ params }: { params: LayoutProps<"/w/[weddingId]">["params"] }) {
  const { weddingId } = await params;
  const access = await requireMember(weddingId);
  if (!access.ok) return null; // the page itself answers "not found" or "sign in"

  const { wedding } = access.member;
  return <WeddingTopBar title={`${wedding.brideName} & ${wedding.groomName}`} isTest={wedding.isTest} />;
}
