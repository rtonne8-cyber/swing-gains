// Flags for stubbed/undecided behaviour. Off by default — flipping one on is a product
// decision for Ryan, documented in docs/handback-p3.md, not something this codebase defaults
// to silently.
export const FEATURE_FLAGS = {
  // Spec §3.2 / §10 decision 5: "after Block 8, the cycle restarts at Block 2... year-1
  // baselines replaced by current values — confirmed in principle; detail at P3." Loads and
  // ladder rungs already carry forward into year 2 by construction (ProgressionState is
  // derived from full history and never resets on its own) — the only open question is
  // whether crossing into a new cycle should ALSO clear each lift's in-flight increment
  // streak, so year 2 doesn't inherit a partial streak from Block 8's dynamics. Off by
  // default: this needs real year-1 data to evaluate sensibly, not an invented default.
  year2StreakReset: false
};
