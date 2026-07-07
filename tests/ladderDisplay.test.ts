import { describe, expect, it } from "vitest";
import { resolveSetInputTarget } from "../src/engine/ladderDisplay";
import type { LadderRung } from "../src/db/types";

describe("resolveSetInputTarget", () => {
  it("renders a Secs label and target text for a time-targeted rung", () => {
    const rung: LadderRung = { name: "Full, 40 s", videoUrl: null, timeTargetSec: 40, perSide: true };
    expect(resolveSetInputTarget(rung)).toEqual({ label: "Secs", targetText: "target 40/side" });
  });

  it("renders a Reps label and target text for a rep-targeted rung", () => {
    const rung: LadderRung = { name: "Bodyweight squat", videoUrl: null, repTarget: 15, perSide: false };
    expect(resolveSetInputTarget(rung)).toEqual({ label: "Reps", targetText: "target 15" });
  });

  it("omits the /side suffix when the rung is not per-side", () => {
    const rung: LadderRung = { name: "Jump squat", videoUrl: null, repTarget: 6, perSide: false };
    expect(resolveSetInputTarget(rung)?.targetText).toBe("target 6");
  });

  it("includes the /side suffix when the rung is per-side", () => {
    const rung: LadderRung = { name: "Split squat", videoUrl: null, repTarget: 10, perSide: true };
    expect(resolveSetInputTarget(rung)?.targetText).toBe("target 10/side");
  });

  it("returns undefined for a non-ladder exercise (no current rung) so gym/loaded lifts are untouched", () => {
    expect(resolveSetInputTarget(undefined)).toBeUndefined();
  });
});
