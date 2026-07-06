# Swing Gains — P2 Handback

**Phase:** P2 — engine, transfer, progress
**Repo:** https://github.com/rtonne8-cyber/swing-gains (public)
**Deploy URL:** https://rtonne8-cyber.github.io/swing-gains/
**Commit SHA:** `bc230697ccd3dd259af1256d928b2b902be5c11b`
**Date:** 2026-07-06

## What's built

- **Progression engine** (`src/engine/progression.ts`, `src/engine/repTarget.ts`) — spec §3.4,
  full deterministic ruleset for loaded gym lifts (double progression, RPE ceiling, below-range
  reduction, Block 1 calibration) and bodyweight ladder advancement. Implemented as a single
  full-replay function (`recomputeProgressionStates`) over the complete SessionLog/SetLog
  history rather than incremental per-session patches — this makes "derived, always
  recomputable from logs" (spec §7) and TR-3's recompute-equals-replay guarantee hold by
  construction, since both the post-session update and the post-merge recompute call the exact
  same function.
- **Block transition engine** (`src/engine/blockTransition.ts`) — spec §3.3, the 15-session/
  8-week/4-week-minimum rule plus the non-blocking gym/home pace guardrail (spec §3.1).
- **Transfer** (`src/transfer/sessionPackage.ts`, `src/transfer/fullState.ts`) — spec §5.4.
  Session-package append-merge (idempotent by SessionLog id) and full-state export/import with
  typed confirmation (`REPLACE ALL DATA`, whitespace-tolerant, case-sensitive). Both are pure;
  `src/db/transferIO.ts` and `src/db/blockTransitionIO.ts` are the thin Dexie adapters the UI
  calls.
- **Progress views** (`src/engine/progressViews.ts`) — pure derivations (load trend, swing
  speed trend, ROM history, session frequency) feeding the new Progress screen.
- **Screens:** Progress (load/speed trend sparklines, ROM history, 8-week frequency strip),
  Metrics (ROM self-test wizard for all three tests, swing speed quick-add, bodyweight),
  Settings/Data (session-package import, full-state export/import, block transition status,
  device role toggle, units, safety note; CSV export stubbed disabled — that's P3). BottomNav
  and App routing extended to 5 tabs.
- **Wired into existing screens:** Session runner now recomputes ProgressionState after every
  finished session (previously nothing did this — P1 only ever wrote it at seed time), shows
  the prescribed load next to gym exercises, offers a ladder rung advance (never forced) once
  streak ≥2, checks block-transition status on finish and routes into the ROM wizard before
  advancing the block if due, and its "Export session package" button is now live (Web Share
  API with a download-link fallback). Next Up now surfaces the pace guardrail warning and a
  "block complete" notice.

## Files created

```
src/engine/repTarget.ts, progression.ts, blockTransition.ts, progressViews.ts
src/transfer/sessionPackage.ts, fullState.ts
src/db/transferIO.ts, blockTransitionIO.ts
src/components/fileTransfer.ts
src/screens/ProgressScreen.tsx, MetricsScreen.tsx, SettingsScreen.tsx
tests/repTarget.test.ts, progression.test.ts, blockTransition.test.ts, transfer.test.ts, progressViews.test.ts
docs/handback-p2.md
```

## Files modified

```
CLAUDE.md (added the P2-onward subagent policy, per instruction, before build work started)
src/db/types.ts (Exercise.loadRegion, SetLog.ladderAdvanceConfirmed — both flagged below)
src/db/validateLibrary.ts (validates the new loadRegion field)
src/data/exercises.ts (loadRegion mapping for the 24 gym exercises)
src/App.tsx, src/components/BottomNav.tsx (5-tab routing)
src/screens/NextUpScreen.tsx (guardrail + transition-due display)
src/screens/SessionRunnerScreen.tsx (recompute, prescribed-load display, ladder-advance offer,
  block-transition/ROM routing, live session-package export)
```

## Test summary

`npm test` (Vitest): **64/64 passing**, 9 files (5 new: repTarget, progression, blockTransition,
transfer, progressViews). `npm run build` (tsc + vite build) succeeds. No failures.

- `tests/repTarget.test.ts` — the repsDisplay → numeric-target parser, including the ladder
  "rung target N" phrasing and rejection of distance/time/qualitative text.
- `tests/progression.test.ts` — AT-P2 PE-1 through PE-5 plus LD-1, plus an extra PE-1b case
  added after the verifier pass (see below).
- `tests/blockTransition.test.ts` — AT-P2 BT-1 through BT-4.
- `tests/transfer.test.ts` — AT-P2 TR-1 through TR-4.
- `tests/progressViews.test.ts` — load trend/swing-speed/ROM/frequency derivations (not part
  of AT-P2, but new `src/engine` code, so it gets the same "pure, Vitest-tested" treatment
  CLAUDE.md requires).

## VERIFIER report (per CLAUDE.md's P2 subagent policy)

A fresh-context subagent was dispatched once `src/engine` and `src/transfer` compiled and their
suites passed. It was given **only**: spec §3.1/§3.3/§3.4/§5.4/§7 text (pasted inline, not the
whole spec file), the AT-P2 acceptance list from the build brief, and the source + test files
for the two modules — no build conversation or reasoning. Its brief: verify independently
against the spec text, not the code's own comments. Findings below, verbatim, each marked.

1. **[PE-1/PE-2 — FIXED]** `allTopAtCeiling` used strict `reps === target.max`, while the
   ladder-rung hit check used `reps >= target.max` — an inconsistent reading of "at top of
   range" within the same file. A lifter doing 13 reps on an 8–12 prescription at RPE ≤8 would
   have gotten no increment. Changed to `>=` for both, matching the ladder convention; added
   test PE-1b (13 reps still triggers the increment).
2. **[PE-1/PE-2 test gap — FIXED]** No existing test exercised reps above `target.max`, so the
   bug in #1 could pass unnoticed. Added the PE-1b case above.
3. **[BT-4 formula — rejected, comment added]** The pace-deficit formula
   (`minGymSessions/maxWeeks * weeksElapsed`) extrapolates to the full 8-week window rather than
   the minimum-sessions floor, so it under-warns in a pure cramming scenario (15 sessions in 4
   weeks, mostly one venue). **Not changed**: spec §3.1 explicitly makes this guardrail
   non-blocking/advisory, and BT-3's minWeeks floor already hard-blocks any transition before 4
   weeks regardless of venue split — the guardrail doesn't need to double as a second
   completion gate. Added a code comment documenting this explicitly rather than silently
   leaving it to be rediscovered.
4. **[PE-5 — checked, correct]** "Last stable Block 1 load" is the truly-last chronological
   session's load, not max/first — confirmed against a 3-session fixture (30→35→32 kg, expects
   32).
