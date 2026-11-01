import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { getRsvpLanding } from "@/lib/rsvp/queries";
import { addMember, makeFamily, makeUser, makeWedding, resetDatabase } from "./helpers";

// FR-38, NFR-9: the guest page and the WhatsApp preview show only public data.
describe("getRsvpLanding", () => {
  beforeEach(resetDatabase);
  afterAll(async () => {
    await resetDatabase();
    await db.$disconnect();
  });

  it("returns nothing for an unknown link name", async () => {
    expect(await getRsvpLanding("nobody")).toBeNull();
  });

  it("returns only the public fields, never ids, emails or families", async () => {
    const priya = await makeUser("Priya");
    const wedding = await makeWedding("priya-rahul", priya.id);
    await addMember(wedding.id, priya, { role: "admin", relation: "bride" });
    await makeFamily(wedding.id, "Sharma family");

    const landing = await getRsvpLanding("priya-rahul");

    expect(landing).not.toBeNull();
    expect(Object.keys(landing!).sort()).toEqual(
      ["bannerVersion", "brideName", "greeting", "groomName", "isTest", "rsvpLastDate", "themeColor", "weddingDate"],
    );
    expect(JSON.stringify(landing)).not.toMatch(/Sharma|example\.com/);
  });
});
