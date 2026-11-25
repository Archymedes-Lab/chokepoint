import { useEffect, useState } from "react";
import { ARCHETYPES, defaultPosture, type Archetype, type Posture } from "./sim";
import { useSingleRun } from "./hooks/useSimulation";
import { PosturePanel } from "./ui/PosturePanel";
import { SingleRun } from "./ui/SingleRun";
import { MonteCarlo } from "./ui/MonteCarlo";
import { Ecosystem } from "./ui/Ecosystem";
import { Tabs, TabsList, Tab, TabPanel, TooltipProvider, Info } from "./ui/radix";

type Mode = "eco" | "micro";
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
    <TooltipProvider>
      <Tabs className="app" value={mode} onValueChange={(v) => setMode(v as Mode)}>
        <header className="topbar">
          <div className="topbar-in">
            <div className="brand">
              <svg className="glyph" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                <path
                  d="M16 2 4 7v8c0 7 5 12 12 15 7-3 12-8 12-15V7L16 2Z"
                  stroke="var(--good)"
                  strokeWidth="2"
                  fill="none"
                />
                <path d="M11 16h10M16 11l5 5-5 5" stroke="var(--harm)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <h1>Chokepoint</h1>
              <span className="ver">v0.10</span>
            </div>
            <div className="mode-tabs">
              <TabsList aria-label="Model">
                <Tab value="eco">Ecosystem</Tab>
                <Tab value="micro">Encounter model</Tab>
              </TabsList>
            </div>
            <span className="badge hide-sm">Defensive · Simulation</span>
            <span className="badge hide-sm">
              Calibrated 2025–26
              <Info>
                Payment rates (~23% ransomware / 19% data-theft), access vectors, dwell time and
                harm scale are anchored to 2025–26 data — Coveware, Verizon DBIR, Mandiant M-Trends,
                IBM, FIDO Alliance. See docs/CALIBRATION.md.
              </Info>
            </span>
            <div className="spacer" />
            <button
              className="icon-btn"
              onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
              aria-label="Toggle colour theme"
            >
              {theme === "light" ? "Dark theme" : "Light theme"}
            </button>
          </div>
        </header>

        <TabPanel value="eco" className="view view-eco">
          <Ecosystem />
        </TabPanel>
        <TabPanel value="micro" className="view view-micro">
          <MicroApp />
        </TabPanel>

        <footer className="foot">
          <span>
            <b>Chokepoint</b> · abstract criminological model for defensive planning — no operational attack detail
          </span>
          <Info>
            Simulates offender and defender <i>decisions and population dynamics</i> — never real-world actions.
            Parameters are calibrated from public research; see docs/.
          </Info>
          <span className="spacer" />
          <span className="muted">Apache-2.0 · TLP:CLEAR</span>
        </footer>
      </Tabs>
    </TooltipProvider>
  );
}

/** The micro / encounter view: one organisation vs. one adversary. */
function MicroApp() {
  const [agent, setAgent] = useState<Archetype>(ARCHETYPES[0]);
  const [posture, setPosture] = useState<Posture>(() => defaultPosture());
  const [tab, setTab] = useState<string>("single");
  const [seed, setSeed] = useState(() => (Math.random() * 1e9) | 0);
  const result = useSingleRun(agent, posture, seed);

  return (
    <main className="main">
      <aside className="sidebar">
        <PosturePanel agent={agent} onAgent={setAgent} posture={posture} onPosture={setPosture} />
      </aside>
      <div>
        <div className="note" style={{ marginBottom: 16 }}>
          <b>Encounter model.</b> Zoom from the whole ecosystem down to a single organisation facing a
          single adversary: step through one intrusion, or run thousands to find which controls break
          the chain. The forensic companion to the population view.
        </div>
        <Tabs value={tab} onValueChange={setTab}>
          <div style={{ marginBottom: 16, borderBottom: "1px solid var(--line)" }}>
            <TabsList aria-label="Encounter view">
              <Tab value="single">Single run</Tab>
              <Tab value="batch">Monte Carlo</Tab>
            </TabsList>
          </div>
          <TabPanel value="single">
            <SingleRun result={result} agent={agent} posture={posture} onReseed={() => setSeed((Math.random() * 1e9) | 0)} />
          </TabPanel>
          <TabPanel value="batch">
            <MonteCarlo agent={agent} posture={posture} />
          </TabPanel>
        </Tabs>
      </div>
    </main>
  );
}
