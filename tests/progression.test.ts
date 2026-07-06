// AT-P2 PE-1..PE-5 (loaded-lift double progression + Block 1 calibration) and LD-1 (ladder
// rung advancement). Fixtures are minimal, purpose-built templates/exercises rather than the
// full seeded library — the engine only needs a Block sequence, an ExercisePrescription's
// repsDisplay, and logged SetLogs to do its job.
import { describe, expect, it } from "vitest";
import { recomputeProgressionStates, type ProgressionInput } from "../src/engine/progression";
import type {
  Block,
  Exercise,
  ExercisePrescription,
  SessionLog,
  SessionTemplate,
  SetLog,
  TransitionRules,
  VariationLadder
} from "../src/db/types";

const RULES: TransitionRules = { minSessions: 15, maxWeeks: 8, minWeeks: 4, minGymSessions: 8, minHomeSessions: 4 };
const BLOCK1: Block = { id: "b1", sequence: 1, name: "Calibration", emphasis: "", sessionTemplateIds: [], transitionRules: RULES };
const BLOCK2: Block = { id: "b2", sequence: 2, name: "Strength", emphasis: "", sessionTemplateIds: [], transitionRules: RULES };
const BLOCKS = [BLOCK1, BLOCK2];

function rx(exerciseId: string, repsDisplay: string, opts: Partial<ExercisePrescription> = {}): ExercisePrescription {
  return { exerciseId, order: 1, sets: 3, repsDisplay, perSide: false, ...opts };
}

function tmpl(id: string, blockId: string, prescriptions: ExercisePrescription[]): SessionTemplate {
  return { id, blockId, venue: "gym", type: "G1", name: "Test", exercisePrescriptions: prescriptions };
}

function sessionLog(id: string, templateId: string, date: string): SessionLog {
  return { id, templateId, date, durationMin: 45, completed: true, notes: "", originDevice: "ipad" };
}

function setLog(
  id: string,
  sessionLogId: string,
  exerciseId: string,
  setNo: number,
  reps: number,
  loadKg: number | null,
  rpe: number,
  opts: Partial<SetLog> = {}
): SetLog {
  return { id, sessionLogId, exerciseId, setNo, reps, loadKg, rpe, ...opts };
}

function gymExercise(id: string, loadRegion: "upper" | "lower"): Exercise {
  return {
    id,
    name: id,
    pattern: "test",
    venue: "gym",
    cues: "",
    description: "d",
    videoUrl: null,
    loadRegion
  };
}

function recompute(input: Partial<ProgressionInput> & Pick<ProgressionInput, "sessionLogs" | "setLogs" | "sessionTemplates" | "exercises">) {
  return recomputeProgressionStates({
    blocks: BLOCKS,
    ladders: [],
    currentBlockId: "b2",
    nowISO: "2026-01-01T00:00:00.000Z",
    ...input
  });
}

describe("AT-P2 PE-1: upper-body double progression", () => {
  it("all sets at top of an 8-12 range at RPE<=8 prescribes +2.5kg next session", () => {
    const ex = gymExercise("EX-UP", "upper");
    const b1t = tmpl("b1-g1", "b1", [rx("EX-UP", "12")]);
    const b2t = tmpl("b2-g1", "b2", [rx("EX-UP", "8-12")]);
    const logs = [sessionLog("s1", "b1-g1", "2026-01-01"), sessionLog("s2", "b2-g1", "2026-02-01")];
    const setLogs = [
      setLog("set1", "s1", "EX-UP", 1, 12, 40, 6),
      setLog("set2", "s2", "EX-UP", 1, 12, 40, 8),
      setLog("set3", "s2", "EX-UP", 2, 12, 40, 8),
      setLog("set4", "s2", "EX-UP", 3, 12, 40, 7)
    ];
    const result = recompute({ exercises: [ex], sessionTemplates: [b1t, b2t], sessionLogs: logs, setLogs });
    expect(result.find((p) => p.exerciseId === "EX-UP")?.currentPrescribedLoadKg).toBe(42.5);
  });
});

