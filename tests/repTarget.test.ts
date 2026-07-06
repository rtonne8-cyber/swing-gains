import { describe, expect, it } from "vitest";
import { parseRepTarget } from "../src/engine/repTarget";

describe("parseRepTarget", () => {
  it("parses a plain rep count", () => {
    expect(parseRepTarget("12")).toEqual({ min: 12, max: 12 });
  });

  it("parses a rep range", () => {
    expect(parseRepTarget("8-10")).toEqual({ min: 8, max: 10 });
  });

  it("parses a per-side/per-leg suffix as the plain count", () => {
    expect(parseRepTarget("12/leg")).toEqual({ min: 12, max: 12 });
    expect(parseRepTarget("10/side")).toEqual({ min: 10, max: 10 });
  });

  it("parses a ladder rung target with leading prose", () => {
    expect(parseRepTarget("rung target 15")).toEqual({ min: 15, max: 15 });
    expect(parseRepTarget("rung target 10-12")).toEqual({ min: 10, max: 12 });
  });

  it("rejects distance-based prescriptions", () => {
    expect(parseRepTarget("30 m")).toBeUndefined();
    expect(parseRepTarget("40 m/side")).toBeUndefined();
  });

  it("rejects time-based prescriptions", () => {
    expect(parseRepTarget("20 s")).toBeUndefined();
    expect(parseRepTarget("15 s/side")).toBeUndefined();
  });

  it("rejects qualitative ladder placeholders", () => {
    expect(parseRepTarget("current rung")).toBeUndefined();
    expect(parseRepTarget("per rung")).toBeUndefined();
    expect(parseRepTarget("top rung")).toBeUndefined();
    expect(parseRepTarget("full mobility sequence")).toBeUndefined();
  });
});
