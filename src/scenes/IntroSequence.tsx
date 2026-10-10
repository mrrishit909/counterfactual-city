import { useRef, useState } from "react";
import { CityStage } from "./CityStage";
import { computeCityLayout, VIEWBOX_HEIGHT, VIEWBOX_WIDTH } from "./cityLayout";
import { defaultScaleForOutcome, encodeResult } from "./resultVisualEncoding";
import { useScene } from "./useScene";
import { useScenario } from "../engine/ScenarioContext";

const SCENE_ID = "intro";

/**
 * Stage 2's cinematic vertical slice. A single persistent city SVG stage (CityStage) carries one
 * continuous scroll sequence:
 *   beat A (0.00-0.33 progress): the street grid draws in (dossier: "0-3 street plan unfolds").
 *   beat B (0.33-0.66): zone data overlays (labels) fade in and the title/disclaimer resolve. This
 *     intentionally departs from the dossier's literal "3-6 traffic pulses" wording: a true
 *     infinite pulsing loop doesn't compose with a SCRUBBED (scroll-position-bound) timeline, which
 *     is what makes reverse-scroll and fast-jump recovery deterministic for free (GSAP's own scrub
 *     mechanic is a pure function of scroll progress, no custom state machine to keep in sync). The
 *     substituted beat still delivers the storyboard's intent (establish the data layer exists)
 *     without fighting the architecture CASCADIA's own build already proved out. Documented
 *     deviation, not a silent shortcut.
 *   beat C (0.66-1.00): the camera (an SVG group transform, not a real 3D camera, see
 *     docs/VISUAL_REFERENCE_RESEARCH.md's own recommendation to stay 2D until 3D is analytically
 *     justified) pushes in toward the treated zone, and the treated zone's color/pulse resolves to
 *     the REAL current DiD result (src/scenes/resultVisualEncoding.ts), not a placeholder, handing
 *     off into the interactive laboratory rendered immediately below.
 *
 * Architecture: CSS `position: sticky` holds the visible stage in place (.intro-sticky) while an
 * outer, genuinely-tall wrapper (.intro-section, height: 400vh) provides the scroll distance;
 * ScrollTrigger only reads scroll progress (no `pin: true`). A first version used GSAP's own
 * `pin: true` + a relative percentage end value, and was found, by direct browser inspection
 * (not assumed), to produce a pin-spacer with ZERO added height for the pin duration, silently
 * trapping scroll inside the section with no way to reach the content below, confirmed live: even
 * 100 real wheel-scroll ticks could not escape it. CASCADIA's own persistent-stage chapters
 * (~/cascadia/src/scenes/experience.css's `.stage-sticky`) use plain CSS sticky instead of GSAP
 * pinning for exactly this reason, a proven pattern reused here rather than re-fighting the same
 * class of bug from scratch.
 */
