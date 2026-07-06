// Full-state export/import (spec §5.4, secondary flow — backup and device seeding). Pure
// functions only — Dexie reads/writes live in src/db/transferIO.ts.
//
// Library content (Block/SessionTemplate/Exercise/VariationLadder) is deliberately excluded
// from the payload: every device seeds that content itself from src/data (idempotent,
// spec-authoritative, never user-edited in P2 scope), so shipping it around would just be a
// second, driftable copy of the same seed. ProgressionState is excluded too — it is always
// recomputed fresh from the imported sessionLogs/setLogs (src/engine/progression.ts), never
// carried across as raw data, so an import can never install stale derived state.
import type { MetricLog, Programme, SessionLog, SetLog } from "../db/types";

export const FULL_STATE_VERSION = 1;
export const FULL_STATE_CONFIRMATION_PHRASE = "REPLACE ALL DATA";

export interface FullStateExport {
  version: 1;
  exportedAt: string;
  programme: Programme;
  sessionLogs: SessionLog[];
  setLogs: SetLog[];
  metricLogs: MetricLog[];
}

export function buildFullStateExport(
  programme: Programme,
  sessionLogs: SessionLog[],
  setLogs: SetLog[],
  metricLogs: MetricLog[],
  exportedAt: string
): FullStateExport {
  return { version: FULL_STATE_VERSION, exportedAt, programme, sessionLogs, setLogs, metricLogs };
}

export interface FullStateImportCheck {
  allowed: boolean;
  reason?: string;
}

// hasExistingData should reflect whether the *importing* device already has any logs —
// confirmation is only required when an import would overwrite something (spec §5.4:
// "Import of a full-state file onto a device with existing data requires explicit typed
// confirmation"). A freshly-seeded device (no logs yet) can import without typing anything.
export function validateFullStateImport(
  data: Pick<FullStateExport, "version">,
  hasExistingData: boolean,
  typedConfirmation: string
): FullStateImportCheck {
  if (data.version !== FULL_STATE_VERSION) {
    return { allowed: false, reason: `unsupported full-state export version: ${String(data.version)}` };
  }
  // Tolerate accidental leading/trailing whitespace (a real UX trap otherwise) but keep exact
  // case — deliberate friction on a destructive, irreversible action is the point.
  if (hasExistingData && typedConfirmation.trim() !== FULL_STATE_CONFIRMATION_PHRASE) {
    return { allowed: false, reason: `type "${FULL_STATE_CONFIRMATION_PHRASE}" exactly to replace this device's existing data` };
  }
  return { allowed: true };
}
