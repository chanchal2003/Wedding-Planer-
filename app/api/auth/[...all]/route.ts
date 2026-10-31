import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth/auth";

// Better Auth answers every address under /api/auth (Google sign-in and sign-out).
export const { GET, POST } = toNextJsHandler(auth);
