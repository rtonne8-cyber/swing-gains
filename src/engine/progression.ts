// Progression engine (spec §3.4) — deterministic rules for loaded gym lifts and bodyweight
// ladder exercises. Pure and Dexie-free: callers pass in the full log history plus the
// current Programme.currentBlockId, and get back the complete ProgressionState[] table.
//
// Design choice (flagged): rather than incrementally patching ProgressionState after each
// session, this always recomputes the *entire* table from the full ordered history. Spec §7
// already calls ProgressionState "derived state, always recomputable from logs (merge-safe
// by construction)" — a full-replay function satisfies that literally, and it is also
// exactly what AT-P2's TR-3 requires ("post-merge recompute equals a from-scratch replay of
// full history"): both cases call this same function, so the property holds by
// construction rather than needing separate incremental-vs-replay code paths to agree.
import type {
  Block,
  Exercise,
  ExercisePrescription,
  LoadRegion,
  ProgressionState,
  SessionLog,
  SessionTemplate,
  SetLog,
  VariationLadder
} from "../db/types";
import { parseRepTarget } from "./repTarget";

const RPE_CEILING = 8; // spec §3.4 rule 2/PE-4: fixed ceiling, independent of the
// prescription's own (often lower, reference-only) targetRPE display value.
const LOAD_REDUCTION_FACTOR = 0.9; // rule 3: -10%

export interface ProgressionInput {
  exercises: Exercise[];
  ladders: VariationLadder[];
  blocks: Block[];
  sessionTemplates: SessionTemplate[];
  sessionLogs: SessionLog[];
  setLogs: SetLog[];
  currentBlockId: string;
  nowISO: string; // fallback lastUpdated for state that has never been touched by a log
}

interface MutableState {
  currentPrescribedLoadKg: number | null;
  currentLadderRung: number | null;
  streakCount: number;
  lastUpdated: string;
}

function lastBySetNo(setLogs: SetLog[]): SetLog | undefined {
  if (setLogs.length === 0) return undefined;
  return setLogs.reduce((latest, s) => (s.setNo > latest.setNo ? s : latest));
}

function setLogsFor(setLogs: SetLog[], sessionLogId: string, exerciseId: string): SetLog[] {
  return setLogs.filter((s) => s.sessionLogId === sessionLogId && s.exerciseId === exerciseId);
}

function allSetsRpeWithinCeiling(sessionSetLogs: SetLog[]): boolean {
  return sessionSetLogs.every((s) => s.rpe != null && s.rpe <= RPE_CEILING);
}

export function recomputeProgressionStates(input: ProgressionInput): ProgressionState[] {
  const { exercises, ladders, blocks, sessionTemplates, setLogs, currentBlockId, nowISO } = input;

  const blockById = new Map(blocks.map((b) => [b.id, b]));
  const templateById = new Map(sessionTemplates.map((t) => [t.id, t]));
  const ladderById = new Map(ladders.map((l) => [l.id, l]));
  const block1 = blocks.find((b) => b.sequence === 1);
  const currentBlock = blockById.get(currentBlockId);
  const pastCalibration = !!currentBlock && !!block1 && currentBlock.sequence > block1.sequence;

  const completedSessionsAsc = [...input.sessionLogs]
    .filter((s) => s.completed)
    .sort((a, b) => a.date.localeCompare(b.date));

  const state = new Map<string, MutableState>();

  // Ladder-anchored exercises always have a state row from first launch (seed.ts convention).
  for (const ex of exercises) {
    if (ex.ladderId) {
      state.set(ex.id, {
        currentPrescribedLoadKg: null,
        currentLadderRung: 0,
        streakCount: 0,
        lastUpdated: nowISO
      });
    }
  }

  function getOrCreateLoadedLiftState(exerciseId: string): MutableState {
    let s = state.get(exerciseId);
    if (!s) {
      s = { currentPrescribedLoadKg: null, currentLadderRung: null, streakCount: 0, lastUpdated: nowISO };
      state.set(exerciseId, s);
    }
    return s;
  }

  // ---- Block 1 calibration (rule 4): derive each loaded lift's "last stable load" from the
  // last Block-1 session that logged it. Block 1 itself never gets a prescription (user
  // free-selects loads throughout); the derived value only becomes the live
  // currentPrescribedLoadKg once the block has actually advanced past Block 1.
  const lastBlock1Load = new Map<string, number>();
  if (block1) {
    for (const session of completedSessionsAsc) {
      const template = templateById.get(session.templateId);
      if (!template || template.blockId !== block1.id) continue;
      for (const ex of exercises) {
        if (ex.venue !== "gym" || !ex.loadRegion) continue;
        const last = lastBySetNo(setLogsFor(setLogs, session.id, ex.id));
        if (last && last.loadKg != null) {
          lastBlock1Load.set(ex.id, last.loadKg);
        }
      }
    }
  }

  if (pastCalibration) {
    for (const [exerciseId, loadKg] of lastBlock1Load) {
      getOrCreateLoadedLiftState(exerciseId).currentPrescribedLoadKg = loadKg;
    }
  }

  // ---- Replay every completed session from Block 2 onward, in order.
  for (const session of completedSessionsAsc) {
    const template = templateById.get(session.templateId);
    if (!template) continue;
    const block = blockById.get(template.blockId);
    if (!block || (block1 && block.sequence <= block1.sequence)) continue; // Block 1 = calibration only

    for (const ex of exercises) {
      const prescription = template.exercisePrescriptions.find((p) => p.exerciseId === ex.id);
      if (!prescription) continue;
      const sessionSetLogs = setLogsFor(setLogs, session.id, ex.id);
      if (sessionSetLogs.length === 0) continue;

      if (ex.venue === "gym" && ex.loadRegion) {
        applyLoadedLiftSession(getOrCreateLoadedLiftState(ex.id), prescription, sessionSetLogs, ex.loadRegion, session.date);
      } else if (ex.ladderId) {
        const ladder = ladderById.get(ex.ladderId);
        if (ladder) {
          applyLadderSession(getOrCreateLoadedLiftState(ex.id), prescription, sessionSetLogs, ladder, session.date);
        }
      }
    }
  }

  return Array.from(state.entries()).map(([exerciseId, s]) => ({
    exerciseId,
    currentPrescribedLoadKg: s.currentPrescribedLoadKg,
    currentLadderRung: s.currentLadderRung,
    streakCount: s.streakCount,
    lastUpdated: s.lastUpdated
  }));
}

