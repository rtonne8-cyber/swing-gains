// Seed-integrity coverage for the video/description merge (docs/video-links.csv,
// docs/ladder-video-links.csv -> src/data/exercises.ts, src/data/ladders.ts via
// scripts/merge-video-links.mjs). Re-parses the CSVs directly here (rather than trusting
// the merge script's own validation) so a hand-edit that drifts from the source CSVs still
// fails the suite.
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ALL_EXERCISES } from "../src/data/exercises";
import { LADDERS } from "../src/data/ladders";

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      fields.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  fields.push(cur);
  return fields;
}

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  const header = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const fields = parseCsvLine(line);
    const row: Record<string, string> = {};
    header.forEach((h, i) => {
      row[h] = (fields[i] ?? "").trim();
    });
    return row;
  });
}

const docsDir = path.resolve(process.cwd(), "docs");
const videoLinksCsv = parseCsv(readFileSync(path.join(docsDir, "video-links.csv"), "utf8"));
const ladderVideoCsv = parseCsv(readFileSync(path.join(docsDir, "ladder-video-links.csv"), "utf8"));

describe("video/description merge integrity", () => {
  it("all 49 exercises have a non-empty description", () => {
    expect(ALL_EXERCISES).toHaveLength(49);
    for (const ex of ALL_EXERCISES) {
      expect(ex.description.trim().length).toBeGreaterThan(0);
    }
  });

  it("has exactly 24 ladder rung entries across all ladders", () => {
    const totalRungs = LADDERS.reduce((sum, l) => sum + l.rungs.length, 0);
    expect(totalRungs).toBe(24);
  });

  it("has exactly one null rung videoUrl, at L5 rung 1 (H-09 rotational hop, low-amplitude)", () => {
    const nullRungs = LADDERS.flatMap((l) => l.rungs.map((r, i) => ({ ladder: l.id, rung: i + 1, r }))).filter(
      (x) => x.r.videoUrl === null
    );
    expect(nullRungs).toHaveLength(1);
    expect(nullRungs[0].ladder).toBe("L5");
    expect(nullRungs[0].rung).toBe(1);
  });

  it("video-links.csv has exactly 49 rows with zero unmatched exerciseIds either direction", () => {
    expect(videoLinksCsv).toHaveLength(49);
    const csvIds = new Set(videoLinksCsv.map((r) => r.exerciseId));
    const knownIds = new Set(ALL_EXERCISES.map((e) => e.id));
    expect([...knownIds].filter((id) => !csvIds.has(id))).toEqual([]);
    expect([...csvIds].filter((id) => !knownIds.has(id))).toEqual([]);
  });

  it("ladder-video-links.csv has exactly 24 rows with zero unmatched (ladder,rung) pairs", () => {
    expect(ladderVideoCsv).toHaveLength(24);
    const csvKeys = new Set(ladderVideoCsv.map((r) => `${r.ladder}#${r.rung}`));
    const knownKeys = new Set(LADDERS.flatMap((l) => l.rungs.map((_, i) => `${l.id}#${i + 1}`)));
    expect([...knownKeys].filter((k) => !csvKeys.has(k))).toEqual([]);
    expect([...csvKeys].filter((k) => !knownKeys.has(k))).toEqual([]);
  });

  it("all non-blank timestamps in ladder-video-links.csv parse to positive integer seconds", () => {
    let checked = 0;
    for (const row of ladderVideoCsv) {
      if (!row.timestamp) continue;
      const parts = row.timestamp.split(":").map(Number);
      expect(parts.every((n) => Number.isInteger(n) && n >= 0)).toBe(true);
      const seconds = parts.reduce((acc, n) => acc * 60 + n, 0);
      expect(Number.isInteger(seconds)).toBe(true);
      expect(seconds).toBeGreaterThan(0);
      checked++;
    }
    expect(checked).toBeGreaterThan(0);
  });

  it("ladder-anchor exercises (H-01, H-02, H-03, H-04, H-09) keep videoUrl null", () => {
    for (const id of ["H-01", "H-02", "H-03", "H-04", "H-09"]) {
      const ex = ALL_EXERCISES.find((e) => e.id === id);
      expect(ex?.videoUrl).toBeNull();
    }
  });
});