describe("AT-P2 PE-1b: exceeding the top of range still counts as a hit", () => {
  it("reps above the prescribed max at RPE<=8 still prescribes the increment", () => {
    const ex = gymExercise("EX-UP", "upper");
    const b2t = tmpl("b2-g1", "b2", [rx("EX-UP", "8-10")]);
    const logs = [sessionLog("s1", "b2-g1", "2026-02-01")];
    const setLogs = [
      setLog("set1", "s1", "EX-UP", 1, 13, 40, 7),
      setLog("set2", "s1", "EX-UP", 2, 12, 40, 7)
    ];
    const result = recompute({ exercises: [ex], sessionTemplates: [b2t], sessionLogs: logs, setLogs });
    expect(result.find((p) => p.exerciseId === "EX-UP")?.currentPrescribedLoadKg).toBe(42.5);
  });
});

describe("AT-P2 PE-2: lower-body double progression", () => {
  it("all sets at top of range at RPE<=8 prescribes +5kg next session", () => {
    const ex = gymExercise("EX-LOW", "lower");
    const b1t = tmpl("b1-g1", "b1", [rx("EX-LOW", "12")]);
    const b2t = tmpl("b2-g1", "b2", [rx("EX-LOW", "8-12")]);
    const logs = [sessionLog("s1", "b1-g1", "2026-01-01"), sessionLog("s2", "b2-g1", "2026-02-01")];
    const setLogs = [
      setLog("set1", "s1", "EX-LOW", 1, 12, 60, 6),
      setLog("set2", "s2", "EX-LOW", 1, 12, 60, 8),
      setLog("set3", "s2", "EX-LOW", 2, 12, 60, 8),
      setLog("set4", "s2", "EX-LOW", 3, 12, 60, 7)
    ];
    const result = recompute({ exercises: [ex], sessionTemplates: [b1t, b2t], sessionLogs: logs, setLogs });
    expect(result.find((p) => p.exerciseId === "EX-LOW")?.currentPrescribedLoadKg).toBe(65);
  });
});

describe("AT-P2 PE-3: below-range reduction", () => {
  it("below bottom of range in two consecutive sessions reduces load 10%", () => {
    const ex = gymExercise("EX-LOW", "lower");
    const b2t = tmpl("b2-g1", "b2", [rx("EX-LOW", "8-10")]);
    const logs = [sessionLog("s1", "b2-g1", "2026-02-01"), sessionLog("s2", "b2-g1", "2026-02-08")];
    const setLogs = [
      setLog("set1", "s1", "EX-LOW", 1, 6, 40, 8),
      setLog("set2", "s2", "EX-LOW", 1, 6, 40, 8)
    ];
    const result = recompute({ exercises: [ex], sessionTemplates: [b2t], sessionLogs: logs, setLogs });
    const state = result.find((p) => p.exerciseId === "EX-LOW");
    expect(state?.currentPrescribedLoadKg).toBe(36);
    expect(state?.streakCount).toBe(0);
  });

  it("does not reduce after only one below-range session", () => {
    const ex = gymExercise("EX-LOW", "lower");
    const b2t = tmpl("b2-g1", "b2", [rx("EX-LOW", "8-10")]);
    const logs = [sessionLog("s1", "b2-g1", "2026-02-01")];
    const setLogs = [setLog("set1", "s1", "EX-LOW", 1, 6, 40, 8)];
    const result = recompute({ exercises: [ex], sessionTemplates: [b2t], sessionLogs: logs, setLogs });
    const state = result.find((p) => p.exerciseId === "EX-LOW");
    expect(state?.currentPrescribedLoadKg).toBe(40);
    expect(state?.streakCount).toBe(1);
  });

  it("a hit session in between resets the below-range streak", () => {
    const ex = gymExercise("EX-LOW", "lower");
    const b2t = tmpl("b2-g1", "b2", [rx("EX-LOW", "8-10")]);
    const logs = [
      sessionLog("s1", "b2-g1", "2026-02-01"),
      sessionLog("s2", "b2-g1", "2026-02-08"),
      sessionLog("s3", "b2-g1", "2026-02-15")
    ];
    const setLogs = [
      setLog("set1", "s1", "EX-LOW", 1, 6, 40, 8), // miss
      setLog("set2", "s2", "EX-LOW", 1, 9, 40, 7), // mid-range hit, not below bottom
      setLog("set3", "s3", "EX-LOW", 1, 6, 40, 8) // miss again, but streak should be 1 not 2
    ];
    const result = recompute({ exercises: [ex], sessionTemplates: [b2t], sessionLogs: logs, setLogs });
    const state = result.find((p) => p.exerciseId === "EX-LOW");
    expect(state?.currentPrescribedLoadKg).toBe(40);
    expect(state?.streakCount).toBe(1);
  });
});

