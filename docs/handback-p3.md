# Swing Gains — P3 Handback

**Phase:** P3 — reporting, polish, tracker (goal: the loop closes)
**Repo:** https://github.com/rtonne8-cyber/swing-gains (public)
**Deploy URL:** https://rtonne8-cyber.github.io/swing-gains/
**Commit SHA:** not yet committed — build work only, awaiting your go-ahead to commit/push
**Date:** 2026-07-07

## What's built

- **CSV export** (`src/engine/csvExport.ts`, `src/db/csvExportIO.ts`) — spec §8.1's exact
  13-column contract (`date, block, sessionType, venue, exercise, setNo, reps, loadKg, rpe,
  metricType, metricValue, unit, device`), one row per SetLog and per MetricLog, chronologically
  sorted, RFC4180-escaped. Wired into Settings (replacing the P2 stub) via a new
  `shareOrDownloadCSV` helper alongside the existing JSON transfer helpers.
- **Weakness_Panel signal engine** (`src/engine/weaknessSignals.ts`, `src/engine/blockPeriods.ts`)
  — pure, tested implementations of spec §8.2's four RAG signals: stalled lifts, ROM stagnation,
  speed plateau despite strength gains (this **is** the "swing-speed correlation view" P3 scope
  item — made actionable rather than just plotted), and session-frequency drift. Surfaced in-app
  as a new Weakness Panel section on the Progress screen, and used as the reference behaviour the
  offline tracker's own formulas are built to match.
- **Exercise detail screen** (`src/screens/ExerciseDetailScreen.tsx`, spec §6 screen 6) — cues,
  description, busy-gym substitution, ladder position (current rung + index/total), and an
  editable video URL. Reachable from Programme → a block → tapping an exercise row. For a
  ladder-anchored exercise, editing targets the **current rung's** video (what the Session runner
  actually shows), not the anchor exercise's own always-null field.
- **Progress Tracker workbook** (`tools/build_progress_tracker.py` → `docs/tracker/
  Swing_Gains_Progress_Tracker.xlsx`) — spec §8.2, built with openpyxl: `Data_Import` (paste
  target for the CSV export, with two hidden helper columns), `Dashboard`, `Lift_Trends`,
  `Speed_and_ROM`, `Weakness_Panel`, all formula-driven (SUMIFS/MAXIFS/MINIFS/AVERAGEIFS/
  COUNTIFS/SUMPRODUCT/INDEX — no macros, no Power Query, no dynamic-array/LAMBDA functions), two
  native line charts. A synthetic fixture (`docs/tracker/csv-fixture-3-blocks.csv`) seeds a
  stalled lift, a progressing control lift, ROM stagnation, and session-frequency drift for
  manual Sheets-import verification (test pack §6).
- **Year-2 cycle stub** (`src/config/featureFlags.ts`, off by default) — the one open piece of
  spec §3.2/§10 decision 5 ("year-1 baselines replaced by current values... detail at P3").
  Flag-gated inside `recomputeProgressionStates` itself (not a bolt-on DB write, which would be
  silently clobbered by the next recompute) so it stays a pure function of its inputs.
- **Small polish**: fixed the dev-only StrictMode double-seed race flagged as an open item in
  the P1.1 handback (`src/db/seed.ts` now coalesces genuinely-concurrent `seedDatabase()` calls
  onto one in-flight promise, without caching across independent calls).

## Files created

```
src/engine/csvExport.ts, blockPeriods.ts, weaknessSignals.ts
src/db/csvExportIO.ts
src/config/featureFlags.ts
src/screens/ExerciseDetailScreen.tsx
tools/build_progress_tracker.py, _verify_tracker_with_fixture.py, requirements.txt
docs/tracker/Swing_Gains_Progress_Tracker.xlsx, csv-fixture-3-blocks.csv
docs/manual-test-pack-p3.md, handback-p3.md
tests/csvExport.test.ts, weaknessSignals.test.ts, csvFixture.test.ts
```

## Files modified

```
src/components/fileTransfer.ts (downloadCSV/shareOrDownloadCSV)
src/screens/SettingsScreen.tsx (live CSV export, replacing the P2 stub)
src/screens/ProgressScreen.tsx (Weakness Panel section)
src/screens/ProgrammeMapScreen.tsx (exercise rows now navigate to Exercise detail)
src/App.tsx (exercise-detail route)
src/engine/progression.ts (year2StreakReset, flag-gated, off by default)
src/db/transferIO.ts (passes FEATURE_FLAGS.year2StreakReset through)
src/db/seed.ts (in-flight seeding guard)
tests/progression.test.ts, seedDatabase.test.ts (new coverage for the above two)
```

