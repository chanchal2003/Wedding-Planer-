import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { resetDatabase } from "./helpers";

describe("test database", () => {
  // Start from an empty database, so a test that ran before and left rows cannot make this one fail.
  beforeAll(resetDatabase);
  afterAll(() => db.$disconnect());

  it("is shadidesk_test, not the local development database", async () => {
    const rows = await db.$queryRaw<{ name: string }[]>`select current_database() as name`;
    expect(rows[0].name).toBe("shadidesk_test");
  });

  it("has the migrations applied and no rows", async () => {
    expect(await db.user.count()).toBe(0);
    expect(await db.wedding.count()).toBe(0);
  });
});
