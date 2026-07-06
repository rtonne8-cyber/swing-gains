# Swing Gains — Exercise Library v1.0 (P0 Sign-off Artefact)

**Set:** Personal | **Status:** Draft for sign-off | **Date:** 06 July 2026
**Parent:** Swing Gains Spec v1.2 | **Purpose:** Seeds the app's Exercise, VariationLadder, and SessionTemplate stores. Video URLs sourced post-sign-off via Cowork (Appendix A).

> Design inputs: barbell-confident; busy gym (every gym exercise carries a substitution sharing the same progression state); home = bodyweight + golf clubs only; conservative loaded end-range rotation in Blocks 1–2 pending thoracic ROM improvement.

---

## 1. Conventions

- **RPE:** rating of perceived exertion, 1–10. Target RPE is the ceiling, not the goal.
- **Tempo:** eccentric-pause-concentric, e.g. 2-0-2; X = explosive intent.
- **Substitution rule:** substitutions inherit the parent exercise's progression state; the engine treats a subbed session as the parent for streak/load purposes (load mapping noted per exercise where geometry differs).
- **Warm-up (all sessions, ~5 min, unlogged):** 2 min pulse raise → open book ×6/side → 90/90 switch ×6 → glute bridge ×10 → bodyweight squat ×10 → (gym) 2 ramp-up sets on the A-lift.
- **Rest:** main lifts 2–3 min; accessories 60–90 s; power/speed work full recovery (90 s–2 min), never rushed.

## 2. Exercise Pool

### 2.1 Gym pool

| ID | Exercise | Pattern | Busy-gym substitution | Video search term | Channel |
|---|---|---|---|---|---|
| G-01 | Back squat (barbell) | Squat | Goblet squat (map: DB ≈ 40% bar load) or leg press | "back squat technique" | Squat University |
| G-02 | Trap bar deadlift | Hinge | Barbell deadlift or heavy DB RDL | "trap bar deadlift form" | Alan Thrall |
| G-03 | Romanian deadlift (barbell) | Hinge | DB RDL | "romanian deadlift form" | Squat University |
| G-04 | Bench press (barbell) | H-push | DB bench press | "bench press technique" | Alan Thrall |
| G-05 | Seated DB shoulder press | V-push | Machine shoulder press | "seated dumbbell shoulder press" | Jeff Nippard |
| G-06 | Barbell row | H-pull | Chest-supported DB row | "barbell row form" | Alan Thrall |
| G-07 | Lat pulldown | V-pull | Assisted pull-up / band pull-up | "lat pulldown technique" | Jeff Nippard |
| G-08 | Bulgarian split squat (DB) | SL squat | DB split squat | "bulgarian split squat" | Squat University |
| G-09 | Walking lunge (DB) | SL squat | Reverse lunge (DB) | "dumbbell walking lunge" | Jeff Nippard |
| G-10 | Lateral lunge (DB) | Frontal | Bodyweight lateral lunge | "lateral lunge golf" | Fit For Golf |
| G-11 | Pallof press (cable) | Anti-rotation | Band Pallof press | "pallof press" | Fit For Golf |
| G-12 | Cable chop (high-to-low) | Rotation | Band chop | "cable chop golf" | Fit For Golf |
| G-13 | Med ball rotational throw (side, to wall) | Rotation-power | Band explosive rotation | "med ball rotational throw golf" | Fit For Golf |
| G-14 | Med ball slam | Power | DB high-pull (light) | "medicine ball slam" | Fit For Golf |
| G-15 | Jump squat (bodyweight) | Power | — (no equipment) | "jump squat technique" | Squat University |
| G-16 | Broad jump | Power | Box jump | "standing broad jump technique" | Fit For Golf |
| G-17 | Plyo push-up | Power | Fast-tempo push-up (X concentric) | "plyometric push up" | Jamie Greaves Golf |
| G-18 | Barbell hip thrust | Hinge/glute | DB glute bridge | "barbell hip thrust form" | Jeff Nippard |
| G-19 | Single-leg RDL (DB) | SL hinge | Bodyweight SL RDL | "single leg rdl golf" | Jamie Greaves Golf |
| G-20 | Farmer carry (DB) | Carry | Suitcase carry (single DB) | "farmer carry technique" | Squat University |
| G-21 | Face pull (cable) | H-pull/posture | Band pull-apart | "face pull form" | Jeff Nippard |
| G-22 | Landmine rotation | Rotation | Cable chop (low-to-high) | "landmine rotation golf" | Fit For Golf |
| G-23 | Box jump | Power | Jump squat | "box jump technique" | Squat University |
| G-24 | Suitcase carry (DB) | Anti-lateral | Single-arm farmer carry | "suitcase carry" | Fit For Golf |

