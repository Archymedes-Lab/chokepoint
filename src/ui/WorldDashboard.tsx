import type { World, HistoryPoint } from "../world/model";
import { money } from "../world/model";
import { MOTIVATIONS, MOTIVATION_IDS } from "../world/psychology";

export function WorldDashboard({ world }: { world: World }) {
  const m = world.metrics();
  const advice = world.advise();
  const pop = Math.max(1, m.population);

  return (
    <>
      <section className="panel">
        <div className="hd">
          <h2>National Impact</h2>
          <span className="sub">cumulative damage, multiple dimensions</span>
        </div>
        <div className="bd">
          <div className="tiles">
            <Big label="Direct losses" value={money(m.financialLoss)} tone="attacker" />
            <Big label="Recovery cost" value={money(m.recoveryCost)} tone="attacker" />
            <Big label="GDP health" value={`${m.gdpIndex.toFixed(0)}%`} tone={m.gdpIndex > 80 ? "advantage" : "attacker"} />
            <Big label="Public trust" value={`${m.publicTrust.toFixed(0)}%`} tone={m.publicTrust > 80 ? "advantage" : "attacker"} />
            <Big label="Downtime" value={`${compact(m.downtimeHours)}h`} />
            <Big label="Records stolen" value={compact(m.recordsStolen)} />
            <Big label="Victim orgs" value={compact(m.victims)} />
            <Big label="Breaches" value={compact(m.breaches)} />
          </div>
          <Spark history={world.history} />
        </div>
      </section>

      <section className="panel">
        <div className="hd">
          <h2>Authority Advisor</h2>
          <span className="sub">the highest-leverage move, right now</span>
        </div>
        <div className="bd">
          <div className="advice">
            <div className="advice-head">▶ {advice.headline}</div>
            <div className="advice-body">{advice.rationale}</div>
          </div>
          <div className="note" style={{ marginTop: "0.7rem" }}>
            The lever changes as the population changes. That is the thesis: once you can
            <b> see the motivation</b> driving the harm, the right response stops being a guess.
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="hd">
          <h2>Who & Where</h2>
          <span className="sub">motivation mix · sector harm</span>
        </div>
        <div className="bd">
          <div className="eyebrow" style={{ marginBottom: "0.4rem" }}>Active offenders by motivation — {compact(m.population)} total</div>
          {MOTIVATION_IDS.map((id) => {
            const n = m.byMotivation[id] ?? 0;
            return (
              <div className="hbar" key={id}>
                <span className="lab" title={MOTIVATIONS[id].name}>{MOTIVATIONS[id].name}</span>
                <span className="track">
                  <span className="fill" style={{ width: `${(n / pop) * 100}%`, background: MOTIVATIONS[id].color }} />
                </span>
                <span className="num">{compact(n)}</span>
              </div>
            );
          })}
          <div className="eyebrow" style={{ margin: "0.9rem 0 0.4rem" }}>Economic health by sector — low = displacement target</div>
          {world.sectors.map((s) => (
            <div className="hbar" key={s.id}>
              <span className="lab" title={s.name}>{s.name}</span>
              <span className="track">
                <span className="fill" style={{ width: `${s.economy}%`, background: s.economy > 70 ? "var(--advantage)" : s.economy > 40 ? "var(--warn)" : "var(--crit)" }} />
              </span>
              <span className="num">{Math.round(s.economy)}%</span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="hd">
          <h2>Investigator Feed</h2>
          <span className="sub">notable events</span>
        </div>
        <div className="bd">
          <div className="feed">
            {world.events.length === 0 && <div className="muted" style={{ fontSize: "0.8rem" }}>No major events yet — run the simulation.</div>}
            {world.events.map((e, i) => (
              <div className={`feed-row k-${e.kind}`} key={`${e.tick}-${i}`}>
                <span className="feed-dot" />
                <span className="feed-text">{e.text}</span>
                <span className="feed-t">t{e.tick}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function Big({ label, value, tone }: { label: string; value: string; tone?: "attacker" | "advantage" }) {
  return (
    <div className={`tile ${tone ?? ""}`}>
      <div className="t-lbl">{label}</div>
      <div className="t-val" style={{ fontSize: "1.15rem" }}>{value}</div>
    </div>
  );
}

function compact(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}k`;
  return `${Math.round(n)}`;
}

function Spark({ history }: { history: HistoryPoint[] }) {
  if (history.length < 2) return null;
  const W = 300;
  const H = 54;
  const gdp = history.map((h) => h.gdp);
  const trust = history.map((h) => h.trust);
  const n = history.length;
  const path = (vals: number[]) =>
    vals
      .map((v, i) => `${(i / (n - 1)) * W},${H - (v / 100) * H}`)
      .join(" ");
  return (
    <div style={{ marginTop: "0.8rem" }}>
      <div className="eyebrow" style={{ marginBottom: "0.3rem" }}>GDP health & public trust over time</div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" style={{ display: "block" }}>
        <polyline points={path(gdp)} fill="none" stroke="var(--accent)" strokeWidth="1.5" />
        <polyline points={path(trust)} fill="none" stroke="var(--advantage)" strokeWidth="1.5" strokeDasharray="3 2" />
      </svg>
      <div className="muted" style={{ fontSize: "0.66rem" }}>
        <span style={{ color: "var(--accent)" }}>— GDP</span> &nbsp;
        <span style={{ color: "var(--advantage)" }}>-- trust</span>
      </div>
    </div>
  );
}
