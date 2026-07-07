// Pure display-logic helper for the Session runner's set-logging input (spec §3.4 LD-1
// follow-up, Library v1.0.1). Every ladder rung carries exactly one of repTarget/
// timeTargetSec (src/db/types.ts) — this derives what the set-input should be labelled and
// what target text to show alongside it, purely from the rung, so it's testable without a
// DOM/component-rendering harness (this project has no jsdom/@testing-library setup, and
// CLAUDE.md keeps UI thin — the actual decision logic belongs here, not in the component).
import type { LadderRung } from "../db/types";

export interface SetInputTarget {
  label: "Reps" | "Secs";
  targetText: string; // e.g. "target 40/side" or "target 12"
}

// Returns undefined for non-ladder exercises (gym lifts, or home exercises with no current
// rung) — callers fall back to the existing plain "Reps" placeholder with no target text,
// so loaded gym lifts are entirely untouched by this.
export function resolveSetInputTarget(rung: LadderRung | undefined): SetInputTarget | undefined {
  if (!rung) return undefined;
  const suffix = rung.perSide ? "/side" : "";
  if (rung.timeTargetSec !== undefined) {
    return { label: "Secs", targetText: `target ${rung.timeTargetSec}${suffix}` };
  }
  if (rung.repTarget !== undefined) {
    return { label: "Reps", targetText: `target ${rung.repTarget}${suffix}` };
  }
  return undefined;
}
