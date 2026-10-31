import { afterAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";

describe("test database", () => {
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
