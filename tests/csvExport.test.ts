// AT-P3 #1: CSV export matches the §8.1 column contract exactly (header snapshot); row count
// = setLogs + metricLogs.
import { describe, expect, it } from "vitest";
import { buildCsvRows, csvRowsToString, type CsvExportInput } from "../src/engine/csvExport";
import type { Block, Exercise, MetricLog, SessionLog, SessionTemplate, SetLog, TransitionRules } from "../src/db/types";

const RULES: TransitionRules = { minSessions: 15, maxWeeks: 8, minWeeks: 4, minGymSessions: 8, minHomeSessions: 4 };
const BLOCK: Block = { id: "b1", sequence: 1, name: "Foundation", emphasis: "", sessionTemplateIds: [], transitionRules: RULES };
const TEMPLATE: SessionTemplate = {
  id: "t1",
  blockId: "b1",
  venue: "gym",
  type: "G1",
  name: "Gym 1",
  exercisePrescriptions: []
};
const EXERCISE: Exercise = {
  id: "ex1",
  name: "Back squat",
  pattern: "Squat",
  venue: "gym",
  cues: "",
  description: "d",
  videoUrl: null,
  loadRegion: "lower"
};
const SESSION: SessionLog = {
  id: "s1",
  templateId: "t1",
  date: "2026-01-05T10:00:00.000Z",
  durationMin: 40,
  completed: true,
  notes: "",
  originDevice: "ipad"
};

function baseInput(overrides: Partial<CsvExportInput> = {}): CsvExportInput {
  return {
    sessionLogs: [SESSION],
    setLogs: [],
    metricLogs: [],
    sessionTemplates: [TEMPLATE],
    blocks: [BLOCK],
    exercises: [EXERCISE],
    ...overrides
  };
}

describe("buildCsvRows / csvRowsToString", () => {
  it("emits the exact §8.1 header, in order", () => {
    const csv = csvRowsToString(buildCsvRows(baseInput()));
    const header = csv.split("\r\n")[0];
    expect(header).toBe("date,block,sessionType,venue,exercise,setNo,reps,loadKg,rpe,metricType,metricValue,unit,device");
  });

  it("row count equals setLogs + metricLogs", () => {
    const setLogs: SetLog[] = [
      { id: "sl1", sessionLogId: "s1", exerciseId: "ex1", setNo: 1, reps: 10, loadKg: 40, rpe: 7 },
      { id: "sl2", sessionLogId: "s1", exerciseId: "ex1", setNo: 2, reps: 9, loadKg: 40, rpe: 8 }
    ];
    const metricLogs: MetricLog[] = [
      { id: "m1", date: "2026-01-05T09:00:00.000Z", type: "swing_speed", value: 95, unit: "mph", sourceTag: "manual" }
    ];
    const rows = buildCsvRows(baseInput({ setLogs, metricLogs }));
    expect(rows).toHaveLength(setLogs.length + metricLogs.length);
  });

  it("resolves block/sessionType/venue/exercise for a set-log row", () => {
    const setLogs: SetLog[] = [{ id: "sl1", sessionLogId: "s1", exerciseId: "ex1", setNo: 1, reps: 10, loadKg: 40, rpe: 7 }];
    const rows = buildCsvRows(baseInput({ setLogs }));
    expect(rows[0]).toMatchObject({
      date: SESSION.date,
      block: "Block 1: Foundation",
      sessionType: "G1",
      venue: "gym",
      exercise: "Back squat",
      setNo: 1,
      reps: 10,
      loadKg: 40,
      rpe: 7,
      metricType: "",
      metricValue: "",
      unit: "",
      device: ""
    });
  });

  it("leaves set-log columns blank on a metric-log row", () => {
    const metricLogs: MetricLog[] = [
      { id: "m1", date: "2026-01-05T09:00:00.000Z", type: "swing_speed", value: 95, unit: "mph", device: "R10", sourceTag: "manual" }
    ];
    const rows = buildCsvRows(baseInput({ metricLogs }));
    expect(rows[0]).toMatchObject({
      date: metricLogs[0].date,
      block: "",
      sessionType: "",
      venue: "",
      exercise: "",
      setNo: "",
      reps: "",
      loadKg: "",
      rpe: "",
      metricType: "swing_speed",
      metricValue: 95,
      unit: "mph",
      device: "R10"
    });
  });

  it("sorts rows chronologically by date", () => {
    const setLogs: SetLog[] = [{ id: "sl1", sessionLogId: "s1", exerciseId: "ex1", setNo: 1, reps: 10, loadKg: 40, rpe: 7 }];
    const metricLogs: MetricLog[] = [
      { id: "m1", date: "2026-01-01T00:00:00.000Z", type: "swing_speed", value: 90, unit: "mph", sourceTag: "manual" }
    ];
    const rows = buildCsvRows(baseInput({ setLogs, metricLogs }));
    expect(rows.map((r) => r.date)).toEqual([metricLogs[0].date, SESSION.date]);
  });

  it("escapes commas/quotes per RFC4180", () => {
    const weirdExercise: Exercise = { ...EXERCISE, id: "ex2", name: 'Squat, "back" variant' };
    const setLogs: SetLog[] = [{ id: "sl1", sessionLogId: "s1", exerciseId: "ex2", setNo: 1, reps: 10, loadKg: 40, rpe: 7 }];
    const csv = csvRowsToString(buildCsvRows(baseInput({ setLogs, exercises: [weirdExercise] })));
    expect(csv).toContain('"Squat, ""back"" variant"');
  });
});
