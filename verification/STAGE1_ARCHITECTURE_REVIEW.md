# Stage 1: Independent Architecture Review

Per the build directive's own sequencing ("Commission a focused independent review before expanding
the visual system"), a fresh reviewer with no access to this session's own notes reviewed the
scenario-state architecture, estimator ports, and all 6 wired controls before any chapter/cinematic/
motion work began.

**Verdict: ARCHITECTURE SOUND.** Proceed to the cinematic build (Stage 2), with two findings fixed
first.

## Method

The reviewer read `specifications/REQUIREMENTS.yaml` and `docs/PROJECT_SPEC.md` for acceptance
criteria, read every core source file independently, RAN every verification command itself (did not
trust `REQUIREMENTS.yaml`'s own claims), and drove the production preview live in a real browser via
injected `input`/`change` events, the same technique `e2e/controls.spec.ts` uses.

All verification commands matched what was claimed: `pytest` 25/25, `tsc -b` clean, `oxlint` clean
(besides the 2 known fast-refresh warnings), `vitest run` 27/27, `vite build && playwright test`
17/17.

## Findings

**#1, FIXED: donor-weight slider thumbs could visually desync from the applied weights.**
Reproduced live: after a custom weight application followed by "Use auto-fit weights," the
percentage labels updated correctly but the slider thumbs (uncontrolled `defaultValue` inputs)
stayed at their last-dragged DOM position. Root cause: React does not re-apply `defaultValue` to an
existing DOM node on re-render. Fix: a `weightsRevision` counter in `ScenarioContext.tsx`, bumped on
apply/clear/reset, used as part of each slider row's React `key` to force a genuine remount. A
regression test was added and confirmed to fail against the pre-fix code (thumb/label mismatch of
0.95, far outside the 0.015 tolerance) before confirming it passes against the fix.

**#2, FIXED: the TS/Python synthetic-control parity tolerance was far looser than the actual
achieved agreement.** The test used a flat 40-unit tolerance across all 3 outcomes; actual agreement
measured by the reviewer was sub-1-unit on all three (trip_volume 0.90, avg_speed_kmh 0.067,
transit_ridership 0.07). For `avg_speed_kmh` (true effect ~2.9), a 40-unit tolerance would pass even
a catastrophically broken port. Tightened to 3 units, i.e. with headroom above observed drift but
tight enough to actually catch a future regression.

## What held up without changes

- **State ownership**: one `ScenarioState` in `ScenarioContext.tsx`; `did`/`sc`/`pretrend` are all
  `useMemo` derivations off it, no second copy anywhere.
- **Async load race guard**: the panel-fetch `useEffect` uses a real `cancelled` flag, genuinely
  exercised every load since `main.tsx` wraps the app in `StrictMode`.
- **All 6 controls trigger real recomputation**, confirmed both by reading estimator call sites and
  by live browser manipulation.
- **Invalid-input handling**: donor weights not summing to 1, negative weights, out-of-range
  intervention day, an undersized placebo pool, all verified live to throw and surface as visible
  errors, not silently swallowed.
- **Reset Scenario** restores every piece of scenario state, confirmed live.
- **LIMITATIONS.md** was found honest about everything it discussed at review time; it simply didn't
  yet know about finding #1 (an undiscovered bug, not a disclosure gap), now added.
- **REQUIREMENTS.yaml's own claims matched reality** on every point checked, including the two gates
  (`CTY-MOTION-001`, `CTY-RELEASE-001`) honestly marked `unstarted` with no fabricated evidence.

## Next

Stage 2: the cinematic vertical slice, per `execution/PROGRESS.md`'s own next-task section.
