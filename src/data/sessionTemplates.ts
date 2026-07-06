// Transcribed from docs/exercise-library-v1.0.md section 4 (Block Templates).
// Where the library says "as Block X" / "as Block X at progressed rungs" for a session,
// the full exercise list is expanded here (rather than left as a cross-reference) so each
// template stands alone for the engine and UI, with a `notes` field preserving the
// library's original carry-forward wording. Accessory slots without a stated RPE in the
// library are left with targetRPE/rpeDisplay undefined rather than invented.
import type { ExercisePrescription, SessionTemplate } from "../db/types";

let seq = 0;
function rx(
  exerciseId: string,
  sets: number,
  repsDisplay: string,
  opts: Partial<Omit<ExercisePrescription, "exerciseId" | "sets" | "repsDisplay" | "order">> = {}
): ExercisePrescription {
  seq += 1;
  return { exerciseId, order: seq, sets, repsDisplay, perSide: false, ...opts };
}

function template(
  id: string,
  blockId: string,
  venue: "gym" | "home",
  type: "G1" | "G2" | "H1",
  name: string,
  prescriptions: ExercisePrescription[],
  notes?: string
): SessionTemplate {
  seq = 0;
  return { id, blockId, venue, type, name, exercisePrescriptions: prescriptions, notes };
}

// ---- Block 1 ----
const b1g1 = template(
  "b1-g1",
  "b1",
  "gym",
  "G1",
  "Gym: lower + push",
  [
    rx("G-01", 3, "12", { targetRPE: 6 }),
    rx("G-04", 3, "12", { targetRPE: 6 }),
    rx("G-08", 2, "12/leg", { perSide: true, rpeDisplay: "6-7" }),
    rx("G-11", 3, "10/side", { perSide: true, targetRPE: 6 }),
    rx("G-20", 3, "30 m", { targetRPE: 6 }),
    rx("H-13", 2, "8/side", { perSide: true })
  ],
  "Tempo 2-0-2 throughout."
);

const b1g2 = template(
  "b1-g2",
  "b1",
  "gym",
  "G2",
  "Gym: hinge + pull",
  [
    rx("G-03", 3, "12", { targetRPE: 6 }),
    rx("G-07", 3, "12", { targetRPE: 6 }),
    rx("G-06", 2, "12", { rpeDisplay: "6-7" }),
    rx("G-18", 3, "12", { rpeDisplay: "6-7" }),
    rx("G-21", 2, "15", { targetRPE: 6 }),
    rx("H-15", 2, "8/side", { perSide: true })
  ],
  "Tempo 2-0-2 throughout."
);

const b1h1 = template(
  "b1-h1",
  "b1",
  "home",
  "H1",
  "Home (~30 min)",
  [
    rx("H-01", 3, "rung target 15"),
    rx("H-02", 3, "rung target 10-12"),
    rx("H-03", 3, "15"),
    rx("H-05", 3, "8/side", { perSide: true }),
    rx("H-04", 3, "per rung"),
    rx("H-17", 1, "5/side", { perSide: true, note: "finisher" }),
    rx("H-14", 1, "8/side", { perSide: true, note: "finisher" }),
    rx("H-18", 1, "10", { note: "finisher" })
  ],
  "Circuit x3 for the main block. Week 1: baseline ROM tests logged."
);

// ---- Block 2 ----
const b2g1 = template("b2-g1", "b2", "gym", "G1", "Gym: lower + push", [
  rx("G-01", 4, "8-10", { targetRPE: 8, rpeDisplay: "7-8" }),
  rx("G-04", 4, "8-10", { targetRPE: 8, rpeDisplay: "7-8" }),
  rx("G-08", 3, "10/leg", { perSide: true }),
  rx("G-10", 2, "10/side", { perSide: true }),
  rx("G-11", 3, "10/side", { perSide: true }),
  rx("G-24", 2, "30 m/side", { perSide: true })
]);

