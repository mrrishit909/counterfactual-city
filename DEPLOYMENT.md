# Deployment

**Status: deployed.** Live at https://mrrishit909.github.io/counterfactual-city/ via GitHub Actions
(`.github/workflows/deploy.yml`), authorized and completed 2026-10-10. See
`verification/COUNTERFACTUAL_CITY_PUBLICATION_REPORT.md` for the full record (commits, workflow,
live smoke-test and Lighthouse results, independent review). The steps below remain accurate as
the process actually used, kept as the reference for any future redeploy.

## Production build

```bash
npm run build     # tsc -b && vite build, outputs to dist/
npm run preview    # serves dist/ locally for a final smoke check before any real deploy
```

Verified repeatedly this session: the build succeeds cleanly from a clean `dist/`, typechecks
cleanly, and the production preview serves correctly. Every Playwright e2e test in this project runs
against exactly this build, never a dev server (see `TESTING.md`); `npx playwright test` passing is
itself a real build-correctness check, run and confirmed clean multiple times.

## Static hosting (GitHub Pages) base path

`vite.config.ts` sets `base: "/counterfactual-city/"`, matching the actual deployed GitHub Pages
project-page URL. The panel-data fetch (`src/engine/loadPanel.ts`) already builds its URL from
`import.meta.env.BASE_URL`, so no other code path needed to change to support this. `vite preview`
locally honors the same base: requesting `/` 302-redirects to `/counterfactual-city/`, which a real
browser (and Playwright's `page.goto("/")`) follows transparently.

## Pre-deployment checklist

- [x] `base` in `vite.config.ts` matches the real target path (see above).
- [ ] `npm run build` succeeds with no errors.
- [ ] `npm run preview` serves the build correctly: the intro plays, at least one control produces a
      real recomputed result, and the browser console shows no errors.
- [ ] Full test suite green (`TESTING.md`): `npx tsc -b`, `npx vitest run`, `npx playwright test`,
      `.venv/bin/python -m pytest analysis/validation/ -q`.
- [ ] `LIMITATIONS.md` reflects the actual shipped state (update if anything changed since it was
      last written).
- [ ] An independent, worktree-isolated adversarial review (per `CLAUDE.md`'s own mandatory process)
      has run against this exact commit and its findings are resolved or explicitly accepted.
- [ ] After publishing: a real `curl` check against the live URL, and a real screenshot of the live
      page actually loading, this project's own standing rule is that a deployment is not verified
      until checked this way, not merely "the push succeeded."

## What this build does NOT include

No CDN, no server-side rendering, no backend of any kind, this is a fully static site (HTML/CSS/JS +
a static JSON data fixture), suitable for any static host (GitHub Pages, Netlify, Vercel's static
mode, a plain S3 bucket) with no server-side configuration required.