5. **[Mutual exclusivity — checked, correct]** The +2.5/+5 increment and the −10% reduction are
   structurally mutually exclusive (single if/else branch); can't both fire in one session.
6. **[PE-3 streak reset — checked, correct]** An intervening hit session resets the below-range
   streak to 0, confirmed by test.
7. **[LD-1 rung clamp — checked, correct]** Rung index is clamped at `rungs.length - 1`,
   confirmed by test.
8. **[TR-2 notice — flagged as unverified, not a defect]** The verifier's file list didn't
   include the UI layer, so it couldn't confirm the "already imported" notice actually
   surfaces anywhere. It does: `SettingsScreen.tsx`'s session-package import handler renders
   "This session package was already imported — no changes made." from
   `importSessionPackage()`'s `alreadyImported` flag. No action needed, but noting the gap in
   the verifier's coverage rather than silently treating it as confirmed.
9. **[TR-4 whitespace — FIXED]** The typed-confirmation check had no `.trim()`, so a trailing
   space would silently block a correct-looking confirmation. Added `.trim()` (case sensitivity
   kept deliberately — this is a destructive, irreversible action). Added a test.
10. **[Schema additions — checked, judged reasonable]** `Exercise.loadRegion` and
    `SetLog.ladderAdvanceConfirmed` (both new, not in spec §7) were checked against all 24 gym
    exercises' patterns and against the ladder-advance flow; judged as minimal, correctly-scoped
    bridges rather than overreach. No action needed.

