import { useEffect, useRef, useState } from "react";
import { World } from "../world/model";
import { drawWorld } from "../world/render";
import { WorldControls } from "./WorldControls";
import { WorldDashboard } from "./WorldDashboard";
import { Inspector } from "./Inspector";

const WORLD_W = 1000;
const WORLD_H = 620;
const SPEEDS = [1, 2, 4, 8];

export function Ecosystem() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const worldRef = useRef<World | null>(null);
  const runningRef = useRef(true);
  const speedRef = useRef(2);
  const selectedRef = useRef<number | null>(null);
  const showHeatRef = useRef(false);

  const [, setRev] = useState(0);
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(2);
  const [pop, setPop] = useState(600);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showHeat, setShowHeat] = useState(false);

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

  // Keep refs in sync with state.
  useEffect(() => void (runningRef.current = running), [running]);
  useEffect(() => void (speedRef.current = speed), [speed]);
  useEffect(() => void (selectedRef.current = selectedId), [selectedId]);
  useEffect(() => void (showHeatRef.current = showHeat), [showHeat]);

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
        drawWorld(ctx, w, { selectedId: selectedRef.current, showHeat: showHeatRef.current });
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
  };

  const world = worldRef.current!;
  const refresh = () => setRev((r) => (r + 1) & 0xffff);

  return (
    <div className="eco">
      <aside className="eco-left">
        <WorldControls world={world} onChange={refresh} />
      </aside>

      <div className="eco-center">
        <div className="transport">
          <button className="btn primary" onClick={() => setRunning((r) => !r)}>
            {running ? "❚❚ Pause" : "▶ Play"}
          </button>
          <div className="seg">
            {SPEEDS.map((s) => (
              <button key={s} className={`seg-b ${speed === s ? "on" : ""}`} onClick={() => setSpeed(s)}>
                {s}×
              </button>
            ))}
          </div>
          <button className="btn" onClick={() => reset(pop)}>
            ↻ Reset
          </button>
          <label className="toggle">
            <input type="checkbox" checked={showHeat} onChange={(e) => setShowHeat(e.target.checked)} />
            Heat view
          </label>
          <div className="pop-field">
            <span className="muted" style={{ fontSize: "0.72rem" }}>seed pop</span>
            <input
              type="range"
              min={100}
              max={3000}
              step={100}
              value={pop}
              onChange={(e) => setPop(Number(e.target.value))}
              onMouseUp={() => reset(pop)}
              onTouchEnd={() => reset(pop)}
            />
            <span className="mono" style={{ fontSize: "0.72rem" }}>{pop}</span>
          </div>
        </div>

        <div className="canvas-wrap">
          <canvas
            ref={canvasRef}
            width={WORLD_W}
            height={WORLD_H}
            onClick={onCanvasClick}
            className="world-canvas"
          />
        </div>

        <div className="legend-bar">
          <span className="muted" style={{ fontSize: "0.72rem" }}>offenders:</span>
          {[
            ["economic", "#f0a33c"],
            ["professional", "#f2695e"],
            ["ideological", "#7aa0ff"],
            ["thrill", "#35c48b"],
            ["opportunistic", "#9aa7b8"],
          ].map(([name, col]) => (
            <span key={name} className="legend-item">
              <i style={{ background: col }} /> {name}
            </span>
          ))}
        </div>

        <Inspector world={world} selectedId={selectedId} />
      </div>

      <aside className="eco-right">
        <WorldDashboard world={world} />
      </aside>
    </div>
  );
}
