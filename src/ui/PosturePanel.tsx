import { ARCHETYPES, type Archetype, type Control, type Posture } from "../sim";
import { Switch, Slider } from "./components";

const CATEGORY_LABELS: Record<Control["category"], string> = {
  identity: "Identity",
  endpoint: "Endpoint",
  network: "Network",
  data: "Data",
  process: "Process & People",
  intel: "Threat Intel",
};

const CATEGORY_ORDER: Control["category"][] = [
  "identity",
  "endpoint",
  "network",
  "data",
  "process",
  "intel",
];

export function PosturePanel({
  agent,
  onAgent,
  posture,
  onPosture,
}: {
  agent: Archetype;
  onAgent: (a: Archetype) => void;
  posture: Posture;
  onPosture: (p: Posture) => void;
}) {
  function setControl(id: string, patch: Partial<Control>) {
    onPosture({
      ...posture,
      controls: posture.controls.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    });
  }

  function preset(kind: "baseline" | "hardened") {
    onPosture({
      ...posture,
      responsiveness: kind === "hardened" ? 0.75 : 0.5,
      responseThreshold: kind === "hardened" ? 0.45 : 0.62,
      controls: posture.controls.map((c) => {
        if (kind === "baseline") {
          const on = ["mfa_push", "patch_edge", "edr", "backups"].includes(c.id);
          return { ...c, enabled: on };
        }
        return { ...c, enabled: true, coverage: Math.max(c.coverage, 0.8) };
      }),
    });
  }

  const byCat = CATEGORY_ORDER.map((cat) => ({
    cat,
    items: posture.controls.filter((c) => c.category === cat),
  })).filter((g) => g.items.length);

  return (
    <>
      <section className="panel">
        <div className="hd">
          <h2>Adversary</h2>
          <span className="sub">who is operating</span>
        </div>
        <div className="bd">
          <select
            value={agent.id}
            onChange={(e) => onAgent(ARCHETYPES.find((a) => a.id === e.target.value)!)}
            aria-label="Adversary archetype"
          >
            {ARCHETYPES.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <div className="arch-blurb">{agent.blurb}</div>
          <div className="arch-traits">
            <span className="trait">skill {pct(agent.skill)}</span>
            <span className="trait">budget {agent.budget}</span>
            <span className="trait">risk {pct(agent.riskTolerance)}</span>
            <span className="trait">adapt {pct(agent.adaptability)}</span>
            <span className="trait">goal: {agent.goal}</span>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="hd">
          <h2>Defensive Posture</h2>
          <span className="sub">your controls</span>
        </div>
        <div className="bd">
          <div className="presets">
            <button className="btn" onClick={() => preset("baseline")}>
              Baseline org
            </button>
            <button className="btn" onClick={() => preset("hardened")}>
              Hardened
            </button>
          </div>

          <div className="field">
            <label htmlFor="tv">
              Target value (what's at stake)
              <span className="val">{fmtTV(posture.targetValue)}</span>
            </label>
            <Slider
              id="tv"
              min={100_000}
              max={50_000_000}
              step={100_000}
              value={posture.targetValue}
              onChange={(v) => onPosture({ ...posture, targetValue: v })}
            />
          </div>
          <div className="field">
            <label htmlFor="resp">
              SOC responsiveness
              <span className="val">{pct(posture.responsiveness)}</span>
            </label>
            <Slider
              id="resp"
              min={0.1}
              max={0.95}
              step={0.05}
              value={posture.responsiveness}
              onChange={(v) => onPosture({ ...posture, responsiveness: v })}
            />
          </div>
          <div className="field">
            <label htmlFor="thr">
              Detection sensitivity
              <span className="val">{pct(1 - posture.responseThreshold)}</span>
            </label>
            <Slider
              id="thr"
              min={0.2}
              max={0.85}
              step={0.02}
              value={1 - posture.responseThreshold}
              onChange={(v) => onPosture({ ...posture, responseThreshold: 1 - v })}
            />
          </div>

          {byCat.map((g) => (
            <div key={g.cat}>
              <div className="ctrl-cat">{CATEGORY_LABELS[g.cat]}</div>
              {g.items.map((c) => (
                <div key={c.id} className={`ctrl ${c.enabled ? "on" : ""}`}>
                  <div className="row">
                    <Switch
                      checked={c.enabled}
                      onChange={(v) => setControl(c.id, { enabled: v })}
                      label={c.name}
                    />
                    <span className="name">{c.name}</span>
                    <span className="effort">{c.effort}</span>
                  </div>
                  {c.enabled && (
                    <div className="cov">
                      <Slider
                        min={0.1}
                        max={1}
                        step={0.05}
                        value={c.coverage}
                        onChange={(v) => setControl(c.id, { coverage: v })}
                      />
                      <span>{pct(c.coverage)}</span>
                    </div>
                  )}
                  <div className="blurb">{c.blurb}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

const pct = (x: number) => `${Math.round(x * 100)}%`;
const fmtTV = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${(n / 1000).toFixed(0)}k`;
