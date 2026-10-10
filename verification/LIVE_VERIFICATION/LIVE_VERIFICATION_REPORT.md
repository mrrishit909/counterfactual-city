# Live Verification Report

First-party verification against the actual deployed public URL, not local preview, not assumed
from a green GitHub Actions run.

**Live URL:** https://mrrishit909.github.io/counterfactual-city/
**Repository:** https://github.com/mrrishit909/counterfactual-city
**Deployed commit:** `e4b65da` (tag `release-candidate-e4b65da`), workflow run `38082946176`
**Pages config:** `build_type: workflow`, confirmed via `gh api repos/mrrishit909/counterfactual-city/pages`

## Live Playwright (`verification/live_scratch/live.spec.ts`, run against the real public URL)

17/17 passed:

- Site loads with zero console errors and zero failed/4xx+ requests.
- Intro renders; all 6 chapters reachable via the nav.
- Forward and reverse scroll both work.
- CTY-INT-001/002: changing the treated zone recomputes the ATT; Reset restores baseline.
- CTY-INT-004/synthetic control: chapter 4's trajectory chart (observed + synthetic paths) and gap
  readout render real data, no estimator error.
- CTY-INT-005/placebo: running the placebo test in chapter 5 produces a real rank/p-value and
  renders the evidence-bands null-distribution chart; the pretrend diagnostic badge is present.
- Chapter 6: identification-assumptions disclaimer and local outcome readout both present.
- Keyboard-only: Skip Intro is operable via focus + Enter.
- Reduced motion: chapter 6 reachable with no extra reserved scroll distance.
- Zero axe-core violations.
- No horizontal overflow at desktop/tablet/mobile.
- Mobile nav does not occlude content; Reset reachable.
- Real screenshots captured at all 3 breakpoints (`live-desktop.png`, `live-tablet.png`,
  `live-mobile.png`), visually inspected: intro renders correctly (24-zone grid, treated zone
  highlighted with its pulse glow, nav rail, Skip Intro, Reset Scenario all present and placed
  correctly).

## Lighthouse (live URL)

| | Desktop | Mobile |
|---|---|---|
| Performance | 100 | 100 |
| Accessibility | 100 | 100 |
| Best Practices | 100 | 100 |
| SEO | 90 | 90 |
| LCP | 0.3s | 1.5s |
| CLS | 0.005 | 0 |

All exceed the release gate (Performance >=90, Accessibility >=95, LCP <=2.5s, CLS <=0.1) with
wide margin. Matches the local preflight numbers taken against the same build before deployment.

## Conclusion

The live, publicly deployed build is independently confirmed functional: real analytical
computation (not simulated), all 6 chapters and 6 interactions working, accessible, fast, and
matching the local release-candidate build exactly (same commit hash, same Lighthouse numbers).
