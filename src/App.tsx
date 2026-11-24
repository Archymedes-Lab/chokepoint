import { useEffect, useState } from "react";
import { ARCHETYPES, defaultPosture, type Archetype, type Posture } from "./sim";
import { useSingleRun } from "./hooks/useSimulation";
import { PosturePanel } from "./ui/PosturePanel";
import { SingleRun } from "./ui/SingleRun";
import { MonteCarlo } from "./ui/MonteCarlo";
import { Ecosystem } from "./ui/Ecosystem";

type Mode = "eco" | "micro";
type MicroTab = "single" | "batch";

const THEME_KEY = "chokepoint-theme";

export default function App() {
  const [mode, setMode] = useState<Mode>("eco");
  const [theme, setTheme] = useState<"dark" | "light" | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY) as "dark" | "light" | null;
      if (saved) setTheme(saved);
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => {
    const root = document.documentElement;
    if (theme) root.setAttribute("data-theme", theme);
    else root.removeAttribute("data-theme");
    try {
      if (theme) localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-in">
          <div className="brand">
            <svg className="glyph" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <path
                d="M16 2 4 7v8c0 7 5 12 12 15 7-3 12-8 12-15V7L16 2Z"
                stroke="var(--advantage)"
                strokeWidth="2"
                fill="color-mix(in srgb, var(--advantage) 12%, transparent)"
              />
              <path d="M11 16h10M16 11l5 5-5 5" stroke="var(--attacker)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <h1>Chokepoint</h1>
            <span className="ver">v0.2</span>
          </div>
          <div className="mode-switch">
            <button className={`mode-b ${mode === "eco" ? "on" : ""}`} onClick={() => setMode("eco")}>
              Ecosystem
            </button>
            <button className={`mode-b ${mode === "micro" ? "on" : ""}`} onClick={() => setMode("micro")}>
              Encounter model
            </button>
          </div>
          <span className="badge">Defensive · Simulation</span>
          <div className="spacer" />
          <button
            className="icon-btn"
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            aria-label="Toggle theme"
          >
            {theme === "light" ? "◐ Dark" : "◑ Light"}
          </button>
        </div>
      </header>

      {mode === "eco" ? <Ecosystem /> : <MicroApp />}

      <footer className="foot">
        <div className="foot-in">
          <div>
            <b>Chokepoint</b> is an abstract, criminological model for defensive planning, policy
            analysis, and education. It simulates offender <i>motivation, decisions, and population
            dynamics</i> — never real-world actions — and contains no operational attack detail.
            Parameters are calibrated from public research; see <code>docs/</code>.
          </div>
          <div className="muted">Apache-2.0 · TLP:CLEAR · for defenders, authorities, and researchers.</div>
        </div>
      </footer>
    </div>
  );
}

/** The micro / encounter view: one organisation vs. one adversary. */
function MicroApp() {
  const [agent, setAgent] = useState<Archetype>(ARCHETYPES[0]);
  const [posture, setPosture] = useState<Posture>(() => defaultPosture());
  const [tab, setTab] = useState<MicroTab>("single");
  const [seed, setSeed] = useState(() => (Math.random() * 1e9) | 0);
  const result = useSingleRun(agent, posture, seed);

  return (
    <main className="main">
      <aside className="sidebar">
        <PosturePanel agent={agent} onAgent={setAgent} posture={posture} onPosture={setPosture} />
      </aside>
      <div>
        <div className="note" style={{ marginBottom: "1rem" }}>
          <b>Encounter model.</b> Zoom from the whole ecosystem down to a single organisation facing a
          single adversary: step through one intrusion, or run thousands to find which controls break
          the chain. The forensic companion to the population view.
        </div>
        <div className="tabs">
          <button className={`tab ${tab === "single" ? "on" : ""}`} onClick={() => setTab("single")}>
            Single run
          </button>
          <button className={`tab ${tab === "batch" ? "on" : ""}`} onClick={() => setTab("batch")}>
            Monte Carlo
          </button>
        </div>
        {tab === "single" ? (
          <SingleRun result={result} agent={agent} posture={posture} onReseed={() => setSeed((Math.random() * 1e9) | 0)} />
        ) : (
          <MonteCarlo agent={agent} posture={posture} />
        )}
      </div>
    </main>
  );
}
