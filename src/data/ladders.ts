// Transcribed verbatim from docs/exercise-library-v1.0.md section 3 (Variation Ladders).
import type { VariationLadder } from "../db/types";

export const LADDERS: VariationLadder[] = [
  {
    id: "L1",
    pattern: "Squat",
    rungs: [
      "Bodyweight squat",
      "3-1-X tempo squat",
      "Split squat",
      "Rear-foot-elevated split squat (chair)",
      "Jump squat",
      "Single-leg box squat (to chair)"
    ]
  },
  {
    id: "L2",
    pattern: "Push",
    rungs: [
      "Incline push-up (worktop)",
      "Push-up",
      "Feet-elevated push-up",
      "Archer push-up",
      "Plyo push-up"
    ]
  },
  {
    id: "L3",
    pattern: "Bridge",
    rungs: [
      "Glute bridge",
      "Glute bridge march",
      "Single-leg glute bridge",
      "Single-leg bridge 3 s pause"
    ]
  },
  {
    id: "L4",
    pattern: "Side plank",
    rungs: [
      "Knees",
      "Full, 20 s",
      "Full, 40 s",
      "Feet-stacked + reach-through",
      "Side plank leg lift"
    ]
  },
  {
    id: "L5",
    pattern: "Rotational hop",
    rungs: ["Low-amplitude hop-and-stick", "90-degree hop-and-stick", "180-degree hop", "Continuous 90-degree hops"]
  }
];
