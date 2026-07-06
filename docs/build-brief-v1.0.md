# Swing Gains — Build Brief v1.0

**Set:** Personal | **Date:** 06 July 2026 | **Build tool:** Claude Code (Lenovo)
**Sources:** Swing Gains Spec v1.2 (`swing-gains-spec-v1.2.md`) · Exercise Library v1.0 (`swing-gains-exercise-library-v1.0.md`, signed off)

---

## 1. Objective & Definition of Done

Build Swing Gains: an offline-first PWA delivering the 12-month, 8-block golf S&C programme with adaptive load progression, venue-aware session queues, session-package device transfer, and CSV export to a Google-Sheets-hosted Progress Tracker.

**Done =** all P1–P3 exit tests pass; app installed and functioning offline on iPad (Safari) and Pixel 8a (Chrome); a full gym and home session logged on-device; Pixel→iPad session-package merge verified idempotent; Progress Tracker imports the app's CSV in Google Sheets with zero formula errors.

## 2. Source Spec Reference

- **Spec:** `swing-gains-spec-v1.2.md` — architecture §5, data model §7, screens §6, progression rules §3.4, transfer model §5.4, reporting §8. Do not restate; the spec is authoritative.
- **Content seed:** `swing-gains-exercise-library-v1.0.md` — 49 exercises, 5 ladders, 24 session templates. Video URLs merge from Cowork CSV (`videoUrl` join on `exerciseId`); build must not block on the CSV — seed with null URLs and merge when delivered.

## 3. Environment & Constraints

- **Build machine:** Lenovo (Claude Code, cmd.exe shell, ASCII-only scripts, Node/npm available).
- **Repo remote:** GitHub, HTTPS push via PAT-embedded remote (Net Gains pattern).
- **Deploy/run target:** GitHub Pages; runtime is iPadOS Safari + Android Chrome — no corporate PC involvement, no admin constraints apply.
- **Stack (fixed):** React + Vite + TypeScript + vite-plugin-pwa + Dexie. Reuse the `net-practice` scaffold patterns (vite config base path, PWA manifest, deploy workflow) — do not reinvent.
- **SW update flow:** identical to Net Gains (confirmed auto-updating on Android Chrome). iPadOS SW update lag test carried in P1 acceptance.
- **Brand:** Personal set — Slate `#34699E`, Copper `#C77B3C`, warm grey `#D8D4C9`, white; system-sans/Arial stack. Sibling identity to Net Gains.
- Spec/library files live in the repo under `/docs`; OneDrive holds working copies — avoid dual-editing.

## 4. Repo / Folder Scaffold

Repo: **`swing-gains`** (new, public or private per Net Gains convention).

```
swing-gains/
  CLAUDE.md                  ← project rules (below)
  docs/
    spec-v1.2.md             ← copy of signed spec
    exercise-library-v1.0.md ← signed content seed
    video-links.csv          ← Cowork deliverable (merged when available)
  src/
    db/          ← Dexie schema (spec §7), seed loader, migrations
    engine/      ← progression, ladders, block transition, queues (pure functions)
    transfer/    ← session-package export/import, full-state, CSV export
    screens/     ← 7 screens per spec §6
    components/
    theme/       ← Personal palette tokens
  tests/         ← Vitest: engine + transfer unit/fixture tests
  public/        ← manifest, icons
  .github/workflows/deploy.yml
```

**CLAUDE.md content (create):** stack + fixed versions; spec/library are authoritative — no programme content invention; engine and transfer logic must be pure, unit-tested functions with UI as a thin layer; ASCII-only scripts; commit per milestone; Personal brand tokens only; never modify `docs/` content without instruction.

## 5. Phased Build Plan

**P0 — CLOSED.** SW behaviour confirmed; library signed off. Cowork video CSV in flight (non-blocking).

**P1 — Skeleton, data, logging (goal: usable logger on both devices)**
Scope: repo scaffold; Dexie schema per spec §7 (UUIDs on logs, derived ProgressionState); library seed loader (templates, exercises, ladders, null-safe videoUrl); screens 1, 2, 3 (Next Up with venue toggle + dual queues, Session runner with rest timer incl. audible/vibration + visual fallback, Programme map); PWA install + Pages deploy.
Exit test: AT-P1 set (below).

**P2 — Engine, transfer, progress (goal: the app thinks)**
Scope: progression engine (§3.4 rules incl. Block 1 calibration mode); ladder advancement; block transition (15-session/8-week/4-week-min, guardrails); ROM test wizard at transitions; Progress screen; session-package export/import with idempotent append-merge + ProgressionState recompute; full-state export/import with typed confirmation.
Exit test: AT-P2 set.

**P3 — Reporting, polish, tracker (goal: the loop closes)**
Scope: CSV export per spec §8.1 column contract; Progress Tracker workbook via openpyxl — Sheets-compatible formula set, no macros, sheets per spec §8.2 incl. Weakness_Panel RAG logic; swing-speed correlation view; video URL merge from `video-links.csv`; exercise detail URL editing; polish pass; year-2 cycle stub behind a flag.
Exit test: AT-P3 set + manual test pack.

## 6. Acceptance Tests

