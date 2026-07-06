# swing-gains — "Swing Gains"

Personal golf strength & conditioning PWA. 12-month, 8-block programme with adaptive load
progression, venue-aware session queues (gym/home), and cross-device session transfer.

Stack: React + Vite + TS + vite-plugin-pwa + Dexie. Deploy: GitHub Pages (push to main
auto-deploys via Actions; repo name and base path '/swing-gains/' must never change).

Authoritative inputs — do not deviate without flagging to Ryan:
- `docs/spec-v1.2.md` — architecture, data model, progression rules, transfer model
- `docs/exercise-library-v1.0.md` — all programme content (49 exercises, 5 ladders,
  24 session templates). Never invent exercises or prescriptions; never modify docs/
  content without instruction.

Engine (`src/engine`) and transfer (`src/transfer`) logic must be pure, Vitest-tested
functions. UI (`src/screens`, `src/components`) stays thin — it reads derived state,
it does not compute it.

Persistence: IndexedDB via Dexie (`src/db`). iPad is the canonical master device;
Pixel is a satellite logger. No backend, no auth, no analytics, no secrets committed.

Rules: British English in UI copy. ASCII-only in any PowerShell/shell scripts.
git push over HTTPS (PAT-embedded remote or gh CLI credential helper) — never assume
an interactive browser auth flow will complete in this environment.

Brand: Personal set — Slate `#34699E`, Copper `#C77B3C`, warm grey `#D8D4C9`, white;
system-sans font stack. Sibling identity to Net Gains (`net-practice`).
