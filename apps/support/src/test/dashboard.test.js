import { describe, expect, it } from "vitest";
import { dailyCsv, trendLabel } from "../lib/dashboard.js";

describe("trendLabel", () => {
  it("describes the change from the previous period", () => {
    expect(trendLabel(8, 5, 30)).toBe("+3 vs previous 30 days");
    expect(trendLabel(2, 5, 7)).toBe("-3 vs previous 7 days");
    expect(trendLabel(5, 5, 7)).toBe("No change vs previous 7 days");
    expect(trendLabel(0, 0, 7)).toBeNull();
  });
});

describe("dailyCsv", () => {
  it("writes one row per day", () => {
    expect(dailyCsv([{ day: "2026-11-01", created: 2, solved: 1 }])).toBe("date,created,solved\n2026-11-01,2,1\n");
  });
});