const b2g2 = template("b2-g2", "b2", "gym", "G2", "Gym: hinge + pull", [
  rx("G-02", 4, "8", { targetRPE: 8, rpeDisplay: "7-8" }),
  rx("G-06", 4, "8-10"),
  rx("G-07", 3, "10"),
  rx("G-18", 3, "10"),
  rx("G-12", 3, "10/side", { perSide: true, note: "light, control" }),
  rx("G-21", 2, "15")
]);

const b2h1 = template(
  "b2-h1",
  "b2",
  "home",
  "H1",
  "Home",
  [
    rx("H-01", 3, "current rung"),
    rx("H-02", 3, "current rung"),
    rx("H-03", 3, "current rung"),
    rx("H-06", 1, "8/side", { perSide: true }),
    rx("H-04", 1, "per rung"),
    rx("H-07", 2, "15 s/side", { perSide: true }),
    rx("H-11", 2, "15", { note: "intro, reactive prep" })
  ],
  "Circuit x3: L1/L2/L3 at current rungs. Mobility finisher as Block 1."
);

// ---- Block 3 ----
const b3g1 = template("b3-g1", "b3", "gym", "G1", "Gym: lower + push", [
  rx("G-01", 4, "5-6", { targetRPE: 8 }),
  rx("G-04", 4, "5-6", { targetRPE: 8 }),
  rx("G-08", 3, "8/leg", { perSide: true }),
  rx("G-11", 3, "10/side", { perSide: true }),
  rx("G-24", 3, "30 m/side", { perSide: true })
]);

const b3g2 = template("b3-g2", "b3", "gym", "G2", "Gym: hinge + pull", [
  rx("G-02", 4, "4-5", { targetRPE: 8 }),
  rx("G-06", 4, "6"),
  rx("G-07", 3, "8"),
  rx("G-19", 2, "8/leg", { perSide: true }),
  rx("G-12", 3, "10/side", { perSide: true }),
  rx("G-21", 2, "15")
]);

const b3h1 = template(
  "b3-h1",
  "b3",
  "home",
  "H1",
  "Home",
  [
    rx("H-01", 3, "current rung"),
    rx("H-02", 3, "current rung"),
    rx("H-03", 3, "current rung"),
    rx("H-06", 1, "8/side", { perSide: true }),
    rx("H-04", 1, "per rung"),
    rx("H-07", 2, "15 s/side", { perSide: true }),
    rx("H-11", 2, "15"),
    rx("H-09", 3, "4/side", { perSide: true, note: "rung 1-2, stick each landing" }),
    rx("H-22", 3, "20 s")
  ],
  "As Block 2 at progressed rungs, plus H-09 rotational hop (new) and H-22 hollow hold (new)."
);

// ---- Block 4 ----
const b4g1 = template(
  "b4-g1",
  "b4",
  "gym",
  "G1",
  "Gym: lower + push (contrast)",
  [
    rx("G-01", 4, "4", { targetRPE: 7, note: "contrast pair A1" }),
    rx("G-23", 4, "3", { note: "contrast pair A2" }),
    rx("G-04", 4, "4", { targetRPE: 7, note: "contrast pair B1" }),
    rx("G-17", 4, "3", { note: "contrast pair B2" }),
    rx("G-13", 4, "4/side", { perSide: true, note: "max intent" }),
    rx("G-11", 2, "10/side", { perSide: true })
  ],
  "Contrast pairs: 2-3 min rest between pair elements."
);

const b4g2 = template(
  "b4-g2",
  "b4",
  "gym",
  "G2",
  "Gym: hinge + pull (contrast)",
  [
    rx("G-02", 4, "3", { targetRPE: 7, note: "contrast pair A1" }),
    rx("G-16", 4, "3", { note: "contrast pair A2" }),
    rx("G-06", 3, "6"),
    rx("G-14", 4, "5"),
    rx("G-22", 3, "8/side", { perSide: true }),
    rx("G-21", 2, "15")
  ],
  "Contrast pairs: 2-3 min rest between pair elements."
);

