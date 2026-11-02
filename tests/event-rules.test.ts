import { describe, expect, it } from "vitest";
import { eventClash, type EventKey } from "@/lib/events/rules";
import { eventHeaders } from "@/lib/import/columns";

// One event of a name for each side (decided 2026-11-02). "Both sides" overlaps with the other two.
const haldi = (hostedBy: EventKey["hostedBy"], id = "x"): EventKey => ({ id, name: "Haldi", hostedBy });

describe("one event of a name for each side", () => {
  it("allows the first Haldi, and a Haldi for each side", () => {
    expect(eventClash({ name: "Haldi", hostedBy: "bride" }, [])).toBeNull();
    expect(eventClash({ name: "Haldi", hostedBy: "groom" }, [haldi("bride")])).toBeNull();
    expect(eventClash({ name: "Haldi", hostedBy: "bride" }, [haldi("groom")])).toBeNull();
  });

  it("refuses a second Haldi for the same side", () => {
    expect(eventClash({ name: "Haldi", hostedBy: "bride" }, [haldi("bride")])).toBe("There is already a Haldi for the bride's side. A second one is not allowed.");
    expect(eventClash({ name: "Haldi", hostedBy: "groom" }, [haldi("groom")])).toContain("groom's side");
    expect(eventClash({ name: "Haldi", hostedBy: "both" }, [haldi("both")])).toBe("There is already a Haldi for both sides. A second one is not allowed.");
  });

  it("lets 'both sides' block the two sides, and the two sides block 'both sides'", () => {
    expect(eventClash({ name: "Haldi", hostedBy: "bride" }, [haldi("both")])).toBe("There is already a Haldi for both sides, so you cannot add one for the bride's side.");
    expect(eventClash({ name: "Haldi", hostedBy: "groom" }, [haldi("both")])).not.toBeNull();
    expect(eventClash({ name: "Haldi", hostedBy: "both" }, [haldi("bride")])).not.toBeNull();
    expect(eventClash({ name: "Haldi", hostedBy: "both" }, [haldi("groom")])).not.toBeNull();
  });

  it("ignores capital letters and extra spaces in the name", () => {
    expect(eventClash({ name: "  HALDI ", hostedBy: "bride" }, [haldi("bride")])).not.toBeNull();
    expect(eventClash({ name: "Mehendi  night", hostedBy: "bride" }, [{ id: "y", name: "mehendi night", hostedBy: "bride" }])).not.toBeNull();
  });

  it("allows a different name on the same side", () => {
    expect(eventClash({ name: "Sangeet", hostedBy: "bride" }, [haldi("bride")])).toBeNull();
  });

  it("does not count the event that is being changed", () => {
    expect(eventClash({ id: "x", name: "Haldi", hostedBy: "bride" }, [haldi("bride", "x")])).toBeNull();
    expect(eventClash({ id: "x", name: "Haldi", hostedBy: "bride" }, [haldi("bride", "x"), haldi("groom", "z")])).toBeNull();
    // changing the Haldi of the bride's side to the groom's side, when the groom's side has one already
    expect(eventClash({ id: "x", name: "Haldi", hostedBy: "groom" }, [haldi("bride", "x"), haldi("groom", "z")])).not.toBeNull();
  });
});

describe("import column titles for events with the same name", () => {
  const day = (n: number) => new Date(`2027-01-${12 + n}T04:30:00Z`);

  it("keeps the plain name when it is the only one", () => {
    expect(eventHeaders([{ id: "a", name: "Haldi", startsAt: day(0), hostedBy: "bride" }, { id: "b", name: "Sangeet", startsAt: day(1), hostedBy: "bride" }])).toEqual(["Haldi", "Sangeet"]);
  });

  it("adds the side when two events have the same name, also on the same day", () => {
    const headers = eventHeaders([
      { id: "a", name: "Haldi", startsAt: day(0), hostedBy: "bride" },
      { id: "b", name: "Haldi", startsAt: day(0), hostedBy: "groom" },
    ]);
    expect(headers).toEqual(["Haldi (Bride's side)", "Haldi (Groom's side)"]);
  });

  it("adds the date too when an old duplicate has the same name and the same side", () => {
    const headers = eventHeaders([
      { id: "a", name: "Haldi", startsAt: day(0), hostedBy: "bride" },
      { id: "b", name: "Haldi", startsAt: day(1), hostedBy: "bride" },
    ]);
    expect(headers).toEqual(["Haldi (Bride's side, 12 Jan)", "Haldi (Bride's side, 13 Jan)"]);
  });

  it("uses the date alone when the side is not known", () => {
    expect(eventHeaders([{ id: "a", name: "Haldi", startsAt: day(0) }, { id: "b", name: "Haldi", startsAt: day(1) }])).toEqual(["Haldi (12 Jan)", "Haldi (13 Jan)"]);
  });
});
