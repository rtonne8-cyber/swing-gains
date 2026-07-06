// Transcribed verbatim from docs/exercise-library-v1.0.md section 2 (Exercise Pool).
// videoUrl is seeded null throughout — merged later from the Cowork video-links.csv
// deliverable (spec section 4 / build brief section 4). Do not add exercises or
// prescriptions not present in the library.
//
// cues: the library has no per-exercise coaching-cue text field. Populated only from the
// library's own "busy-gym substitution" notes (gym exercises) where present; left blank
// otherwise. Authoring full technique cues is new content, out of scope for this seed.
import type { Exercise } from "../db/types";

function gymExercise(
  id: string,
  name: string,
  pattern: string,
  substitution?: string
): Exercise {
  return {
    id,
    name,
    pattern,
    venue: "gym",
    cues: substitution ? `Busy-gym sub: ${substitution}` : "",
    videoUrl: null,
    substitution
  };
}

function homeExercise(id: string, name: string, pattern: string, ladderId?: string): Exercise {
  return {
    id,
    name,
    pattern,
    venue: "home",
    ladderId,
    cues: "",
    videoUrl: null
  };
}

export const GYM_EXERCISES: Exercise[] = [
  gymExercise("G-01", "Back squat (barbell)", "Squat", "Goblet squat (map: DB approx 40% bar load) or leg press"),
  gymExercise("G-02", "Trap bar deadlift", "Hinge", "Barbell deadlift or heavy DB RDL"),
  gymExercise("G-03", "Romanian deadlift (barbell)", "Hinge", "DB RDL"),
  gymExercise("G-04", "Bench press (barbell)", "H-push", "DB bench press"),
  gymExercise("G-05", "Seated DB shoulder press", "V-push", "Machine shoulder press"),
  gymExercise("G-06", "Barbell row", "H-pull", "Chest-supported DB row"),
  gymExercise("G-07", "Lat pulldown", "V-pull", "Assisted pull-up / band pull-up"),
  gymExercise("G-08", "Bulgarian split squat (DB)", "SL squat", "DB split squat"),
  gymExercise("G-09", "Walking lunge (DB)", "SL squat", "Reverse lunge (DB)"),
  gymExercise("G-10", "Lateral lunge (DB)", "Frontal", "Bodyweight lateral lunge"),
  gymExercise("G-11", "Pallof press (cable)", "Anti-rotation", "Band Pallof press"),
  gymExercise("G-12", "Cable chop (high-to-low)", "Rotation", "Band chop"),
  gymExercise("G-13", "Med ball rotational throw (side, to wall)", "Rotation-power", "Band explosive rotation"),
  gymExercise("G-14", "Med ball slam", "Power", "DB high-pull (light)"),
  gymExercise("G-15", "Jump squat (bodyweight)", "Power"),
  gymExercise("G-16", "Broad jump", "Power", "Box jump"),
  gymExercise("G-17", "Plyo push-up", "Power", "Fast-tempo push-up (X concentric)"),
  gymExercise("G-18", "Barbell hip thrust", "Hinge/glute", "DB glute bridge"),
  gymExercise("G-19", "Single-leg RDL (DB)", "SL hinge", "Bodyweight SL RDL"),
  gymExercise("G-20", "Farmer carry (DB)", "Carry", "Suitcase carry (single DB)"),
  gymExercise("G-21", "Face pull (cable)", "H-pull/posture", "Band pull-apart"),
  gymExercise("G-22", "Landmine rotation", "Rotation", "Cable chop (low-to-high)"),
  gymExercise("G-23", "Box jump", "Power", "Jump squat"),
  gymExercise("G-24", "Suitcase carry (DB)", "Anti-lateral", "Single-arm farmer carry")
];

export const HOME_EXERCISES: Exercise[] = [
  homeExercise("H-01", "Squat ladder", "Squat", "L1"),
  homeExercise("H-02", "Push-up ladder", "H-push", "L2"),
  homeExercise("H-03", "Glute bridge ladder", "Hinge", "L3"),
  homeExercise("H-04", "Side plank ladder", "Anti-lateral", "L4"),
  homeExercise("H-05", "Dead bug", "Anti-extension"),
  homeExercise("H-06", "Bird dog", "Anti-rotation"),
  homeExercise("H-07", "Copenhagen plank (short lever)", "Adductor/stability"),
  homeExercise("H-08", "Speed skater", "Frontal-power"),
  homeExercise("H-09", "Rotational hop ladder", "Rotation-power", "L5"),
  homeExercise("H-10", "Broad jump (garden)", "Power"),
  homeExercise("H-11", "Pogo hops", "Reactive"),
  homeExercise("H-12", "Mountain climber (fast)", "Power/core"),
  homeExercise("H-13", "Open book", "T-spine mobility"),
  homeExercise("H-14", "Seated wall thoracic rotation", "T-spine mobility (= ROM test)"),
  homeExercise("H-15", "90/90 hip switch", "Hip mobility (= ROM test)"),
  homeExercise("H-16", "Couch stretch", "Hip flexor"),
  homeExercise("H-17", "World's greatest stretch", "Full-body mobility"),
  homeExercise("H-18", "Hamstring toe-reach flow", "Posterior chain (= ROM test kin)"),
  homeExercise("H-19", "Cossack squat", "Frontal mobility"),
  homeExercise("H-20", "Cat-cow segmentation", "Spine mobility"),
  homeExercise("H-21", "Shoulder taps", "Anti-rotation"),
  homeExercise("H-22", "Hollow hold", "Anti-extension"),
  homeExercise("H-23", "Club speed swings - lead side", "Speed (specific)"),
  homeExercise("H-24", "Club speed swings - trail side (opposite hand)", "Speed (specific)"),
  homeExercise("H-25", "Inverted-driver overspeed swings", "Speed (specific)")
];

export const ALL_EXERCISES: Exercise[] = [...GYM_EXERCISES, ...HOME_EXERCISES];
