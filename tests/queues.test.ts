// AT-P1 #2: Dual queues: completing G1 advances gym queue to G2 and vice versa; home queue
// independent.
import { describe, expect, it } from "vitest";
import { computeNextUp, nextGymTemplateId, nextHomeTemplateId, weeksElapsed } from "../src/engine/queues";
import type { SessionLog, SessionTemplate } from "../src/db/types";

const g1: SessionTemplate = {
  id: "b1-g1",
  blockId: "b1",
  venue: "gym",
  type: "G1",
  name: "Gym 1",
  exercisePrescriptions: []
};
const g2: SessionTemplate = { ...g1, id: "b1-g2", type: "G2", name: "Gym 2" };
const h1: SessionTemplate = {
  id: "b1-h1",
  blockId: "b1",
  venue: "home",
  type: "H1",
  name: "Home",
  exercisePrescriptions: []
};

const blockTemplates = [g1, g2, h1];

function log(templateId: string, date: string, completed = true): SessionLog {
  return {
    id: `log-${templateId}-${date}`,
    templateId,
    date,
    durationMin: 45,
    completed,
    notes: "",
    originDevice: "ipad"
  };
}

describe("AT-P1-2: dual venue queues", () => {
  it("with no logs, offers G1 and H1 first", () => {
    const state = computeNextUp(blockTemplates, [], "2026-07-01T00:00:00Z", "2026-07-01T00:00:00Z");
    expect(state.nextGymTemplateId).toBe("b1-g1");
    expect(state.nextHomeTemplateId).toBe("b1-h1");
  });

  it("completing G1 advances the gym queue to G2", () => {
    const logs = [log("b1-g1", "2026-07-01")];
    expect(nextGymTemplateId([g1, g2], logs)).toBe("b1-g2");
  });

  it("completing G1 then G2 returns the gym queue to G1", () => {
    const logs = [log("b1-g1", "2026-07-01"), log("b1-g2", "2026-07-03")];
    expect(nextGymTemplateId([g1, g2], logs)).toBe("b1-g1");
  });

  it("uses the most recent completed gym log regardless of insertion order", () => {
    const logs = [log("b1-g2", "2026-07-03"), log("b1-g1", "2026-07-01")];
    expect(nextGymTemplateId([g1, g2], logs)).toBe("b1-g2");
  });

  it("home queue is independent of gym queue advancement", () => {
    const logs = [log("b1-g1", "2026-07-01"), log("b1-h1", "2026-07-02"), log("b1-g1", "2026-07-04")];
    const state = computeNextUp(blockTemplates, logs, "2026-07-01T00:00:00Z", "2026-07-05T00:00:00Z");
    expect(state.nextGymTemplateId).toBe("b1-g2");
    expect(state.nextHomeTemplateId).toBe("b1-h1");
    expect(state.homeSessionsCompleted).toBe(1);
    expect(state.gymSessionsCompleted).toBe(2);
  });

  it("ignores incomplete session logs when advancing the queue", () => {
    const logs = [log("b1-g1", "2026-07-01", false)];
    const state = computeNextUp(blockTemplates, logs, "2026-07-01T00:00:00Z", "2026-07-01T00:00:00Z");
    expect(state.nextGymTemplateId).toBe("b1-g1");
    expect(state.gymSessionsCompleted).toBe(0);
  });

  it("nextHomeTemplateId returns the sole home template", () => {
    expect(nextHomeTemplateId([h1])).toBe("b1-h1");
  });

  it("throws if a block is missing a G1 or G2 template", () => {
    expect(() => nextGymTemplateId([g1], [])).toThrow();
  });

  it("computes weeks elapsed from block start date", () => {
    expect(weeksElapsed("2026-07-01T00:00:00Z", "2026-07-01T00:00:00Z")).toBe(0);
    expect(weeksElapsed("2026-07-01T00:00:00Z", "2026-07-15T00:00:00Z")).toBe(2);
  });
});
