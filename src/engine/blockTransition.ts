// Block transition rule (spec §3.3, AT-P2 BT-1..BT-4). Pure function over the same derived
// NextUpState queues.ts already computes, plus the block's TransitionRules — no Dexie access.
import type { NextUpState } from "./queues";
import type { TransitionRules } from "../db/types";

export type TransitionReason = "session-count" | "max-weeks";

export interface BlockTransitionStatus {
  shouldTransition: boolean;
  reason: TransitionReason | null;
  // Non-blocking pace guardrail (spec §3.1): "N sessions behind pace" for each venue,
  // measured against a straight-line pace toward the rules' minimums across the max-weeks
  // window (the fastest a block can legitimately run is minWeeks, but minGymSessions/
  // minHomeSessions are only *required* by minSessions-at-maxWeeks, so maxWeeks is the pace
  // denominator). Deficits are clamped at 0 (never negative/ahead-of-pace noise) and never
  // block transition — surfaced for display only.
  gymSessionsBehindPace: number;
  homeSessionsBehindPace: number;
}

export function evaluateBlockTransition(nextUp: NextUpState, rules: TransitionRules): BlockTransitionStatus {
  const { weeksElapsed, totalSessionsCompleted, gymSessionsCompleted, homeSessionsCompleted } = nextUp;

  let shouldTransition = false;
  let reason: TransitionReason | null = null;

  if (weeksElapsed >= rules.minWeeks) {
    if (totalSessionsCompleted >= rules.minSessions) {
      shouldTransition = true;
      reason = "session-count";
    } else if (weeksElapsed >= rules.maxWeeks) {
      shouldTransition = true;
      reason = "max-weeks";
    }
  }

  // Denominator is maxWeeks (the full window), not minWeeks — deliberately the more lenient
  // reading, so the warning doesn't fire prematurely for someone who is, say, gym-heavy
  // early in a block and plans to catch up on home sessions later. This means the guardrail
  // can under-warn in a pure cramming scenario (e.g. 15 sessions in exactly 4 weeks, mostly
  // one venue) — that's acceptable because BT-3's minWeeks floor already hard-blocks
  // transition before 4 weeks regardless of split, and spec §3.1 explicitly makes this
  // guardrail non-blocking/advisory, not a second completion gate.
  const expectedGym = (rules.minGymSessions / rules.maxWeeks) * weeksElapsed;
  const expectedHome = (rules.minHomeSessions / rules.maxWeeks) * weeksElapsed;

  return {
    shouldTransition,
    reason,
    gymSessionsBehindPace: Math.max(0, Math.floor(expectedGym - gymSessionsCompleted)),
    homeSessionsBehindPace: Math.max(0, Math.floor(expectedHome - homeSessionsCompleted))
  };
}