**AT-P1 (run: Vitest + on-device manual)**
1. Seed loader: 49 exercises, 5 ladders, 24 templates load; zero orphan references.
2. Dual queues: completing G1 advances gym queue to G2 and vice versa; home queue independent.
3. Full gym session and full home session logged on iPad; repeat on Pixel.
4. Offline: airplane-mode session logging succeeds end-to-end; data present after relaunch.
5. iPadOS SW update: deploy a version bump; confirm update lands after full close/reopen (document observed behaviour).

**AT-P2 (run: Vitest fixtures — engine must be pure functions)**
1. PE-1: 3×8–12 upper lift, all sets ×12 @ RPE ≤8 → next prescription +2.5 kg.
2. PE-2: lower lift equivalent → +5 kg.
3. PE-3: below-range sets in two consecutive sessions → prescribed load −10%.
4. PE-4: RPE 9 at top of range → no increment (RPE ceiling respected).
5. PE-5: Block 1 calibration — 15 logged calibration sessions produce Block 2 starting prescriptions = last stable Block 1 load per lift.
6. LD-1: ladder rung offer after two consecutive target hits @ RPE ≤8; not before; user-confirm gate honoured.
7. BT-1: transition fires at 15 sessions (weeks ≥4); BT-2: fires at 8 weeks regardless of count; BT-3: never before 4 weeks; BT-4: guardrail warning at <8 gym or <4 home pace, non-blocking.
8. TR-1: session-package import adds exactly the package's logs; TR-2: re-import of same package = no-op with notice; TR-3: post-merge ProgressionState recompute equals a from-scratch replay of full history; TR-4: full-state import onto populated device requires typed confirmation string.
9. On-device: round-trip Pixel session → share sheet → iPad import verified.

**AT-P3**
1. CSV export matches the §8.1 column contract exactly (header snapshot test); row count = setLogs + metricLogs.
2. Tracker: import CSV fixture (3 simulated blocks) into Google Sheets → zero formula errors; Weakness_Panel correctly flags a seeded stalled lift, ROM stagnation, and frequency drift in the fixture.
3. Video links: merged URLs open from exercise detail; broken/null URL degrades to cues without error.
4. Manual test pack (produced at P3 start, Net Gains B9/M-series pattern): install, transfer, ROM wizard, tracker import, link spot-checks.

## 7. Data & Secrets Handling

No secrets: no API keys, no backend, no auth. All training data local to device (IndexedDB); leaves only via user-initiated export. Nothing personal committed to the repo — fixtures use synthetic data only. Video URLs are public YouTube links (link-out only, no downloading/rehosting). PAT stays in the git remote config, never in files.

## 8. Autonomy & Cost Flags

None required — fully interactive build, no cron, no programmatic API spend. **Optional post-P3:** a Claude Code Routine for deploy verification (Pages build green + smoke-load the deployed URL), consistent with the previously identified low-risk Routines candidate for personal PWAs. Not gated.

## 9. Handback Format

Per phase, Claude Code returns a Markdown handback: phase ID; file paths created/modified; `npm test` summary (pass/fail counts, failures verbatim); deployed URL + commit SHA; deviations from spec (each flagged, none silently applied); open items for the next phase. Manual test items are listed as a checklist for Ryan, not self-certified.

---

## Claude Code Guidance Note (paste-ready)

```
Project: Swing Gains — golf S&C PWA. New repo `swing-gains` on the Lenovo.

Authoritative inputs (in /docs, do not deviate without flagging):
- spec-v1.2.md  (architecture, data model, progression rules, transfer model)
- exercise-library-v1.0.md  (all programme content — never invent exercises or prescriptions)

Stack: React + Vite + TypeScript + vite-plugin-pwa + Dexie, GitHub Pages deploy.
Reuse net-practice patterns for vite base path, PWA manifest, SW update flow, deploy workflow.
Constraints: cmd.exe, ASCII-only scripts, HTTPS PAT remote. Personal brand: Slate #34699E,
Copper #C77B3C, warm grey #D8D4C9 on white. Engine and transfer logic = pure, Vitest-tested
functions; UI stays thin.

Build in three phases; stop for handback after each:
[ ] P1 — scaffold, Dexie schema (UUID logs, derived ProgressionState), library seed loader
      (null-safe videoUrl), screens: Next Up (dual venue queues), Session runner (rest timer,
      audio/vibration + visual fallback), Programme map; PWA install + Pages deploy.
[ ] P2 — progression engine per spec §3.4 (incl. Block 1 calibration), ladder advancement,
      block transition + guardrails, ROM wizard, Progress screen, session-package
      export/import (idempotent append-merge + state recompute), full-state export/import
      (typed confirmation).
[ ] P3 — CSV export (§8.1 column contract), Progress Tracker xlsx via openpyxl
      (Sheets-compatible formulas, no macros, Weakness_Panel RAG), swing-speed correlation
      view, video-links.csv merge, URL editing, polish, manual test pack draft.

Acceptance tests: implement the AT-P1/P2/P3 fixtures from the build brief as Vitest suites;
all must pass before handback. On-device items are returned as a manual checklist.

Handback per phase (Markdown): files, test summary, deploy URL + SHA, spec deviations
(flag every one), next-phase open items.
```

---

*Build Brief v1.0 — validation checklist passed. Hand to Claude Code with spec v1.2 + library v1.0 in `/docs`.*
