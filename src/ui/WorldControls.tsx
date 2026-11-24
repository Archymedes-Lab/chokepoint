import type { World } from "../world/model";
import type { Drivers, Interventions } from "../world/types";
import { Slider, Info } from "./radix";

const DRIVER_META: { key: keyof Drivers; label: string; hint: string }[] = [
  { key: "economicStrain", label: "Economic strain", hint: "Hardship and unemployment — feeds recruitment and risk-taking." },
  { key: "toolingAvailability", label: "Tooling availability", hint: "Cheap RaaS / kits — lowers the skill barrier to entry." },
  { key: "perceivedImpunity", label: "Perceived impunity", hint: "Belief you won't be caught — drives entry and boldness." },
  { key: "cryptoLiquidity", label: "Cash-out ease", hint: "How easily proceeds can be realised and laundered." },
  { key: "contagion", label: "Social contagion", hint: "How strongly visible success recruits imitators." },
  { key: "aiEnabled", label: "AI-enabled attacks", hint: "Generative AI lowers the skill barrier and scales phishing/recon — swelling the low-skill inflow (IBM 2025)." },
];

const IV_META: { key: keyof Interventions; label: string; hint: string }[] = [
  { key: "arrests", label: "Arrest certainty", hint: "Raise the probability of being caught — deters and incapacitates offenders." },
  { key: "takedown", label: "Infrastructure takedowns", hint: "Seize tooling supply — raises the skill barrier at the source." },
  { key: "cashoutDisruption", label: "Cash-out disruption", hint: "Seize mixers / complicit exchanges — cuts realised reward." },
  { key: "hardening", label: "Defensive uplift", hint: "Fund sector-wide hardening — fewer suitable targets (watch displacement)." },
  { key: "cooperation", label: "International cooperation", hint: "Reach into non-cooperating jurisdictions / safe havens." },
  { key: "diversion", label: "Diversion programs", hint: "Address root causes — shrink the inflow of new offenders." },
  { key: "paymentBan", label: "Ransom-payment ban / norm", hint: "Suppress ransom payments. Cheap on budget, politically fraught — but it starves the attacker economy at its source." },
];

export function WorldControls({ world, onChange }: { world: World; onChange: () => void }) {
  const budget = world.budgetUsed();
  const over = budget > 1;

  return (
    <>
      <section className="panel">
        <div className="hd">
          <h2>External Causes</h2>
          <span className="sub">why offending rises &amp; falls</span>
        </div>
        <div className="bd">
          {DRIVER_META.map((d) => (
            <div className="field" key={d.key}>
              <label>
                <span className="label-wrap">
                  {d.label}
                  <Info>{d.hint}</Info>
                </span>
                <span className="val">{Math.round(world.drivers[d.key] * 100)}</span>
              </label>
              <Slider
                aria-label={d.label}
                min={0}
                max={1}
                step={0.05}
                value={world.drivers[d.key]}
                onValueChange={(v) => {
                  world.drivers[d.key] = v;
                  onChange();
                }}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="hd">
          <h2>Authority Levers</h2>
          <span className="sub">what the response invests in</span>
        </div>
        <div className="bd">
          <div className={`budget ${over ? "over" : ""}`}>
            <div className="budget-row">
              <span className="eyebrow">Enforcement budget</span>
              <span className="mono" style={{ fontSize: 12 }}>{Math.round(budget * 100)}%</span>
            </div>
            <div className="heatbar">
              <span style={{ width: `${Math.min(100, budget * 100)}%`, background: over ? "var(--crit)" : "var(--ink)" }} />
            </div>
            <div className="hint" style={{ marginTop: 6 }}>
              Fielded {Math.round(world.metrics().fieldedCapability * 100)}% of funded — capability lags by months.
            </div>
            {over && <div className="hint" style={{ color: "var(--crit)", marginTop: 4 }}>Over budget — real authorities can't fund every lever at once. Prioritise.</div>}
          </div>
          {IV_META.map((d) => (
            <div className="field" key={d.key}>
              <label>
                <span className="label-wrap">
                  {d.label}
                  <Info>{d.hint}</Info>
                </span>
                <span className="val">{Math.round(world.interventions[d.key] * 100)}</span>
              </label>
              <Slider
                aria-label={d.label}
                min={0}
                max={1}
                step={0.05}
                value={world.interventions[d.key]}
                onValueChange={(v) => {
                  world.interventions[d.key] = v;
                  onChange();
                }}
              />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
