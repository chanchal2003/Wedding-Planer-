import { notFound, redirect } from "next/navigation";
import { fail } from "@/lib/result";
import type { Access, Allowed, Denied } from "@/lib/access/checks";

// What a "no" from a guard looks like.

// Pages: not signed in goes to the sign-in page. Everything else shows "page not found",
// so a person cannot find out whether a wedding exists (see the not-found page text).
export function forPage<T>(access: Access<T>): Allowed<T> {
  if (access.ok) return access;
  if (access.code === "NOT_SIGNED_IN") redirect("/sign-in");
  notFound();
}

// Server Actions: an action never throws to the browser. It returns this error.
export function denied(access: Denied) {
  return access.code === "NOT_SIGNED_IN"
    ? fail("NOT_SIGNED_IN", "Please sign in again.")
    : fail("NO_ACCESS", "You do not have access to this.");
}