## Test summary

`npm test` (Vitest): **102/102 passing**, 13 files (6 new: csvExport, weaknessSignals,
csvFixture, plus additions to progression.test.ts and seedDatabase.test.ts). `npm run build`
(tsc + vite build) succeeds. No failures.

- `tests/csvExport.test.ts` — AT-P3 #1: exact §8.1 header (snapshot), row count = setLogs +
  metricLogs, correct block/sessionType/venue/exercise resolution, blank set-columns on a
  metric row, chronological sort, RFC4180 escaping.
- `tests/weaknessSignals.test.ts` — a synthetic 3-block fixture (block 1 rising, block 2 flat)
  confirming stalledLiftSignal/romStagnationSignal/speedPlateauSignal/frequencyDriftSignal each
  fire correctly and don't false-positive on the "not enough data yet" / "still healthy" cases —
  including a regression test for a bug the browser check below actually caught (see below).
- `tests/csvFixture.test.ts` — proves `docs/tracker/csv-fixture-3-blocks.csv` itself (not just
  the engine in isolation) triggers all three signals AT-P3 #2 names, using the same engine
  functions, so the manual-test fixture can never silently drift from what it claims to
  demonstrate.
- `tests/progression.test.ts` — two new cases for the year-2 streak-reset stub: off by default
  (existing behaviour unchanged, a genuine below-range streak carries across a cycle wrap and
  triggers the usual -10% cut) and on (the wrap clears the streak, so the same session is
  treated as a fresh first hit).
- `tests/seedDatabase.test.ts` — one new case: two genuinely concurrent `seedDatabase()` calls
  (`Promise.allSettled`) both resolve successfully with no duplicate-key error and no double
  seeding.

## Manual verification done this session

Ran the app in a live browser preview and walked the new surfaces end to end: Programme → Block
1 → tapped "Squat ladder" → Exercise detail showed the description, "Rung 1 of 6: Bodyweight
squat", and a prefilled video URL → edited and saved it → confirmed the input reflected the new
value (proving the Dexie write round-tripped through `useLiveQuery`) → Back returned to
Programme → Progress screen rendered the new Weakness Panel section → Settings → Export CSV
fired with no console errors and the expected notice. No console errors at any point.

**A real bug was caught and fixed during this check, not just planned in the abstract**: the
Weakness Panel's frequency-drift signal initially fired on a completely fresh install (zero
sessions ever logged) because a rolling average of 0 sessions/week is, arithmetically, "under
2/week." Seeing it flag on an empty Progress screen in the live preview is what caught it — the
signal now requires at least one non-zero week in its window before it will flag anything,
matching the same "insufficient data ≠ a real signal" guard the other three signals already had
(`tests/weaknessSignals.test.ts`'s new "does not flag a brand-new install" case).

## The tracker's formulas were independently verified, not just eyeballed

Since the workbook's formulas are only evaluated by Excel/Sheets on open (openpyxl just writes
formula text), I installed the `formulas` Python library (a standalone Excel-formula evaluation
engine, dev-only — not added as a project dependency) and actually ran the generated workbook
against the CSV fixture. This caught two real indexing bugs before they reached you:

1. The ROM-stagnation formula originally compared a block's value against the block **two**
   rows back, when spec's "no grade change across two transitions" actually means "the two most
   recently completed blocks compared to each other" (i.e. **adjacent**, one row back) — the
   same pairing the speed-plateau formula already used correctly. Fixed to compare i vs i-1.
2. My own verification script initially queried the wrong cell for the ROM flag (an off-by-one
   in a hand-typed column reference), which looked like a workbook bug until double-checked.

After the fix, an evaluated run against `csv-fixture-3-blocks.csv` confirms: current block
resolves to "Block 3: Strength"; Back squat flags STALLED in block 2 (its last completed block)
while Bench press (the control lift) correctly stays "ok"; the ROM (hip) reading flags STAGNANT
in block 2; and the frequency-drift summary flags DRIFTING (6 sessions in the trailing window,
1.5/week rolling average). This is real automated proof the formulas compute what they claim to
— Sheets-import verification (test pack §6) is still the final gate per spec §8.2, since a
formula evaluating correctly in `formulas` doesn't guarantee an identical result after Google's
own conversion step, but it's no longer a blind eyeball check either.

