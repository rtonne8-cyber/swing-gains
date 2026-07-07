// AT-P3 #2 (Weakness_Panel): a synthetic 3-block fixture seeding a stalled lift, ROM
// stagnation, and session-frequency drift, each independently confirmed flagged/not-flagged.
import { describe, expect, it } from "vitest";
import { blockPeriods } from "../src/engine/blockPeriods";
import {
  frequencyDriftSignal,
  romStagnationSignal,
  speedPlateauSignal,
  stalledLiftSignal
} from "../src/engine/weaknessSignals";
import type { LoadTrendPoint, MetricPoint } from "../src/engine/progressViews";
import type { SessionLog, SessionTemplate } from "../src/db/types";

function template(id: string, blockId: string): SessionTemplate {
  return { id, blockId, venue: "gym", type: "G1", name: id, exercisePrescriptions: [] };
}

function session(id: string, templateId: string, date: string): SessionLog {
  return { id, templateId, date, durationMin: 40, completed: true, notes: "", originDevice: "ipad" };
}

// Block 1: rising load (stable progress). Block 2: flat load (the seeded stall). Block 3:
// a single session in progress — the "current" period, excluded from completed-period checks.
const TEMPLATES = [template("t1", "b1"), template("t2", "b2"), template("t3", "b3")];
const SESSIONS = [
  session("s1", "t1", "2026-01-01"),
  session("s2", "t1", "2026-01-08"),
  session("s3", "t1", "2026-01-15"),
  session("s4", "t2", "2026-02-01"),
  session("s5", "t2", "2026-02-08"),
  session("s6", "t3", "2026-03-01")
];
const PERIODS = blockPeriods(SESSIONS, TEMPLATES);

describe("blockPeriods", () => {
  it("groups contiguous same-block sessions into ordered periods", () => {
    expect(PERIODS).toEqual([
      { blockId: "b1", startDate: "2026-01-01", endDate: "2026-01-15" },
      { blockId: "b2", startDate: "2026-02-01", endDate: "2026-02-08" },
      { blockId: "b3", startDate: "2026-03-01", endDate: "2026-03-01" }
    ]);
  });

  it("ignores incomplete sessions", () => {
    const withIncomplete = [...SESSIONS, { ...session("s7", "t3", "2026-03-08"), completed: false }];
    expect(blockPeriods(withIncomplete, TEMPLATES)).toEqual(PERIODS);
  });
});

describe("stalledLiftSignal", () => {
  it("flags the seeded stall: block 2's load never exceeds its first reading", () => {
    const loadSeries: LoadTrendPoint[] = [
      { date: "2026-01-01", loadKg: 30 },
      { date: "2026-01-08", loadKg: 35 },
      { date: "2026-01-15", loadKg: 40 },
      { date: "2026-02-01", loadKg: 40 },
      { date: "2026-02-08", loadKg: 40 }
    ];
    // Last completed period is block 2 (block 3 is current/in-progress) — flat at 40kg.
    expect(stalledLiftSignal(loadSeries, PERIODS)).toBe(true);
  });

  it("does not flag a lift that's still increasing in its last completed block", () => {
    const risingOnly = blockPeriods(SESSIONS.slice(0, 4), TEMPLATES); // only block 1 completed, block 2 in progress
    const loadSeries: LoadTrendPoint[] = [
      { date: "2026-01-01", loadKg: 30 },
      { date: "2026-01-08", loadKg: 35 },
      { date: "2026-01-15", loadKg: 40 }
    ];
    expect(stalledLiftSignal(loadSeries, risingOnly)).toBe(false);
  });

  it("treats fewer than 2 points in the period as insufficient signal, not a stall", () => {
    expect(stalledLiftSignal([{ date: "2026-02-01", loadKg: 40 }], PERIODS)).toBe(false);
  });
});

describe("romStagnationSignal", () => {
  it("flags the seeded stagnation: same grade at the end of the last two completed blocks", () => {
    const romSeries: MetricPoint[] = [
      { date: "2026-01-15", value: 1, unit: "grade" },
      { date: "2026-02-08", value: 1, unit: "grade" }
    ];
    expect(romStagnationSignal(romSeries, PERIODS)).toBe(true);
  });

  it("does not flag a grade that improved between the same two transitions", () => {
    const romSeries: MetricPoint[] = [
      { date: "2026-01-15", value: 1, unit: "grade" },
      { date: "2026-02-08", value: 2, unit: "grade" }
    ];
    expect(romStagnationSignal(romSeries, PERIODS)).toBe(false);
  });

  it("needs at least two completed periods", () => {
    const onePeriod = blockPeriods(SESSIONS.slice(0, 3), TEMPLATES);
    expect(romStagnationSignal([{ date: "2026-01-15", value: 1, unit: "grade" }], onePeriod)).toBe(false);
  });
});

describe("speedPlateauSignal", () => {
  it("flags load rising while swing speed is flat/down in the last completed block", () => {
    const loadSeries: LoadTrendPoint[] = [
      { date: "2026-02-01", loadKg: 40 },
      { date: "2026-02-08", loadKg: 45 }
    ];
    const speedSeries: MetricPoint[] = [
      { date: "2026-02-01", value: 95, unit: "mph" },
      { date: "2026-02-08", value: 94, unit: "mph" }
    ];
    expect(speedPlateauSignal(speedSeries, loadSeries, PERIODS)).toBe(true);
  });

  it("does not flag when speed rose alongside load", () => {
    const loadSeries: LoadTrendPoint[] = [
      { date: "2026-02-01", loadKg: 40 },
      { date: "2026-02-08", loadKg: 45 }
    ];
    const speedSeries: MetricPoint[] = [
      { date: "2026-02-01", value: 95, unit: "mph" },
      { date: "2026-02-08", value: 97, unit: "mph" }
    ];
    expect(speedPlateauSignal(speedSeries, loadSeries, PERIODS)).toBe(false);
  });
});

describe("frequencyDriftSignal", () => {
  it("flags the seeded drift: rolling average below 2/week", () => {
    expect(frequencyDriftSignal([{ weekStartISO: "w1", count: 1 }, { weekStartISO: "w2", count: 0 }, { weekStartISO: "w3", count: 1 }, { weekStartISO: "w4", count: 0 }])).toBe(true);
  });

  it("does not flag a healthy rolling average", () => {
    expect(frequencyDriftSignal([{ weekStartISO: "w1", count: 3 }, { weekStartISO: "w2", count: 2 }])).toBe(false);
  });

  it("does not flag a brand-new install with zero sessions ever logged", () => {
    expect(frequencyDriftSignal([{ weekStartISO: "w1", count: 0 }, { weekStartISO: "w2", count: 0 }])).toBe(false);
  });
});