describe("AT-P2 PE-4: RPE ceiling", () => {
  it("RPE 9 at top of range blocks the increment", () => {
    const ex = gymExercise("EX-UP", "upper");
    const b2t = tmpl("b2-g1", "b2", [rx("EX-UP", "8-10")]);
    const logs = [sessionLog("s1", "b2-g1", "2026-02-01")];
    const setLogs = [
      setLog("set1", "s1", "EX-UP", 1, 10, 40, 8),
      setLog("set2", "s1", "EX-UP", 2, 10, 40, 9),
      setLog("set3", "s1", "EX-UP", 3, 10, 40, 8)
    ];
    const result = recompute({ exercises: [ex], sessionTemplates: [b2t], sessionLogs: logs, setLogs });
    expect(result.find((p) => p.exerciseId === "EX-UP")?.currentPrescribedLoadKg).toBe(40);
  });
});

describe("AT-P2 PE-5: Block 1 calibration", () => {
  it("produces no prescription while still in Block 1 (calibration mode)", () => {
    const ex = gymExercise("EX-UP", "upper");
    const b1t = tmpl("b1-g1", "b1", [rx("EX-UP", "12")]);
    const logs = [
      sessionLog("s1", "b1-g1", "2026-01-01"),
      sessionLog("s2", "b1-g1", "2026-01-08"),
      sessionLog("s3", "b1-g1", "2026-01-15")
    ];
    const setLogs = [
      setLog("set1", "s1", "EX-UP", 1, 12, 30, 6),
      setLog("set2", "s2", "EX-UP", 1, 12, 35, 6),
      setLog("set3", "s3", "EX-UP", 1, 12, 32, 6)
    ];
    const result = recompute({
      exercises: [ex],
      sessionTemplates: [b1t],
      sessionLogs: logs,
      setLogs,
      currentBlockId: "b1"
    });
    // No ProgressionState row exists yet for a gym exercise nothing has prescribed a load
    // for — same convention as the P1 seed loader, which only pre-creates rows for
    // ladder-anchored exercises. Downstream (UI) code treats "no row" as "no prescription".
    expect(result.find((p) => p.exerciseId === "EX-UP")).toBeUndefined();
  });

  it("15 calibration sessions produce a Block 2 starting load = last stable Block 1 load", () => {
    const ex = gymExercise("EX-UP", "upper");
    const b1t = tmpl("b1-g1", "b1", [rx("EX-UP", "12")]);
    const logs = [
      sessionLog("s1", "b1-g1", "2026-01-01"),
      sessionLog("s2", "b1-g1", "2026-01-08"),
      sessionLog("s3", "b1-g1", "2026-01-15")
    ];
    const setLogs = [
      setLog("set1", "s1", "EX-UP", 1, 12, 30, 6),
      setLog("set2", "s2", "EX-UP", 1, 12, 35, 6),
      setLog("set3", "s3", "EX-UP", 1, 12, 32, 6) // last stable load = 32, not the max (35)
    ];
    // No Block 2 sessions logged yet — Programme has just advanced to b2.
    const result = recompute({
      exercises: [ex],
      sessionTemplates: [b1t],
      sessionLogs: logs,
      setLogs,
      currentBlockId: "b2"
    });
    expect(result.find((p) => p.exerciseId === "EX-UP")?.currentPrescribedLoadKg).toBe(32);
  });
});

