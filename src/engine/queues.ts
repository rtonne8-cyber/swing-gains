// Pure functions computing the dual venue queues (spec section 3.1, screen 1). No Dexie
// access here — callers read logs/templates from the DB and pass plain data in, so this is
// directly Vitest-testable and reusable by both the Next Up screen and its tests.
import type { SessionLog, SessionTemplate } from "../db/types";

export interface NextUpState {
  nextGymTemplateId: string;
  nextHomeTemplateId: string;
  gymSessionsCompleted: number;
  homeSessionsCompleted: number;
  totalSessionsCompleted: number;
  weeksElapsed: number;
}

function completedInBlock(logs: SessionLog[], blockTemplateIds: Set<string>): SessionLog[] {
  return logs.filter((l) => l.completed && blockTemplateIds.has(l.templateId));
}

function sortByDateAsc(logs: SessionLog[]): SessionLog[] {
  return [...logs].sort((a, b) => a.date.localeCompare(b.date));
}

export function nextGymTemplateId(
  gymTemplates: SessionTemplate[],
  completedGymLogsAscending: SessionLog[]
): string {
  const g1 = gymTemplates.find((t) => t.type === "G1");
  const g2 = gymTemplates.find((t) => t.type === "G2");
  if (!g1 || !g2) {
    throw new Error("a block must define exactly one G1 and one G2 session template");
  }
  if (completedGymLogsAscending.length === 0) return g1.id;
  const last = completedGymLogsAscending[completedGymLogsAscending.length - 1];
  const lastTemplate = gymTemplates.find((t) => t.id === last.templateId);
  if (!lastTemplate) {
    throw new Error(`session log ${last.id} references a template not in this block: ${last.templateId}`);
  }
  return lastTemplate.type === "G1" ? g2.id : g1.id;
}

export function nextHomeTemplateId(homeTemplates: SessionTemplate[]): string {
  if (homeTemplates.length === 0) {
    throw new Error("a block must define at least one home session template");
  }
  return homeTemplates[0].id;
}

export function weeksElapsed(blockStartDateISO: string, nowISO: string): number {
  const start = new Date(blockStartDateISO).getTime();
  const now = new Date(nowISO).getTime();
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  return Math.max(0, Math.floor((now - start) / msPerWeek));
}

export function computeNextUp(
  blockTemplates: SessionTemplate[],
  allSessionLogs: SessionLog[],
  blockStartDateISO: string,
  nowISO: string
): NextUpState {
  const blockTemplateIds = new Set(blockTemplates.map((t) => t.id));
  const gymTemplates = blockTemplates.filter((t) => t.venue === "gym");
  const homeTemplates = blockTemplates.filter((t) => t.venue === "home");

  const completed = completedInBlock(allSessionLogs, blockTemplateIds);
  const completedGym = sortByDateAsc(completed.filter((l) => gymTemplates.some((t) => t.id === l.templateId)));
  const completedHome = completed.filter((l) => homeTemplates.some((t) => t.id === l.templateId));

  return {
    nextGymTemplateId: nextGymTemplateId(gymTemplates, completedGym),
    nextHomeTemplateId: nextHomeTemplateId(homeTemplates),
    gymSessionsCompleted: completedGym.length,
    homeSessionsCompleted: completedHome.length,
    totalSessionsCompleted: completed.length,
    weeksElapsed: weeksElapsed(blockStartDateISO, nowISO)
  };
}