### 2.2 Home pool (bodyweight + golf club)

| ID | Exercise | Pattern | Ladder | Video search term | Channel |
|---|---|---|---|---|---|
| H-01 | Squat ladder (see L1) | Squat | L1 | "bodyweight squat progression" | Jamie Greaves Golf |
| H-02 | Push-up ladder (see L2) | H-push | L2 | "push up progression" | Jamie Greaves Golf |
| H-03 | Glute bridge ladder (see L3) | Hinge | L3 | "single leg glute bridge progression" | E3 Rehab |
| H-04 | Side plank ladder (see L4) | Anti-lateral | L4 | "side plank progression" | E3 Rehab |
| H-05 | Dead bug | Anti-extension | — | "dead bug exercise" | E3 Rehab |
| H-06 | Bird dog | Anti-rotation | — | "bird dog form" | E3 Rehab |
| H-07 | Copenhagen plank (short lever) | Adductor/stability | — | "copenhagen plank short lever" | E3 Rehab |
| H-08 | Speed skater | Frontal-power | — | "speed skater exercise" | Fit For Golf |
| H-09 | Rotational hop ladder (see L5) | Rotation-power | L5 | "rotational jump golf" | Fit For Golf |
| H-10 | Broad jump (garden) | Power | — | "standing broad jump" | Fit For Golf |
| H-11 | Pogo hops | Reactive | — | "pogo hops plyometric" | Fit For Golf |
| H-12 | Mountain climber (fast) | Power/core | — | "mountain climbers form" | Jamie Greaves Golf |
| H-13 | Open book | T-spine mobility | — | "open book thoracic rotation" | Fit For Golf |
| H-14 | Seated wall thoracic rotation | T-spine mobility (= ROM test) | — | "seated thoracic rotation golf" | Jamie Greaves Golf |
| H-15 | 90/90 hip switch | Hip mobility (= ROM test) | — | "90 90 hip switch" | Fit For Golf |
| H-16 | Couch stretch | Hip flexor | — | "couch stretch hip flexor" | Squat University |
| H-17 | World's greatest stretch | Full-body mobility | — | "worlds greatest stretch" | Fit For Golf |
| H-18 | Hamstring toe-reach flow | Posterior chain (= ROM test kin) | — | "standing toe touch progression" | E3 Rehab |
| H-19 | Cossack squat | Frontal mobility | — | "cossack squat progression" | Squat University |
| H-20 | Cat-cow segmentation | Spine mobility | — | "cat cow exercise" | E3 Rehab |
| H-21 | Shoulder taps | Anti-rotation | — | "plank shoulder taps" | Jamie Greaves Golf |
| H-22 | Hollow hold | Anti-extension | — | "hollow body hold" | Jeff Nippard |
| H-23 | Club speed swings — lead side | Speed (specific) | — | "overspeed training golf swing protocol" | Fit For Golf |
| H-24 | Club speed swings — trail side (opposite hand) | Speed (specific) | — | "non dominant side swings golf speed" | Fit For Golf |
| H-25 | Inverted-driver overspeed swings | Speed (specific) | — | "upside down driver speed training" | Fit For Golf |

Club speed swing notes: max intent, full recovery between swings, into the net or open garden space; lead/trail-side balance protects the trunk over a 12-month horizon; log R10/monitor swing speed whenever a net session falls within 48 h (spec §3.4).

## 3. Variation Ladders

