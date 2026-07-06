# Swing Gains — P1.1 Handback: Video/Description Merge

**Task:** merge `docs/video-links.csv` (49 rows, exercise-level) and
`docs/ladder-video-links.csv` (24 rows, rung-level for H-01/02/03/04/09) into the seed data.
**Date:** 2026-07-06

## What changed

### Schema (both flagged as requested)

1. **`Exercise.description: string`** (required) — added to `src/db/types.ts`. Populated
   from `video-links.csv`, joined on `exerciseId`, for all 49 exercises.
2. **`VariationLadder.rungs` changed from `string[]` to `LadderRung[]`**, where
   `LadderRung = { name: string; videoUrl: string | null; timestampSec?: number }`. Rung
   `name` is unchanged (still the canonical text from `exercise-library-v1.0.md` §3 —
   the CSV's own `rungName` column has minor wording differences, e.g. "Tempo squat
   (3-1-X)" vs the library's "3-1-X tempo squat"; these are cosmetic and the canonical
   library wording was kept). `videoUrl`/`timestampSec` populated from
   `ladder-video-links.csv`, joined on `(ladder, rung)`.

### Exercise-level videoUrl

Populated from `video-links.csv` for all 44 non-ladder exercises. The 5 ladder-anchor
exercises (H-01, H-02, H-03, H-04, H-09) keep `videoUrl: null` at the exercise level even
though the CSV has a row for them (their own overview description IS still used) —
rung-level video data supersedes, per the task's instruction.

### Merge mechanism

Wrote `scripts/merge-video-links.mjs` rather than hand-transcribing 49 long descriptions
and 24 video/timestamp entries. It:

- Extracts the current base metadata (id/name/pattern/venue/ladderId/substitution for
  exercises; id/pattern/rung-names for ladders) directly from the existing
  `src/data/exercises.ts` / `src/data/ladders.ts` source via a parenthesis-and-quote-aware
  scanner — so the already-verified P1 seed content can never drift, only new fields get
  added.
- Parses both CSVs with a small hand-rolled parser (quoted fields, embedded commas, `""`
  escaping — no new npm dependency).
- Validates before writing anything: exact row counts (49 / 24), zero unmatched exerciseIds
  in either direction, zero unmatched `(ladder, rung)` pairs, exactly one null rung
  videoUrl and that it's `L5#1` (H-09 rung 1), every timestamp parses to a positive
  integer. Throws and exits non-zero on any mismatch — nothing partial ever gets written.
- Converts `m:ss` timestamps to seconds (e.g. `3:03` → `183`).
- Regenerates `src/data/exercises.ts` and `src/data/ladders.ts` in full.

Re-run with `node scripts/merge-video-links.mjs` whenever the CSVs are corrected (several
rows in both files are flagged "Confidence: Medium" with notes recommending a follow-up
check — see below).

### UI

`src/screens/SessionRunnerScreen.tsx`: the video icon now resolves to the exercise's
current rung video (via `ProgressionState.currentLadderRung` → `ladder.rungs[n]`) for
ladder exercises, falling back to the exercise's own `videoUrl` otherwise. A new
`withTimestamp()` helper appends `&t={timestampSec}s` when the rung has one. Null `videoUrl`
still degrades to a disabled icon with cues/prescription text as the only guidance (no
UI regression for exercises without a video).

**Not touched:** there is no "Exercise detail" screen yet (spec §6 screen 6) — it wasn't in
P1 scope. The video-with-timestamp behaviour only applies to the Session runner for now;
add the same resolution logic to Exercise detail when that screen is built.

### Validation additions

`src/db/validateLibrary.ts` now also checks: every exercise has a non-empty `description`;
every ladder rung has a non-empty `name`, a `videoUrl` that's `null` or a string, and a
`timestampSec` that's `undefined` or a non-negative integer. This runs at app startup
(seed loader) as well as in tests, so a bad hand-edit fails loudly rather than silently.

## Tests

New `tests/videoLinks.test.ts` (7 tests), independently re-parsing both CSVs (not reusing
the merge script) so a hand-edit drifting from source can't pass silently:

- 49 exercises, all with non-empty descriptions.
- Exactly 24 ladder rung entries total.
- Exactly one null rung videoUrl, confirmed at `L5` rung 1 (H-09).
- `video-links.csv`: exactly 49 rows, zero unmatched exerciseIds in either direction.
- `ladder-video-links.csv`: exactly 24 rows, zero unmatched `(ladder,rung)` pairs.
- All non-blank timestamps parse to positive integer seconds.
- Ladder-anchor exercises keep `videoUrl: null`.

**Full suite: 24/24 passing** (4 files — the 3 existing P1 files plus this one).
`npm run build` (tsc + vite build) succeeds; added `@types/node` as a devDependency
(needed for `node:fs`/`node:path`/`process` in the new test file — `scripts/` was already
using Node built-ins but wasn't type-checked since `tsconfig.json` only includes
`src`/`tests`).

## Manual verification done this session

Cleared IndexedDB, reloaded, and walked both venues in a live browser preview:

- Gym G1: all 6 exercises now show an enabled (non-disabled) video icon linking to the
  correct CSV URL (spot-checked G-01 Back squat → `...watch?v=7v_V6xiA_AA`, etc.).
- Home H1: the 4 ladder exercises (H-01/02/03/04) correctly resolve to their **rung 0**
  video with the right timestamp appended (`&t=183s`, `&t=110s`, `&t=53s`, `&t=165s`,
  matching the ladder's first rung in each case), while non-ladder exercises (H-05, H-17,
  H-14, H-18) link without a timestamp param.

One incidental observation, not a regression from this change: in dev mode, React 18
StrictMode's double-effect-invoke occasionally races two concurrent `seedDatabase()` calls
against a freshly-emptied IndexedDB, producing a noisy (harmless) `BulkError` in the
console — one of the two calls wins, the app renders correctly either way. This existed in
the original P1 seeding code; flagging it here as an observation, not fixing it now since
it's dev-only StrictMode behaviour and out of scope for this task. Worth a small guard in
`seedDatabase()` if it ever becomes visible in production.

## Data-quality notes carried over from the CSVs (for Ryan, not app bugs)

Several rows in both CSVs are self-flagged "Confidence: Medium" or lower with notes
recommending manual re-verification before relying on them — worth a spot-check pass
before P3's video-link verification test pack, in particular:
- H-09 rung 1 (low-amplitude hop-and-stick) has no video at all — deliberately `null`.
- H-23/H-24/H-25 (club speed swings, all 3 variants) share one source video with "Low"
  confidence on exact drill-timestamp matching.
- Several gym/home substitution videos came from channels outside the approved shortlist
  (flagged per-row in the CSV `notes` column).

None of this blocks the app — broken/uncertain links degrade to cues per spec §4, and
URLs are user-editable in-app once that screen exists (P2/P3).

## Open items

- Exercise detail screen (spec §6 screen 6) still doesn't exist — when built, reuse the
  rung-resolution + `withTimestamp()` logic from `SessionRunnerScreen.tsx`.
- In-app video URL editing (spec §4) is P2/P3 scope, not started.
- Consider a small concurrency guard on `seedDatabase()` if the StrictMode race above ever
  surfaces outside dev.