Also explicitly checked and found correct (verifier's words): PE-4's RPE ceiling hardcoded at 8
independent of an exercise's own (often lower) targetRPE display value; Block 1 never producing
a ProgressionState row until calibration completes; BT-1/BT-2/BT-3 transition branching; TR-1/
TR-3 merge and full-history-replay equivalence; TR-4's fresh-device bypass. Not checked: the
on-device manual round-trip (out of scope for a text-only verifier).

## Manual verification done this session

Ran the app in a live browser preview and walked: fresh seed → Next Up (Block 1, G1) → Metrics
tab → logged a swing speed value (95 mph) → confirmed it appeared on the Progress screen's
sparkline → Settings tab → confirmed block-transition status, device role toggle, and both
transfer sections render correctly → back to Next Up → started a G1 session → logged a set
(reps/load/RPE) → rest timer fired → finished the session → no console errors → recompute and
block-transition check both ran silently (correct: 1/15 sessions, not due) → Next Up correctly
advanced the gym queue to G2 → Progress screen's session-frequency strip updated to reflect the
new session → clicked "Export full backup" in Settings, no errors thrown.

Not exercised this session (would require simulating a full 15-session Block 1 or a second
device): the Block-2 calibration handoff showing a live prescribed load, the ladder rung-advance
offer UI, an actual session-package round-trip between two browser instances, and the ROM-wizard
block-transition prompt. All four are covered by the Vitest fixtures; the UI plumbing for each
was reviewed by hand against the engine's expectations but not click-tested end-to-end.

## Spec deviations (all flagged, none silently applied)

1. **Numeric rep targets are parsed from `repsDisplay` text at recompute time
   (`src/engine/repTarget.ts`), not stored on `ExercisePrescription.repRange`.** P1 left
   `repRange` undefined everywhere in the seeded content (100+ prescriptions), since the library
   only gives numbers inside display strings like "8-10", "12/leg", "rung target 15". Rather
   than hand-transcribing a `repRange` onto every prescription — real transcription risk against
   already-verified P1 content — the engine parses the trailing number straight out of
   `repsDisplay`, correctly distinguishing rep counts from distance ("30 m"), time ("20 s/side")
   and qualitative ladder placeholders ("current rung", "per rung"). Confirmed correct against
   every unique `repsDisplay` string in the seeded templates.
2. **`Exercise.loadRegion?: "upper" | "lower"` added, populated via a `pattern`→region mapping
   in `src/data/exercises.ts`.** Spec §3.4 rule 2 needs an upper/lower split for the +2.5 kg/
   +5 kg increment, but neither spec §7 nor the library carries one — only a free-text
   `pattern` column. Squat/hinge/carry families map to lower; press/pull families to upper;
   Power/Rotation-power patterns (med ball throws, jumps, plyo push-up) are excluded from load
   progression entirely, since spec §3.2 frames Block 4/5/7 power work as "bar speed intent,"
   not a load-progression signal. Verifier-checked against all 24 gym exercises.
3. **`SetLog.ladderAdvanceConfirmed?: boolean` added.** Ladder rung advancement (LD-1) is a
   user-confirmed decision, not derivable from reps/RPE alone — but spec §7 calls
   ProgressionState "always recomputable from logs." Logging the confirmation as a flag on the
   SetLog the user was looking at when they confirmed keeps it recomputable (needed for TR-3)
   without inventing a second mutable-state store.
4. **The real seeded content mostly can't drive ladder advancement yet.** Most Block 2+ home
   session templates prescribe ladder exercises as `"current rung"` (no restated number) rather
   than Block 1's explicit `"rung target 15"` style. The engine correctly handles both (see
   deviation 1), but for `"current rung"` there's no numeric target to evaluate a hit against, so
   LD-1 can't actually fire against most of the real programme content as currently authored —
   only against Block 1's two ladder templates that restate a number. **Flag for Ryan:** either
   the library needs a restated numeric target per ladder session going forward, or the Session
   runner needs its own separate "did you hit today's rung target" input independent of
   `repsDisplay`. Not fixed in P2 since it's a content/UX decision, not an engine bug — the LD-1
   fixture tests prove the engine logic is correct given a numeric target.
5. **BT-4's pace-deficit formula is not literal spec text** (spec gives no formula, only the
   guardrail minimums and an example phrase). Documented and defended in the verifier section
   above rather than repeated here.
6. **Block transition, once due, is only checked/acted on when a session finishes** (via
   `checkBlockTransitionStatus()` in the Session runner) — there's no background check while
   idle on Next Up. This matches how BT-1/BT-2 are session-count/calendar triggers anyway (you
   can't complete a 15th session without finishing a session), and Next Up's guardrail display
   already recomputes live off `weeksElapsed` every time it renders.
7. **Year-2 cycling (`advanceToNextBlock` wrapping Block 8 → Block 2)** implements only the
   block-pointer/`cycleNumber` increment described in spec §3.2, not the baseline-replacement
   detail — spec explicitly defers that detail to P3 with year-1 data.

## Open items for P3

- CSV export (§8.1) and the Progress Tracker workbook — not started, correctly stubbed/disabled
  in Settings.
- Video URL editing (Exercise detail screen, spec §6 screen 6) — still doesn't exist; P1.1 also
  flagged this.
- Deviation 4 above (ladder session templates needing a restated numeric target, or a separate
  rung-target input) needs a decision before LD-1 is meaningfully exercisable against the real
  programme.
- On-device manual checklist (not self-certified, for Ryan):
  - [ ] Log a full Block 1 gym session to session 15 (or simulate via direct log entry) and
        confirm the Block 2 starting prescription matches the last Block 1 load logged.
  - [ ] Confirm the ladder rung-advance offer appears after two consecutive hits on a Block 1
        home template (H-01/H-02, which do have numeric targets) and that declining, then
        confirming later, still advances correctly.
  - [ ] Round-trip a session package: log a session on the Pixel, export, import on the iPad,
        confirm it's idempotent on re-import.
  - [ ] Full-state export from iPad, import onto a freshly-seeded Pixel, confirm no
        confirmation string is required; then re-import onto the now-populated Pixel and
        confirm the typed-confirmation gate blocks/allows correctly.
  - [ ] Trigger a real block transition (15 sessions or 8 weeks) and confirm the ROM wizard
        prompt appears and the block actually advances afterward.
