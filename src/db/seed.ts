import { ALL_EXERCISES, BLOCKS, LADDERS, SESSION_TEMPLATES } from "../data";
import { db } from "./schema";
import type { DeviceRole, Programme } from "./types";
import { validateLibrary } from "./validateLibrary";

export class LibraryValidationError extends Error {
  constructor(public readonly errors: string[]) {
    super(`Library seed failed validation:\n${errors.join("\n")}`);
    this.name = "LibraryValidationError";
  }
}

// P1.1 noted a harmless-but-noisy dev-only race: React 18 StrictMode's double-effect-invoke
// can call seedDatabase() twice back-to-back before the first call's count-check-then-write
// has landed, so both see an empty table and both try to bulkAdd — one wins, one throws a
// (harmless) BulkError. This in-flight guard coalesces genuinely CONCURRENT calls onto the
// same promise; it deliberately does NOT cache past resolution, so a later independent call
// (e.g. after tests clear the tables) still re-runs the check fresh.
let inFlightSeed: Promise<void> | null = null;

// Idempotent: safe to call on every app start. Only writes the library content stores
// (exercise/ladder/sessionTemplate/block) if they are empty, and only creates a Programme
// record if none exists yet. Never overwrites existing SessionLog/SetLog/MetricLog/
// ProgressionState data.
export async function seedDatabase(deviceRole: DeviceRole = "master"): Promise<void> {
  if (inFlightSeed) return inFlightSeed;
  inFlightSeed = seedDatabaseOnce(deviceRole).finally(() => {
    inFlightSeed = null;
  });
  return inFlightSeed;
}

async function seedDatabaseOnce(deviceRole: DeviceRole): Promise<void> {
  const validation = validateLibrary(ALL_EXERCISES, LADDERS, SESSION_TEMPLATES, BLOCKS);
  if (!validation.valid) {
    throw new LibraryValidationError(validation.errors);
  }

  const exerciseCount = await db.exercise.count();
  if (exerciseCount === 0) {
    await db.transaction(
      "rw",
      [db.exercise, db.variationLadder, db.sessionTemplate, db.block, db.progressionState],
      async () => {
        await db.exercise.bulkAdd(ALL_EXERCISES);
        await db.variationLadder.bulkAdd(LADDERS);
        await db.sessionTemplate.bulkAdd(SESSION_TEMPLATES);
        await db.block.bulkAdd(BLOCKS);

        // Seed rung 0 for every ladder-anchored exercise so the Session runner has a
        // current rung to display from first launch. Full advancement logic is P2 (spec
        // §3.4 LD-1); this just establishes the starting state.
        const now = new Date().toISOString();
        const ladderAnchors = ALL_EXERCISES.filter((e) => e.ladderId);
        await db.progressionState.bulkAdd(
          ladderAnchors.map((e) => ({
            exerciseId: e.id,
            currentPrescribedLoadKg: null,
            currentLadderRung: 0,
            streakCount: 0,
            lastUpdated: now
          }))
        );
      }
    );
  }

  const existingProgramme = await db.programme.toCollection().first();
  if (!existingProgramme) {
    const now = new Date().toISOString();
    const programme: Programme = {
      id: "programme-1",
      name: "Swing Gains",
      startDate: now,
      currentBlockId: "b1",
      currentBlockStartDate: now,
      cycleNumber: 1,
      deviceRole
    };
    await db.programme.add(programme);
  }
}
