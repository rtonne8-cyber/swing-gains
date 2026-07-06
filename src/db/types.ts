// Data model per spec-v1.2.md section 7.
// Deviation (flagged): spec lists repRange/targetRPE as fixed fields on Exercise, but the
// exercise library prescribes different sets/reps/RPE for the same exercise across blocks
// (e.g. G-01 is 3x12 in Block 1, 4x8-10 in Block 2, 5x5 in Block 6). Exercise.repRange/
// targetRPE are kept as reference defaults for the Exercise detail view; the actual
// per-block working prescription lives on ExercisePrescription within SessionTemplate.

export type Venue = "gym" | "home";
export type SessionType = "G1" | "G2" | "H1";
export type DeviceRole = "master" | "satellite";
export type OriginDevice = "ipad" | "pixel";
export type MetricType =
  | "swing_speed"
  | "rom_thoracic"
  | "rom_hip"
  | "rom_reach"
  | "bodyweight";
export type SourceTag = "manual" | "import";
export type Side = "L" | "R";

export interface RepRange {
  min: number;
  max: number;
}

export interface Programme {
  id: string;
  name: string;
  startDate: string; // ISO date
  currentBlockId: string;
  // Not in spec §7's Programme field list, but required to display "weeks elapsed" on the
  // Next Up screen (spec §6 screen 1) and to drive the P2 block-transition rule (spec §3.3),
  // which is measured from block entry, not programme start. Reset whenever currentBlockId
  // changes.
  currentBlockStartDate: string; // ISO date
  cycleNumber: number;
  deviceRole: DeviceRole;
}

export interface TransitionRules {
  minSessions: number; // 15
  maxWeeks: number; // 8
  minWeeks: number; // 4
  minGymSessions: number; // 8 (guardrail, non-blocking)
  minHomeSessions: number; // 4 (guardrail, non-blocking)
}

export interface Block {
  id: string;
  sequence: number; // 1-8
  name: string;
  emphasis: string;
  sessionTemplateIds: string[];
  transitionRules: TransitionRules;
}

export interface ExercisePrescription {
  exerciseId: string;
  order: number;
  sets: number;
  // Exact text as authored in the library (never re-derive/invent), e.g. "8-12", "12/leg",
  // "30 m", "20 s/side", "max intent".
  repsDisplay: string;
  // Best-effort numeric rep range for future engine use; left undefined when the
  // prescription isn't a plain rep count (distance/time-based, or ladder-rung-based).
  repRange?: RepRange;
  perSide: boolean;
  // Best-effort numeric RPE ceiling; left undefined when the library gives a range or
  // qualitative note (e.g. "6-7", "max intent") rather than a single ceiling number.
  targetRPE?: number;
  rpeDisplay?: string;
  tempo?: string;
  note?: string; // e.g. "max intent", "control", pairing notes for contrast pairs
}

export interface SessionTemplate {
  id: string;
  blockId: string;
  venue: Venue;
  type: SessionType;
  name: string;
  exercisePrescriptions: ExercisePrescription[];
  // Template-wide notes transcribed verbatim from the library (tempo convention, "as Block
  // X at progressed rungs" carry-forward text, deload/taper flags). Kept as a single note
  // rather than duplicated onto every prescription to avoid inventing repetition the
  // library doesn't specify.
  notes?: string;
}

export interface Exercise {
  id: string;
  name: string;
  pattern: string;
  venue: Venue;
  ladderId?: string;
  cues: string;
  // Required (P1.1 addition): merged from docs/video-links.csv, joined on exerciseId.
  // For the 5 ladder-anchor exercises (H-01, H-02, H-03, H-04, H-09) this is still the
  // exercise-level overview description from that CSV; their per-rung video detail lives
  // on VariationLadder.rungs instead (see LadderRung below).
  description: string;
  repRange?: RepRange;
  targetRPE?: number;
  // Null for the 5 ladder-anchor exercises even though docs/video-links.csv carries a
  // value for them — rung-level video data (VariationLadder.rungs[n].videoUrl) supersedes
  // it, since the anchor's own videoUrl can only cover one rung's demonstration at a time.
  videoUrl: string | null;
  substitution?: string;
}

// P1.1 addition: per-rung video detail merged from docs/ladder-video-links.csv, joined on
// (ladder, rung). videoUrl is null where no adequate video was found (H-09 rung 1 is the
// one intentional case in the source data); timestampSec is undefined when the source
// video has no specific in-video timestamp for this rung.
export interface LadderRung {
  name: string;
  videoUrl: string | null;
  timestampSec?: number;
}

// Deviation (flagged): spec §7 models VariationLadder.exerciseIds as references to distinct
// Exercise records per rung. The library instead authors each ladder as a single pool
// exercise (e.g. H-01 "Squat ladder", ladderId -> L1) with rungs described as prose
// variations (section 3) — and AT-P1 requires exactly 49 Exercise records (G-01..G-24 +
// H-01..H-25), which is incompatible with one Exercise per rung. Rungs are modelled as
// ordered objects (name + optional video); the anchor Exercise (Exercise.ladderId) is
// shown together with rungs[ProgressionState.currentLadderRung] in the Session runner and
// Programme map.
export interface VariationLadder {
  id: string;
  pattern: string;
  rungs: LadderRung[]; // ordered rungs, index 0 = easiest
}

export interface SessionLog {
  id: string; // UUID
  templateId: string;
  date: string; // ISO datetime
  durationMin: number | null;
  completed: boolean;
  notes: string;
  originDevice: OriginDevice;
}

export interface SetLog {
  id: string; // UUID
  sessionLogId: string;
  exerciseId: string;
  setNo: number;
  reps: number | null;
  loadKg: number | null;
  rpe: number | null;
  tempo?: string;
}

export interface ProgressionState {
  exerciseId: string; // primary key
  currentPrescribedLoadKg: number | null;
  currentLadderRung: number | null; // index into VariationLadder.exerciseIds
  streakCount: number;
  lastUpdated: string; // ISO datetime
}

export interface MetricLog {
  id: string; // UUID
  date: string; // ISO datetime
  type: MetricType;
  value: number;
  unit: string;
  side?: Side;
  device?: string; // free-text label, e.g. "R10"
  sourceTag: SourceTag;
  linkedSessionLogId?: string;
}
