// Pure validation of the seed content against itself — no Dexie/IndexedDB access, so this
// runs identically in Vitest and in the browser. Used by the seed loader (fails closed,
// never writes partial/broken data) and by the AT-P1 acceptance test.
import type { Block, Exercise, SessionTemplate, VariationLadder } from "./types";

export interface LibraryValidationResult {
  valid: boolean;
  errors: string[];
  counts: { exercises: number; ladders: number; sessionTemplates: number; blocks: number };
}

export function validateLibrary(
  exercises: Exercise[],
  ladders: VariationLadder[],
  sessionTemplates: SessionTemplate[],
  blocks: Block[]
): LibraryValidationResult {
  const errors: string[] = [];

  const exerciseIds = new Set(exercises.map((e) => e.id));
  const ladderIds = new Set(ladders.map((l) => l.id));
  const templateIds = new Set(sessionTemplates.map((t) => t.id));
  const blockIds = new Set(blocks.map((b) => b.id));

  if (exerciseIds.size !== exercises.length) errors.push("duplicate exercise id detected");
  if (ladderIds.size !== ladders.length) errors.push("duplicate ladder id detected");
  if (templateIds.size !== sessionTemplates.length) errors.push("duplicate session template id detected");
  if (blockIds.size !== blocks.length) errors.push("duplicate block id detected");

  for (const ex of exercises) {
    if (ex.videoUrl !== null && typeof ex.videoUrl !== "string") {
      errors.push(`exercise ${ex.id}: videoUrl must be null or string, got ${typeof ex.videoUrl}`);
    }
    if (ex.ladderId && !ladderIds.has(ex.ladderId)) {
      errors.push(`exercise ${ex.id}: orphan ladderId '${ex.ladderId}'`);
    }
  }

  for (const t of sessionTemplates) {
    if (!blockIds.has(t.blockId)) {
      errors.push(`session template ${t.id}: orphan blockId '${t.blockId}'`);
    }
    for (const p of t.exercisePrescriptions) {
      if (!exerciseIds.has(p.exerciseId)) {
        errors.push(`session template ${t.id}: orphan exerciseId '${p.exerciseId}'`);
      }
    }
  }

  for (const b of blocks) {
    for (const tid of b.sessionTemplateIds) {
      if (!templateIds.has(tid)) {
        errors.push(`block ${b.id}: orphan sessionTemplateId '${tid}'`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    counts: {
      exercises: exercises.length,
      ladders: ladders.length,
      sessionTemplates: sessionTemplates.length,
      blocks: blocks.length
    }
  };
}
