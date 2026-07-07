// Pure implementations of the four Weakness_Panel RAG signals spec §8.2 names but gives no
// formula for: stalled lifts, ROM stagnation, speed plateau despite strength gains (the
// "swing-speed correlation" signal — spec §6 screen 4 / P3 scope), and session-frequency
// drift. Interpretive, deliberately conservative reading of each spec bullet (flagged, like
// blockTransition.ts's BT-4 pace-deficit formula): spec gives no exact arithmetic, so each
// function documents the reading it implements. Used both by the in-app Progress screen and as
// the reference implementation the tracker's Excel/Sheets formulas (docs/tracker) are built to
// match on the same fixture data.
//
// "Completed period" below always means all but the LAST entry in a blockPeriods() list — the
// last period is assumed to be the block currently in progress, not yet a fair subject for a
// "no change across a full block" verdict.
import type { BlockPeriod } from "./blockPeriods";
import type { LoadTrendPoint, MetricPoint, FrequencyWeek } from "./progressViews";

function pointsWithin<T extends { date: string }>(points: T[], period: BlockPeriod): T[] {
  return points.filter((p) => p.date >= period.startDate && p.date <= period.endDate);
}

// "No load increase across a full block": the last completed period's peak load never exceeds
// its first logged load for this lift. Fewer than 2 data points in that period is treated as
// "not enough signal", not a stall.
export function stalledLiftSignal(loadSeries: LoadTrendPoint[], periods: BlockPeriod[]): boolean {
  const completed = periods.slice(0, -1);
  if (completed.length === 0) return false;
  const period = completed[completed.length - 1];
  const pts = pointsWithin(loadSeries, period);
  if (pts.length < 2) return false;
  const first = pts[0].loadKg;
  const max = Math.max(...pts.map((p) => p.loadKg));
  return max <= first;
}

// "No grade change across two transitions": the last reading in each of the two most recent
// completed periods is equal. Needs at least two completed periods to compare across.
export function romStagnationSignal(romSeries: MetricPoint[], periods: BlockPeriod[]): boolean {
  const completed = periods.slice(0, -1);
  if (completed.length < 2) return false;
  const [prev, last] = completed.slice(-2);
  const prevPts = pointsWithin(romSeries, prev);
  const lastPts = pointsWithin(romSeries, last);
  if (prevPts.length === 0 || lastPts.length === 0) return false;
  return prevPts[prevPts.length - 1].value === lastPts[lastPts.length - 1].value;
}

// "Speed plateau despite strength gains" (power-transfer failure signal): within the last
// completed period, this lift's load rose while swing speed was flat or fell.
export function speedPlateauSignal(speedSeries: MetricPoint[], loadSeries: LoadTrendPoint[], periods: BlockPeriod[]): boolean {
  const completed = periods.slice(0, -1);
  if (completed.length === 0) return false;
  const period = completed[completed.length - 1];
  const loadPts = pointsWithin(loadSeries, period);
  const speedPts = pointsWithin(speedSeries, period);
  if (loadPts.length < 2 || speedPts.length < 2) return false;
  const loadIncreased = loadPts[loadPts.length - 1].loadKg > loadPts[0].loadKg;
  const speedFlatOrDown = speedPts[speedPts.length - 1].value <= speedPts[0].value;
  return loadIncreased && speedFlatOrDown;
}

// "<2/week rolling": average completed-session count over the most recent `rollingWeeks`
// buckets from sessionFrequencyStrip() falls below 2. A window with zero sessions logged at
// all (e.g. a brand-new install, or the strip's very first week before anything has run) is
// "no signal yet", not "drift" — same insufficient-data guard as the other three signals.
export function frequencyDriftSignal(frequency: FrequencyWeek[], rollingWeeks = 4): boolean {
  const recent = frequency.slice(-rollingWeeks);
  const total = recent.reduce((sum, w) => sum + w.count, 0);
  if (total === 0) return false;
  return total / recent.length < 2;
}
