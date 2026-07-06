// Pure helper for the progression engine (spec §3.4). ExercisePrescription.repRange is left
// undefined in the seeded content whenever a prescription isn't a plain rep count (see the
// flagged deviation in src/db/types.ts) — session templates carry the number only inside
// `repsDisplay` text (e.g. "8-10", "12/leg", "rung target 15"). Rather than hand-transcribing
// a repRange onto ~100 prescriptions (risking drift from the already-verified P1 library
// content), the engine parses the number straight out of repsDisplay at recompute time.
import type { RepRange } from "../db/types";

// Matches a trailing rep count or range, with an optional "/leg" or "/side" suffix, so it
// finds the number regardless of leading prose ("rung target 15") while correctly rejecting
// distance ("30 m"), time ("20 s/side") and purely qualitative text ("current rung", "per
// rung", "full mobility sequence") — none of those end in a bare number.
const REP_TARGET_PATTERN = /(\d+)(?:-(\d+))?\s*(?:\/(?:leg|side))?$/i;

export function parseRepTarget(repsDisplay: string): RepRange | undefined {
  const match = repsDisplay.trim().match(REP_TARGET_PATTERN);
  if (!match) return undefined;
  const min = Number(match[1]);
  const max = match[2] ? Number(match[2]) : min;
  return { min, max };
}