describe("AT-P2 LD-1: ladder rung advancement", () => {
  const ladder: VariationLadder = {
    id: "L1",
    pattern: "Squat",
    rungs: [
      { name: "Rung 0", videoUrl: null },
      { name: "Rung 1", videoUrl: null },
      { name: "Rung 2", videoUrl: null }
    ]
  };

  function ladderExercise(): Exercise {
    return { id: "EX-LADDER", name: "Ladder", pattern: "Squat", venue: "home", ladderId: "L1", cues: "", description: "d", videoUrl: null };
  }

  function ladderTemplate(): SessionTemplate {
    return { id: "b2-h1", blockId: "b2", venue: "home", type: "H1", name: "Home", exercisePrescriptions: [rx("EX-LADDER", "10")] };
  }

  it("does not offer before two consecutive hits", () => {
    const logs = [sessionLog("s1", "b2-h1", "2026-02-01")];
    const setLogs = [setLog("set1", "s1", "EX-LADDER", 1, 10, null, 7)];
    const result = recompute({ exercises: [ladderExercise()], ladders: [ladder], sessionTemplates: [ladderTemplate()], sessionLogs: logs, setLogs });
    const state = result.find((p) => p.exerciseId === "EX-LADDER");
    expect(state?.currentLadderRung).toBe(0);
    expect(state?.streakCount).toBe(1);
  });

  it("streak reaches 2 after two consecutive hits but never auto-advances without confirmation", () => {
    const logs = [sessionLog("s1", "b2-h1", "2026-02-01"), sessionLog("s2", "b2-h1", "2026-02-08")];
    const setLogs = [
      setLog("set1", "s1", "EX-LADDER", 1, 10, null, 7),
      setLog("set2", "s2", "EX-LADDER", 1, 10, null, 7)
    ];
    const result = recompute({ exercises: [ladderExercise()], ladders: [ladder], sessionTemplates: [ladderTemplate()], sessionLogs: logs, setLogs });
    const state = result.find((p) => p.exerciseId === "EX-LADDER");
    expect(state?.currentLadderRung).toBe(0);
    expect(state?.streakCount).toBe(2);
  });

  it("a single confirmed hit at streak 1 does not advance (guards premature confirmation)", () => {
    const logs = [sessionLog("s1", "b2-h1", "2026-02-01")];
    const setLogs = [setLog("set1", "s1", "EX-LADDER", 1, 10, null, 7, { ladderAdvanceConfirmed: true })];
    const result = recompute({ exercises: [ladderExercise()], ladders: [ladder], sessionTemplates: [ladderTemplate()], sessionLogs: logs, setLogs });
    expect(result.find((p) => p.exerciseId === "EX-LADDER")?.currentLadderRung).toBe(0);
  });

  it("advances one rung and resets the streak once the user confirms after two hits", () => {
    const logs = [
      sessionLog("s1", "b2-h1", "2026-02-01"),
      sessionLog("s2", "b2-h1", "2026-02-08"),
      sessionLog("s3", "b2-h1", "2026-02-15")
    ];
    const setLogs = [
      setLog("set1", "s1", "EX-LADDER", 1, 10, null, 7),
      setLog("set2", "s2", "EX-LADDER", 1, 10, null, 7),
      // confirmation can arrive in a later session, even a miss — never forced immediately
      setLog("set3", "s3", "EX-LADDER", 1, 4, null, 7, { ladderAdvanceConfirmed: true })
    ];
    const result = recompute({ exercises: [ladderExercise()], ladders: [ladder], sessionTemplates: [ladderTemplate()], sessionLogs: logs, setLogs });
    const state = result.find((p) => p.exerciseId === "EX-LADDER");
    expect(state?.currentLadderRung).toBe(1);
    expect(state?.streakCount).toBe(0);
  });

  it("never advances past the last rung", () => {
    const lastRungLadder: VariationLadder = { ...ladder, rungs: ladder.rungs.slice(0, 1) }; // only Rung 0
    const logs = [
      sessionLog("s1", "b2-h1", "2026-02-01"),
      sessionLog("s2", "b2-h1", "2026-02-08"),
      sessionLog("s3", "b2-h1", "2026-02-15")
    ];
    const setLogs = [
      setLog("set1", "s1", "EX-LADDER", 1, 10, null, 7),
      setLog("set2", "s2", "EX-LADDER", 1, 10, null, 7),
      setLog("set3", "s3", "EX-LADDER", 1, 10, null, 7, { ladderAdvanceConfirmed: true })
    ];
    const result = recompute({ exercises: [ladderExercise()], ladders: [lastRungLadder], sessionTemplates: [ladderTemplate()], sessionLogs: logs, setLogs });
    expect(result.find((p) => p.exerciseId === "EX-LADDER")?.currentLadderRung).toBe(0);
  });
});
