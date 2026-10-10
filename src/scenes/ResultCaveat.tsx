// Shared one-line caveat, placed directly adjacent to every result this page shows, per the
// dossier's own "explicit high-risk limitation": "Do not claim causality when identification
// assumptions fail. Apply scientific disclaimer adjacent to results rather than burying it in the
// footer" (docs/PROJECT_SPEC.md). Chapter 6 (src/scenes/Chapter6Limitations.tsx) is the one place
// that explains WHY (parallel trends, no interference, no anticipation); this component is the
// short pointer to it that belongs next to every number, not a restatement of the full reasoning.
export function ResultCaveat() {
  return (
    <p className="result-caveat">
      Fitted estimate, not a proven causal effect: depends on parallel trends, no interference, and
      no anticipation holding. See{" "}
      <a href="#ch6-heading" aria-label="identification assumptions, chapter 6">
        chapter 6
      </a>
      .
    </p>
  );
}
