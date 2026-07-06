# Swing Gains — P1 Handback

**Phase:** P1 — scaffold, data, logging
**Repo:** https://github.com/rtonne8-cyber/swing-gains (public)
**Deploy URL:** https://rtonne8-cyber.github.io/swing-gains/
**Commit SHA:** `9d3d874281ea87ad6545909900ae18998a2e4e81`
**Date:** 2026-07-06

## What's built

- Repo scaffold: React + Vite + TS + vite-plugin-pwa + Dexie, following net-practice's
  vite base-path/manifest/SW-update/deploy patterns.
- Dexie schema (`src/db/schema.ts`, `src/db/types.ts`) implementing spec §7's nine stores,
  with two flagged deviations (see below).
- Full exercise library transcribed verbatim into seed data (`src/data/`): 49 exercises
  (G-01..G-24, H-01..H-25), 5 variation ladders (L1-L5), 24 session templates across all
  8 blocks. `videoUrl` seeded `null` throughout, pending the Cowork CSV merge (P3).
- Seed loader (`src/db/seed.ts`) — idempotent, validates referential integrity before
  writing anything (`src/db/validateLibrary.ts`), never overwrites logs on repeat calls.
- Dual-venue queue engine (`src/engine/queues.ts`) — pure functions, no Dexie access,
  computing next gym (G1/G2 alternation) and next home session independently, plus block
  progress (sessions/weeks/gym-home split for the guardrail display).
- Screens: Next Up (venue toggle, next session card, block progress bar), Session runner
  (set logging with reps/load/RPE, rest timer with Web Audio beep + vibration + visual
  flash fallback, session complete summary), Programme map (8-block grid + block detail).
- PWA manifest + icons (Personal brand palette), installable; GitHub Actions deploy
  workflow (build + **test** + deploy — test step added ahead of deploy as a gate,
  beyond the net-practice pattern).

## Files created

```
CLAUDE.md, .gitignore, package.json, vite.config.ts, tsconfig.json, index.html
.github/workflows/deploy.yml
.claude/launch.json
assets/icon.svg, scripts/make-icons.mjs
public/icon-192.png, icon-512.png, icon-maskable-512.png, apple-touch-icon.png
docs/spec-v1.2.md, docs/exercise-library-v1.0.md, docs/build-brief-v1.0.md, docs/handback-p1.md
src/main.tsx, src/App.tsx, src/vite-env.d.ts
src/theme/tokens.ts
src/db/types.ts, src/db/schema.ts, src/db/seed.ts, src/db/validateLibrary.ts
src/data/exercises.ts, ladders.ts, blocks.ts, sessionTemplates.ts, index.ts
src/engine/queues.ts
src/screens/NextUpScreen.tsx, SessionRunnerScreen.tsx, ProgrammeMapScreen.tsx
src/components/BottomNav.tsx, RestTimer.tsx, UpdateToast.tsx
tests/setup.ts, seed.test.ts, seedDatabase.test.ts, queues.test.ts
```

## Test summary

`npm test` (Vitest): **17/17 passing**, 3 files. Also run and green inside the
GitHub Actions deploy workflow (build gate).

- `tests/seed.test.ts` — AT-P1 #1 (seed loader integrity): exact counts (49/5/24/8),
  zero orphan references, null-safe videoUrl, every block has exactly one G1/G2/H1,
  plus a negative-control test confirming the validator actually flags a broken reference.
- `tests/seedDatabase.test.ts` — Dexie-level seeding (via fake-indexeddb): populates on
  first run, idempotent on repeat calls, never overwrites existing session logs.
- `tests/queues.test.ts` — AT-P1 #2 (dual queues): G1→G2→G1 alternation, home queue
  independence, incomplete logs ignored, weeks-elapsed calculation.

No failures.

## Manual verification done this session

Ran the app in a live browser preview (not just unit tests) and walked the golden path:
seeded on first load → Next Up shows Block 1 / G1 → started a G1 session → logged a set
(reps, load, RPE) → rest timer counted down and fired the audio/vibration/visual cue →
finished the session → Next Up correctly advanced the gym queue to G2 (1/15 sessions,
Gym 1/8) while the Home queue stayed on H1 independently → reloaded the page and
confirmed the logged set persisted in IndexedDB (offline-first survives a reload) →
opened Programme map → Block 4 detail rendered the contrast-pair prescriptions correctly.
No console errors observed.

## Deploy verification

- GitHub Actions run `28785846365`: build (incl. `npm test`) and deploy jobs both green.
- Live URL returns `200 OK`; manifest.webmanifest serves correctly with Personal branding
  (`theme_color: #34699E`, `background_color: #D8D4C9`).

## Spec deviations (all flagged, none silently applied)

