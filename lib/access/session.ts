import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";

// The outer part of the sign-in guard: it reads the session cookie and finds the person.
// Better Auth checks the session row in the database on every call (no cookie cache),
// so a person who was removed is refused at the next click.
// A component that calls these functions must sit inside <Suspense> (Next.js reads
// cookies at request time). Never use "use cache" here (CLAUDE.md rule 13).

export async function getSessionUser() {
  const result = await auth.api.getSession({
    headers: await headers(),
    query: { disableCookieCache: true },
  });
  return result?.user ?? null;
}

// Pages: a person who is not signed in goes to the sign-in page.
export async function requireUser() {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");
  return user;
}