const b4h1 = template(
  "b4-h1",
  "b4",
  "home",
  "H1",
  "Home (speed intro)",
  [
    rx("H-09", 3, "4/side", { perSide: true }),
    rx("H-08", 3, "6/side", { perSide: true }),
    rx("H-10", 3, "3"),
    rx("H-23", 2, "5/side", { perSide: true, note: "intro volume" }),
    rx("H-24", 2, "5/side", { perSide: true, note: "intro volume" })
  ],
  "Speed intro. Mobility finisher as Block 1."
);

// ---- Block 5 ----
const b5g1 = template("b5-g1", "b5", "gym", "G1", "Gym: maintenance + power", [
  rx("G-01", 2, "5", { targetRPE: 7 }),
  rx("G-13", 5, "3/side", { perSide: true, note: "max intent" }),
  rx("G-15", 4, "4"),
  rx("G-11", 2, "10/side", { perSide: true })
]);

const b5g2 = template("b5-g2", "b5", "gym", "G2", "Gym: maintenance + power", [
  rx("G-02", 2, "4", { targetRPE: 7 }),
  rx("G-14", 4, "4"),
  rx("G-06", 2, "6"),
  rx("G-22", 3, "6/side", { perSide: true, note: "X intent" })
]);

const b5h1 = template(
  "b5-h1",
  "b5",
  "home",
  "H1",
  "Home (speed session)",
  [
    rx("H-25", 3, "6/side", { perSide: true }),
    rx("H-23", 3, "6"),
    rx("H-24", 2, "6"),
    rx("H-09", 3, "3/side", { perSide: true })
  ],
  "Full warm-up mandatory. Full recovery between all sets. Log swing speed at next net session <=48h."
);

// ---- Block 6 ----
const b6g1 = template("b6-g1", "b6", "gym", "G1", "Gym: lower + push", [
  rx("G-01", 5, "5", { targetRPE: 8 }),
  rx("G-04", 5, "5", { targetRPE: 8 }),
  rx("G-09", 3, "10/leg", { perSide: true }),
  rx("G-11", 3, "10/side", { perSide: true }),
  rx("G-24", 3, "30 m/side", { perSide: true })
]);

const b6g2 = template("b6-g2", "b6", "gym", "G2", "Gym: hinge + pull", [
  rx("G-02", 5, "4", { targetRPE: 8 }),
  rx("G-06", 4, "6"),
  rx("G-05", 3, "8"),
  rx("G-18", 3, "8"),
  rx("G-12", 3, "10/side", { perSide: true }),
  rx("G-21", 2, "15")
]);

const b6h1 = template(
  "b6-h1",
  "b6",
  "home",
  "H1",
  "Home",
  [
    rx("H-01", 3, "current rung"),
    rx("H-02", 3, "current rung"),
    rx("H-03", 3, "current rung"),
    rx("H-06", 1, "8/side", { perSide: true }),
    rx("H-04", 1, "per rung"),
    rx("H-07", 2, "15 s/side", { perSide: true }),
    rx("H-11", 2, "15"),
    rx("H-09", 3, "4/side", { perSide: true }),
    rx("H-22", 3, "20 s"),
    rx("H-23", 2, "4/side", { perSide: true, note: "retention dose" }),
    rx("H-24", 2, "4/side", { perSide: true, note: "retention dose" })
  ],
  "As Block 3 at progressed rungs; club swings maintained at retention dose."
);

