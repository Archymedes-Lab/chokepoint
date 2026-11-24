import type { World } from "../world/model";
import { money } from "../world/model";
import { MOTIVATIONS } from "../world/psychology";
import type { AgentState } from "../world/types";

const STATE_LABEL: Record<AgentState, string> = {
  seek: "choosing a target",
  travel: "moving to target",
  operate: "attacking",
  cash: "cashing out",
  lay_low: "lying low (deterred)",
  jailed: "arrested",
  desisted: "desisted",
};

export function Inspector({ world, selectedId }: { world: World; selectedId: number | null }) {
  const a = selectedId != null ? world.agents.find((x) => x.id === selectedId) : null;

  return (
    <section className="panel">
      <div className="hd">
        <h2>Forensic Profile</h2>
        <span className="sub">{a ? `offender #${a.id}` : "click an offender"}</span>
      </div>
      <div className="bd">
        {!a && (
          <div className="muted" style={{ fontSize: "0.82rem" }}>
            Click any moving pixel in the world to inspect that offender — their motivation,
            capability, history, and the live expected-utility reasoning behind their next move.
          </div>
        )}
        {a && (
          <>
            <div className="prof-top">
              <span className="prof-chip" style={{ background: MOTIVATIONS[a.mot].color }} />
              <div>
                <div className="prof-name">{MOTIVATIONS[a.mot].name}</div>
                <div className="muted" style={{ fontSize: "0.72rem" }}>
                  {STATE_LABEL[a.state]} · {a.shielded ? "shielded (controlled impunity)" : `${a.jurisdiction} jurisdiction`}
                </div>
              </div>
            </div>
            <div className="prof-blurb">{MOTIVATIONS[a.mot].blurb}</div>

            <div className="eyebrow mt" style={{ marginBottom: "0.3rem" }}>Disposition</div>
            <Meter label="Skill" v={a.skill} />
            <Meter label="Risk tolerance" v={a.riskTolerance} />
            <Meter label="Conscience" v={a.morality} />
            <Meter label="Greed" v={a.greed / 1.4} />
            <Meter label="Heat / attention" v={a.heat} danger />
            <Meter label="Case built" v={a.invProgress} danger />

            <div className="eyebrow mt" style={{ marginBottom: "0.3rem" }}>History</div>
            <div className="prof-grid">
              <Stat k="Proceeds" v={money(a.wealth)} />
              <Stat k="Aspiration" v={money(a.aspiration)} />
              <Stat k="Successful ops" v={`${a.ops}`} />
              <Stat k="Times caught" v={`${a.busts}`} />
              <Stat k="Active for" v={`${a.ageTicks}t`} />
              <Stat k="Last EU" v={a.lastEU.toFixed(0)} />
            </div>

            <div className="note mt" style={{ fontSize: "0.72rem" }}>
              <b>Why this behaviour:</b> this offender weighs expected reward (scaled by greed and
              cash-out ease) against the perceived certainty and severity of punishment and the moral
              cost of the harm. {a.lastEU > 0
                ? "Their last calculation came out positive — crime still pays, so they press on."
                : "Their last calculation came out negative — deterred, they lie low or step away."}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function Meter({ label, v, danger }: { label: string; v: number; danger?: boolean }) {
  const pct = Math.max(0, Math.min(100, v * 100));
  return (
    <div className="meter">
      <span className="meter-l">{label}</span>
      <span className="meter-track">
        <span className="meter-fill" style={{ width: `${pct}%`, background: danger ? "var(--crit)" : "var(--accent)" }} />
      </span>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="prof-stat">
      <div className="prof-stat-k">{k}</div>
      <div className="prof-stat-v">{v}</div>
    </div>
  );
}
