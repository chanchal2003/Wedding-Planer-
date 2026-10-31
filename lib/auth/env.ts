import { z } from "zod";

// Variables for sign-in. They are checked here (not in lib/env.ts), so tests that only
// need the database do not need the Google keys. Only names and reasons are printed,
// never the values.
const schema = z.object({
  GOOGLE_CLIENT_ID: z.string({ error: "is missing" }).min(1, "is empty"),
  GOOGLE_CLIENT_SECRET: z.string({ error: "is missing" }).min(1, "is empty"),
  BETTER_AUTH_SECRET: z
    .string({ error: "is missing" })
    .min(32, "must be at least 32 characters (make one with: openssl rand -base64 32)"),
  BETTER_AUTH_URL: z.url({ error: "is missing or is not a web address" }),
});

const result = schema.safeParse(process.env);

if (!result.success) {
  const problems = result.error.issues
    .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  throw new Error(
    `Invalid sign-in environment variables:\n${problems}\nCheck your .env file (see .env.example).`,
  );
}

export const authEnv = result.data;
