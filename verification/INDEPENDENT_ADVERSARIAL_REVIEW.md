# Independent Adversarial Review, THE COUNTERFACTUAL CITY

Reviewer: independent QA pass, no prior involvement in this project's build. Performed 2026-10-10
against a clean `npm install` + production build in this worktree. Did not read
`execution/PROGRESS.md`, `git log`, commit messages, or `REQUIREMENTS.yaml`'s `note:` fields, per
instructions.

## Summary verdict

**Ship-blocking issues found: YES.**

- P0: 1
- P1: 2
- P2: 2

The automated suite (126 Playwright e2e tests, 35 Vitest unit tests, tsc, oxlint) is genuinely
green and the green is real, I ran all of it myself from a clean install. But automated coverage
missed a real, reproducible, user-facing defect in the chapter navigation (P0) and a dead-end
error state in the flagship donor-weights control (P1). Full reproductions below.

---

## 1. Verification suite results (run fresh, from this worktree)

| Check | Result |
|---|---|
| `npm install` | OK, 126 packages, 0 vulnerabilities |
| `npx tsc -b` | Clean, no output, exit 0 |
| `npx oxlint` | 2 warnings (both `react(only-export-components)` in `src/engine/ScenarioContext.tsx:269,275`, Fast Refresh advisory only, not errors) |
| `npx vitest run` | **35/35 passed** (5 test files) |
| `npm run build` | Succeeds. `tsc -b && vite build`, 50 modules, dist output produced |
| `npx playwright test` (against `vite preview` production build per `playwright.config.ts`'s `webServer.command: "npm run preview -- --port 4173"`) | **126/126 passed**, 51.1s |
| Python parity suite (`analysis/validation/test_estimators.py`, CTY-MATH-001) | **NOT RUN, cannot be run.** No `.venv` exists in this worktree, and there is no `requirements.txt` or `pyproject.toml` anywhere in the repo to build one. The test file itself documents `source .venv/bin/activate && pytest analysis/validation/ -v` as the run recipe, but nothing in the repo provides a way to create that venv from a clean checkout. This means the CTY-MATH-001 gate's claimed "independent numerical baseline" evidence is **not independently reproducible** from what's actually committed. Flagged as a finding below (P1, #4). |

Verified `playwright.config.ts` really does run against the production build, not a dev server:
`webServer.command` is `"npm run preview -- --port 4173"` (vite preview, i.e. serving `dist/`), and
`use.baseURL` is `http://localhost:4173`, matching that port. Confirmed this is what the 126 tests
actually ran against.

---

## 2. Defects found

### Finding 1 (P0): Chapter nav never highlights "01 Observed world," and shows the wrong active chapter for the first ~44% of the page

**Reproduction:**
1. Load the production build fresh (`http://localhost:4173` or any static serve of `dist/`), no interaction yet.
2. Look at the fixed chapter-nav dot list on the right edge of the viewport.
3. **Expected:** the first dot ("01 Observed world") is highlighted/active, since the page just loaded showing the intro.
4. **Actual:** the second dot ("02 Treatment") is highlighted red immediately, before any scrolling at all.
5. Scroll down slowly (I scripted this in 300px increments from `y=0` to `y=11400`, full page height `11610`). The "02 Treatment" dot stays active continuously from `y=0` through `y=5100`, i.e. through the entire intro section (`y=0..3600`) AND roughly 65% of chapter 2's own section (`y=3600..5850`). "01 Observed world" is **never** highlighted at any scroll position, even while the intro ("Observed world") content is the only thing on screen and the real DiD result panel for chapter 2 hasn't even scrolled into view yet.

Evidence (scripted scroll sweep, `activeNav` = chapter-nav's highlighted label, `centerSectionId` = the section actually centered in the viewport at that scroll position):
```
y=0     activeNav=02 Treatment   centerSectionId=intro-section
y=1500  activeNav=02 Treatment   centerSectionId=intro-section
y=3000  activeNav=02 Treatment   centerSectionId=intro-section
y=5100  activeNav=02 Treatment   centerSectionId=ch2
```

**Root cause** (confirmed by instrumenting `IntersectionObserver` directly): `src/scenes/IntroSequence.tsx` only renders `<header id="intro-section" ...>` once `load.status === "ready"` (an async panel fetch). `src/scenes/useActiveChapter.ts`'s effect runs on mount, before that fetch resolves, and calls `trySetup()`, which does `ids.map(id => document.getElementById(id)).filter(e => e !== null)`. At that moment `ch2`..`ch6` already exist in the DOM (they're not gated on the fetch) but `intro-section` does not, so `els.length === 5` (not 0), `trySetup()` returns `true`, and the `IntersectionObserver` is created observing only those 5 sections. The retry path (`MutationObserver`, lines 40-52 of `useActiveChapter.ts`) only re-runs `trySetup()` when the **first** call found **zero** elements, it never fires here because the first call already found 5/6, so `intro-section` is **permanently excluded** from observation once it mounts later. The very first `IntersectionObserver` callback fires with `ch2` already at `intersectionRatio: 0.24` (it's large enough, at 2250px tall, to already intersect the `-20%/-20%` rootMargin band near the top of the page even at `scrollY=0`), while `intro-section` reports nothing at all (it isn't observed), so `ch2` wins by default from the very first paint.

**Severity: P0.** This directly breaks the one feature `src/scenes/ChapterNav.tsx`'s own header comment names as satisfying the release gate's "clear navigation" UX row. It is reproducible on every fresh page load, 100% of the time, with no special input needed.

**Fix direction (not applied, QA does not fix):** either (a) retry `trySetup()` whenever the found-element count changes, not only when it was zero, or (b) don't conditionally render `#intro-section` on `load.status`; mount it unconditionally and gate only its inner content.

---

### Finding 2 (P1): Chapter 4's donor-weights control has no in-place recovery from an invalid-weights error, the entire control surface (23 sliders + Apply button) is replaced by a bare error message with no retry affordance

**Reproduction:**
1. Production build, desktop viewport (1440x900). Scroll to chapter 4 ("counterfactual").
2. Drag the first 2-3 donor-weight sliders down to 0 (or use the keyboard: Tab to a slider, press Home) without adjusting any others, so the weights no longer sum to 1.
3. Click "Apply weights."
4. **Expected** (per the release gate's "full operational states (…/error/retry/…)" row and `REQUIREMENTS.yaml` CTY-INT-004's own `then` clause, "infeasible weights … are handled"): an error is shown, and the user can correct their input and retry without losing all other context.
5. **Actual:** `src/controls/DonorWeightsControl.tsx` (lines 8-16) short-circuits: when `scError` is set, the component returns *only* `<fieldset><legend>…</legend><p role="alert">{scError}</p></fieldset>`, nothing else. All 23 sliders and the "Apply weights" / "Use auto-fit weights" buttons disappear from the DOM entirely. Confirmed live: `document.querySelectorAll('input[type="range"][aria-label^="Donor weight"]')` returns **0** elements immediately after the error appears (vs. 23 before).
6. The only ways out of this dead end are not surfaced anywhere in the component itself:
   - Changing an unrelated control (e.g. the treated-zone `<select>` in chapter 2) forces a fresh synthetic-control computation that happens to clear `scError` and restores the 23 sliders (confirmed live), but nothing in chapter 4 tells the user to do this.
   - Clicking the global "Reset Scenario" button also clears it, but that resets *every* scenario field (intervention date, treated zone, control pool, outcome), not just the weights, discarding unrelated state the user may have wanted to keep.
7. Error text itself is correct and real (`"weights must sum to 1 (got 0.864124)"`, confirmed against the live computed sum), so the validation logic itself is not the problem, only the fact that recovering from it requires leaving the component.

**Severity: P1.** Not a crash and the error text is accurate, but it is a functional dead end inside the one interaction the dossier calls the "flagship" control: a user who mis-drags one slider loses the entire weights panel with no visible path back except accidentally discovering that touching an unrelated control elsewhere on the page fixes it.

---

### Finding 3 (P1): No committed way to reproduce the CTY-MATH-001 Python parity-test evidence from a clean checkout

Covered in the table above (Section 1). `analysis/validation/test_estimators.py` exists and documents `source .venv/bin/activate && pytest analysis/validation/ -v` as its own run recipe, but there is no `requirements.txt`, `pyproject.toml`, `Pipfile`, or any other dependency manifest anywhere in the repository, and no `.venv` is committed or generatable from what's here. I could not independently verify the analytical engine's Python-side parity claims (the TypeScript/Python agreement to `1e-6` cited in `REQUIREMENTS.yaml`) because the repository, as checked out in this worktree, does not provide a way to install `pandas`/`numpy`/`statsmodels`/`pytest` and run that suite. This is itself evidence that CTY-MATH-001's "independent numerical baseline" gate is not currently independently re-verifiable by a fresh reviewer from a clean clone, only by someone who already has a matching environment lying around.

---

### Finding 4 (P2): Chapter 5's pretrend-diagnostic p-value is the only numeric result on the page without the project's own `ResultCaveat` kind label

`src/scenes/Chapter5Diagnostics.tsx`'s `PretrendBadge` (lines 10-20) shows a real number (`pretrend.slopePvalue.toFixed(3)`) with inline prose explaining what a significant pre-trend means, but does not use `src/scenes/ResultCaveat.tsx`, the shared component every other numeric result on the page uses to label itself as a `fitted-estimate` / `counterfactual-gap` / `permutation-diagnostic`. This isn't a missing explanation (the inline sentence is genuinely informative), but it is an inconsistency with the project's own stated hard rule ("distinguish historical measurement, fitted estimate, counterfactual inference, and hypothetical simulation in every label that presents a number") and with every other result block's visual treatment on the page (`DiDResultPanel`, `DonorWeightsControl`, `PlaceboControl`, the intro hero number all carry the shared caveat component; this one doesn't).

### Finding 5 (P2): Chapter 6's own control (CTY-INT-006, change outcome) produces no visible number anywhere inside chapter 6 itself

Confirmed live: switching the outcome-series `<select>` in chapter 6 from "Trip volume" to "Average speed (km/h)" does trigger a real recomputation (verified the ATT shown in chapter 2's `DiDResultPanel` changes from `-197.4 trips/day` to `3.0 km/h`, correct units, not a placeholder), but **chapter 6's own DOM content is byte-identical before and after** the change, no number, result, or caveat appears anywhere in chapter 6. The only place the effect of this control is visible is chapter 2, several thousand pixels back up the page, which the visitor has already scrolled past by the time they reach the last chapter. This matches the project's existing "chapter 3 control affects chapter 2's shared panel" pattern used elsewhere (so it may be a deliberate architectural choice, not an oversight), but it is the only chapter whose own control produces literally zero local feedback, which runs against the dossier's own chapter-6 flavor text ("change outcome > reload compatible series > **effect estimate**," implying the estimate is part of this control's own flow) and against every other chapter's established pattern of showing a result right next to its own control.

---

## 3. What I specifically checked and found correct (not broken)

- **Three-chapter layout-skeleton duplication** (named in the brief as a prior finding): checked class lists and live screenshots for chapters 2, 3, 4, 5, 6 at 1440x900. All five are visually and structurally distinct, chapter 3 has a 3-up comparative-card strip with sparklines, chapter 4 has the two-stage flagship split + trajectory chart, chapter 5 has a genuinely distinct inverted dark "console" panel (confirmed via `.chapter-diagnostics` CSS overrides and a live screenshot), chapter 6 is the text-led two-column layout. No two adjacent chapters look alike. This specific historical bug appears fixed.
- **Mobile overflow hiding controls below the fold** (named in the brief): scripted a full-page scroll sweep at 390x844 and 768x1024 in 60%-viewport-height increments (23 and 15 screenshots respectively) and checked `document.documentElement.scrollWidth - clientWidth` at every step. Zero horizontal overflow detected at any scroll position, either breakpoint. Visually reviewed a sample of the screenshots (intro, chapter 2 controls, chapter 3 comparative cards, chapter 4 flagship split, chapter 5 diagnostics), all controls are reachable and not occluded by the fixed bottom/side nav. Appears fixed.
- **Chart collapsing to 1px tall on mobile** (named in the brief): measured every `<svg>` element's rendered bounding-box size at mobile/tablet/desktop for chapters 3, 4, 5 (city-stage, sparkline, trajectory-chart, evidence-bands). Smallest rendered height found was 51.95px (`evidence-bands` on mobile), well above a collapse; largest desktop charts are 220-636px. No 1px or near-zero chart found. Appears fixed.
- **Flagship interaction missing its literal dossier-requested feature** (named in the brief: "two urban timelines diverge as estimator assumptions are manipulated"): confirmed live that `TrajectoryChart.tsx` renders a real observed-vs-synthetic line chart that redraws when donor weights are reapplied (not just on scroll), matching the dossier's literal wording. Appears fixed.
- **Global a11y contrast regression from leftover scaffold CSS** (named in the brief): ran `@axe-core/playwright` myself against the baseline page and two additional interaction states not in the existing suite (chapter 4's invalid-weights error state, chapter 5's post-placebo-run state with the dark console panel visible), **0 violations** in both. Appears fixed.
- **Keyboard-only operability**: tabbed through the first 40 focusable elements from a fresh load, order is logical (nav dots → Reset Scenario → chapter-6 footnote link → Skip Intro → intervention-date slider → treated-zone select → control-pool checkboxes → donor-weight sliders), nothing is keyboard-trapped. Operated the intervention-date range input with `Home`/`End` keys only (jumped 120 → 179 → 1 correctly, no mouse). `selectOption` on the treated-zone `<select>` works (documented elsewhere as a known headless-Chromium quirk with synthetic keyboard events on native selects, not something I'm re-litigating).
- **Rapid/repeated interaction**: mashed "Reset Scenario" 10x rapidly, mashed "Run placebo test" 8x rapidly, and synchronously fired `input`/`change` events on all 23 donor-weight sliders with random values in a tight loop. Zero console errors or page errors (`pageerror` listener) in any of these passes. The placebo control correctly returned a real rank (`3 of 24`) after the mash, not a stale or corrupted value.
- **Reduced motion + interaction**: ran `page.emulateMedia({reducedMotion: 'reduce'})` and then operated a donor-weight slider + Apply under that mode, behaves identically to normal mode (an invalid-sum error if the weights don't sum to 1, a real gap value if they do), no reduced-motion-specific breakage found.
- **Desktop/tablet/mobile 3-breakpoint overflow and composition**: verified no horizontal scrollbar introduced at any of the 3 required breakpoints across a full-page scroll sweep (see above); the existing Playwright suite's own responsive-viewport tests (tablet/mobile "fits without horizontal overflow," "shows the grid before the prose at mobile," "chapter 2's treated-zone select is reachable and usable at mobile, not visually collided with the nav bar") all pass and I additionally confirmed them visually against my own independently-captured screenshots, not just trusting the assertions.
- **Numbers labeled with claim type + adjacent caveat**: spot-checked every chapter's result readouts (DiD ATT in chapter 2, synthetic-control gap in chapter 4, placebo rank/p-value in chapter 5), all carry an adjacent `ResultCaveat` with a correct `kind` (`fitted-estimate` for DiD, `counterfactual-gap` for the synthetic-control gap, `permutation-diagnostic` for the placebo result), each pointing to chapter 6's identification-assumptions prose. The one gap is the pretrend p-value (Finding 4, P2).
- **"Never present counterfactual inference as unconditional fact"**: the synthetic-control gap in chapter 4 is explicitly labeled "Counterfactual inference (what the data implies would have happened absent treatment), not an observed measurement," adjacent to the number, not buried in a footer. Confirmed correct.

No other defects were found despite a genuine attempt to break the page (edge-case slider values, rapid-fire clicks, keyboard-only operation, fast scroll jumps to the absolute top/bottom, reduced motion combined with control changes). Findings 1 and 2 above are the real, reproducible, actionable issues from this pass.
