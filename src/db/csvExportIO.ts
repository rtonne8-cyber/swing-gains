// Thin Dexie adapter over the pure CSV export engine (src/engine/csvExport.ts).
import { db } from "./schema";
import { buildCsvRows, csvRowsToString } from "../engine/csvExport";

export async function buildCsvExport(): Promise<string> {
  const [sessionLogs, setLogs, metricLogs, sessionTemplates, blocks, exercises] = await Promise.all([
    db.sessionLog.toArray(),
    db.setLog.toArray(),
    db.metricLog.toArray(),
    db.sessionTemplate.toArray(),
    db.block.toArray(),
    db.exercise.toArray()
  ]);

  const rows = buildCsvRows({ sessionLogs, setLogs, metricLogs, sessionTemplates, blocks, exercises });
  return csvRowsToString(rows);
}
