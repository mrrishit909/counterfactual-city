import { afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";

// jsdom has no `window.matchMedia` at all; GSAP's ScrollTrigger plugin calls it unconditionally at
// registration time (src/scenes/gsapSetup.ts, module load), so without this polyfill every test
// file that imports anything from src/scenes/ (transitively, via App.tsx) throws "matchMedia is not
// a function" before a single test in that file can run. Ported from CASCADIA's own verified
// test-setup.ts (same root cause, same fix). `matches: false` is the correct default: src/scenes/
// useScene.ts reads `prefers-reduced-motion` through this same API, and the non-reduced-motion
// code path is what exercises the actual GSAP timelines these tests need to cover.
if (typeof window !== "undefined" && typeof window.matchMedia !== "function") {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

// ScrollTrigger's `pin: true` manipulates the DOM directly (inserting a pin-spacer) outside
// React's own reconciliation. Under jsdom, React Testing Library's automatic unmount-on-afterEach
// can run before/interleaved with that DOM manipulation in a way a real browser never produces,
// throwing "NotFoundError: the node to be removed is not a child of this node" on teardown.
// CASCADIA's own test-setup carries the same fix for the same root cause: explicitly kill every
// ScrollTrigger before RTL's own cleanup runs, so there is nothing left for ScrollTrigger's pin
// machinery to touch during unmount.
afterEach(async () => {
  const { ScrollTrigger } = await import("./scenes/gsapSetup");
  ScrollTrigger.getAll().forEach((st) => st.kill());
});
