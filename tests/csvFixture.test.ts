// Proves docs/tracker/csv-fixture-3-blocks.csv (the manual Sheets-import test fixture, AT-P3
// #2) actually exercises the three seeded Weakness_Panel signals it claims to, using the same
// engine functions the tracker's formulas are built to match — rather than relying on the CSV
// file being eyeballed correct. Also checks it against the exact §8.1 column contract, so the
// fixture can never silently drift from what the app's own export produces.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CSV_COLUMNS } from "../src/engine/csvExport";
import { blockPeriods } from "../src/engine/blockPeriods";
import { loadTrendSeries, romTrend, sessionFrequencyStrip, swingSpeedTrend } from "../src/engine/progressViews";
import { frequencyDriftSignal, romStagnationSignal, stalledLiftSignal } from "../src/engine/weaknessSignals";
import type { MetricLog, MetricType, SessionLog, SessionTemplate, SetLog } from "../src/db/types";

const FIXTURE_PATH = join(__dirname, "../docs/tracker/csv-fixture-3-blocks.csv");
const lines = readFileSync(FIXTURE_PATH, "utf-8").trim().split(/\r?\n/);
const [header, ...dataLines] = lines;
const rows = dataLines.map((line) => line.split(","));

// Rebuilds the minimal SessionLog/SetLog/MetricLog/SessionTemplate fixtures the engine needs,
// straight from the flat CSV rows — block label and exercise name double as their own ids
// (the engine only cares about the relationships, not real seeded ids).
const sessionTemplates = new Map<string, SessionTemplate>();
const sessionLogs = new Map<string, SessionLog>();
const setLogs: SetLog[] = [];
const metricLogs: MetricLog[] = [];

for (const [date, block, sessionType, venue, exercise, setNo, reps, loadKg, rpe, metricType, metricValue, unit, device] of rows) {
  if (exercise) {
    const templateId = `${block}|${sessionType}`;
    if (!sessionTemplates.has(templateId)) {
      sessionTemplates.set(templateId, {
        id: templateId,
        blockId: block,
        venue: venue as "gym" | "home",
        type: sessionType as "G1" | "G2" | "H1",
        name: templateId,
        exercisePrescriptions: []
      });
    }
    const sessionId = `${date}|${templateId}`;
    if (!sessionLogs.has(sessionId)) {
      sessionLogs.set(sessionId, {
        id: sessionId,
        templateId,
        date,
        durationMin: null,
        completed: true,
        notes: "",
        originDevice: "ipad"
      });
    }
    setLogs.push({
      id: `${sessionId}|${exercise}|${setNo}`,
      sessionLogId: sessionId,
      exerciseId: exercise,
      setNo: Number(setNo),
      reps: Number(reps),
      loadKg: Number(loadKg),
      rpe: Number(rpe)
    });
  } else if (metricType) {
    metricLogs.push({
      id: `${date}|${metricType}`,
      date,
      type: metricType as MetricType,
      value: Number(metricValue),
      unit,
      device: device || undefined,
      sourceTag: "manual"
    });
  }
}

const allSessionLogs = [...sessionLogs.values()];
const allSessionTemplates = [...sessionTemplates.values()];
const periods = blockPeriods(allSessionLogs, allSessionTemplates);

describe("docs/tracker/csv-fixture-3-blocks.csv", () => {
  it("matches the §8.1 column contract exactly", () => {
    expect(header).toBe(CSV_COLUMNS.join(","));
  });

  it("seeds a stalled lift: Back squat is flat across the last completed block", () => {
    const series = loadTrendSeries("Back squat (barbell)", allSessionLogs, setLogs);
    expect(stalledLiftSignal(series, periods)).toBe(true);
  });

  it("does NOT flag Bench press, which keeps progressing (control case)", () => {
    const series = loadTrendSeries("Bench press (barbell)", allSessionLogs, setLogs);
    expect(stalledLiftSignal(series, periods)).toBe(false);
  });

  it("seeds ROM stagnation: hip switch grade is unchanged across the last two transitions", () => {
    const series = romTrend(metricLogs, "rom_hip");
    expect(romStagnationSignal(series, periods)).toBe(true);
  });

  it("seeds session-frequency drift: sparse logging averages under 2/week", () => {
    const frequency = sessionFrequencyStrip(allSessionLogs, 8, "2026-03-20T00:00:00.000Z");
    expect(frequencyDriftSignal(frequency)).toBe(true);
  });

  it("carries a swing-speed series for the Dashboard/Speed_and_ROM demo", () => {
    expect(swingSpeedTrend(metricLogs).length).toBeGreaterThan(0);
  });
});
