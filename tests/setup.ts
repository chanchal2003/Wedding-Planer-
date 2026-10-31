import { config } from "dotenv";

// Tests use their own database (shadidesk_test), never shadidesk_local.
// .env.test is loaded with override, so a DATABASE_URL from .env cannot win.
config({ path: ".env.test", override: true });

const url = process.env.DATABASE_URL ?? "";
const databaseName = url.split("/").pop()?.split("?")[0];

if (databaseName !== "shadidesk_test") {
  throw new Error(
    `Tests must run on the database "shadidesk_test", but DATABASE_URL points to "${databaseName}". Check .env.test.`,
  );
}
