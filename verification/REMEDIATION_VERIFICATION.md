# Remediation Verification, THE COUNTERFACTUAL CITY

Independent verification of 5 claimed fixes. Method: `npm install && npm run build`, served the
production build with `npx vite preview --port 4173`, then verified each finding with the
project's existing production-mode e2e specs (selected, relevant ones only, re-run here as
independent confirmation, not taken on faith) plus ad-hoc Playwright scripts
(`verification/verify-finding2.mjs`, `verification/verify-finding1-5.mjs`) written to reproduce
each ORIGINAL bug's exact repro steps. A fresh venv was used for the Python check (finding 3).

## 1. Chapter nav intro highlight (was P0), PASS

Ad-hoc script (`verify-finding1-5.mjs`) against the production build:
- Immediately after load (no scroll): `nav-intro-section` → `data-active="true"`.
- After scrolling to 50% through the intro section's own height: still `data-active="true"`.

Also re-ran the project's own regression test `e2e/chapterNav.spec.ts` ("CTY-UX-001 regression")
plus the full-sweep nav test, both passed (26/26 tests in that file passed overall).

## 2. Donor-weights sliders surviving an invalid apply (was P1), PASS

Ad-hoc script (`verify-finding2.mjs`), reproducing the exact repro steps:
1. Checked exactly 2 zone checkboxes in chapter 3 (`.zone-checkbox input[type=checkbox]`) →
   confirmed 2 checked, narrowing the control pool to an explicit 2-zone allow-list.
2. Scrolled to chapter 4 → confirmed exactly 2 donor-weight sliders rendered.
3. Set the sliders to 0.9 and 0.5 (sum 1.4) using the native-setter + real `input`/`change` event
   dispatch (not React's synthetic value setter), clicked "Apply weights".
4. Observed `sc-error` visible with text: `"weights must sum to 1 (got 1.400000) Adjust the
   sliders below so they sum to 1, or use auto-fit weights, and apply again."`
5. Confirmed slider count was **still 2** (not 0), the control did not disappear.
6. Set sliders to new, different values (0.3 and 0.7, sum 1.0), clicked "Apply weights" again.
7. Confirmed `sc-error` is no longer visible, and slider count remained 2.

Source inspection of `src/controls/DonorWeightsControl.tsx` confirms the sliders are rendered
unconditionally (keyed on `weightsRevision`) and only the error banner is conditional, matching
the observed behavior.

## 3. Python test reproducibility via fresh venv + requirements.txt (was P1), PASS

- `requirements.txt` exists at repo root, pinned: `numpy==2.5.3`, `pandas==3.0.6`,
  `scipy==1.18.1`, `pyarrow==26.0.0`, `pytest==9.1.1`.
- Created a genuinely fresh venv at `/tmp/cfc-fresh-venv` (not the repo's own `.venv`, which was
  not touched/used at all).
- `/tmp/cfc-fresh-venv/bin/pip install -r requirements.txt` succeeded cleanly, resolving all
  transitive deps (python-dateutil, pluggy, packaging, iniconfig, pygments, six).
- `/tmp/cfc-fresh-venv/bin/python -m pytest analysis/validation/ -q` → **25 passed** in 12.65s,
  using that fresh venv's own pytest binary exclusively.

## 4. Pretrend-diagnostic badge caveat in chapter 5 (was P2), PASS

Re-ran `e2e/chapter5.spec.ts` in full against the production build (all tests passed, including
the test that explicitly asserts `.result-caveat` text matching `/slope-significance test/i` is
visible adjacent to the pretrend badge). Also manually confirmed via source/DOM: chapter 5's
"chapter 5 hosts CTY-INT-005" test checks exactly this and passed. Clicking "Run placebo test"
and inspecting `placebo-result`/`pretrend-badge` confirms the caveat element is present, not
limited to only some other result elsewhere on the page.

## 5. Chapter 6 outcome-dependent value shown locally within chapter 6 (was P2), PASS

Ad-hoc script (`verify-finding1-5.mjs`):
- Scrolled to `#ch6`.
- `ch6-outcome-att` (inside chapter 6) read `-197.4 trips/day` initially, visible in viewport.
- Changed `#outcome-select` to `avg_speed_kmh`.
- `ch6-outcome-att` updated to `3.0 km/h`, still visible within chapter 6, without scrolling
  away. Confirms the value is a real local readout, not only reflected in a different chapter.

Also re-ran `e2e/chapter6.spec.ts` in full (all tests passed), including the specific regression
test for this exact bug ("CTY-UX regression: chapter 6's own outcome control shows a real local
readout...").

## Overall verdict

**All 5 findings are confirmed fixed.** Every fix was independently reproduced against a real
production build (not dev server) using the exact original repro steps: fresh page load +
partial scroll (finding 1), narrowed control pool + real native-setter slider events + invalid
then valid donor weights (finding 2), a brand-new Python virtualenv with pinned
`requirements.txt` and 25 passing tests (finding 3), the placebo-test caveat element next to the
pretrend badge (finding 4), and a local, in-chapter-6 ATT readout that changes with the outcome
dropdown (finding 5). No partial fixes, no regressions, no console/page errors observed during
verification.
