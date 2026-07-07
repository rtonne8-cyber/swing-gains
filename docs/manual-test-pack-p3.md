# Swing Gains — P3 Manual Test Pack

Per the build brief's P3 gate ("Manual test pack pass incl. video link verification and
Tracker post-import zero-error check"). None of this is self-certified — it's for Ryan to
run on-device and in Google Sheets. Anything carried over from the P1/P2 on-device checklists
that hasn't been ticked off yet is repeated here so this is the one list to work from at the
P3 gate.

## 1. Install

- [ ] Install as PWA on iPad (Safari) — home-screen icon, standalone launch, status bar styling.
- [ ] Install as PWA on Pixel 8a (Chrome) — install prompt/banner behaviour.
- [ ] iPadOS service-worker update test: bump the version (trivial commit + push), confirm the
      "Update available" toast appears and updates correctly after a full close/reopen.

## 2. Transfer

- [ ] Round-trip a session package: log a session on the Pixel, export, import on the iPad,
      confirm it's idempotent on re-import (re-importing the same file shows "already
      imported — no changes made" and doesn't duplicate anything).
- [ ] Full-state export from iPad, import onto a freshly-seeded Pixel, confirm no confirmation
      string is required for an empty device; then re-import onto the now-populated Pixel and
      confirm the typed-confirmation gate (`REPLACE ALL DATA`) blocks/allows correctly.

## 3. Block transition / ROM wizard

- [ ] Trigger a real block transition (15 sessions or 8 weeks) and confirm the ROM wizard
      prompt appears and the block actually advances afterward.
- [ ] Confirm the ladder rung-advance offer appears after two consecutive hits on a Block 2+
      home template, and that declining, then confirming later, still advances correctly.
- [ ] Spot-check a couple of L4 (side plank) rungs — the set-input labels itself "Secs" with an
      inline "target Ns/side" for timed rungs; confirm that reads clearly in practice.

## 4. CSV export (spec §8.1)

- [ ] Log a handful of real sets and at least one metric entry (swing speed or a ROM test) on
      the iPad, then Settings → Export CSV. Confirm the share sheet / download fires with no
      error, and the file opens cleanly in a spreadsheet app (Excel, Sheets, Numbers).
- [ ] Spot-check the exported rows: set rows carry block/sessionType/venue/exercise/setNo/reps/
      loadKg/rpe with metric columns blank; metric rows carry date/metricType/metricValue/unit/
      device with everything else blank.
- [ ] Note the known limitation: MetricLog's `side` field (L/R for ROM tests) is not part of
      the §8.1 column contract, so left/right ROM readings collapse into a single unlabelled
      row in the export. Not a bug — the contract simply has no column for it.

## 5. Exercise detail (spec §6 screen 6)

- [ ] From Programme → a block → tap an exercise name. Confirm cues/description render, and
      for a ladder exercise (e.g. Squat ladder) the current rung and its position (e.g. "Rung 1
      of 6") show correctly.
- [ ] Edit the video URL field and save. For a non-ladder exercise, confirm the new link opens
      from the Session runner's video icon. For a ladder exercise, confirm editing here changes
      the CURRENT rung's video specifically (the one actually shown in-session) — not the
      anchor exercise's own field, which stays null by design.
- [ ] Clear a video URL entirely and save; confirm the Session runner's video icon degrades to
      disabled (not an error) and cues remain visible.
- [ ] Spot-check a handful of the merged video links from `docs/video-links.csv` /
      `docs/ladder-video-links.csv` actually open the intended clip — particularly the rows
      P1.1's handback flagged "Confidence: Medium" or lower (H-09 rung 1's intentional null,
      H-23/24/25's shared low-confidence video, and any substitution video from a channel
      outside the approved shortlist).

## 6. Progress Tracker (spec §8.2) — Google Sheets import

Files: `docs/tracker/Swing_Gains_Progress_Tracker.xlsx` (the template) and
`docs/tracker/csv-fixture-3-blocks.csv` (a synthetic 3-block fixture — Back squat stalls in
its second block, Bench press keeps progressing as a control, a hip-switch ROM reading repeats
unchanged, and logging is sparse enough to trip the frequency-drift flag; verified
independently in `tests/csvFixture.test.ts` and, for the workbook's own formulas, by an
automated formula-evaluation pass during the build — see the P3 handback for details).

- [ ] Upload `Swing_Gains_Progress_Tracker.xlsx` to Google Drive and open with Google Sheets
      ("Open with Google Sheets", which converts it — confirm the conversion reports zero
      formula errors).
- [ ] Open `csv-fixture-3-blocks.csv`, select all, copy, and paste into `Data_Import` starting
      at cell A2 (paste values only, so you don't disturb the header row or the two hidden
      helper columns N/O).
- [ ] Confirm **Dashboard** shows "Current block: Block 3: Strength" and the other cards
      populate (latest swing speed 93 mph, latest ROM — hip switch: 1, latest loads for both
      example lifts).
- [ ] Confirm **Lift_Trends** shows Back squat's load flattening in block 2 (45/45/45 kg) while
      Bench press keeps climbing (35/36/37.5 kg), both charted by block.
- [ ] Confirm **Speed_and_ROM** shows the swing-speed and ROM-by-block table/charts populating
      (no #N/A or #VALUE! errors in any cell).
- [ ] Confirm **Weakness_Panel** flags: Back squat = STALLED, Bench press = ok, ROM (hip) =
      STAGNANT, and the frequency-drift summary at the bottom = DRIFTING (sessions in window 6,
      rolling average 1.5/week).
- [ ] Now paste a real CSV export from the app (section 4 above) into a fresh copy of the
      template and confirm it behaves sensibly on real data — this is the actual "does my real
      data reload correctly" check, the fixture only proves the formulas are wired correctly.
- [ ] Optional: try "add another lift" by copying one of Lift_Trends'/Weakness_Panel's lift
      columns and repointing its header cell at a different exercise name — confirm it picks up
      that lift's data with no formula changes needed.

## 7. Year-2 cycle stub (informational — no action required)

`src/config/featureFlags.ts`'s `year2StreakReset` flag is off by default and has no in-app
toggle by design (it's an unresolved product decision, not a finished feature — see the P3
handback's deviations section). Nothing to test here unless you specifically want to
experiment with it, which would mean flipping the flag in code and rebuilding.
