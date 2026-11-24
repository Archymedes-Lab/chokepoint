import type { World, HistoryPoint } from "../world/model";
import { money } from "../world/model";
import { MOTIVATIONS, MOTIVATION_IDS } from "../world/psychology";
import { ScrollArea } from "./radix";
import { JURISDICTION_COLORS } from "../world/render";

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
            <Big label="Attacker revenue" value={money(m.attackerRevenue)} tone="attacker" />
            <Big
              label="Payment rate"
              value={m.extortionAttempts ? `${Math.round((m.paidCount / m.extortionAttempts) * 100)}%` : "—"}
              tone="attacker"
            />
          </div>
          <Spark history={world.history} />
          <div className="note">
            Every breach does <b>harm</b>, but only a paying victim gives the attacker <b>revenue</b>
            — and revenue is what recruits the next offender. The real-world payment rate is ~23%
            (ransomware) / 19% (data-theft) and falling (Coveware, Q3 2025). Driving it lower with
            backups and a no-pay posture starves the ecosystem at its source.
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="hd">
          <h2>Defence &amp; Government Activity</h2>
          <span className="sub">the blue team and the state, at work</span>
        </div>
        <div className="bd">
          <div className="tiles">
            <Big label="SOC units" value={compact(m.guardians)} tone="defender" />
            <Big label="Active offenders" value={compact(m.population)} tone="attacker" />
            <Big label="Defender captures" value={compact(m.defenderEvictions)} tone="defender" />
            <Big label="Nodes patched" value={compact(m.patches)} tone="defender" />
            <Big label="Gov. takedowns" value={compact(m.takedownOps)} tone="gov" />
            <Big label="Total arrests" value={compact(m.arrestsMade)} tone="gov" />
            <Big label="Desistances" value={compact(m.desistances)} tone="advantage" />
            <Big label="Recruited" value={compact(m.recruited)} tone="attacker" />
          </div>
          <div className="note">
            Defenders (blue units) hunt the noisiest offenders and patch weak targets; government
            takedowns (amber) strike infrastructure. Fund <b>Defensive uplift</b>, <b>Arrest certainty</b>,
            and <b>Cooperation</b> to field more of them — and watch captures rise against the population.
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="hd">
          <h2>Response Timescales</h2>
          <span className="sub">how slow the response really is</span>
        </div>
        <div className="bd">
          <div className="tiles">
            <Big label="Sim day" value={`${m.day}`} tone="defender" />
            <Big
              label="Capability fielded"
              value={`${Math.round(m.fieldedCapability * 100)}%`}
              tone={m.fieldedCapability > 0.9 ? "advantage" : "gov"}
            />
            <Big label="Open cases" value={compact(m.openInvestigations)} tone="defender" />
            <Big
              label="Avg time to arrest"
              value={m.meanTimeToArrestDays ? `${Math.round(m.meanTimeToArrestDays)}d` : "—"}
              tone="gov"
            />
            <Big
              label="Clearance rate"
              value={m.breaches ? `${Math.min(100, (m.arrestsMade / m.breaches) * 100).toFixed(1)}%` : "—"}
              tone="gov"
            />
            <Big label="Total arrests" value={compact(m.arrestsMade)} tone="gov" />
            <Big label="Disclosed breaches" value={compact(Math.round(m.disclosedBreaches))} tone="defender" />
            <Big
              label="Undisclosed (pending)"
              value={compact(Math.max(0, Math.round(m.breaches - m.disclosedBreaches)))}
              tone="attacker"
            />
          </div>
          <div className="note">
            The response is slow and leaky on purpose. Ransomware is spotted in ~19 days, stealthier
            malware ~93 (breach filings); investigations run <b>1–3 years</b> and most never clear;
            and funded capability takes <b>months to field</b>. Enforcement mostly <i>deters</i> —
            it rarely catches anyone in the act. And authorities act on <b>disclosed</b> data, which
            trails the real breach count by weeks — the picture is always an undercount.
          </div>
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

          <div className="eyebrow" style={{ margin: "0.9rem 0 0.4rem" }}>Offenders by origin — reach depends on cooperation</div>
          {([
            ["domestic", "Domestic (reachable)", JURISDICTION_COLORS.domestic],
            ["partner", "Partner (needs cooperation)", JURISDICTION_COLORS.partner],
            ["haven", "Non-cooperating haven", JURISDICTION_COLORS.haven],
          ] as const).map(([k, label, col]) => {
            const n = m.byJurisdiction[k] ?? 0;
            return (
              <div className="hbar" key={k}>
                <span className="lab" title={label}>{label}</span>
                <span className="track">
                  <span className="fill" style={{ width: `${(n / pop) * 100}%`, background: col }} />
                </span>
                <span className="num">{compact(n)}</span>
              </div>
            );
          })}
          <div className="hint" style={{ marginTop: 6 }}>
            Of these, <b style={{ color: "var(--crit)" }}>{compact(m.shieldedCount)}</b> are shielded —
            "controlled impunity" that enforcement can't reach regardless of cooperation.
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="hd">
          <h2>Investigator Feed</h2>
          <span className="sub">notable events</span>
        </div>
        <div className="bd">
          <ScrollArea maxHeight={240}>
            <div className="feed">
              {world.events.length === 0 && <div className="muted" style={{ fontSize: 12 }}>No major events yet — run the simulation.</div>}
              {world.events.map((e, i) => (
                <div className={`feed-row k-${e.kind}`} key={`${e.tick}-${i}`}>
                  <span className="feed-dot" />
                  <span className="feed-text">{e.text}</span>
                  <span className="feed-t">t{e.tick}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </section>
    </>
  );
}

function Big({ label, value, tone }: { label: string; value: string; tone?: "attacker" | "advantage" | "defender" | "gov" }) {
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
