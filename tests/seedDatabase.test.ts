import { beforeEach, describe, expect, it } from "vitest";
import { db } from "../src/db/schema";
import { seedDatabase } from "../src/db/seed";

describe("seedDatabase (Dexie, fake-indexeddb)", () => {
  beforeEach(async () => {
    await db.exercise.clear();
    await db.variationLadder.clear();
    await db.sessionTemplate.clear();
    await db.block.clear();
    await db.programme.clear();
    await db.progressionState.clear();
    await db.sessionLog.clear();
  });

  it("populates all library stores and a programme record on first run", async () => {
    await seedDatabase("master");
    expect(await db.exercise.count()).toBe(49);
    expect(await db.variationLadder.count()).toBe(5);
    expect(await db.sessionTemplate.count()).toBe(24);
    expect(await db.block.count()).toBe(8);
    const programme = await db.programme.toCollection().first();
    expect(programme?.currentBlockId).toBe("b1");
    expect(programme?.deviceRole).toBe("master");
  });

  it("is idempotent: calling twice does not duplicate rows", async () => {
    await seedDatabase("master");
    await seedDatabase("master");
    expect(await db.exercise.count()).toBe(49);
    expect(await db.programme.count()).toBe(1);
  });

  it("never overwrites existing session logs", async () => {
    await seedDatabase("master");
    await db.sessionLog.add({
      id: "existing-log",
      templateId: "b1-g1",
      date: "2026-07-01",
      durationMin: 40,
      completed: true,
      notes: "pre-existing",
      originDevice: "ipad"
    });
    await seedDatabase("master");
    const log = await db.sessionLog.get("existing-log");
    expect(log?.notes).toBe("pre-existing");
  });
});