export function IntroSequence({ children }: { children: React.ReactNode }) {
  const { load, did, scenario, allZones } = useScenario();
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<SVGSVGElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const [skipped, setSkipped] = useState(false);

  useScene(
    SCENE_ID,
    sectionRef,
    ({ gsap: g, reducedMotion }) => {
      const stage = stageRef.current;
      if (!stage) return;

      const treatedLayout = computeCityLayout(allZones.length || 24).find((b) => b.zone === scenario.treatedZone);
      const targetX = treatedLayout?.cx ?? VIEWBOX_WIDTH / 2;
      const targetY = treatedLayout?.cy ?? VIEWBOX_HEIGHT / 2;
      const zoomedWidth = VIEWBOX_WIDTH / 1.9;
      const zoomedHeight = VIEWBOX_HEIGHT / 1.9;
      const zoomedViewBox = `${targetX - zoomedWidth / 2} ${targetY - zoomedHeight / 2} ${zoomedWidth} ${zoomedHeight}`;
      const baseViewBox = `0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`;

      if (reducedMotion) {
        // Reduced motion: instant final state, no scroll-driven transform, matching the dossier's
        // own "reduced motion: instant state changes, no parallax/spinning intro" rule and
        // CASCADIA's established precedent.
        g.set(stage.querySelectorAll(".road"), { strokeDashoffset: 0 });
        g.set(stage.querySelectorAll(".zone-label"), { opacity: 1 });
        if (titleRef.current) g.set(titleRef.current, { opacity: 1 });
        g.set(stage, { attr: { viewBox: baseViewBox } });
        return;
      }

      const roads = stage.querySelectorAll<SVGLineElement>(".road");
      roads.forEach((road) => {
        // jsdom (used by Vitest's component tests) implements essentially no SVG geometry, not
        // getTotalLength, not even SVGAnimatedLength on a <line>'s x1/x2/y1/y2; a real browser has
        // both. The exact fallback number is irrelevant under jsdom (no test asserts on the drawn
        // length there, only that setup runs without throwing); a real browser always takes the
        // getTotalLength branch.
        const length = typeof road.getTotalLength === "function" ? road.getTotalLength() : 100;
        g.set(road, { strokeDasharray: length, strokeDashoffset: length });
      });
      g.set(stage.querySelectorAll(".zone-label"), { opacity: 0 });
      if (titleRef.current) g.set(titleRef.current, { opacity: 0, y: -12 });
      g.set(stage, { attr: { viewBox: baseViewBox } });

      const tl = g.timeline({
        scrollTrigger: {
          id: `${SCENE_ID}-pin`,
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
        },
      });

      // Beat A: street grid draws in, title resolves.
      tl.to(roads, { strokeDashoffset: 0, duration: 1, ease: "none", stagger: 0.02 }, 0);
      if (titleRef.current) tl.to(titleRef.current, { opacity: 1, y: 0, duration: 0.4, ease: "none" }, 0);

      // Beat B: zone labels (the data layer) resolve.
      tl.to(stage.querySelectorAll(".zone-label"), { opacity: 1, duration: 0.5, ease: "none" }, 0.5);

      // Beat C: camera pushes toward the treated zone; title hands off. The target point comes
      // from the SAME pure layout function CityStage renders from (cityLayout.ts), not from DOM
      // geometry (getBBox): effectively absent under jsdom, and computing it from the layout data
      // directly is also simply more correct, it doesn't depend on the SVG having actually
      // painted.
      //
      // An independent review caught a real targeting bug in an earlier version of this beat: it
      // scaled a nested <g> with a CSS-percentage transformOrigin, which resolves against THAT
      // element's own getBBox(), not the SVG's viewBox, so the percentage landed on the wrong
      // point (confirmed live: the treated zone pushed off-screen). Switching that to GSAP's
      // svgOrigin (viewBox-space coordinates, sidestepping the bbox-vs-viewBox mismatch) was
      // tried next and only partially fixed it (confirmed by direct measurement: still ~73px off
      // the top of the viewport), because scaling around a fixed origin point keeps that POINT
      // stationary on screen, it does not move it to the viewport's center, a real conceptual
      // gap, not just an implementation bug. Animating the `<svg>` element's own `viewBox`
      // attribute directly (a true pan+zoom) has neither problem: the new viewBox IS the visible
      // region, by definition, with no transform-origin math involved at all.
      tl.fromTo(
        stage,
        { attr: { viewBox: baseViewBox } },
        { attr: { viewBox: zoomedViewBox }, duration: 1, ease: "none" },
        1,
      );
      if (titleRef.current) {
        tl.to(titleRef.current, { opacity: 0, duration: 0.3, ease: "none" }, 1.2);
      }
    },
    [scenario.treatedZone],
  );

  const handleSkip = () => {
    const section = sectionRef.current;
    if (section) {
      const rect = section.getBoundingClientRect();
      const reduced =
        typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      // An independent review caught a real bug here: under reduced motion, .intro-section
      // collapses to exactly one viewport tall (scenes.css), so `rect.bottom - innerHeight` is
      // always 0 and this was a silent no-op, confirmed live (scrollY stayed 0 after clicking).
      // That formula is only correct for the NORMAL (CSS-sticky) case, where it lands at the
      // precise boundary where the sticky stage detaches and the lab begins (also confirmed
      // live, independently, to be pixel-exact). Under reduced motion there is no sticky stage to
      // detach from, just a normal-flow section, so the correct target is simply scrolling PAST
      // its bottom edge entirely (no innerHeight subtraction).
      const target = reduced ? window.scrollY + rect.bottom : window.scrollY + rect.bottom - window.innerHeight;
      window.scrollTo({ top: target, behavior: "auto" });
    }
    setSkipped(true);
  };

  // An independent review caught a real dead end here: this used to `return` early for BOTH
  // "loading" and "error" status with the same permanent spinner-less text, which also meant
  // `children` (the lab) was never rendered at all if the panel fetch failed, with no way to
  // reach it, confirmed live (routed the fetch to abort(), the page stayed on "Loading city
  // data…" forever, 0 buttons, no retry). The lab's own Lab component already has its own
  // correct loading/error handling against this SAME ScenarioContext (src/App.tsx), so the fix
  // is to stop gating `children` behind the intro's own readiness at all: render the intro's
  // cinematic visuals only when ready, but always render `children` underneath so a fetch
  // failure surfaces the lab's own real error message and remains reachable, instead of being
  // silently hidden behind an intro that never finishes loading.
  const visual = did ? encodeResult(did.att, defaultScaleForOutcome(did.outcome)) : undefined;

  return (
    <>
      {load.status === "ready" ? (
        <header id="intro-section" ref={sectionRef} className="intro-section" data-testid="intro-section">
          <div className="intro-sticky">
            <div className="intro-title" ref={titleRef}>
              <h1>The Counterfactual City</h1>
              <p>One city. Infinite consequences.</p>
            </div>
            <button
              type="button"
              className="skip-intro"
              onClick={handleSkip}
              aria-label="Skip the introduction and go to the laboratory"
              data-testid="skip-intro"
            >
              Skip Intro
            </button>
            <div className="city-stage-wrap">
              <CityStage
                ref={stageRef}
                instanceId="intro"
                nZones={allZones.length || 24}
                treatedZone={scenario.treatedZone}
                zoneColors={visual ? { [scenario.treatedZone]: visual.treatedColor } : undefined}
                treatedPulseIntensity={visual?.pulseIntensity}
              />
            </div>
          </div>
        </header>
      ) : (
        // data-state is prefixed "intro-" so it never collides with the lab's own [data-state]
        // selectors (e.g. [data-state="error"]) further down the DOM; the two are genuinely
        // different states (the intro's own cinematic readiness vs. the lab's data readiness)
        // even when driven by the same underlying load.status value.
        <div data-state={`intro-${load.status}`} data-testid="intro-not-ready">
          {load.status === "loading" ? <p>Loading city data{"…"}</p> : null}
          {/* load.status === "error": no message rendered here, the lab's own error branch
              (src/App.tsx) shows the real error message immediately below; this avoids showing
              the same failure twice. */}
        </div>
      )}
      <div data-testid="post-intro" data-skipped={skipped}>
        {children}
      </div>
    </>
  );
}