1. **`Exercise.repRange`/`targetRPE` are optional reference defaults, not fixed values.**
   Spec §7 lists these as fixed Exercise fields, but the library prescribes different
   sets/reps/RPE for the same exercise across blocks (e.g. G-01 back squat is 3×12 in
   Block 1, 4×8–10 in Block 2, 5×5 in Block 6). The actual per-block working prescription
   lives on `ExercisePrescription` inside `SessionTemplate`; Exercise-level fields are left
   undefined everywhere in this seed rather than picking one block's value arbitrarily.
   See `src/db/types.ts`.

2. **`VariationLadder.rungs: string[]` replaces spec §7's `exerciseIds: string[]`.**
   Spec models each ladder rung as a distinct Exercise record. The library instead authors
   each ladder as a single pool exercise (e.g. H-01 "Squat ladder", `ladderId: L1`) with
   rungs described as prose variations (library §3) — and AT-P1 hard-requires exactly 49
   Exercise records (G-01..G-24 + H-01..H-25), which is incompatible with one Exercise per
   rung (would be 68+). Rungs are modelled as ordered display strings on the ladder;
   `ProgressionState.currentLadderRung` indexes into them. The Session runner already
   displays the current rung name alongside the anchor exercise — confirmed working in
   manual testing.

3. **`Exercise.cues` populated only from the library's own substitution notes (gym), left
   blank elsewhere.** The library has no per-exercise coaching-cue text field — only
   pattern, busy-gym substitution, video search term, and channel. Inventing full
   technique cues would be new content beyond the signed-off library, so `cues` currently
   holds only the substitution note where one exists (useful in a busy gym) and is blank
   for home exercises. Flag for Ryan: if per-exercise coaching cues are wanted, that's a
   new authoring task, not a P2/P3 build item.

4. **`Programme.currentBlockStartDate` added** (not in spec §7's Programme field list).
   Needed to display "weeks elapsed" on Next Up (spec §6 screen 1) and will drive the P2
   block-transition rule (spec §3.3), which is measured from block entry, not programme
   start.

5. **Session-template "as Block X" / "as Block X at progressed rungs" prose was expanded
   into full standalone prescription lists** for the referencing block (e.g. Block 3 H1,
   Block 6 H1, Block 7 G1/G2/H1), rather than left as a cross-reference, so every template
   is independently usable by the engine and UI. Each expanded template keeps the
   library's original carry-forward wording in its `notes` field for traceability.

6. **Rest timer durations are a coarse two-band heuristic** (150 s for the first two slots
   in a template = main lifts, 75 s for everything else = accessories), derived from
   library §1's prose ranges ("main lifts 2-3 min; accessories 60-90s; power/speed 90s-2min
   never rushed") rather than per-exercise numbers, since the library doesn't give
   per-exercise rest values and this isn't part of any AT-P1/P2 acceptance contract.
   Adjustable ±15s in the UI.

7. **CI gate added:** the deploy workflow runs `npm test` before `npm run build`/deploy,
   which net-practice's original workflow didn't do. This blocks a broken deploy rather
   than just building it — flagged as a small deliberate improvement, not a requirement.

## On-device manual checklist (for Ryan — not self-certified)

- [ ] Install as PWA on iPad (Safari) — confirm home-screen icon, standalone launch,
      status bar styling.
- [ ] Install as PWA on Pixel 8a (Chrome) — confirm install prompt/banner behaviour.
- [ ] Log a full G1 gym session end-to-end on iPad.
- [ ] Log a full H1 home session end-to-end on Pixel.
- [ ] Airplane-mode test: log a session fully offline on either device, confirm data
      present after relaunch.
- [ ] iPadOS service-worker update test: bump the version (trivial commit + push),
      confirm the "Update available" toast appears and updates correctly after a full
      close/reopen of the installed app (document actual observed lag).
- [ ] Confirm rest timer audio/vibration actually fires on both devices (iOS Safari
      silent-mode behaviour in particular — the visual flash fallback should still fire).

## Open items for P2

- Progression engine per spec §3.4 (double progression, Block 1 calibration derivation,
  RPE ceiling logic) — `ProgressionState.currentPrescribedLoadKg` is currently always
  `null`; Block 1 is calibration mode by design (user free-selects load) but nothing
  computes Block 2+ starting prescriptions yet.
- Ladder rung advancement (LD-1) — `currentLadderRung` is seeded at 0 and never advances;
  no "offer next rung" UI yet.
- Block transition logic (BT-1..BT-4) and the ROM test wizard.
- Session-package export/import (currently a disabled stub button on the session-complete
  screen) and full-state export/import with typed confirmation.
- Progress screen (not started — P2 scope per build brief).
- Decide whether the 6 flagged deviations above need any adjustment before P2 engine work
  builds on top of them (in particular #1 and #2, since P2's progression/ladder engine
  reads directly off these structures).
