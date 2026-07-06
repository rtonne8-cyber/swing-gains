// One-time (repeatable) merge of docs/video-links.csv and docs/ladder-video-links.csv into
// src/data/exercises.ts and src/data/ladders.ts. Base exercise/ladder metadata (id, name,
// pattern, venue, ladderId/substitution, rung names) is extracted from the CURRENT
// src/data/*.ts source via regex rather than retyped here, so this script can never drift
// from the already-verified seed content — it only adds description/videoUrl/timestampSec.
// Re-run whenever the CSVs are corrected (e.g. a broken link gets fixed):
//   node scripts/merge-video-links.mjs
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const LADDER_ANCHOR_IDS = new Set(["H-01", "H-02", "H-03", "H-04", "H-09"]);

function fail(message) {
  console.error(`\nmerge-video-links FAILED: ${message}\n`);
  process.exit(1);
}

// ---- minimal CSV parser (quoted fields, embedded commas, "" escaped quotes) ----
function parseCsvLine(line) {
  const fields = [];
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

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  const header = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const fields = parseCsvLine(line);
    const row = {};
    header.forEach((h, i) => {
      row[h] = (fields[i] ?? "").trim();
    });
    return row;
  });
}

function timestampToSeconds(ts) {
  if (!ts) return undefined;
  const parts = ts.split(":").map(Number);
  if (parts.length === 0 || parts.some((n) => Number.isNaN(n) || n < 0)) {
    fail(`unparseable timestamp "${ts}"`);
  }
  const seconds = parts.reduce((acc, n) => acc * 60 + n, 0);
  if (!Number.isInteger(seconds) || seconds < 0) {
    fail(`timestamp "${ts}" did not resolve to a positive integer`);
  }
  return seconds;
}

// ---- extract current base metadata from src/data/exercises.ts (source of truth) ----
const exercisesSrc = readFileSync(path.join(root, "src/data/exercises.ts"), "utf8");

// Scans for fnName(...) calls tracking quote state, so parentheses inside quoted string
// arguments (e.g. "Back squat (barbell)") don't get mistaken for the call's closing paren.
function extractCalls(src, fnName, argNames) {
  const marker = `${fnName}(`;
  const results = [];
  let searchFrom = 0;
  while (true) {
    const start = src.indexOf(marker, searchFrom);
    if (start === -1) break;
    let i = start + marker.length;
    const argsStart = i;
    let depth = 1;
    let inQuotes = false;
    while (i < src.length && depth > 0) {
      const c = src[i];
      if (inQuotes) {
        if (c === "\\") {
          i += 2;
          continue;
        }
        if (c === '"') inQuotes = false;
      } else if (c === '"') {
        inQuotes = true;
      } else if (c === "(") {
        depth++;
      } else if (c === ")") {
        depth--;
      }
      i++;
    }
    const argsText = src.slice(argsStart, i - 1);
    const args = [...argsText.matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1]);
    const entry = {};
    argNames.forEach((name, idx) => {
      if (args[idx] !== undefined) entry[name] = args[idx];
    });
    results.push(entry);
    searchFrom = i;
  }
  return results;
}

// The regex scanner also matches each helper's own `function gymExercise(...)` signature
// (no quoted args there, so it yields an entry with no id) — filter those out.
const gymBase = extractCalls(exercisesSrc, "gymExercise", ["id", "name", "pattern", "substitution"]).filter(
  (e) => e.id
);
const homeBase = extractCalls(exercisesSrc, "homeExercise", ["id", "name", "pattern", "ladderId"]).filter(
  (e) => e.id
);

if (gymBase.length !== 24) fail(`expected 24 gym exercises extracted from exercises.ts, got ${gymBase.length}`);
if (homeBase.length !== 25) fail(`expected 25 home exercises extracted from exercises.ts, got ${homeBase.length}`);

