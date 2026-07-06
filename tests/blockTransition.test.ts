// AT-P2 BT-1..BT-4: block transition rule (spec §3.3) and the non-blocking pace guardrail
// (spec §3.1).
import { describe, expect, it } from "vitest";
import { evaluateBlockTransition } from "../src/engine/blockTransition";
import type { NextUpState } from "../src/engine/queues";
import type { TransitionRules } from "../src/db/types";

const RULES: TransitionRules = { minSessions: 15, maxWeeks: 8, minWeeks: 4, minGymSessions: 8, minHomeSessions: 4 };

function nextUp(overrides: Partial<NextUpState>): NextUpState {
  return {
    nextGymTemplateId: "g",
    nextHomeTemplateId: "h",
    gymSessionsCompleted: 0,
    homeSessionsCompleted: 0,
    totalSessionsCompleted: 0,
    weeksElapsed: 0,
    ...overrides
  };
}

describe("AT-P2 BT-1: 15 sessions triggers transition once minWeeks has passed", () => {
  it("fires at 15 sessions and 4+ weeks", () => {
    const status = evaluateBlockTransition(nextUp({ totalSessionsCompleted: 15, weeksElapsed: 5 }), RULES);
    expect(status.shouldTransition).toBe(true);
    expect(status.reason).toBe("session-count");
  });
});

describe("AT-P2 BT-2: 8 weeks triggers transition regardless of session count", () => {
  it("fires at 8 weeks even with few sessions logged", () => {
    const status = evaluateBlockTransition(nextUp({ totalSessionsCompleted: 6, weeksElapsed: 8 }), RULES);
    expect(status.shouldTransition).toBe(true);
    expect(status.reason).toBe("max-weeks");
  });
});

describe("AT-P2 BT-3: never before minWeeks", () => {
  it("does not transition before 4 weeks even with 15+ sessions logged (cramming guard)", () => {
    const status = evaluateBlockTransition(nextUp({ totalSessionsCompleted: 20, weeksElapsed: 3 }), RULES);
    expect(status.shouldTransition).toBe(false);
    expect(status.reason).toBeNull();
  });

  it("does not transition just short of minWeeks even at maxWeeks-eligible session counts", () => {
    const status = evaluateBlockTransition(nextUp({ totalSessionsCompleted: 0, weeksElapsed: 3 }), RULES);
    expect(status.shouldTransition).toBe(false);
  });
});

describe("AT-P2 BT-4: guardrail warning, non-blocking", () => {
  it("flags gym/home sessions behind pace without blocking transition", () => {
    // At week 8 (=maxWeeks), full pace would be 8 gym / 4 home; only 3 gym / 1 home logged.
    const status = evaluateBlockTransition(
      nextUp({ totalSessionsCompleted: 4, weeksElapsed: 8, gymSessionsCompleted: 3, homeSessionsCompleted: 1 }),
      RULES
    );
    expect(status.shouldTransition).toBe(true); // maxWeeks reached — guardrail never blocks
    expect(status.reason).toBe("max-weeks");
    expect(status.gymSessionsBehindPace).toBe(5);
    expect(status.homeSessionsBehindPace).toBe(3);
  });

  it("reports zero deficit when on or ahead of pace", () => {
    const status = evaluateBlockTransition(
      nextUp({ totalSessionsCompleted: 2, weeksElapsed: 2, gymSessionsCompleted: 10, homeSessionsCompleted: 10 }),
      RULES
    );
    expect(status.gymSessionsBehindPace).toBe(0);
    expect(status.homeSessionsBehindPace).toBe(0);
  });
});
