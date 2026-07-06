# Swing Gains — Specification v1.2

**Set:** Personal (Slate/Copper) | **Status:** Spec-complete, ready for build brief | **Date:** 06 July 2026
**Supersedes:** v1.1 | **Next step:** `spec-to-build-brief` → Claude Code

> Draft between us — assumptions carry confidence ratings per working convention. Strip before any final version.

**v1.2 changes:** transfer model revised from full-state last-write-wins to session-package append-merge (iPad master); Progress Tracker host confirmed as Google Sheets (delivered as Sheets-engineered .xlsx via Drive); all v1.1 open questions resolved; audible/vibration rest timer confirmed.

---

## 1. Purpose

Swing Gains is a personal, installable PWA for iPad (primary/master device) and Google Pixel 8a (secondary logger) delivering a 12-month golf strength and conditioning programme structured as eight rotating training blocks (nominally 6 weeks each), with adaptive load progression from logged lifts. Personal use only; not productised. Outcomes targeted:

1. General strength increase
2. Swing speed increase
3. Improved rotational flexibility (thoracic and hip) supporting a better swing plane
4. Improved stability through the swing

## 2. Scope

### 2.1 In scope (v1)

- Full 12-month programme content: 8 blocks × session templates, pre-authored, signed off at P0
- Session-sequenced (not calendar-based) programme engine with venue-aware queues
- Set/rep/load/RPE logging with adaptive load progression rules
- Bodyweight exercise progression via variation ladders
- YouTube demonstration video per exercise — link-out model, editable URLs
- Metric logging: swing speed (manual entry, launch-monitor-agnostic device label), ROM self-tests, bodyweight (optional)
- Block transition logic: session-count driven with calendar cap
- Progress views: load trends, swing speed trend, ROM scores by block
- Offline-first (IndexedDB)
- **Session-package export/import** (Pixel → iPad append-merge) plus full-state JSON export (backup / device seeding)
- Flat CSV export feeding the Progress Tracker in Google Sheets (§8)
- GitHub Pages deployment; installable on iPadOS (Safari) and Android (Chrome)
- Rest timer with audible/vibration cues (device-permitting) and visual fallback

### 2.2 Out of scope (v1)

- Adaptive *programming* (auto-redesign of block content) — parked as P4+ concept
- Launch monitor API/file integration — manual entry only; data model import-ready
- Real-time/background sync — file-based session packages only; automated sync parked P4+ (low priority now the master-device flow is confirmed)
- In-app embedded video playback — link-out only (offline-first and PWA player reliability)
- Video hosting or downloading — YouTube links only
- Injury rehabilitation content — explicitly excluded; see §3.6

## 3. Programme Design

### 3.1 Architecture: session-sequenced, venue-aware

- Training frequency varies week to week; therefore **no fixed weekly calendar**.
- Each block defines three session templates:
  - **G1** — Gym: lower body + push emphasis (loaded)
  - **G2** — Gym: upper body + pull emphasis (loaded)
  - **H1** — Home: bodyweight speed, anti-rotation stability, mobility
- The app maintains **two queues**: next gym session (alternating G1/G2) and next home session (H1, with internal variation). Opening the app answers "what's next?" for wherever the user is.
- **Balance guardrail:** block completion requires minimum 8 gym sessions and minimum 4 home sessions. The app surfaces imbalance ("2 home sessions behind pace") without blocking training.

### 3.2 Block structure — 8 blocks over 12 months

| # | Block | Emphasis | Primary progression signal |
|---|---|---|---|
| 1 | Anatomical adaptation + baseline | Movement quality, tissue tolerance, load calibration | Establish working loads; baseline ROM tests |
| 2 | Strength foundation | Main lifts, moderate volume | Double progression |
| 3 | Strength | Heavier, lower reps | Load on main lifts |
| 4 | Power conversion | Contrast pairs (heavy → explosive), rotational throw variants (bodyweight/home substitutes) | Bar speed intent; jump/throw quality |
| 5 | Speed | Maximum-intent rotational work, swing-speed focus | Swing speed (primary metric this block) |
| 6 | Strength 2 | Consolidation at higher baseline | Load vs Block 3 |
| 7 | Power / speed 2 | Peak speed | Swing speed vs Block 5 |
| 8 | Stability + mobility emphasis | Concentrated ROM and anti-rotation work; strength maintenance | ROM test scores vs baseline |

