import { useEffect, useRef, useState } from "react";
import { World } from "../world/model";
import { drawWorld } from "../world/render";
import { WorldControls } from "./WorldControls";
import { WorldDashboard } from "./WorldDashboard";
import { Inspector } from "./Inspector";
import { MapKey, worldRead } from "./MapKey";
import { ThreatWire } from "./ThreatWire";
import { ToggleGroup, ToggleItem, Slider } from "./radix";
import type { ColorBy } from "../world/render";

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
          <span className="badge mono" title="1 tick = 6 hours">Day {world.metrics().day}</span>
          <span className="eyebrow" style={{ marginLeft: 4 }}>colour by</span>
          <ToggleGroup aria-label="Colour offenders by" value={colorBy} onValueChange={(v) => setColorBy(v as ColorBy)}>
            {COLOR_MODES.map(([k, label]) => (
              <ToggleItem key={k} value={k}>
                {label}
              </ToggleItem>
            ))}
          </ToggleGroup>
          <div className="pop-field">
            <span className="eyebrow">seed pop</span>
            <Slider
              aria-label="Seed population"
              min={100}
              max={3000}
              step={100}
              value={pop}
              onValueChange={setPop}
              onCommit={(v) => reset(v)}
            />
            <span className="mono" style={{ fontSize: 12 }}>{pop}</span>
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

        <div className="mapread">
          <span className="mapread-tag">MAP READ</span>
          <span className="mapread-text">{worldRead(world)}</span>
        </div>

        <MapKey colorBy={colorBy} />

        <ThreatWire />

        <Inspector world={world} selectedId={selectedId} />
      </div>

      <aside className="eco-right">
        <WorldDashboard world={world} />
      </aside>
    </div>
  );
}
