import { describe, expect, it } from "vitest";

import { srtTstamp, tim, Timerange, trange, SEC } from "../src/time.js";

describe("time utils", () => {
  it("parses h/m/s expressions", () => {
    expect(tim("1.5s")).toBe(1_500_000);
    expect(tim("1m30s")).toBe(90 * SEC);
    expect(tim("-2s")).toBe(-2 * SEC);
  });

  it("creates timerange from helper", () => {
    const value = trange("2s", "0.5s");
    expect(value.start).toBe(2 * SEC);
    expect(value.duration).toBe(500_000);
    expect(value.end).toBe(2_500_000);
  });

  it("checks overlap", () => {
    const a = new Timerange(0, 1_000_000);
    const b = new Timerange(900_000, 200_000);
    const c = new Timerange(1_000_000, 500_000);
    expect(a.overlaps(b)).toBe(true);
    expect(a.overlaps(c)).toBe(false);
  });

  it("parses srt timestamp", () => {
    expect(srtTstamp("00:01:02,345")).toBe(62_345_000);
  });
});
