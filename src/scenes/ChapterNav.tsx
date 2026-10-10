import { useScenario } from "../engine/ScenarioContext";
import { useActiveChapter } from "./useActiveChapter";

const SECTIONS = [
  { id: "intro-section", label: "01 Observed world" },
  { id: "ch2", label: "02 Treatment" },
  { id: "ch3", label: "03 Matched controls" },
  { id: "ch4", label: "04 Counterfactual" },
  { id: "ch5", label: "05 Diagnostics" },
  { id: "ch6", label: "06 Limitations" },
];

function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY;
  window.scrollTo({ top, behavior: "smooth" });
}

/**
 * Release-gate "clear navigation" (UX row) + the nav-transitions motion layer: a fixed chapter
 * index, always reachable regardless of scroll position, built on `useActiveChapter` (ported from
 * CASCADIA, already in the codebase, never previously wired to any UI). Also hosts Reset Scenario,
 * previously reachable only at the very bottom of the page despite every chapter's own control
 * depending on it.
 */
export function ChapterNav() {
  const { reset } = useScenario();
  const active = useActiveChapter(SECTIONS.map((s) => s.id));

  return (
    <nav className="chapter-nav" aria-label="Chapter navigation">
      <ol>
        {SECTIONS.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              className="chapter-nav-dot"
              data-active={s.id === active}
              aria-current={s.id === active ? "true" : undefined}
              aria-label={s.label}
              data-testid={`nav-${s.id}`}
              onClick={() => scrollToSection(s.id)}
            >
              <span className="chapter-nav-dot-mark" aria-hidden="true" />
              <span className="chapter-nav-dot-label">{s.label}</span>
            </button>
          </li>
        ))}
      </ol>
      <button type="button" className="chapter-nav-reset" onClick={reset} data-testid="nav-reset">
        Reset Scenario
      </button>
    </nav>
  );
}
