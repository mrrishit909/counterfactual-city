import { useGSAP } from "@gsap/react";
import { useEffect, useRef } from "react";
import { ScrollTrigger, gsap } from "./gsapSetup";

export interface SceneTools {
  gsap: typeof gsap;
  ScrollTrigger: typeof ScrollTrigger;
  reducedMotion: boolean;
}

const killSceneTriggers = (sceneId: string) =>
  ScrollTrigger.getAll()
    .filter((st) => typeof st.vars.id === "string" && st.vars.id.startsWith(sceneId))
    .forEach((st) => st.kill());

// Shared scene-lifecycle wrapper, PORTED DIRECTLY from CASCADIA's own verified implementation
// (~/cascadia/src/scenes/useScene.ts, project #1 of this same Atlas), per the build directive's
// own instruction to reuse verified infrastructure rather than re-derive it. Every chapter/intro-
// beat scene goes through this, never calls `useGSAP`/`gsap.context`/`ScrollTrigger.create`
// directly, so the lifecycle correctness CASCADIA already found the hard way (see below) doesn't
// need rediscovering here.
//
// - Scoping: `useGSAP`'s own `scope` option restricts GSAP's internal selector lookups AND
//   guarantees every tween/timeline created during `setup()` is tracked and reverted together.
// - Reduced motion: `reducedMotion` is passed into `setup()` so each scene can choose its own
//   meaningful static end-state rather than this layer silently skipping `setup()`.
// - `sceneId` tags every ScrollTrigger this scene creates (the scene author's own responsibility
//   inside `setup()`, convention: ids starting with `${sceneId}`).
//
// Ref-timing safety net: a scene can be rendered as a sibling of the DOM node its `scopeRef`
// points at. CASCADIA confirmed directly, twice, in its own tests: a child/sibling component's
// layout effect can run before a DOM node elsewhere in the SAME commit has had its ref attached,
// under React 19, not a JSX-ordering mistake to fix once, but a real timing gap. This wrapper
// retries on the next animation frame if `scopeRef.current` is null when `setup()` would
// otherwise run, bounded and cancelled on unmount.
//
// StrictMode AND unmount cleanup, verified directly by CASCADIA rather than assumed:
// 1. `useGSAP` is GSAP's documented StrictMode-safe React integration, but left a duplicate
//    ScrollTrigger behind after a StrictMode mount in CASCADIA's own isolated repro. This wrapper
//    doesn't depend on `useGSAP` for that: every `setup()` call starts by killing any existing
//    ScrollTrigger whose id starts with `sceneId`, so a duplicate invocation converges to exactly
//    one trigger instead of accumulating.
// 2. `useGSAP`'s own unmount cleanup (`context.revert()`) does NOT reliably remove a ScrollTrigger
//    created inside it (traced directly in gsap-core.js by CASCADIA: `revert()` takes a "soft
//    revert" branch, not the "actually remove it" branch). This wrapper therefore does NOT rely on
//    `useGSAP`'s automatic cleanup for ScrollTrigger disposal at all: a separate, plain `useEffect`
//    explicitly `.kill()`s every ScrollTrigger tagged with this `sceneId` on unmount.
export function useScene(
  sceneId: string,
  scopeRef: React.RefObject<Element | null>,
  setup: (tools: SceneTools) => void,
  deps: unknown[] = [],
) {
  const reducedMotion = useRef(
    typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false,
  ).current;
  const rafRef = useRef(0);
  useGSAP(
    () => {
      const run = () => {
        if (!scopeRef.current) {
          rafRef.current = requestAnimationFrame(run);
          return;
        }
        killSceneTriggers(sceneId);
        setup({ gsap, ScrollTrigger, reducedMotion });
      };
      run();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    { scope: scopeRef, dependencies: deps },
  );
  useEffect(
    () => () => {
      cancelAnimationFrame(rafRef.current);
      killSceneTriggers(sceneId);
    },
    [sceneId],
  );
}