- Mobility and anti-rotation stability appear as accessories in **every** session across all blocks; Block 8 concentrates them.
- After Block 8, the cycle restarts at Block 2 with Block 1 loads and ROM baselines replaced by current values (year-2 behaviour; confirmed in principle, detail reviewed at P3 with year-1 data).

### 3.3 Block transition rule

Advance to the next block when **15 sessions completed** OR **8 weeks elapsed**, whichever comes first. Minimum 4 weeks in a block regardless of session count (prevents cramming). Transition triggers the ROM self-test prompt (§3.5).

[Assumption — High confidence: average sustained frequency is 2–3 sessions/week. If actual frequency falls below 2/week for two consecutive blocks, the app flags that periodised progression is compromised; programme redesign is a human decision, not an app behaviour.]

### 3.4 Progression engine (deterministic rules)

**Loaded lifts (gym):**

1. Each exercise carries a rep range (e.g. 3 × 8–12) and target RPE.
2. All sets at top of range at RPE ≤ 8 → prescribe +2.5 kg (upper body) / +5 kg (lower body) next session.
3. Below bottom of range on any set, two consecutive sessions → reduce prescribed load 10% and rebuild.
4. Block 1 has no prescriptions: user selects loads freely; the engine records and derives starting prescriptions for Block 2 from Block 1 logs (calibration mode).

**Bodyweight exercises (home):**

1. Each movement sits on a **variation ladder** (e.g. squat pattern: bodyweight squat → split squat → rear-foot-elevated split squat → jump squat → single-leg variations).
2. Progression = rep target hit at RPE ≤ 8 for two consecutive sessions → app offers next ladder rung (user confirms; never forced).
3. Tempo prescriptions (e.g. 3-1-X) used as an intensity lever where ladders are short.

**Speed work:** no load progression — intent and quality cues only; swing speed is the tracked outcome, logged whenever a net session follows within 48 h of an H1/speed session (tagged for later correlation).

### 3.5 ROM self-tests (flexibility as a measured outcome)

Three home tests, scored simply, prompted at every block transition and available on demand:

| Test | Measures | Score |
|---|---|---|
| Seated wall thoracic rotation | Thoracic rotation (swing plane driver) | Degrees estimate via clock-face positions, L/R |
| 90/90 hip switch hold | Hip internal/external rotation | Achievable/with support/not yet, L/R |
| Standing toe reach | Posterior chain | Distance to floor, cm |

Scores chart by block alongside loads and swing speed. Blocks 1–2 restrict loaded end-range positions (e.g. deep loaded rotation) until thoracic scores improve one grade.

### 3.6 Safety boundary

The programme is designed for a healthy, stiff-but-uninjured adult. The app carries a standing note: pain (as distinct from effort) at any point = stop the movement and seek professional assessment. No rehabilitation logic is included by design.

## 4. Exercise Videos

- Every Exercise record carries an optional `videoUrl` (YouTube).
- **Link-out model:** the session runner shows a video icon/thumbnail; tapping opens the YouTube app (or browser tab). No in-app embed — preserves offline-first behaviour and avoids embedded-player reliability issues in installed PWAs.
- URLs are **user-editable in-app** (Exercise detail view) — link rot over a 12-month horizon is expected. A broken link never blocks a session; cues text remains the primary instruction.
- The full video link set (~80 URLs) is drafted alongside the exercise library at P0, favouring established, stable channels; link verification is a manual test pack item at each phase gate.
- Personal use, link-out only — no hosting, downloading, or redistribution of video content.

## 5. Application Architecture

