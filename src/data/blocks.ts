// Transcribed from docs/exercise-library-v1.0.md section 3.2 (Block structure) and
// spec-v1.2.md section 3.3 (transition rule, identical across all 8 blocks).
import type { Block, TransitionRules } from "../db/types";

const TRANSITION_RULES: TransitionRules = {
  minSessions: 15,
  maxWeeks: 8,
  minWeeks: 4,
  minGymSessions: 8,
  minHomeSessions: 4
};

export const BLOCKS: Block[] = [
  {
    id: "b1",
    sequence: 1,
    name: "Anatomical adaptation + baseline",
    emphasis: "Movement quality, tissue tolerance, load calibration",
    sessionTemplateIds: ["b1-g1", "b1-g2", "b1-h1"],
    transitionRules: TRANSITION_RULES
  },
  {
    id: "b2",
    sequence: 2,
    name: "Strength foundation",
    emphasis: "Main lifts, moderate volume",
    sessionTemplateIds: ["b2-g1", "b2-g2", "b2-h1"],
    transitionRules: TRANSITION_RULES
  },
  {
    id: "b3",
    sequence: 3,
    name: "Strength",
    emphasis: "Heavier, lower reps",
    sessionTemplateIds: ["b3-g1", "b3-g2", "b3-h1"],
    transitionRules: TRANSITION_RULES
  },
  {
    id: "b4",
    sequence: 4,
    name: "Power conversion",
    emphasis: "Contrast pairs (heavy to explosive), rotational throw variants",
    sessionTemplateIds: ["b4-g1", "b4-g2", "b4-h1"],
    transitionRules: TRANSITION_RULES
  },
  {
    id: "b5",
    sequence: 5,
    name: "Speed",
    emphasis: "Maximum-intent rotational work, swing-speed focus",
    sessionTemplateIds: ["b5-g1", "b5-g2", "b5-h1"],
    transitionRules: TRANSITION_RULES
  },
  {
    id: "b6",
    sequence: 6,
    name: "Strength 2",
    emphasis: "Consolidation at higher baseline",
    sessionTemplateIds: ["b6-g1", "b6-g2", "b6-h1"],
    transitionRules: TRANSITION_RULES
  },
  {
    id: "b7",
    sequence: 7,
    name: "Power / speed 2",
    emphasis: "Peak speed",
    sessionTemplateIds: ["b7-g1", "b7-g2", "b7-h1"],
    transitionRules: TRANSITION_RULES
  },
  {
    id: "b8",
    sequence: 8,
    name: "Stability + mobility emphasis",
    emphasis: "Concentrated ROM and anti-rotation work; strength maintenance",
    sessionTemplateIds: ["b8-g1", "b8-g2", "b8-h1"],
    transitionRules: TRANSITION_RULES
  }
];
