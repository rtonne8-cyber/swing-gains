// AT-P1 #1: Seed loader: 49 exercises, 5 ladders, 24 templates load; zero orphan references.
import { describe, expect, it } from "vitest";
import { ALL_EXERCISES, BLOCKS, LADDERS, SESSION_TEMPLATES } from "../src/data";
import { validateLibrary } from "../src/db/validateLibrary";

describe("AT-P1-1: library seed integrity", () => {
  it("loads exactly 49 exercises, 5 ladders, 24 session templates, 8 blocks", () => {
    expect(ALL_EXERCISES.length).toBe(49);
    expect(LADDERS.length).toBe(5);
    expect(SESSION_TEMPLATES.length).toBe(24);
    expect(BLOCKS.length).toBe(8);
  });

  it("has zero orphan references", () => {
    const result = validateLibrary(ALL_EXERCISES, LADDERS, SESSION_TEMPLATES, BLOCKS);
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it("every exercise has a null-safe videoUrl (null, never undefined)", () => {
    for (const ex of ALL_EXERCISES) {
      expect(ex.videoUrl === null || typeof ex.videoUrl === "string").toBe(true);
    }
  });

  it("every block has exactly one G1, one G2, one H1 template", () => {
    for (const block of BLOCKS) {
      const templates = SESSION_TEMPLATES.filter((t) => block.sessionTemplateIds.includes(t.id));
      expect(templates.filter((t) => t.type === "G1")).toHaveLength(1);
      expect(templates.filter((t) => t.type === "G2")).toHaveLength(1);
      expect(templates.filter((t) => t.type === "H1")).toHaveLength(1);
    }
  });

  it("flags an injected orphan reference (negative control)", () => {
    const brokenTemplates = [
      ...SESSION_TEMPLATES.slice(1),
      { ...SESSION_TEMPLATES[0], exercisePrescriptions: [{ exerciseId: "G-99", order: 1, sets: 1, repsDisplay: "1", perSide: false }] }
    ];
    const result = validateLibrary(ALL_EXERCISES, LADDERS, brokenTemplates, BLOCKS);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("G-99"))).toBe(true);
  });
});