// ---- extract current ladder base metadata from src/data/ladders.ts (source of truth) ----
const laddersSrc = readFileSync(path.join(root, "src/data/ladders.ts"), "utf8");
const ladderBlockRe = /\{\s*id:\s*"([^"]+)",\s*pattern:\s*"([^"]+)",\s*rungs:\s*\[([\s\S]*?)\]\s*\}/g;
const ladderBase = [...laddersSrc.matchAll(ladderBlockRe)].map((m) => ({
  id: m[1],
  pattern: m[2],
  rungNames: [...m[3].matchAll(/"([^"]+)"/g)].map((r) => r[1])
}));

if (ladderBase.length !== 5) fail(`expected 5 ladders extracted from ladders.ts, got ${ladderBase.length}`);
const totalRungs = ladderBase.reduce((sum, l) => sum + l.rungNames.length, 0);
if (totalRungs !== 24) fail(`expected 24 total rungs extracted from ladders.ts, got ${totalRungs}`);

// ---- parse video-links.csv (exercise-level) ----
const videoLinksCsv = parseCsv(readFileSync(path.join(root, "docs/video-links.csv"), "utf8"));
if (videoLinksCsv.length !== 49) {
  fail(`docs/video-links.csv: expected 49 rows, found ${videoLinksCsv.length}`);
}

const videoMap = new Map();
for (const row of videoLinksCsv) {
  if (!row.exerciseId) fail("docs/video-links.csv: row with blank exerciseId");
  if (videoMap.has(row.exerciseId)) fail(`docs/video-links.csv: duplicate exerciseId ${row.exerciseId}`);
  if (!row.description) fail(`docs/video-links.csv: row ${row.exerciseId} has no description`);
  videoMap.set(row.exerciseId, { videoUrl: row.videoUrl || null, description: row.description });
}

const allExerciseIds = [...gymBase, ...homeBase].map((e) => e.id);
const missingFromCsv = allExerciseIds.filter((id) => !videoMap.has(id));
if (missingFromCsv.length > 0) fail(`docs/video-links.csv is missing rows for: ${missingFromCsv.join(", ")}`);
const extraInCsv = [...videoMap.keys()].filter((id) => !allExerciseIds.includes(id));
if (extraInCsv.length > 0) fail(`docs/video-links.csv has rows for unknown exerciseIds: ${extraInCsv.join(", ")}`);

// ---- parse ladder-video-links.csv (rung-level) ----
const ladderVideoCsv = parseCsv(readFileSync(path.join(root, "docs/ladder-video-links.csv"), "utf8"));
if (ladderVideoCsv.length !== 24) {
  fail(`docs/ladder-video-links.csv: expected 24 rows, found ${ladderVideoCsv.length}`);
}

const ladderRungMap = new Map(); // key `${ladder}#${rung}` -> { videoUrl, timestampSec }
for (const row of ladderVideoCsv) {
  const rungNum = Number(row.rung);
  if (!row.ladder || !Number.isInteger(rungNum)) {
    fail(`docs/ladder-video-links.csv: malformed row ${JSON.stringify(row)}`);
  }
  const key = `${row.ladder}#${rungNum}`;
  if (ladderRungMap.has(key)) fail(`docs/ladder-video-links.csv: duplicate entry for ${key}`);
  ladderRungMap.set(key, {
    videoUrl: row.videoUrl || null,
    timestampSec: timestampToSeconds(row.timestamp)
  });
}

for (const ladder of ladderBase) {
  for (let i = 0; i < ladder.rungNames.length; i++) {
    const key = `${ladder.id}#${i + 1}`;
    if (!ladderRungMap.has(key)) fail(`docs/ladder-video-links.csv is missing ${key} (${ladder.rungNames[i]})`);
  }
}
const expectedKeys = new Set(ladderBase.flatMap((l) => l.rungNames.map((_, i) => `${l.id}#${i + 1}`)));
const extraLadderKeys = [...ladderRungMap.keys()].filter((k) => !expectedKeys.has(k));
if (extraLadderKeys.length > 0) fail(`docs/ladder-video-links.csv has unexpected rows: ${extraLadderKeys.join(", ")}`);

const nullRungUrls = [...ladderRungMap.entries()].filter(([, v]) => v.videoUrl === null);
if (nullRungUrls.length !== 1 || nullRungUrls[0][0] !== "L5#1") {
  fail(
    `expected exactly one null rung videoUrl at L5#1 (H-09 rung 1), found: ${nullRungUrls.map(([k]) => k).join(", ") || "none"}`
  );
}

// ---- codegen: src/data/exercises.ts ----
function esc(str) {
  return JSON.stringify(str);
}

const gymLines = gymBase
  .map((e) => {
    const v = videoMap.get(e.id);
    const args = [esc(e.id), esc(e.name), esc(e.pattern), esc(v.description), v.videoUrl ? esc(v.videoUrl) : "null"];
    if (e.substitution) args.push(esc(e.substitution));
    return `  gymExercise(${args.join(", ")}),`;
  })
  .join("\n");

const homeLines = homeBase
  .map((e) => {
    const v = videoMap.get(e.id);
    const videoUrl = LADDER_ANCHOR_IDS.has(e.id) ? "null" : v.videoUrl ? esc(v.videoUrl) : "null";
    const args = [esc(e.id), esc(e.name), esc(e.pattern), esc(v.description), videoUrl];
    if (e.ladderId) args.push(esc(e.ladderId));
    return `  homeExercise(${args.join(", ")}),`;
  })
  .join("\n");

const exercisesOut = `// Transcribed verbatim from docs/exercise-library-v1.0.md section 2 (Exercise Pool).
// description and videoUrl merged from docs/video-links.csv (joined on exerciseId) via
// scripts/merge-video-links.mjs — do not hand-edit the merged fields, re-run the script
// instead. Ladder-anchor exercises (H-01, H-02, H-03, H-04, H-09) keep videoUrl null here;
// their per-rung video detail lives on VariationLadder.rungs (see src/data/ladders.ts).
import type { Exercise } from "../db/types";

function gymExercise(
  id: string,
  name: string,
  pattern: string,
  description: string,
  videoUrl: string | null,
  substitution?: string
): Exercise {
  return {
    id,
    name,
    pattern,
    venue: "gym",
    cues: substitution ? \`Busy-gym sub: \${substitution}\` : "",
    description,
    videoUrl,
    substitution
  };
}

function homeExercise(
  id: string,
  name: string,
  pattern: string,
  description: string,
  videoUrl: string | null,
  ladderId?: string
): Exercise {
  return {
    id,
    name,
    pattern,
    venue: "home",
    ladderId,
    cues: "",
    description,
    videoUrl
  };
}

export const GYM_EXERCISES: Exercise[] = [
${gymLines}
];

export const HOME_EXERCISES: Exercise[] = [
${homeLines}
];

export const ALL_EXERCISES: Exercise[] = [...GYM_EXERCISES, ...HOME_EXERCISES];
`;

writeFileSync(path.join(root, "src/data/exercises.ts"), exercisesOut);

// ---- codegen: src/data/ladders.ts ----
const laddersOut = `// Transcribed verbatim from docs/exercise-library-v1.0.md section 3 (Variation Ladders).
// Per-rung videoUrl/timestampSec merged from docs/ladder-video-links.csv (joined on
// ladder+rung) via scripts/merge-video-links.mjs — do not hand-edit the merged fields,
// re-run the script instead. H-09 rung 1 (Low-amplitude hop-and-stick) intentionally has
// no video (none adequate was found); videoUrl is null.
import type { VariationLadder } from "../db/types";

export const LADDERS: VariationLadder[] = [
${ladderBase
  .map((ladder) => {
    const rungLines = ladder.rungNames
      .map((name, i) => {
        const v = ladderRungMap.get(`${ladder.id}#${i + 1}`);
        const parts = [`name: ${esc(name)}`, `videoUrl: ${v.videoUrl ? esc(v.videoUrl) : "null"}`];
        if (v.timestampSec !== undefined) parts.push(`timestampSec: ${v.timestampSec}`);
        return `      { ${parts.join(", ")} }`;
      })
      .join(",\n");
    return `  {
    id: ${esc(ladder.id)},
    pattern: ${esc(ladder.pattern)},
    rungs: [
${rungLines}
    ]
  }`;
  })
  .join(",\n")}
];
`;

writeFileSync(path.join(root, "src/data/ladders.ts"), laddersOut);

console.log(`Merged ${videoMap.size} exercise descriptions/videos and ${ladderRungMap.size} ladder rung videos.`);
console.log("Wrote src/data/exercises.ts and src/data/ladders.ts.");