// ---- Block 7 ----
const b7g1 = template(
  "b7-g1",
  "b7",
  "gym",
  "G1",
  "Gym: lower + push (contrast, peak)",
  [
    rx("G-01", 4, "4", { targetRPE: 7, note: "contrast pair A1; loads from Block 6" }),
    rx("G-23", 4, "3", { note: "contrast pair A2" }),
    rx("G-04", 4, "4", { targetRPE: 7, note: "contrast pair B1; loads from Block 6" }),
    rx("G-17", 4, "3", { note: "contrast pair B2" }),
    rx("G-13", 5, "3/side", { perSide: true, note: "max intent" }),
    rx("G-11", 2, "10/side", { perSide: true })
  ],
  "As Block 4 with loads carried from Block 6. Contrast pairs: 2-3 min rest between pair elements."
);

const b7g2 = template(
  "b7-g2",
  "b7",
  "gym",
  "G2",
  "Gym: hinge + pull (contrast, peak)",
  [
    rx("G-02", 4, "3", { targetRPE: 7, note: "contrast pair A1; loads from Block 6" }),
    rx("G-16", 4, "3", { note: "contrast pair A2" }),
    rx("G-06", 3, "6"),
    rx("G-14", 4, "5"),
    rx("G-22", 3, "8/side", { perSide: true }),
    rx("G-21", 2, "15"),
    rx("H-11", 3, "15", { note: "pre-lift reactive primer" })
  ],
  "As Block 4 with loads carried from Block 6, plus H-11 Pogo pre-lift."
);

const b7h1 = template(
  "b7-h1",
  "b7",
  "home",
  "H1",
  "Home (speed session, peak)",
  [
    rx("H-25", 4, "5/side", { perSide: true }),
    rx("H-23", 3, "6"),
    rx("H-24", 2, "6"),
    rx("H-09", 3, "3/side", { perSide: true })
  ],
  "As Block 5 speed session with inverted driver dose increased to 4x5/side. Deload swing volume in the final week before any competitive round."
);

// ---- Block 8 ----
const b8g1 = template("b8-g1", "b8", "gym", "G1", "Gym: lower + push (maintenance)", [
  rx("G-01", 2, "5", { targetRPE: 7 }),
  rx("G-19", 3, "8/leg", { perSide: true }),
  rx("G-10", 3, "8/side", { perSide: true }),
  rx("G-08", 2, "10/leg", { perSide: true }),
  rx("G-11", 3, "12/side", { perSide: true }),
  rx("G-24", 3, "40 m/side", { perSide: true })
]);

const b8g2 = template("b8-g2", "b8", "gym", "G2", "Gym: hinge + pull (maintenance)", [
  rx("G-02", 2, "4", { targetRPE: 7 }),
  rx("G-06", 3, "8"),
  rx("G-18", 3, "10"),
  rx("G-22", 3, "10/side", { perSide: true, note: "controlled full range" }),
  rx("G-21", 3, "15")
]);

const b8h1 = template(
  "b8-h1",
  "b8",
  "home",
  "H1",
  "Home (extended, ~40 min)",
  [
    rx("H-19", 3, "6/side", { perSide: true }),
    rx("H-07", 3, "20 s/side", { perSide: true }),
    rx("H-04", 1, "top rung"),
    rx("H-06", 3, "8/side", { perSide: true }),
    rx("H-13", 1, "full mobility sequence"),
    rx("H-14", 1, "full mobility sequence"),
    rx("H-15", 1, "full mobility sequence"),
    rx("H-16", 1, "full mobility sequence"),
    rx("H-17", 1, "full mobility sequence"),
    rx("H-18", 1, "full mobility sequence"),
    rx("H-20", 1, "full mobility sequence")
  ],
  "Block-exit ROM tests logged and compared to baseline."
);

export const SESSION_TEMPLATES: SessionTemplate[] = [
  b1g1, b1g2, b1h1,
  b2g1, b2g2, b2h1,
  b3g1, b3g2, b3h1,
  b4g1, b4g2, b4h1,
  b5g1, b5g2, b5h1,
  b6g1, b6g2, b6h1,
  b7g1, b7g2, b7h1,
  b8g1, b8g2, b8h1
];
