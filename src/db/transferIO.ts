// Thin Dexie adapter over the pure transfer + progression modules. UI (Settings/Data,
// Session runner) calls these; all decision logic lives in src/transfer and
// src/engine/progression so it stays unit-testable without a real IndexedDB.
import { db } from "./schema";
import { FEATURE_FLAGS } from "../config/featureFlags";
import { recomputeProgressionStates } from "../engine/progression";
import {
  buildSessionPackage,
  mergeSessionPackage,
  type SessionPackage
} from "../transfer/sessionPackage";
import {
  buildFullStateExport,
  validateFullStateImport,
  type FullStateExport
} from "../transfer/fullState";

// Exported so the Session runner can call it after every locally-logged session finishes —
// not just after a transfer merge. ProgressionState is derived (spec §7): nothing else
// should ever write to it directly.
export async function recomputeAndPersistProgressionStates(): Promise<void> {
  const [exercises, ladders, blocks, sessionTemplates, sessionLogs, setLogs, programme] = await Promise.all([
    db.exercise.toArray(),
    db.variationLadder.toArray(),
    db.block.toArray(),
    db.sessionTemplate.toArray(),
    db.sessionLog.toArray(),
    db.setLog.toArray(),
    db.programme.toCollection().first()
  ]);
  if (!programme) return;

  const states = recomputeProgressionStates({
    exercises,
    ladders,
    blocks,
    sessionTemplates,
    sessionLogs,
    setLogs,
    currentBlockId: programme.currentBlockId,
    nowISO: new Date().toISOString(),
    year2StreakReset: FEATURE_FLAGS.year2StreakReset
  });
  await db.progressionState.bulkPut(states);
}

export async function exportSessionPackage(sessionLogId: string): Promise<SessionPackage> {
  const [sessionLog, allSetLogs, allMetricLogs] = await Promise.all([
    db.sessionLog.get(sessionLogId),
    db.setLog.toArray(),
    db.metricLog.toArray()
  ]);
  if (!sessionLog) {
    throw new Error(`no session log found for id ${sessionLogId}`);
  }
  return buildSessionPackage(sessionLog, allSetLogs, allMetricLogs, new Date().toISOString());
}

export interface SessionPackageImportResult {
  alreadyImported: boolean;
  setLogsAdded: number;
  metricLogsAdded: number;
}

export async function importSessionPackage(pkg: SessionPackage): Promise<SessionPackageImportResult> {
  const [existingSessionLogs, existingSetLogs, existingMetricLogs] = await Promise.all([
    db.sessionLog.toArray(),
    db.setLog.toArray(),
    db.metricLog.toArray()
  ]);

  const merge = mergeSessionPackage(
    pkg,
    new Set(existingSessionLogs.map((s) => s.id)),
    new Set(existingSetLogs.map((s) => s.id)),
    new Set(existingMetricLogs.map((m) => m.id))
  );

  if (merge.alreadyImported) {
    return { alreadyImported: true, setLogsAdded: 0, metricLogsAdded: 0 };
  }

  await db.transaction("rw", [db.sessionLog, db.setLog, db.metricLog], async () => {
    if (merge.sessionLogToAdd) await db.sessionLog.add(merge.sessionLogToAdd);
    if (merge.setLogsToAdd.length) await db.setLog.bulkAdd(merge.setLogsToAdd);
    if (merge.metricLogsToAdd.length) await db.metricLog.bulkAdd(merge.metricLogsToAdd);
  });

  await recomputeAndPersistProgressionStates();

  return { alreadyImported: false, setLogsAdded: merge.setLogsToAdd.length, metricLogsAdded: merge.metricLogsToAdd.length };
}

export async function exportFullState(): Promise<FullStateExport> {
  const [programme, sessionLogs, setLogs, metricLogs] = await Promise.all([
    db.programme.toCollection().first(),
    db.sessionLog.toArray(),
    db.setLog.toArray(),
    db.metricLog.toArray()
  ]);
  if (!programme) {
    throw new Error("no programme record to export");
  }
  return buildFullStateExport(programme, sessionLogs, setLogs, metricLogs, new Date().toISOString());
}

export interface FullStateImportOutcome {
  allowed: boolean;
  reason?: string;
}

// Full-state import REPLACES this device's programme/sessionLog/setLog/metricLog stores
// (spec §5.4: "retained for backup and for seeding/refreshing the Pixel from the iPad") —
// unlike session-package import, this is not an append-merge. Library content
// (block/sessionTemplate/exercise/variationLadder) is left untouched; ProgressionState is
// dropped and recomputed fresh from the imported logs.
export async function importFullState(data: FullStateExport, typedConfirmation: string): Promise<FullStateImportOutcome> {
  const existingSessionLogCount = await db.sessionLog.count();
  const check = validateFullStateImport(data, existingSessionLogCount > 0, typedConfirmation);
  if (!check.allowed) {
    return check;
  }

  await db.transaction(
    "rw",
    [db.programme, db.sessionLog, db.setLog, db.metricLog, db.progressionState],
    async () => {
      await db.sessionLog.clear();
      await db.setLog.clear();
      await db.metricLog.clear();
      await db.progressionState.clear();
      await db.programme.clear();

      await db.programme.add(data.programme);
      if (data.sessionLogs.length) await db.sessionLog.bulkAdd(data.sessionLogs);
      if (data.setLogs.length) await db.setLog.bulkAdd(data.setLogs);
      if (data.metricLogs.length) await db.metricLog.bulkAdd(data.metricLogs);
    }
  );

  await recomputeAndPersistProgressionStates();

  return { allowed: true };
}
