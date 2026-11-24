import type { World } from "../world/model";
import { MOTIVATIONS, MOTIVATION_IDS } from "../world/psychology";
import type { ColorBy } from "../world/render";

const DEF = "#38bdf8";

/** Tiny SVG glyphs that mirror exactly what the canvas draws. */
function Glyph({ type, color }: { type: "dot" | "ring" | "target" | "target-hit" | "square" | "cross" | "crosshair"; color: string }) {
  const s = 12;
  const c = s / 2;
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ flex: "0 0 auto" }} aria-hidden="true">
      {type === "dot" && <rect x={c - 2} y={c - 2} width={4} height={4} fill={color} />}
      {type === "ring" && (
        <>
          <rect x={c - 3} y={c - 3} width={6} height={6} fill="none" stroke={color} />
          <rect x={c - 1} y={c - 1} width={2} height={2} fill="#fff" />
        </>
      )}
      {type === "target" && <rect x={c - 3.5} y={c - 3.5} width={7} height={7} fill="none" stroke={color} />}
      {type === "target-hit" && (
        <>
          <rect x={c - 3.5} y={c - 3.5} width={7} height={7} fill="none" stroke={color} />
          <rect x={c - 2} y={c - 2} width={4} height={4} fill="#ef4444" />
        </>
      )}
      {type === "square" && <rect x={c - 3.5} y={c - 3.5} width={7} height={7} fill="none" stroke={color} />}
      {type === "cross" && (
        <path d={`M${c - 4} ${c} H${c + 4} M${c} ${c - 4} V${c + 4}`} stroke={color} strokeWidth={1.2} />
      )}
      {type === "crosshair" && (
        <>
          <rect x={c - 3.5} y={c - 3.5} width={7} height={7} fill="none" stroke={color} />
          <path d={`M${c - 5} ${c} h2 M${c + 3} ${c} h2`} stroke={color} />
        </>
      )}
    </svg>
  );
}

function Row({ glyph, label }: { glyph: React.ReactNode; label: string }) {
  return (
    <span className="key-row">
      {glyph}
      <span>{label}</span>
    </span>
  );
}

export function MapKey({ colorBy }: { colorBy: ColorBy }) {
  return (
    <section className="panel mapkey">
      <div className="hd">
        <h2>Map Key</h2>
        <span className="sub">what every mark means</span>
      </div>
      <div className="bd">
        <div className="key-grid">
          <div className="key-cat">
            <div className="eyebrow">Infrastructure</div>
            <Row glyph={<Glyph type="target" color="#8aa0c0" />} label="Target org (size = value)" />
            <Row glyph={<Glyph type="target-hit" color="#8aa0c0" />} label="Under attack (red = damage)" />
            <Row glyph={<Glyph type="cross" color={DEF} />} label="Hardened (defence pip)" />
          </div>

          <div className="key-cat">
            <div className="eyebrow">
              Offenders {colorBy === "motivation" ? "· by motivation" : colorBy === "activity" ? "· by activity" : "· by heat"}
            </div>
            {colorBy === "motivation" &&
              MOTIVATION_IDS.map((id) => (
                <Row key={id} glyph={<Glyph type="dot" color={MOTIVATIONS[id].color} />} label={MOTIVATIONS[id].name} />
              ))}
            {colorBy === "activity" && (
              <>
                <Row glyph={<Glyph type="dot" color="#ef4444" />} label="Attacking" />
                <Row glyph={<Glyph type="dot" color="#f59e0b" />} label="Approaching" />
                <Row glyph={<Glyph type="dot" color="#64748b" />} label="Choosing target" />
                <Row glyph={<Glyph type="dot" color="#475569" />} label="Deterred / lying low" />
              </>
            )}
            {colorBy === "heat" && (
              <>
                <Row glyph={<Glyph type="dot" color="#22c55e" />} label="Low attention" />
                <Row glyph={<Glyph type="dot" color="#f59e0b" />} label="Rising heat" />
                <Row glyph={<Glyph type="dot" color="#ef4444" />} label="Hot / notorious" />
              </>
            )}
            {colorBy === "jurisdiction" && (
              <>
                <Row glyph={<Glyph type="dot" color="#34d399" />} label="Domestic (reachable)" />
                <Row glyph={<Glyph type="dot" color="#f59e0b" />} label="Partner (needs cooperation)" />
                <Row glyph={<Glyph type="dot" color="#ef4444" />} label="Non-cooperating haven" />
                <Row glyph={<Glyph type="dot" color="#b91c1c" />} label="Shielded (controlled impunity)" />
              </>
            )}
            <div className="hint" style={{ marginTop: 4 }}>Bright + white core = attacking now · dim = roaming</div>
          </div>

          <div className="key-cat">
            <div className="eyebrow">Response</div>
            <Row glyph={<Glyph type="ring" color={DEF} />} label="Defender (SOC) unit" />
            <Row glyph={<Glyph type="square" color={DEF} />} label="Arrest" />
            <Row glyph={<Glyph type="crosshair" color="#f59e0b" />} label="Gov. takedown" />
            <Row glyph={<Glyph type="cross" color="#22c55e" />} label="Node patched" />
            <Row glyph={<Glyph type="square" color="#ef4444" />} label="Breach" />
          </div>
        </div>
      </div>
    </section>
  );
}

/** The "visual judge": translate the current picture into one plain sentence. */
export function worldRead(world: World): string {
  const m = world.metrics();
  if (m.tick < 8) return "Press play — the ecosystem is just coming to life.";
  const sorted = [...world.sectors].sort((a, b) => a.economy - b.economy);
  const worst = sorted.filter((s) => s.economy < 82).slice(0, 2).map((s) => s.name);

  const pop = Math.max(1, m.population);
  let domId = MOTIVATION_IDS[0];
  for (const id of MOTIVATION_IDS) if ((m.byMotivation[id] ?? 0) > (m.byMotivation[domId] ?? 0)) domId = id;
  const domShare = Math.round(((m.byMotivation[domId] ?? 0) / pop) * 100);

  const responding = world.guardians.filter((g) => g.state === "respond").length;

  // GDP trend over recent history
  const h = world.history;
  let trend = "holding";
  if (h.length > 12) {
    const d = h[h.length - 1].gdp - h[h.length - 12].gdp;
    trend = d < -0.6 ? "falling" : d > 0.6 ? "recovering" : "holding";
  }

  const harm = worst.length
    ? `Harm concentrated in ${worst.join(" & ")}`
    : "Harm spread thin — no sector is collapsing";
  const who = `${MOTIVATIONS[domId].name} offenders lead (${domShare}%)`;
  const def = responding > 0 ? `${responding} SOC unit${responding === 1 ? "" : "s"} responding` : "defenders idle";
  const econ = `GDP ${trend}`;
  return `${harm}. ${who}. ${def}. ${econ}.`;
}
