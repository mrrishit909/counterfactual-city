import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Shared GSAP lifecycle layer, ported from CASCADIA's own verified pattern
// (~/cascadia/src/scenes/gsapSetup.ts). Plugin registration belongs in exactly ONE place, at module
// load (ES module caching makes this idempotent regardless of how many files import this module),
// never per-component, which would re-register the plugin on every mount.
gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger };
