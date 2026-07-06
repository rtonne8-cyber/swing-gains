// Transcribed verbatim from docs/exercise-library-v1.0.md section 3 (Variation Ladders).
// Per-rung videoUrl/timestampSec merged from docs/ladder-video-links.csv (joined on
// ladder+rung) via scripts/merge-video-links.mjs — do not hand-edit the merged fields,
// re-run the script instead. H-09 rung 1 (Low-amplitude hop-and-stick) intentionally has
// no video (none adequate was found); videoUrl is null.
import type { VariationLadder } from "../db/types";

export const LADDERS: VariationLadder[] = [
  {
    id: "L1",
    pattern: "Squat",
    rungs: [
      { name: "Bodyweight squat", videoUrl: "https://www.youtube.com/watch?v=9h9RnjOJFgg", timestampSec: 183 },
      { name: "3-1-X tempo squat", videoUrl: "https://www.youtube.com/watch?v=lweUB-4SF5w" },
      { name: "Split squat", videoUrl: "https://www.youtube.com/watch?v=9h9RnjOJFgg", timestampSec: 275 },
      { name: "Rear-foot-elevated split squat (chair)", videoUrl: "https://www.youtube.com/watch?v=9h9RnjOJFgg", timestampSec: 307 },
      { name: "Jump squat", videoUrl: "https://www.youtube.com/watch?v=A-cFYWvaHr0" },
      { name: "Single-leg box squat (to chair)", videoUrl: "https://www.youtube.com/watch?v=bfLZAmA4RiI" }
    ]
  },
  {
    id: "L2",
    pattern: "Push",
    rungs: [
      { name: "Incline push-up (worktop)", videoUrl: "https://www.youtube.com/watch?v=J-R3fk2JqS4", timestampSec: 110 },
      { name: "Push-up", videoUrl: "https://www.youtube.com/watch?v=IODxDxX7oi4", timestampSec: 79 },
      { name: "Feet-elevated push-up", videoUrl: "https://www.youtube.com/watch?v=xoX1nSewXgA" },
      { name: "Archer push-up", videoUrl: "https://www.youtube.com/watch?v=eZNvTorsU6I", timestampSec: 71 },
      { name: "Plyo push-up", videoUrl: "https://www.youtube.com/watch?v=GR0ZL7f7u18" }
    ]
  },
  {
    id: "L3",
    pattern: "Bridge",
    rungs: [
      { name: "Glute bridge", videoUrl: "https://www.youtube.com/watch?v=7vTnfE6oiXk", timestampSec: 53 },
      { name: "Glute bridge march", videoUrl: "https://www.youtube.com/watch?v=7vTnfE6oiXk", timestampSec: 359 },
      { name: "Single-leg glute bridge", videoUrl: "https://www.youtube.com/watch?v=7vTnfE6oiXk", timestampSec: 481 },
      { name: "Single-leg bridge 3 s pause", videoUrl: "https://www.youtube.com/watch?v=x9qUThV02no" }
    ]
  },
  {
    id: "L4",
    pattern: "Side plank",
    rungs: [
      { name: "Knees", videoUrl: "https://www.youtube.com/watch?v=aorw__LL-DA", timestampSec: 165 },
      { name: "Full, 20 s", videoUrl: "https://www.youtube.com/watch?v=aorw__LL-DA", timestampSec: 243 },
      { name: "Full, 40 s", videoUrl: "https://www.youtube.com/watch?v=aorw__LL-DA", timestampSec: 243 },
      { name: "Feet-stacked + reach-through", videoUrl: "https://www.youtube.com/watch?v=TfLt8orAiiQ" },
      { name: "Side plank leg lift", videoUrl: "https://www.youtube.com/watch?v=uCPYhYDGJ5Q" }
    ]
  },
  {
    id: "L5",
    pattern: "Rotational hop",
    rungs: [
      { name: "Low-amplitude hop-and-stick", videoUrl: null },
      { name: "90-degree hop-and-stick", videoUrl: "https://www.youtube.com/watch?v=0aZres4LbZI" },
      { name: "180-degree hop", videoUrl: "https://www.youtube.com/watch?v=xTjBP85moMo" },
      { name: "Continuous 90-degree hops", videoUrl: "https://www.youtube.com/watch?v=HGYrwx2MDZg" }
    ]
  }
];
