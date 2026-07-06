import { describe, expect, it } from "vitest";
import { loadTrendSeries, romTrend, sessionFrequencyStrip, swingSpeedTrend } from "../src/engine/progressViews";
import type { MetricLog, SessionLog, SetLog } from "../src/db/types";

function session(id: string, date: string, completed = true): SessionLog {
  return { id, templateId: "t", date, durationMin: 40, completed, notes: "", originDevice: "ipad" };
}

function set(id: string, sessionLogId: string, exerciseId: string, setNo: number, loadKg: number | null): SetLog {
  return { id, sessionLogId, exerciseId, setNo, reps: 8, loadKg, rpe: 7 };
}

describe("loadTrendSeries", () => {
  it("uses the last (highest setNo) set's load per session, in date order", () => {
    const sessions = [session("s1", "2026-01-01"), session("s2", "2026-01-08")];
    const sets = [
      set("a", "s1", "EX", 1, 40),
      set("b", "s1", "EX", 2, 42.5),
      set("c", "s2", "EX", 1, 45)
    ];
    expect(loadTrendSeries("EX", sessions, sets)).toEqual([
      { date: "2026-01-01", loadKg: 42.5 },
      { date: "2026-01-08", loadKg: 45 }
    ]);
  });

  it("ignores incomplete sessions", () => {
    const sessions = [session("s1", "2026-01-01", false)];
    const sets = [set("a", "s1", "EX", 1, 40)];
    expect(loadTrendSeries("EX", sessions, sets)).toEqual([]);
  });
});

describe("swingSpeedTrend / romTrend", () => {
  const metrics: MetricLog[] = [
    { id: "m1", date: "2026-01-05", type: "swing_speed", value: 95, unit: "mph", sourceTag: "manual" },
    { id: "m2", date: "2026-01-01", type: "swing_speed", value: 93, unit: "mph", sourceTag: "manual" },
    { id: "m3", date: "2026-01-01", type: "rom_hip", value: 1, unit: "grade", side: "L", sourceTag: "manual" }
  ];

  it("sorts swing speed ascending by date", () => {
    expect(swingSpeedTrend(metrics)).toEqual([
      { date: "2026-01-01", value: 93, unit: "mph", side: undefined, device: undefined },
      { date: "2026-01-05", value: 95, unit: "mph", side: undefined, device: undefined }
    ]);
  });

  it("filters ROM series by type", () => {
    expect(romTrend(metrics, "rom_hip")).toEqual([
      { date: "2026-01-01", value: 1, unit: "grade", side: "L", device: undefined }
    ]);
    expect(romTrend(metrics, "rom_reach")).toEqual([]);
  });
});

describe("sessionFrequencyStrip", () => {
  it("buckets completed sessions into weekly counts, oldest first", () => {
    const now = "2026-01-15T00:00:00.000Z";
    const sessions = [session("s1", "2026-01-01T00:00:00.000Z"), session("s2", "2026-01-10T00:00:00.000Z")];
    const strip = sessionFrequencyStrip(sessions, 2, now);
    expect(strip).toHaveLength(2);
    expect(strip[0].count).toBe(1); // week of 2026-01-01
    expect(strip[1].count).toBe(1); // week of 2026-01-08
  });
});
