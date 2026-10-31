import { Suspense, cache } from "react";
import { WeddingNav } from "@/components/layout/wedding-nav";
import { WeddingTopBar } from "@/components/layout/wedding-top-bar";
import { requireMember } from "@/lib/access/guards";

// The frame of every page under /w/<wedding id>/...: the menu, and the top bar with the TEST label
// of a test wedding. A page that is added later gets all of it without extra work (AC-3.1).
//
// A layout does NOT protect its pages: it is not drawn again when a person moves between pages.
// It asks the guard only to decide what to show. Every page and every action calls the guard
// itself, and a person without access sees "page not found" from the page.
//
// The three parts below ask the same question. cache() answers it once for one page request.
const memberOf = cache((weddingId: string) => requireMember(weddingId));

type Params = LayoutProps<"/w/[weddingId]">["params"];

export default function WeddingLayout({ children, params }: LayoutProps<"/w/[weddingId]">) {
  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <Suspense fallback={null}>
        <SideMenu params={params} />
      </Suspense>
      {/* pb-20: room for the bottom bar on a phone */}
      <div className="flex min-w-0 flex-1 flex-col pb-20 md:pb-0">
        <Suspense fallback={<WeddingTopBar />}>
          <TopBar params={params} />
        </Suspense>
        {children}
      </div>
      <Suspense fallback={null}>
        <BottomMenu params={params} />
      </Suspense>
    </div>
  );
}

async function TopBar({ params }: { params: Params }) {
  const { weddingId } = await params;
  const access = await memberOf(weddingId);
  if (!access.ok) return null; // the page itself answers "not found" or "sign in"

  const { wedding } = access.member;
  return <WeddingTopBar title={`${wedding.brideName} & ${wedding.groomName}`} isTest={wedding.isTest} />;
}

async function SideMenu({ params }: { params: Params }) {
  const { weddingId } = await params;
  const access = await memberOf(weddingId);
  if (!access.ok) return null;
  return <WeddingNav variant="side" weddingId={access.member.wedding.id} isAdmin={access.member.role === "admin"} />;
}

async function BottomMenu({ params }: { params: Params }) {
  const { weddingId } = await params;
  const access = await memberOf(weddingId);
  if (!access.ok) return null;
  return <WeddingNav variant="bottom" weddingId={access.member.wedding.id} isAdmin={access.member.role === "admin"} />;
}
