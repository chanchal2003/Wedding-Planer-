import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/lib/db";
import { authEnv } from "@/lib/auth/env";
import { linkPendingInvitations } from "@/lib/auth/link-invitations";

// Sign-in with Google for the team. Guests never sign in.
export const auth = betterAuth({
  baseURL: authEnv.BETTER_AUTH_URL,
  secret: authEnv.BETTER_AUTH_SECRET,
  database: prismaAdapter(db, { provider: "postgresql" }),
  // Same random ids (UUID) as the other tables.
  advanced: { database: { generateId: "uuid" } },
  // The session cookie cache stays off (the default). Every request checks the session
  // row in the database, so a removed person is refused at the next click.
  socialProviders: {
    google: {
      clientId: authEnv.GOOGLE_CLIENT_ID,
      clientSecret: authEnv.GOOGLE_CLIENT_SECRET,
      prompt: "select_account",
    },
  },
  databaseHooks: {
    user: {
      create: {
        // First sign-in of a person: connect the invitations that wait for this email.
        // "My weddings" also does this at every visit (API design, Section 4).
        after: async (user) => {
          await linkPendingInvitations(user);
        },
      },
    },
  },
  plugins: [nextCookies()], // must be the last plugin
});