| Ladder | Rungs (progression order) |
|---|---|
| **L1 Squat** | Bodyweight squat → 3-1-X tempo squat → split squat → rear-foot-elevated split squat (chair) → jump squat → single-leg box squat (to chair) |
| **L2 Push** | Incline push-up (worktop) → push-up → feet-elevated push-up → archer push-up → plyo push-up |
| **L3 Bridge** | Glute bridge → glute bridge march → single-leg glute bridge → single-leg bridge 3 s pause |
| **L4 Side plank** | Knees → full, 20 s → full, 40 s → feet-stacked + reach-through → side plank leg lift |
| **L5 Rotational hop** | Low-amplitude hop-and-stick → 90° hop-and-stick → 180° hop → continuous 90° hops |

Rung advance rule per spec §3.4: rep/time target at RPE ≤ 8, two consecutive sessions, user-confirmed.

## 4. Block Templates

### Block 1 — Anatomical adaptation + baseline (calibration mode: user-selected loads, engine records)

**G1 (gym, lower + push)** | tempo 2-0-2 throughout
| Slot | Exercise | Sets × reps | RPE |
|---|---|---|---|
| A | G-01 Back squat | 3 × 12 | 6 |
| B | G-04 Bench press | 3 × 12 | 6 |
| C | G-08 Bulgarian split squat | 2 × 12/leg | 6–7 |
| D | G-11 Pallof press | 3 × 10/side | 6 |
| E | G-20 Farmer carry | 3 × 30 m | 6 |
| F | H-13 Open book | 2 × 8/side | — |

**G2 (gym, hinge + pull)**
| Slot | Exercise | Sets × reps | RPE |
|---|---|---|---|
| A | G-03 Romanian deadlift | 3 × 12 | 6 |
| B | G-07 Lat pulldown | 3 × 12 | 6 |
| C | G-06 Barbell row | 2 × 12 | 6–7 |
| D | G-18 Hip thrust | 3 × 12 | 6–7 |
| E | G-21 Face pull | 2 × 15 | 6 |
| F | H-15 90/90 switch | 2 × 8/side | — |

**H1 (home, ~30 min)** — circuit ×3: H-01 (rung target 15) / H-02 (rung target 10–12) / H-03 (×15) / H-05 (×8/side) / H-04 (per rung); finisher: H-17 ×5/side, H-14 ×8/side, H-18 ×10. **Week 1: baseline ROM tests logged.**

### Block 2 — Strength foundation (double progression live from here)

**G1:** A G-01 4×8–10 RPE 7–8 · B G-04 4×8–10 RPE 7–8 · C G-08 3×10/leg · D G-10 2×10/side · E G-11 3×10/side · F G-24 2×30 m/side
**G2:** A G-02 Trap bar DL 4×8 RPE 7–8 · B G-06 4×8–10 · C G-07 3×10 · D G-18 3×10 · E G-12 3×10/side (light, control) · F G-21 2×15
**H1:** circuit ×3: L1/L2/L3 at current rungs · H-06 ×8/side · H-04 per rung · H-07 2×15 s/side; mobility finisher as Block 1; H-11 Pogo 2×15 (intro, reactive prep)

### Block 3 — Strength

**G1:** A G-01 4×5–6 RPE 8 · B G-04 4×5–6 RPE 8 · C G-08 3×8/leg · D G-11 3×10/side · E G-24 3×30 m/side
**G2:** A G-02 4×4–5 RPE 8 · B G-06 4×6 · C G-07 3×8 · D G-19 2×8/leg · E G-12 3×10/side · F G-21 2×15
**H1:** as Block 2 at progressed rungs; add H-09 rotational hop L5 rung 1–2, 3×4/side (stick each landing); H-22 hollow 3×20 s

### Block 4 — Power conversion (contrast pairs; 2-3 min between pair elements)

