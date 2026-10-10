// Shared one-line caveat, placed directly adjacent to every result this page shows, per the
// dossier's own "explicit high-risk limitation": "Do not claim causality when identification
// assumptions fail. Apply scientific disclaimer adjacent to results rather than burying it in the
// footer" (docs/PROJECT_SPEC.md). Chapter 6 (src/scenes/Chapter6Limitations.tsx) is the one place
// that explains WHY (parallel trends, no interference, no anticipation); this component is the
// short pointer to it that belongs next to every number, not a restatement of the full reasoning.
//
// `kind` names what TYPE of number it sits next to (CLAUDE.md's own hard rule: "distinguish
// historical measurement, fitted estimate, counterfactual inference, and hypothetical simulation
// in every label that presents a number"), a real finding from a second self-review: every usage
// previously said "Fitted estimate" even next to the synthetic-control gap (a counterfactual
// inference, not a point estimate fit to data the same way DiD's ATT is) and the placebo rank
// (a permutation-test diagnostic, not an estimate of anything).
type ResultKind = "fitted-estimate" | "counterfactual-gap" | "permutation-diagnostic" | "pretrend-diagnostic";

const KIND_TEXT: Record<ResultKind, string> = {
  "fitted-estimate": "Fitted estimate, not a proven causal effect",
  "counterfactual-gap": "Counterfactual inference (what the data implies would have happened absent treatment), not an observed measurement",
  "permutation-diagnostic": "A permutation-test diagnostic, not an estimate of the effect itself",
  // An independent adversarial review found the pretrend badge was the only numeric result on the
  // page without this shared caveat. It is its own kind, not a permutation test: a slope
  // significance test on the pre-period gap between treated and control zones.
  "pretrend-diagnostic": "A pre-period slope-significance test, not an estimate of the post-period effect",
};

export function ResultCaveat({ kind = "fitted-estimate" }: { kind?: ResultKind }) {
  return (
    <p className="result-caveat">
      {KIND_TEXT[kind]}: depends on parallel trends, no interference, and no anticipation holding.
      See{" "}
      <a href="#ch6-heading" aria-label="identification assumptions, chapter 6">
        chapter 6
      </a>
      .
    </p>
  );
}
