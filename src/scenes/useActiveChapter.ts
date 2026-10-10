import { useEffect, useRef, useState } from "react";

// Ported directly from CASCADIA's own verified implementation
// (~/cascadia/src/scenes/useActiveChapter.ts), per the build directive's instruction to reuse
// proven infrastructure. UI-only navigation state: IntersectionObserver, not scroll-position math,
// works identically for native scroll, keyboard, and any future chapter-index jump links, and
// needs no scroll-event throttling.
//
// `ids`: ordered chapter section ids. Returns the id whose section has the largest intersection
// with a thin band near the viewport's vertical center, so a chapter is "active" only once it's
// genuinely in focus, not merely peeking in at the very top/bottom edge.
export function useActiveChapter(ids: string[]): string {
  const [active, setActive] = useState(ids[0]);
  const ratios = useRef(new Map<string, number>());
  useEffect(() => {
    let io: IntersectionObserver | null = null;
    let mo: MutationObserver | null = null;
    const trySetup = (): boolean => {
      const els = ids.map((id) => document.getElementById(id)).filter((e): e is HTMLElement => e !== null);
      // A real bug an independent adversarial review found: this used to retry only when ZERO
      // ids were found, but in this app #intro-section mounts conditionally on an async fetch
      // (IntroSequence.tsx's own `load.status === "ready"` gate) while ch2..ch6 mount
      // unconditionally, so the FIRST call here reliably finds 5 of 6 ids, "succeeds" by the old
      // zero-only check, and permanently excludes intro-section from observation once it mounts
      // later (confirmed live: the nav highlighted "02 Treatment" from scrollY 0, through the
      // entire intro, and into ~65% of chapter 2, never once showing the intro as active).
      // Retrying until every id is present, not just until any are, fixes this for any chapter
      // whose own mount timing is conditional, not only this specific one.
      if (els.length < ids.length) return false;
      io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) ratios.current.set(e.target.id, e.isIntersecting ? e.intersectionRatio : 0);
          let bestId = active;
          let bestRatio = -1;
          for (const id of ids) {
            const r = ratios.current.get(id) ?? 0;
            if (r > bestRatio) {
              bestRatio = r;
              bestId = id;
            }
          }
          if (bestRatio > 0) setActive(bestId);
        },
        { threshold: [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1], rootMargin: "-20% 0px -20% 0px" },
      );
      els.forEach((el) => io!.observe(el));
      return true;
    };
    if (!trySetup()) {
      // CASCADIA's own documented real bug, not a theoretical one: a chapter list that renders a
      // plain loading state (no chapter sections at all) while data is in flight means this
      // effect's dependency array never changes once that fetch resolves and the real chapter
      // markup mounts, so without a retry path this effect runs exactly once, finds zero
      // elements, and never runs again. A MutationObserver (genuinely supported in jsdom too,
      // unlike IntersectionObserver) retries setup once the chapter sections actually appear,
      // then disconnects itself.
      mo = new MutationObserver(() => {
        if (trySetup()) mo?.disconnect();
      });
      mo.observe(document.body, { childList: true, subtree: true });
    }
    return () => {
      io?.disconnect();
      mo?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join(",")]);
  return active;
}
