// Session-package transfer (spec §5.4, primary flow). Pure functions only — Dexie reads/
// writes live in src/db/transferIO.ts, which is a thin adapter over these.
import type { MetricLog, SessionLog, SetLog } from "../db/types";

export const SESSION_PACKAGE_VERSION = 1;

export interface SessionPackage {
  version: 1;
  exportedAt: string;
  sessionLog: SessionLog;
  setLogs: SetLog[];
  metricLogs: MetricLog[];
}

export function buildSessionPackage(
  sessionLog: SessionLog,
  allSetLogs: SetLog[],
  allMetricLogs: MetricLog[],
  exportedAt: string
): SessionPackage {
  return {
    version: SESSION_PACKAGE_VERSION,
    exportedAt,
    sessionLog,
    setLogs: allSetLogs.filter((s) => s.sessionLogId === sessionLog.id),
    metricLogs: allMetricLogs.filter((m) => m.linkedSessionLogId === sessionLog.id)
  };
}

export interface SessionPackageMergeResult {
  // Idempotent by design (TR-2): if the package's SessionLog id already exists on this
  // device, the whole package is treated as already-imported and nothing is added — a
  // session-package import is all-or-nothing per session, never a partial re-merge.
  alreadyImported: boolean;
  sessionLogToAdd: SessionLog | null;
  setLogsToAdd: SetLog[];
  metricLogsToAdd: MetricLog[];
}

export function mergeSessionPackage(
  pkg: SessionPackage,
  existingSessionLogIds: ReadonlySet<string>,
  existingSetLogIds: ReadonlySet<string>,
  existingMetricLogIds: ReadonlySet<string>
): SessionPackageMergeResult {
  if (existingSessionLogIds.has(pkg.sessionLog.id)) {
    return { alreadyImported: true, sessionLogToAdd: null, setLogsToAdd: [], metricLogsToAdd: [] };
  }

  return {
    alreadyImported: false,
    sessionLogToAdd: pkg.sessionLog,
    setLogsToAdd: pkg.setLogs.filter((s) => !existingSetLogIds.has(s.id)),
    metricLogsToAdd: pkg.metricLogs.filter((m) => !existingMetricLogIds.has(m.id))
  };
}
