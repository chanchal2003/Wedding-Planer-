// Next.js calls register() once when the server starts.
// Here it checks the database connection and prints the result.
export async function register() {
  // pg and Prisma need the Node.js runtime, not Edge.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  // Stops the server with a clear message if an environment variable is missing.
  await import("@/lib/env");
  console.log("✅ Environment variables are valid");

  const { db } = await import("@/lib/db");
  try {
    await db.$queryRaw`select 1`;
    console.log("✅ Connected to the database");
  } catch (error) {
    console.error(
      "❌ Could not connect to the database:",
      error instanceof Error ? error.message : error,
    );
  }
}
