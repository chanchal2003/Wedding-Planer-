import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/access/session";

// "/" has no content. A signed-in person goes to My weddings; everyone else to sign-in.
export default function Home() {
  return (
    <Suspense fallback={null}>
      <GoToStart />
    </Suspense>
  );
}

async function GoToStart(): Promise<null> {
  const user = await getSessionUser();
  redirect(user ? "/weddings" : "/sign-in");
}
