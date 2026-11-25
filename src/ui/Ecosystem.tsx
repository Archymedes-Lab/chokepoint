import { useEffect, useRef, useState } from "react";
import { World } from "../world/model";
import { drawWorld } from "../world/render";
import { WorldControls } from "./WorldControls";
import { WorldDashboard, KpiStrip } from "./WorldDashboard";
import { Inspector } from "./Inspector";
import { MapKey, worldRead } from "./MapKey";
import { ThreatWire } from "./ThreatWire";
import { ToggleGroup, ToggleItem, Slider, Tabs, TabsList, Tab, TabPanel } from "./radix";
import type { ColorBy } from "../world/render";
import { SCENARIOS } from "../world/scenarios";

const WORLD_W = 1000;
const WORLD_H = 620;
const SPEEDS = [1, 2, 4, 8];
const COLOR_MODES: [ColorBy, string][] = [
  ["motivation", "Motivation"],
  ["activity", "Activity"],
  ["heat", "Heat"],
  ["jurisdiction", "Origin"],
];

export function Ecosystem() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const worldRef = useRef<World | null>(null);
  const runningRef = useRef(true);
  const speedRef = useRef(2);
  const selectedRef = useRef<number | null>(null);
  const colorByRef = useRef<ColorBy>("motivation");

  const [, setRev] = useState(0);
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(2);
  const [pop, setPop] = useState(600);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [colorBy, setColorBy] = useState<ColorBy>("motivation");
  const [scenario, setScenario] = useState<string>("baseline");
  const [detail, setDetail] = useState<string>("profile");

  // Lazily create the world (no state updates during render).
  if (!worldRef.current) {
    worldRef.current = new World({ width: WORLD_W, height: WORLD_H, initialAgents: pop, seed: (Math.random() * 1e9) | 0 });
  }

  // Reset is only ever called from an event handler, so setState is safe here.
  const reset = (initialAgents: number) => {
    worldRef.current = new World({ width: WORLD_W, height: WORLD_H, initialAgents, seed: (Math.random() * 1e9) | 0 });
    selectedRef.current = null;
    setSelectedId(null);
  };

  const applyScenario = (id: string) => {
    const sc = SCENARIOS.find((s) => s.id === id);
    worldRef.current = new World({ width: WORLD_W, height: WORLD_H, initialAgents: pop, seed: (Math.random() * 1e9) | 0 });
    if (sc) worldRef.current.configure(sc.drivers, sc.interventions);
    selectedRef.current = null;
    setSelectedId(null);
    setScenario(id);
    setRunning(true);
  };

  // Any manual knob change means we're no longer on a named scenario.
  const onKnob = () => {
    setScenario("custom");
    setRev((r) => (r + 1) & 0xffff);
  };

  // Keep refs in sync with state.
  useEffect(() => void (runningRef.current = running), [running]);
  useEffect(() => void (speedRef.current = speed), [speed]);
  useEffect(() => void (selectedRef.current = selectedId), [selectedId]);
  useEffect(() => void (colorByRef.current = colorBy), [colorBy]);

  // Main loop: step the sim and render every animation frame.
  useEffect(() => {
    let raf = 0;
    let lastRefresh = 0;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d") ?? null;

    const frame = (t: number) => {
      const w = worldRef.current;
      if (w && ctx) {
        if (runningRef.current) {
          for (let i = 0; i < speedRef.current; i++) w.step();
        }
        drawWorld(ctx, w, { selectedId: selectedRef.current, colorBy: colorByRef.current });
        // Refresh the React panels a few times a second, not every frame.
        if (t - lastRefresh > 120) {
          lastRefresh = t;
          setRev((r) => (r + 1) & 0xffff);
        }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const w = worldRef.current;
    const canvas = canvasRef.current;
    if (!w || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (WORLD_W / rect.width);
    const y = (e.clientY - rect.top) * (WORLD_H / rect.height);
    const a = w.pickAgent(x, y, 14);
    setSelectedId(a ? a.id : null);
    if (a) setDetail("profile");
  };

  const world = worldRef.current!;

  const scenarioNote = SCENARIOS.find((s) => s.id === scenario)?.note || "Custom posture — you have changed a knob.";
  const m = world.metrics();

  return (
    <div className="eco">
      <aside className="eco-side eco-left" aria-label="Configuration">
        <div className="side-hd">
          <h2>Configuration</h2>
          <span className="sub">inputs to the model</span>
        </div>
        <div className="side-scroll">
          <div className="field scenario-field">
            <label htmlFor="scenario">Scenario</label>
            <select id="scenario" value={scenario} onChange={(e) => applyScenario(e.target.value)}>
              {scenario === "custom" && <option value="custom">Custom</option>}
              {SCENARIOS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <div className="hint">{scenarioNote}</div>
          </div>
          <WorldControls world={world} onChange={onKnob} />
          <div className="field pop-field">
            <label>
              <span>Seed population</span>
              <span className="val">{pop}</span>
            </label>
            <Slider
              aria-label="Seed population"
              min={100}
              max={3000}
              step={100}
              value={pop}
              onValueChange={setPop}
              onCommit={(v) => reset(v)}
            />
            <div className="hint">Restarts the world when released.</div>
          </div>
        </div>
      </aside>

      <section className="eco-center" aria-label="Simulation">
        <div className="toolbar" role="toolbar" aria-label="Simulation controls">
          <div className="tb-group">
            <button className={`btn primary play ${running ? "" : "paused"}`} onClick={() => setRunning((r) => !r)} aria-pressed={!running}>
              {running ? "❚❚ Pause" : "▶ Play"}
            </button>
            <ToggleGroup aria-label="Speed" value={String(speed)} onValueChange={(v) => setSpeed(Number(v))}>
              {SPEEDS.map((s) => (
                <ToggleItem key={s} value={String(s)}>
                  {s}×
                </ToggleItem>
              ))}
            </ToggleGroup>
            <button className="btn" onClick={() => reset(pop)}>
              ↻ Reset
            </button>
          </div>
          <div className="tb-clock" title="1 tick = 6 hours">
            <span className="tb-lbl">Day</span>
            <span className="tb-day">{m.day}</span>
            <span className={`tb-state ${running ? "live" : ""}`}>{running ? "Running" : "Paused"}</span>
          </div>
          <div className="tb-group tb-right">
            <span className="tb-lbl">Colour by</span>
            <ToggleGroup aria-label="Colour offenders by" value={colorBy} onValueChange={(v) => setColorBy(v as ColorBy)}>
              {COLOR_MODES.map(([k, label]) => (
                <ToggleItem key={k} value={k}>
                  {label}
                </ToggleItem>
              ))}
            </ToggleGroup>
          </div>
        </div>

        <KpiStrip world={world} />

        <div className="stage">
          <div className="stage-fit">
            <canvas
              ref={canvasRef}
              width={WORLD_W}
              height={WORLD_H}
              onClick={onCanvasClick}
              className="world-canvas"
              aria-label="Simulated cybercrime ecosystem. Click an offender to inspect it."
            />
            {!running && <div className="stage-badge">Paused</div>}
            {selectedId == null && <div className="stage-hint">Click any offender to inspect it</div>}
          </div>
        </div>

        <div className="mapread" aria-live="polite">
          <span className="mapread-tag">Map read</span>
          <span className="mapread-text">{worldRead(world)}</span>
        </div>

        <Tabs className="drawer" value={detail} onValueChange={setDetail}>
          <div className="drawer-hd">
            <TabsList aria-label="Detail">
              <Tab value="profile">
                Offender profile{selectedId != null && <span className="tab-dot" aria-hidden="true" />}
              </Tab>
              <Tab value="wire">Live threat wire</Tab>
              <Tab value="key">Map key</Tab>
            </TabsList>
          </div>
          <div className="drawer-scroll">
            <TabPanel value="profile">
              <Inspector world={world} selectedId={selectedId} />
            </TabPanel>
            <TabPanel value="wire" forceMount hidden={detail !== "wire"}>
              <ThreatWire />
            </TabPanel>
            <TabPanel value="key">
              <MapKey colorBy={colorBy} />
            </TabPanel>
          </div>
        </Tabs>
      </section>

      <aside className="eco-side eco-right" aria-label="Outcomes">
        <div className="side-hd">
          <h2>Outcomes</h2>
          <span className="sub">what the model is producing</span>
        </div>
        <div className="side-scroll">
          <WorldDashboard world={world} />
        </div>
      </aside>
    </div>
  );
}