function applyLoadedLiftSession(
  s: MutableState,
  prescription: ExercisePrescription,
  sessionSetLogs: SetLog[],
  loadRegion: LoadRegion,
  sessionDate: string
): void {
  const target = parseRepTarget(prescription.repsDisplay);
  if (!target) return; // not a plain rep count this block (distance/time/qualitative) — no signal to act on

  const workingLoad = lastBySetNo(sessionSetLogs)?.loadKg ?? s.currentPrescribedLoadKg;
  if (workingLoad == null) return; // nothing logged and no prior baseline — can't establish a load yet

  // >= (not ===): "all sets at top of range" reads as "met or exceeded the top", matching
  // the same convention already used for ladder rung targets below — a lifter who does 13
  // reps on an 8-12 prescription at RPE<=8 is clearly at/above the top, not merely close.
  const allTopAtCeiling =
    sessionSetLogs.every((set) => set.reps != null && set.reps >= target.max) && allSetsRpeWithinCeiling(sessionSetLogs);
  const anyBelowBottom = sessionSetLogs.some((set) => set.reps != null && set.reps < target.min);

  let nextLoad = workingLoad;
  let streak = s.streakCount;

  if (anyBelowBottom) {
    streak += 1;
    if (streak >= 2) {
      nextLoad = Math.round(workingLoad * LOAD_REDUCTION_FACTOR * 10) / 10;
      streak = 0;
    }
  } else {
    streak = 0;
    if (allTopAtCeiling) {
      nextLoad = workingLoad + (loadRegion === "upper" ? 2.5 : 5);
    }
  }

  s.currentPrescribedLoadKg = nextLoad;
  s.streakCount = streak;
  s.lastUpdated = sessionDate;
}

function applyLadderSession(
  s: MutableState,
  prescription: ExercisePrescription,
  sessionSetLogs: SetLog[],
  ladder: VariationLadder,
  sessionDate: string
): void {
  const confirmedThisSession = sessionSetLogs.some((set) => set.ladderAdvanceConfirmed === true);
  const streakBeforeThisSession = s.streakCount;

  const target = parseRepTarget(prescription.repsDisplay);
  if (target) {
    const hit =
      sessionSetLogs.every((set) => set.reps != null && set.reps >= target.max) && allSetsRpeWithinCeiling(sessionSetLogs);
    s.streakCount = hit ? s.streakCount + 1 : 0;
    s.lastUpdated = sessionDate;
  }

  const currentRung = s.currentLadderRung ?? 0;
  if (confirmedThisSession && streakBeforeThisSession >= 2 && currentRung < ladder.rungs.length - 1) {
    s.currentLadderRung = currentRung + 1;
    s.streakCount = 0;
    s.lastUpdated = sessionDate;
  }
}
