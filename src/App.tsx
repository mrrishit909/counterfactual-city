import { ScenarioProvider } from "./engine/ScenarioContext";
import { Chapter2Treatment } from "./scenes/Chapter2Treatment";
import { Chapter3MatchedControls } from "./scenes/Chapter3MatchedControls";
import { Chapter4Counterfactual } from "./scenes/Chapter4Counterfactual";
import { Chapter5Diagnostics } from "./scenes/Chapter5Diagnostics";
import { Chapter6Limitations } from "./scenes/Chapter6Limitations";
import { ChapterNav } from "./scenes/ChapterNav";
import { IntroSequence } from "./scenes/IntroSequence";
import "./App.css";
import "./scenes/scenes.css";

// Stage 4: the standalone "Lab" <main> section that used to live below chapter 6 is gone. It held
// exactly one real thing (the DiD result + the panel's own load/error states), now
// DiDResultPanel.tsx, rendered inside chapter 2 next to CTY-INT-001/002, the controls that drive
// it (see DiDResultPanel.tsx's own header comment for why). Everything else it held (a page <h1>
// duplicating the intro's own, a synthetic-panel disclaimer paragraph duplicating chapter 6's own
// methodology prose almost verbatim) was redundant presentation, confirmed nothing else referenced
// it before removing it.
function App() {
  return (
    <ScenarioProvider>
      <ChapterNav />
      <IntroSequence>
        <Chapter2Treatment />
        <Chapter3MatchedControls />
        <Chapter4Counterfactual />
        <Chapter5Diagnostics />
        <Chapter6Limitations />
      </IntroSequence>
    </ScenarioProvider>
  );
}

export default App;