### 5.1 Stack

React + Vite + TypeScript + vite-plugin-pwa (Net Gains pattern), GitHub Pages deploy, new repo **`swing-gains`**.

### 5.2 Storage

IndexedDB via Dexie. All data local to device. The iPad instance is the **canonical master record**; the Pixel instance is a satellite logger.

### 5.3 Offline-first

Full function with no connectivity (gyms have poor signal); video links degrade gracefully offline (icon disabled, cues remain). Service worker update flow adopts the resolution of the outstanding Net Gains Android auto-reload investigation — **directly blocking; closes before P1 starts** (same Pixel 8a, same SW pattern).

### 5.4 Devices and cross-device transfer

- **iPad (iPadOS Safari)** — master device: canonical data record, session running, progress review, ROM wizard, CSV export.
- **Google Pixel 8a (Android Chrome)** — satellite logger: session logging when the iPad is unavailable.
- **Session-package transfer (primary flow):** on completing a session on the Pixel, export a **session package** (that session's SessionLog, SetLogs, MetricLogs) via the OS share sheet. Import on the iPad **append-merges** by id — nothing existing on the iPad is modified or overwritten — then recomputes ProgressionState from the full history. Duplicate-import is idempotent (package ids already present are skipped with a notice).
- **Full-state export/import (secondary):** retained for backup and for seeding/refreshing the Pixel from the iPad. Import of a full-state file onto a device with existing data requires explicit typed confirmation.
- **Staleness behaviour:** Pixel prescriptions reflect its last seed from the iPad; a stale Pixel may prescribe one increment behind. Master recompute on merge corrects all downstream prescriptions — no data or progression integrity is ever lost. Documented practice: optional 10-second iPad → Pixel full-state seed before a phone session.

[Assumption — High confidence: Pixel use is occasional; one-increment-stale prescriptions are acceptable noise. Revisit if the Pixel becomes a weekly logger.]

### 5.5 Brand

Personal set — Slate `#34699E` / Copper `#C77B3C` on white; sibling identity to Net Gains.

## 6. Core Screens (v1)

1. **Today / Next Up** — venue toggle (Gym | Home), next session card, block progress bar (sessions done / target, weeks elapsed)
2. **Session runner** — exercise list with prescribed load/reps/rung, video link icons, set logging (touch-optimised for tablet and phone widths), rest timer (audible/vibration where the platform permits, visual fallback), RPE picker, session complete summary with **Export session package** action (surfaced prominently on the Pixel)
3. **Programme** — block map (8 blocks, current highlighted), block detail with session templates
4. **Progress** — load trend per main lift, swing speed trend, ROM scores by block, session frequency strip
5. **Metrics entry** — swing speed quick-add (value + device label), ROM test wizard (prompted at transitions), bodyweight
6. **Exercise detail** — cues, ladder position, video URL (editable)
7. **Settings / Data** — session-package import, full-state export/import, CSV export (§8), units, block transition status, device role indicator (master/satellite), safety note

## 7. Data Model (import-ready, monitor-agnostic)

Entities (IndexedDB stores):

- **Programme** — id, name, startDate, currentBlockId, cycleNumber, deviceRole (master/satellite)
- **Block** — id, sequence, name, emphasis, sessionTemplateIds, transitionRules
- **SessionTemplate** — id, blockId, venue (gym/home), type (G1/G2/H1), ordered ExercisePrescriptions
- **Exercise** — id, name, pattern, venue, ladderId?, cues, repRange, targetRPE, videoUrl?
- **VariationLadder** — id, pattern, ordered exerciseIds
- **SessionLog** — id (UUID), templateId, date, durationMin, completed, notes, originDevice
- **SetLog** — id (UUID), sessionLogId, exerciseId, setNo, reps, loadKg?, rpe, tempo?
- **ProgressionState** — exerciseId, currentPrescribedLoadKg | currentLadderRung, streak counters (derived; recomputable from logs)
- **MetricLog** — id (UUID), date, type (`swing_speed` | `rom_thoracic` | `rom_hip` | `rom_reach` | `bodyweight`), value, unit, side?, device? (free-text label, e.g. "R10"), sourceTag (`manual` | `import` reserved), linkedSessionLogId?

Design intent: UUIDs on all log entities make session-package append-merge idempotent; ProgressionState is derived state, always recomputable from logs (merge-safe by construction); `device` free-text label means replacing the launch monitor requires no schema change; `sourceTag = import` reserved for P4 monitor-file import with zero migration.

## 8. Reporting: CSV Export and Progress Tracker (Google Sheets)

### 8.1 App-side CSV export

Settings → **Export CSV** (iPad/master) produces a single flat, long-format file: one row per set log and per metric log, columns `date, block, sessionType, venue, exercise, setNo, reps, loadKg, rpe, metricType, metricValue, unit, device`. Shared via the OS share sheet; format engineered for clean Google Sheets import.

### 8.2 Swing Gains Progress Tracker

**Host: Google Sheets** (iPad-native review; export to Excel on demand). Because Sheets files cannot be authored directly, the tracker is built as an **.xlsx engineered for Sheets import** — conservative, Sheets-compatible formula set; no macros; no Power Query; standard chart types — delivered into Google Drive for one-tap conversion. Post-import verification checklist forms part of the P3 test pack.

Structure:

- **Data_Import** — paste/import target for the app's CSV export (append model; refresh = paste new rows)
- **Dashboard** — headline cards: current block, sessions this block, top-lift trends, latest swing speed, ROM status
- **Lift_Trends** — load progression chart per main lift, by block
- **Speed_and_ROM** — swing speed trend with block boundaries marked; ROM scores by block
- **Weakness_Panel** — formula-driven RAG flags: stalled lifts (no load increase across a full block), ROM stagnation (no grade change across two transitions), speed plateau despite strength gains (power-transfer failure signal), session-frequency drift (<2/week rolling)

Personal brand styling to the extent Sheets conversion preserves it; substance over chrome — this is a personal tracker, not a client deliverable. Zero-formula-error standard still applies post-import.

## 9. Delivery Phases

| Phase | Content | Gate |
|---|---|---|
| **P0 (pre-build)** | Close Net Gains Android SW auto-reload question; exercise library (~70–90 prescriptions) + video link set drafted | Ryan sign-off on library |
| **P1** | Data model, programme content seeded (all 8 blocks incl. video URLs), Next Up + Session runner + basic logging + rest timer, PWA install/deploy | Log a full gym and home session on iPad and Pixel |
| **P2** | Progression engine (loads + ladders), block transition logic, ROM test wizard, Progress views, session-package export/import, full-state backup | Engine prescribes correctly across a simulated 15-session block; Pixel → iPad session-package merge verified idempotent; recompute verified |
| **P3** | CSV export, Progress Tracker build + Sheets import verification, swing-speed correlation view, polish, year-2 cycle detail | Manual test pack pass incl. video link verification and Tracker post-import zero-error check |
| P4+ (parked) | Launch monitor file import; automated sync; adaptive programming concepts | Not gated; revisit after 2+ blocks of real data |

Acceptance tests, repo scaffold, and milestone breakdown produced via `spec-to-build-brief`.

## 10. Decisions Log (all open questions resolved)

| # | Question | Decision |
|---|---|---|
| 1 | Exercise library sign-off point | P0 artefact, reviewed before seeding — confirmed |
| 2 | Rest timer cues | Audible/vibration where platform permits, visual fallback — confirmed |
| 3 | Tracker host | Google Sheets primary (Excel export on demand) — confirmed |
| 4 | Device model | iPad master, Pixel satellite, session-package transfer — confirmed |
| 5 | Year-2 cycling | Restart at Block 2 with refreshed baselines — confirmed in principle; detail at P3 |

---

*Spec v1.2 — spec-complete. Produced in Claude Chat; build executes in Claude Code per standing workflow.*
