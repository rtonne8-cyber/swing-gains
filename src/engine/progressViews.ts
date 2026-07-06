// Pure derivations for the Progress screen (spec §6 screen 4): load trend per main lift,
// swing speed trend, ROM scores, session frequency strip. No Dexie access — the screen reads
// raw logs and passes them in, same pattern as src/engine/queues.ts.
import type { MetricLog, MetricType, SessionLog, SetLog } from "../db/types";

export interface LoadTrendPoint {
  date: string;
  loadKg: number;
}

// One point per completed session that logged this exercise, using the same "load actually
// used" convention as the progression engine (src/engine/progression.ts): the highest-setNo
// SetLog's loadKg for that session.
export function loadTrendSeries(exerciseId: string, sessionLogs: SessionLog[], setLogs: SetLog[]): LoadTrendPoint[] {
  const completedIds = new Set(sessionLogs.filter((s) => s.completed).map((s) => s.id));
  const bySession = new Map<string, SetLog[]>();
  for (const s of setLogs) {
    if (s.exerciseId !== exerciseId || !completedIds.has(s.sessionLogId)) continue;
    const list = bySession.get(s.sessionLogId) ?? [];
    list.push(s);
    bySession.set(s.sessionLogId, list);
  }

  const points: LoadTrendPoint[] = [];
  for (const session of sessionLogs) {
    const sets = bySession.get(session.id);
    if (!sets || sets.length === 0) continue;
    const last = sets.reduce((latest, s) => (s.setNo > latest.setNo ? s : latest));
    if (last.loadKg != null) points.push({ date: session.date, loadKg: last.loadKg });
  }
  return points.sort((a, b) => a.date.localeCompare(b.date));
}

export interface MetricPoint {
  date: string;
  value: number;
  unit: string;
  side?: "L" | "R";
  device?: string;
}

function metricSeries(metricLogs: MetricLog[], type: MetricType): MetricPoint[] {
  return metricLogs
    .filter((m) => m.type === type)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((m) => ({ date: m.date, value: m.value, unit: m.unit, side: m.side, device: m.device }));
}

export function swingSpeedTrend(metricLogs: MetricLog[]): MetricPoint[] {
  return metricSeries(metricLogs, "swing_speed");
}

export function romTrend(metricLogs: MetricLog[], type: "rom_thoracic" | "rom_hip" | "rom_reach"): MetricPoint[] {
  return metricSeries(metricLogs, type);
}

export interface FrequencyWeek {
  weekStartISO: string;
  count: number;
}

// Completed sessions per week, most recent `weeks` weeks, oldest first — for a simple
// frequency strip (spec §6 screen 4 "session frequency strip").
export function sessionFrequencyStrip(sessionLogs: SessionLog[], weeks: number, nowISO: string): FrequencyWeek[] {
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const now = new Date(nowISO).getTime();
  const completed = sessionLogs.filter((s) => s.completed);

  const buckets: FrequencyWeek[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = now - (i + 1) * msPerWeek;
    const weekEnd = now - i * msPerWeek;
    const count = completed.filter((s) => {
      const t = new Date(s.date).getTime();
      return t >= weekStart && t < weekEnd;
    }).length;
    buckets.push({ weekStartISO: new Date(weekStart).toISOString(), count });
  }
  return buckets;
}
