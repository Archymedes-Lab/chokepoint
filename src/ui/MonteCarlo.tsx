import { STAGES, type Archetype, type Outcome, type Posture } from "../sim";
import { useBatch, useLeverage } from "../hooks/useSimulation";
import { Tile, HBar, fmtMoney } from "./components";

const RUNS = 1500;

const OUTCOME_ORDER: Outcome[] = ["cashed_out", "breached", "abandoned", "evicted", "blocked"];
const OUTCOME_LABEL: Record<Outcome, string> = {
  cashed_out: "Cashed out",
  breached: "Breached",
  abandoned: "Abandoned",
  evicted: "Evicted",
  blocked: "Blocked",
};
const OUTCOME_COLOR: Record<Outcome, string> = {
  cashed_out: "var(--attacker)",
  breached: "var(--warn)",
  abandoned: "var(--muted)",
  evicted: "var(--advantage)",
  blocked: "var(--accent)",
};

export function MonteCarlo({ agent, posture }: { agent: Archetype; posture: Posture }) {
  const stats = useBatch(agent, posture, RUNS);
  const leverage = useLeverage(agent, posture, 350);

  const maxDetect = Math.max(1, ...Object.values(stats.detectByStage));
  const maxLev = Math.max(0.1, ...leverage.map((l) => Math.abs(l.breachDelta)));

  return (
    <>
      <section className="tiles">
        <Tile
          label="Breach rate"
          value={`${(stats.breachRate * 100).toFixed(1)}%`}
          sub="runs reaching impact"
          tone="attacker"
        />
        <Tile
          label="Stopped before impact"
          value={`${((1 - stats.breachRate) * 100).toFixed(1)}%`}
          sub="blocked · evicted · abandoned"
          tone="advantage"
        />
        <Tile label="Mean dwell" value={`${stats.meanDwell.toFixed(0)}h`} sub="time in environment" />
        <Tile
          label="Mean defender loss"
          value={fmtMoney(stats.meanDefenderLoss)}
          sub="expected per intrusion"
          tone="advantage"
        />
      </section>

      <div className="chart-row mt">
        <section className="panel">
          <div className="hd">
            <h2>Outcome Distribution</h2>
            <span className="sub">{stats.runs.toLocaleString()} runs</span>
          </div>
          <div className="bd">
            {OUTCOME_ORDER.map((o) => {
              const n = stats.outcomes[o];
              const p = (n / stats.runs) * 100;
              return (
                <HBar
                  key={o}
                  label={OUTCOME_LABEL[o]}
                  pct={p}
                  color={OUTCOME_COLOR[o]}
                  num={`${p.toFixed(1)}%`}
                />
              );
            })}
            <div className="note">
              Everything left of “Breached” is a defender win — the intrusion was stopped before any
              impact. Adjust the posture on the left and watch the mix shift.
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="hd">
            <h2>Where Detection Happens</h2>
            <span className="sub">stage the response fired</span>
          </div>
          <div className="bd">
            {STAGES.map((s) => {
              const n = stats.detectByStage[s.id];
              return (
                <HBar
                  key={s.id}
                  label={s.name}
                  pct={(n / maxDetect) * 100}
                  color="var(--advantage)"
                  num={`${((n / stats.runs) * 100).toFixed(1)}%`}
                />
              );
            })}
            <div className="note">
              Earlier detection means cheaper incidents. If detections cluster late (Exfil/Impact),
              the damage is mostly done by the time you respond.
            </div>
          </div>
        </section>
      </div>

      <section className="panel mt">
        <div className="hd">
          <h2>Control Leverage — Your Chokepoints</h2>
          <span className="sub">breach-rate rise if each control were removed</span>
        </div>
        <div className="bd">
          {leverage.length === 0 && (
            <div className="muted" style={{ fontSize: "0.82rem" }}>
              No controls enabled — turn some on in the posture panel to rank them.
            </div>
          )}
          {leverage.map((l, i) => (
            <div key={l.controlId} className="lev-row">
              <div>
                <div className="lv-name">
                  <span className="rank">#{i + 1}</span>
                  {l.name}
                </div>
                <div
                  className="lv-bar"
                  style={{
                    width: `${Math.max(2, (Math.abs(l.breachDelta) / maxLev) * 100)}%`,
                    background: l.breachDelta >= 0 ? "var(--advantage)" : "var(--muted)",
                  }}
                />
              </div>
              <div className="lv-delta">
                {l.breachDelta >= 0 ? "+" : ""}
                {l.breachDelta.toFixed(1)}pp
                <div className="muted" style={{ fontSize: "0.64rem", fontWeight: 400 }}>
                  +{fmtMoney(Math.max(0, l.lossDelta))} loss
                </div>
              </div>
            </div>
          ))}
          <div className="note">
            Leverage is <b>posture-specific and adversary-specific</b>. A control ranks high when it
            plugs a gap nothing else covers against <i>this</i> adversary — remove it and the breach
            rate jumps. That is your highest-value investment for this threat model, computed by
            re-running the whole batch with each control switched off.
          </div>
        </div>
      </section>
    </>
  );
}
