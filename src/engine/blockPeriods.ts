// Groups completed sessions into contiguous same-block occupancy periods, ordered
// chronologically. Deliberately derived from session order rather than a stored cycle number —
// SessionLog carries no cycleNumber (spec §7), so a year-2 revisit to a blockId already used in
// year 1 (spec §3.2 cycling) naturally becomes its own later period here, with no extra schema.
import type { SessionLog, SessionTemplate } from "../db/types";

export interface BlockPeriod {
  blockId: string;
  startDate: string;
  endDate: string;
}

export function blockPeriods(sessionLogs: SessionLog[], sessionTemplates: SessionTemplate[]): BlockPeriod[] {
  const templateById = new Map(sessionTemplates.map((t) => [t.id, t]));
  const dated = input(sessionLogs, templateById);

  const periods: BlockPeriod[] = [];
  for (const { date, blockId } of dated) {
    const current = periods[periods.length - 1];
    if (current && current.blockId === blockId) {
      current.endDate = date;
    } else {
      periods.push({ blockId, startDate: date, endDate: date });
    }
  }
  return periods;
}

function input(
  sessionLogs: SessionLog[],
  templateById: Map<string, SessionTemplate>
): { date: string; blockId: string }[] {
  return sessionLogs
    .filter((s) => s.completed)
    .map((s) => ({ date: s.date, blockId: templateById.get(s.templateId)?.blockId }))
    .filter((s): s is { date: string; blockId: string } => !!s.blockId)
    .sort((a, b) => a.date.localeCompare(b.date));
}