## Spec deviations (all flagged, none silently applied)

1. **The CSV export's metric rows carry no block/sessionType/venue/exercise/setNo/reps/loadKg/
   rpe** — spec §8.1's column contract ties those columns to a SetLog, and a MetricLog isn't
   attached to a SessionTemplate/block the way a SetLog is. The tracker needs "by block"
   attribution for ROM/speed anyway (spec §8.2), so `Data_Import`'s hidden `_EffectiveBlock`
   helper column forward-fills the last non-blank block value down through following metric
   rows — this assumes the sheet is pasted in the export's own chronological order and never
   manually reordered, documented in the script and the test pack.
2. **The CSV column contract has no `side` column**, so a MetricLog's L/R side (ROM tests) isn't
   exported at all — both readings collapse into unlabelled rows. This is a literal reading of
   spec §8.1's exact column list (AT-P3 #1 requires an exact header match), not an oversight;
   flagged in the test pack rather than silently extending the contract with a 14th column.
3. **The tracker's "stalled lift" reading is MAX(load) <= MIN(load) within a completed block**
   — simpler than the in-app engine's own "first vs peak, chronologically" reading
   (`src/engine/weaknessSignals.ts`), chosen because Excel/Sheets MAXIFS/MINIFS need no array
   formulas or row-order lookups, while a first-vs-last comparison does. The two readings agree
   on every case in the fixture; documented as a deliberate simplification in
   `tools/build_progress_tracker.py`'s module docstring, same spirit as P2's BT-4 pace-formula
   deviation.
4. **Lift_Trends and Speed_and_ROM chart "by block," not by date** — spec §8.2 literally says
   "load progression chart per main lift, **by block**" and "ROM scores **by block**," so an
   8-row (one per block) aggregation table is what's built, not a per-session date series. This
   sidesteps needing dynamic-array/unique-date-list formulas entirely, consistent with "no
   dynamic-array or LAMBDA functions."
5. **The tracker tracks two example lifts** (Back squat, Bench press) with a documented "copy
   this column's formula pattern" note for adding more — not all 24 gym exercises, since each
   lift needs its own three formula columns and the personal-tracker "substance over chrome"
   framing (spec §8.2) doesn't call for pre-building columns for lifts that may never be a main
   lift of interest.
6. **Exercise detail's video-URL edit targets the current rung for a ladder-anchored exercise**,
   not `Exercise.videoUrl` (which P1.1 left permanently null for the 5 ladder anchors, by
   design — the rung's own video supersedes it). Editing the field that's actually inert would
   have been a worse deviation than this one; documented in the screen's own header comment.
7. **Year-2 cycle stub is intentionally incomplete** (`src/config/featureFlags.ts`,
   `year2StreakReset`, off by default, no in-app toggle). Loads and ladder rungs already carry
   forward into year 2 by construction (ProgressionState is derived from full history and never
   resets on its own) — spec's own decision-log phrasing ("confirmed in principle; detail at
   P3") reads as "P3 should propose the detail," not "P3 should silently pick one," so this
   stays a documented, flag-gated option rather than a default behaviour. **Needs your call**:
   whether crossing into a new cycle should clear each lift's in-flight increment streak, once
   there's real year-1 data to judge it against.
8. **`tools/` (the tracker builder) is plain Python, not part of the npm project** — no
   `package.json` dependency, no CI wiring; `tools/requirements.txt` lists `openpyxl` for
   anyone regenerating the workbook. The `formulas` verification script
   (`_verify_tracker_with_fixture.py`) is a dev-only aid, not required to rebuild the tracker.

## Open items for future work

- On-device manual checklist: see `docs/manual-test-pack-p3.md` in full — install, transfer,
  ROM wizard, CSV export, Exercise detail (incl. video link spot-checks), and the Google
  Sheets tracker import, none of it self-certified.
- Year-2 streak-reset decision (deviation 7 above) — revisit once Block 8 → Block 2 actually
  happens for the first time with real data.
- P4+ (per spec §9, not gated): launch monitor file import, automated sync, adaptive
  programming concepts.

I haven't committed or pushed any of this — let me know if you'd like me to, or if you want to
review the diff/on-device behaviour first.
