// Transcribed verbatim from docs/exercise-library-v1.0.md section 3 (Variation Ladders).
// Per-rung videoUrl/timestampSec merged from docs/ladder-video-links.csv (joined on
// ladder+rung) via scripts/merge-video-links.mjs — do not hand-edit those two fields,
// re-run the script instead. H-09 rung 1 (Low-amplitude hop-and-stick) intentionally has
// no video (none adequate was found); videoUrl is null.
//
// repTarget/timeTargetSec/perSide (P2.1, Library v1.0.1 rung target table, LD-1 content
// fix) ARE hand-maintained here — they're not part of the video merge. Every rung has
// exactly one of repTarget/timeTargetSec (enforced in validateLibrary.ts); L4 (side plank)
// is the one ladder that mixes both — rungs 1-3 are timed holds, rungs 4-5 are reps.
import type { VariationLadder } from "../db/types";

export const LADDERS: VariationLadder[] = [
  {
    id: "L1",
    pattern: "Squat",
    rungs: [
      { name: "Bodyweight squat", videoUrl: "https://www.youtube.com/watch?v=9h9RnjOJFgg", timestampSec: 183, repTarget: 15, perSide: false },
      { name: "3-1-X tempo squat", videoUrl: "https://www.youtube.com/watch?v=lweUB-4SF5w", repTarget: 10, perSide: false },
      { name: "Split squat", videoUrl: "https://www.youtube.com/watch?v=9h9RnjOJFgg", timestampSec: 275, repTarget: 10, perSide: true },
      { name: "Rear-foot-elevated split squat (chair)", videoUrl: "https://www.youtube.com/watch?v=9h9RnjOJFgg", timestampSec: 307, repTarget: 8, perSide: true },
      { name: "Jump squat", videoUrl: "https://www.youtube.com/watch?v=A-cFYWvaHr0", repTarget: 6, perSide: false },
      { name: "Single-leg box squat (to chair)", videoUrl: "https://www.youtube.com/watch?v=bfLZAmA4RiI", repTarget: 5, perSide: true }
    ]
  },
  {
    id: "L2",
    pattern: "Push",
    rungs: [
      { name: "Incline push-up (worktop)", videoUrl: "https://www.youtube.com/watch?v=J-R3fk2JqS4", timestampSec: 110, repTarget: 12, perSide: false },
      { name: "Push-up", videoUrl: "https://www.youtube.com/watch?v=IODxDxX7oi4", timestampSec: 79, repTarget: 10, perSide: false },
      { name: "Feet-elevated push-up", videoUrl: "https://www.youtube.com/watch?v=xoX1nSewXgA", repTarget: 10, perSide: false },
      { name: "Archer push-up", videoUrl: "https://www.youtube.com/watch?v=eZNvTorsU6I", timestampSec: 71, repTarget: 6, perSide: true },
      { name: "Plyo push-up", videoUrl: "https://www.youtube.com/watch?v=GR0ZL7f7u18", repTarget: 5, perSide: false }
    ]
  },
  {
    id: "L3",
    pattern: "Bridge",
    rungs: [
      { name: "Glute bridge", videoUrl: "https://www.youtube.com/watch?v=7vTnfE6oiXk", timestampSec: 53, repTarget: 15, perSide: false },
      { name: "Glute bridge march", videoUrl: "https://www.youtube.com/watch?v=7vTnfE6oiXk", timestampSec: 359, repTarget: 10, perSide: true },
      { name: "Single-leg glute bridge", videoUrl: "https://www.youtube.com/watch?v=7vTnfE6oiXk", timestampSec: 481, repTarget: 8, perSide: true },
      { name: "Single-leg bridge 3 s pause", videoUrl: "https://www.youtube.com/watch?v=x9qUThV02no", repTarget: 5, perSide: true }
    ]
  },
  {
    id: "L4",
    pattern: "Side plank",
    rungs: [
      { name: "Knees", videoUrl: "https://www.youtube.com/watch?v=aorw__LL-DA", timestampSec: 165, timeTargetSec: 30, perSide: true },
      { name: "Full, 20 s", videoUrl: "https://www.youtube.com/watch?v=aorw__LL-DA", timestampSec: 243, timeTargetSec: 20, perSide: true },
      { name: "Full, 40 s", videoUrl: "https://www.youtube.com/watch?v=aorw__LL-DA", timestampSec: 243, timeTargetSec: 40, perSide: true },
      { name: "Feet-stacked + reach-through", videoUrl: "https://www.youtube.com/watch?v=TfLt8orAiiQ", repTarget: 8, perSide: true },
      { name: "Side plank leg lift", videoUrl: "https://www.youtube.com/watch?v=uCPYhYDGJ5Q", repTarget: 10, perSide: true }
    ]
  },
  {
    id: "L5",
    pattern: "Rotational hop",
    rungs: [
      { name: "Low-amplitude hop-and-stick", videoUrl: null, repTarget: 5, perSide: true },
      { name: "90-degree hop-and-stick", videoUrl: "https://www.youtube.com/watch?v=0aZres4LbZI", repTarget: 4, perSide: true },
      { name: "180-degree hop", videoUrl: "https://www.youtube.com/watch?v=xTjBP85moMo", repTarget: 3, perSide: true },
      { name: "Continuous 90-degree hops", videoUrl: "https://www.youtube.com/watch?v=HGYrwx2MDZg", repTarget: 8, perSide: false }
    ]
  }
];
