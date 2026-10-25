import { z } from "zod";

// All environment variables the app needs, checked once when the server starts.
// If one is missing or wrong, the app stops with a message that names it.
// Add new variables here when a step needs them (R2, Google sign-in, ...).
const schema = z.object({
  DATABASE_URL: z
    .string({ error: "is missing" })
    .regex(/^postgres(ql)?:\/\//, "is missing or must start with postgresql://"),
});

const result = schema.safeParse(process.env);

if (!result.success) {
  // Only variable names and reasons are printed, never the values.
  const problems = result.error.issues
    .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  throw new Error(
    `Invalid environment variables:\n${problems}\nCheck your .env file (see .env.example).`,
  );
}

export const env = result.data;
