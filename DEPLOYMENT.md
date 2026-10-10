# Deployment

**Status: NOT deployed.** This project has not been pushed externally or published anywhere, per the
build's own standing authorization constraint ("do not deploy or push externally without
authorization"). The steps below are the verified, reproducible path for whoever authorizes
deployment, not a record of something already done.

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

`vite.config.ts` currently has **no `base` option set**, which defaults to `/` (correct for a
root-domain deploy, e.g. `username.github.io`). If this project is deployed as a PROJECT page instead
(e.g. `username.github.io/counterfactual-city/`), `vite.config.ts` needs:

```ts
export default defineConfig({
  base: "/counterfactual-city/", // must match the actual repo/path name exactly
  // ...existing config
});
```

Left unset deliberately: the exact target path depends on how this project is slotted into the
broader portfolio structure, a decision outside this session's own scope to make unilaterally.
Whoever authorizes deployment should set this to match the real target path, rebuild, and re-verify
with `npm run preview` that every asset (the panel-data JSON fixture in particular) resolves
correctly under that base path before publishing.

## Pre-deployment checklist

- [ ] `base` in `vite.config.ts` matches the real target path (see above).
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
