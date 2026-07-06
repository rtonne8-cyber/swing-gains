// AT-P2 TR-1..TR-4: session-package append-merge (idempotent) and full-state typed
// confirmation. Exercises only the pure transfer + progression functions — no Dexie/
// fake-indexeddb needed, since the merge/recompute logic itself has no IO.
import { describe, expect, it } from "vitest";
import { buildSessionPackage, mergeSessionPackage } from "../src/transfer/sessionPackage";
import { FULL_STATE_CONFIRMATION_PHRASE, validateFullStateImport } from "../src/transfer/fullState";
import { recomputeProgressionStates } from "../src/engine/progression";
import type {
  Block,
  Exercise,
  ExercisePrescription,
  MetricLog,
  SessionLog,
  SessionTemplate,
  SetLog,
  TransitionRules
} from "../src/db/types";

const RULES: TransitionRules = { minSessions: 15, maxWeeks: 8, minWeeks: 4, minGymSessions: 8, minHomeSessions: 4 };
const BLOCK2: Block = { id: "b2", sequence: 2, name: "Strength", emphasis: "", sessionTemplateIds: [], transitionRules: RULES };

function rx(exerciseId: string, repsDisplay: string): ExercisePrescription {
  return { exerciseId, order: 1, sets: 3, repsDisplay, perSide: false };
}

const TEMPLATE: SessionTemplate = {
  id: "b2-g1",
  blockId: "b2",
  venue: "gym",
  type: "G1",
  name: "Test",
  exercisePrescriptions: [rx("EX-UP", "8-10")]
};

const EXERCISE: Exercise = {
  id: "EX-UP",
  name: "Bench",
  pattern: "H-push",
  venue: "gym",
  cues: "",
  description: "d",
  videoUrl: null,
  loadRegion: "upper"
};

function pixelSession(sessionId: string, date: string, reps: number, rpe: number): {
  sessionLog: SessionLog;
  setLogs: SetLog[];
  metricLogs: MetricLog[];
} {
  return {
    sessionLog: { id: sessionId, templateId: "b2-g1", date, durationMin: 40, completed: true, notes: "", originDevice: "pixel" },
    setLogs: [
      { id: `${sessionId}-set1`, sessionLogId: sessionId, exerciseId: "EX-UP", setNo: 1, reps, loadKg: 40, rpe },
      { id: `${sessionId}-set2`, sessionLogId: sessionId, exerciseId: "EX-UP", setNo: 2, reps, loadKg: 40, rpe }
    ],
    metricLogs: []
  };
}

describe("AT-P2 TR-1: session-package import adds exactly the package's logs", () => {
  it("adds the session log, set logs and metric logs, nothing more or less", () => {
    const { sessionLog, setLogs, metricLogs } = pixelSession("pixel-1", "2026-03-01", 10, 7);
    const pkg = buildSessionPackage(sessionLog, setLogs, metricLogs, "2026-03-01T12:00:00Z");

    const merge = mergeSessionPackage(pkg, new Set(), new Set(), new Set());

    expect(merge.alreadyImported).toBe(false);
    expect(merge.sessionLogToAdd).toEqual(sessionLog);
    expect(merge.setLogsToAdd).toEqual(setLogs);
    expect(merge.metricLogsToAdd).toEqual(metricLogs);
  });
});

describe("AT-P2 TR-2: re-import of same package is a no-op", () => {
  it("is idempotent when the session log id is already present", () => {
    const { sessionLog, setLogs, metricLogs } = pixelSession("pixel-1", "2026-03-01", 10, 7);
    const pkg = buildSessionPackage(sessionLog, setLogs, metricLogs, "2026-03-01T12:00:00Z");

    const existingSessionLogIds = new Set([sessionLog.id]);
    const existingSetLogIds = new Set(setLogs.map((s) => s.id));
    const merge = mergeSessionPackage(pkg, existingSessionLogIds, existingSetLogIds, new Set());

    expect(merge.alreadyImported).toBe(true);
    expect(merge.sessionLogToAdd).toBeNull();
    expect(merge.setLogsToAdd).toEqual([]);
    expect(merge.metricLogsToAdd).toEqual([]);
  });
});

describe("AT-P2 TR-3: post-merge recompute equals a from-scratch replay", () => {
  it("gives identical ProgressionState whether history was merged from a package or always local", () => {
    // "iPad" already has one gym session logged locally.
    const ipadSession = pixelSession("ipad-1", "2026-02-01", 8, 6);
    // "Pixel" logs a second session later, exported as a session package and merged in.
    const pixel = pixelSession("pixel-1", "2026-02-08", 10, 8);
    const pkg = buildSessionPackage(pixel.sessionLog, pixel.setLogs, pixel.metricLogs, "2026-02-08T12:00:00Z");

    const merge = mergeSessionPackage(
      pkg,
      new Set([ipadSession.sessionLog.id]),
      new Set(ipadSession.setLogs.map((s) => s.id)),
      new Set()
    );
    const mergedSessionLogs = [ipadSession.sessionLog, merge.sessionLogToAdd!];
    const mergedSetLogs = [...ipadSession.setLogs, ...merge.setLogsToAdd];

    const viaMerge = recomputeProgressionStates({
      exercises: [EXERCISE],
      ladders: [],
      blocks: [BLOCK2],
      sessionTemplates: [TEMPLATE],
      sessionLogs: mergedSessionLogs,
      setLogs: mergedSetLogs,
      currentBlockId: "b2",
      nowISO: "2026-02-08T12:00:00Z"
    });

    // A device that had always seen both sessions locally, in one from-scratch replay.
    const viaFromScratch = recomputeProgressionStates({
      exercises: [EXERCISE],
      ladders: [],
      blocks: [BLOCK2],
      sessionTemplates: [TEMPLATE],
      sessionLogs: [ipadSession.sessionLog, pixel.sessionLog],
      setLogs: [...ipadSession.setLogs, ...pixel.setLogs],
      currentBlockId: "b2",
      nowISO: "2026-02-08T12:00:00Z"
    });

    expect(viaMerge).toEqual(viaFromScratch);
    // Sanity: the second (hit) session should have prescribed +2.5kg (upper) on top of 40.
    expect(viaMerge.find((p) => p.exerciseId === "EX-UP")?.currentPrescribedLoadKg).toBe(42.5);
  });
});

describe("AT-P2 TR-4: full-state import requires typed confirmation on a populated device", () => {
  it("allows import onto a fresh device without any confirmation text", () => {
    expect(validateFullStateImport({ version: 1 }, false, "")).toEqual({ allowed: true });
  });

  it("blocks import onto a populated device without the exact phrase", () => {
    const result = validateFullStateImport({ version: 1 }, true, "replace all data");
    expect(result.allowed).toBe(false);
  });

  it("allows import onto a populated device with the exact phrase", () => {
    const result = validateFullStateImport({ version: 1 }, true, FULL_STATE_CONFIRMATION_PHRASE);
    expect(result.allowed).toBe(true);
  });

  it("rejects an unsupported export version regardless of confirmation", () => {
    const result = validateFullStateImport({ version: 2 as 1 }, true, FULL_STATE_CONFIRMATION_PHRASE);
    expect(result.allowed).toBe(false);
  });

  it("tolerates accidental leading/trailing whitespace but not a case mismatch", () => {
    expect(validateFullStateImport({ version: 1 }, true, `  ${FULL_STATE_CONFIRMATION_PHRASE}  `).allowed).toBe(true);
    expect(validateFullStateImport({ version: 1 }, true, FULL_STATE_CONFIRMATION_PHRASE.toLowerCase()).allowed).toBe(false);
  });
});
