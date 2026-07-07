// App-side CSV export (spec §8.1). One row per SetLog and per MetricLog, flat/long format,
// column contract exact and ordered: date, block, sessionType, venue, exercise, setNo, reps,
// loadKg, rpe, metricType, metricValue, unit, device. Pure and Dexie-free — src/db/csvExportIO.ts
// is the thin adapter that pulls the tables and calls this.
//
// Caveat carried from src/db/types.ts (SetLog.reps): wherever the logged exercise's current
// rung was time-targeted (Library v1.0.1), the `reps` column here is seconds held, not a rep
// count. This isn't re-derivable per historical row without replaying ladder rung state at
// each date, so it is not re-labelled or split into a separate column — documented here and on
// the Settings screen's export section instead.
import type { Block, Exercise, MetricLog, SessionLog, SessionTemplate, SetLog } from "../db/types";

export const CSV_COLUMNS = [
  "date",
  "block",
  "sessionType",
  "venue",
  "exercise",
  "setNo",
  "reps",
  "loadKg",
  "rpe",
  "metricType",
  "metricValue",
  "unit",
  "device"
] as const;

export type CsvColumn = (typeof CSV_COLUMNS)[number];
export type CsvRow = Record<CsvColumn, string | number | null>;

function emptyRow(): CsvRow {
  return {
    date: "",
    block: "",
    sessionType: "",
    venue: "",
    exercise: "",
    setNo: "",
    reps: "",
    loadKg: "",
    rpe: "",
    metricType: "",
    metricValue: "",
    unit: "",
    device: ""
  };
}

export interface CsvExportInput {
  sessionLogs: SessionLog[];
  setLogs: SetLog[];
  metricLogs: MetricLog[];
  sessionTemplates: SessionTemplate[];
  blocks: Block[];
  exercises: Exercise[];
}

// Row count is deliberately setLogs.length + metricLogs.length (AT-P3 #1) — every SetLog and
// MetricLog produces exactly one row, regardless of session completion state; the export is a
// raw log dump, not a filtered report.
export function buildCsvRows(input: CsvExportInput): CsvRow[] {
  const sessionById = new Map(input.sessionLogs.map((s) => [s.id, s]));
  const templateById = new Map(input.sessionTemplates.map((t) => [t.id, t]));
  const blockById = new Map(input.blocks.map((b) => [b.id, b]));
  const exerciseById = new Map(input.exercises.map((e) => [e.id, e]));

  const rows: CsvRow[] = [];

  for (const setLog of input.setLogs) {
    const session = sessionById.get(setLog.sessionLogId);
    const template = session ? templateById.get(session.templateId) : undefined;
    const block = template ? blockById.get(template.blockId) : undefined;
    const exercise = exerciseById.get(setLog.exerciseId);

    const row = emptyRow();
    row.date = session?.date ?? "";
    row.block = block ? `Block ${block.sequence}: ${block.name}` : "";
    row.sessionType = template?.type ?? "";
    row.venue = template?.venue ?? "";
    row.exercise = exercise?.name ?? setLog.exerciseId;
    row.setNo = setLog.setNo;
    row.reps = setLog.reps;
    row.loadKg = setLog.loadKg;
    row.rpe = setLog.rpe;
    rows.push(row);
  }

  for (const metric of input.metricLogs) {
    const row = emptyRow();
    row.date = metric.date;
    row.metricType = metric.type;
    row.metricValue = metric.value;
    row.unit = metric.unit;
    row.device = metric.device ?? "";
    rows.push(row);
  }

  return rows.sort((a, b) => String(a.date).localeCompare(String(b.date)));
}

// RFC4180-style escaping: quote a field only when it contains a comma, quote, or newline;
// double up any embedded quotes.
function csvEscape(value: string | number | null): string {
  const s = value == null ? "" : String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function csvRowsToString(rows: CsvRow[]): string {
  const lines = [CSV_COLUMNS.join(",")];
  for (const row of rows) {
    lines.push(CSV_COLUMNS.map((col) => csvEscape(row[col])).join(","));
  }
  return lines.join("\r\n");
}