**G1:** A1 G-01 4×4 RPE 7 → A2 G-23 Box jump 4×3 · B1 G-04 4×4 RPE 7 → B2 G-17 Plyo push-up 4×3 · C G-13 MB rotational throw 4×4/side (max intent) · D G-11 2×10/side
**G2:** A1 G-02 4×3 RPE 7 → A2 G-16 Broad jump 4×3 · B G-06 3×6 · C G-14 MB slam 4×5 · D G-22 Landmine rotation 3×8/side · E G-21 2×15
**H1 (speed intro):** H-09 L5 3×4/side · H-08 Speed skaters 3×6/side · H-10 Broad jump 3×3 · **H-23/H-24 Club speed swings 2×5/side (intro volume)** · mobility finisher

### Block 5 — Speed (swing speed = primary metric)

**G1 (maintenance + power):** A G-01 2×5 RPE 7 · B G-13 5×3/side max intent · C G-15 Jump squat 4×4 · D G-11 2×10/side
**G2 (maintenance + power):** A G-02 2×4 RPE 7 · B G-14 4×4 · C G-06 2×6 · D G-22 3×6/side (X intent)
**H1 (speed session):** full warm-up mandatory · **H-25 Inverted driver 3×6/side · H-23 Lead side 3×6 · H-24 Trail side 2×6** · H-09 L5 3×3/side · full recovery between all sets · log swing speed at next net session ≤48 h

### Block 6 — Strength 2 (consolidation; loads target > Block 3 close-out)

**G1:** A G-01 5×5 RPE 8 · B G-04 5×5 RPE 8 · C G-09 Walking lunge 3×10/leg · D G-11 3×10/side · E G-24 3×30 m/side
**G2:** A G-02 5×4 RPE 8 · B G-06 4×6 · C G-05 3×8 · D G-18 3×8 · E G-12 3×10/side · F G-21 2×15
**H1:** as Block 3 at progressed rungs; club swings maintained at 2×4/side (retention dose)

### Block 7 — Power / speed 2 (peak; target swing speed > Block 5)

**G1:** as Block 4 G1 with loads from Block 6 · MB throw 5×3/side
**G2:** as Block 4 G2 · add H-11 Pogo 3×15 pre-lift (reactive primer)
**H1:** as Block 5 H1 · inverted driver 4×5/side · deload swing volume in the final week before any competitive round

### Block 8 — Stability + mobility emphasis (strength maintenance)

**G1:** A G-01 2×5 RPE 7 · B G-19 SL RDL 3×8/leg · C G-10 3×8/side · D G-08 2×10/leg · E G-11 3×12/side · F G-24 3×40 m/side
**G2:** A G-02 2×4 RPE 7 · B G-06 3×8 · C G-18 3×10 · D G-22 3×10/side (controlled full range) · E G-21 3×15
**H1 (extended, ~40 min):** H-19 Cossack 3×6/side · H-07 Copenhagen 3×20 s/side · H-04 top rung · H-06 3×8/side · full mobility sequence: H-13/H-14/H-15/H-16/H-17/H-18/H-20 · **block-exit ROM tests logged and compared to baseline**

---

## Appendix A — Cowork Brief: Video Link Sourcing

**Task:** populate the `videoUrl` column for all 49 exercises (IDs G-01…G-24, H-01…H-25) in this library.

**Per-exercise checklist:**
1. Search YouTube using the given search term; prefer the named channel, else the shortlist: Fit For Golf, Jamie Greaves Golf, Squat University, Alan Thrall, Jeff Nippard, E3 Rehab.
2. Verify the video plays, demonstrates the exact movement (not a variation), and is instructional (not entertainment).
3. Prefer videos 2–8 minutes; capture the canonical URL (`https://www.youtube.com/watch?v=…`, no playlist/timestamp parameters).
4. For ladder exercises (L1–L5), a single progression video covering multiple rungs is acceptable; note which rungs it covers.
5. Flag any exercise where no suitable video is found — do not substitute a poor link.

**Return format (CSV):** `exerciseId, videoUrl, channel, durationMin, coversRungs, verifiedDate, notes`

**Acceptance:** 49 rows; zero broken links; zero wrong-movement links; flags acceptable in `notes`.

---

*Library v1.0 — on sign-off, this document seeds the P1 content build; video URLs merge in from the Cowork CSV.*
