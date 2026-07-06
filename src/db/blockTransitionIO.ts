// Thin Dexie adapter over the pure block-transition engine (src/engine/blockTransition.ts).
import { db } from "./schema";
import { evaluateBlockTransition, type BlockTransitionStatus } from "../engine/blockTransition";
import { computeNextUp } from "../engine/queues";

export async function checkBlockTransitionStatus(): Promise<BlockTransitionStatus | null> {
  const programme = await db.programme.toCollection().first();
  if (!programme) return null;
  const block = await db.block.get(programme.currentBlockId);
  if (!block) return null;
  const blockTemplates = await db.sessionTemplate.where("blockId").equals(block.id).toArray();
  const sessionLogs = await db.sessionLog.toArray();

  const nextUp = computeNextUp(blockTemplates, sessionLogs, programme.currentBlockStartDate, new Date().toISOString());
  return evaluateBlockTransition(nextUp, block.transitionRules);
}

// Advances Programme.currentBlockId to the next block by sequence. After the final block
// (8), the programme restarts at Block 2 (spec §3.2: "After Block 8, the cycle restarts at
// Block 2... year-1 baselines replaced by current values" — the baseline-replacement detail
// is explicitly deferred to P3 with year-1 data; this just advances the block pointer and
// bumps cycleNumber, since Block 1 is a one-time calibration block, never repeated).
export async function advanceToNextBlock(): Promise<void> {
  const programme = await db.programme.toCollection().first();
  if (!programme) return;
  const blocks = await db.block.orderBy("sequence").toArray();
  const currentIndex = blocks.findIndex((b) => b.id === programme.currentBlockId);
  if (currentIndex === -1) return;

  const isLastBlock = currentIndex === blocks.length - 1;
  const nextBlock = isLastBlock ? blocks.find((b) => b.sequence === 2)! : blocks[currentIndex + 1];
  const now = new Date().toISOString();

  await db.programme.update(programme.id, {
    currentBlockId: nextBlock.id,
    currentBlockStartDate: now,
    cycleNumber: isLastBlock ? programme.cycleNumber + 1 : programme.cycleNumber
  });
}
