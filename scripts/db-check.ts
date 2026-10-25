import "dotenv/config";
import { db } from "../lib/db";

async function main() {
  const rows = await db.$queryRaw<
    { database: string; version: string }[]
  >`select current_database() as database, version() as version`;
  console.log("Database OK");
  console.log(`  database: ${rows[0].database}`);
  console.log(`  server:   ${rows[0].version.split(",")[0]}`);
}

main()
  .catch((error) => {
    console.error("Database check failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
