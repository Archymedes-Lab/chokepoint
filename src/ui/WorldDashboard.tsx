import type { World, HistoryPoint } from "../world/model";
import { money } from "../world/model";
import { MOTIVATIONS, MOTIVATION_IDS } from "../world/psychology";
import { ScrollArea, CollapsiblePanel, Explainer } from "./radix";
import { HBar } from "./components";
import { JURISDICTION_COLORS } from "../world/render";

/** Headline numbers that sit above the map — the five a decision-maker
 *  should never have to scroll for. Each carries a trend line. */
export function KpiStrip({ world }: { world: World }) {
  const m = world.metrics();
  const h = world.history;
  const pay = m.extortionAttempts ? (m.paidCount / m.extortionAttempts) * 100 : null;
  return (
    <div className="kpis" role="group" aria-label="Headline metrics">
      <Kpi label="Direct losses" value={money(m.financialLoss)} tone="attacker" series={h.map((p) => p.loss)} />
      <Kpi label="Attacker revenue" value={money(m.attackerRevenue)} tone="attacker" hint="Paid ransoms only" />
      <Kpi
        label="Payment rate"
        value={pay == null ? "—" : `${Math.round(pay)}%`}
        tone={pay != null && pay < 15 ? "advantage" : "attacker"}
        hint="Real-world baseline ~23%"
      />
      <Kpi
        label="GDP health"
        value={`${m.gdpIndex.toFixed(0)}%`}
        tone={m.gdpIndex > 80 ? "advantage" : m.gdpIndex > 60 ? "gov" : "attacker"}
        series={h.map((p) => p.gdp)}
      />
      <Kpi label="Active offenders" value={compact(m.population)} tone="attacker" series={h.map((p) => p.population)} />
    </div>
  );
}

function Kpi({
  label,
  value,
  tone,
  series,
  hint,
}: {
  label: string;
  value: string;
  tone: "attacker" | "advantage" | "defender" | "gov";
  series?: number[];
  hint?: string;
}) {
  return (
    <div className={`kpi ${tone}`}>
      <div className="kpi-lbl">{label}</div>
      <div className="kpi-val">{value}</div>
      {series && series.length > 1 ? <Trend values={series} /> : hint ? <div className="kpi-hint">{hint}</div> : <div className="kpi-hint">&nbsp;</div>}
    </div>
  );
}

function Trend({ values }: { values: number[] }) {
  const W = 100;
  const H = 18;
  const v = values.slice(-120);
  const lo = Math.min(...v);
  const hi = Math.max(...v);
  const span = hi - lo || 1;
  const pts = v.map((x, i) => `${(i / (v.length - 1)) * W},${H - 1 - ((x - lo) / span) * (H - 2)}`).join(" ");
  return (
    <svg className="kpi-trend" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="1.25" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** The single most important instruction on screen: what to do next. */
export function Recommendation({ world }: { world: World }) {
  const advice = world.advise();
  return (
    <section className="reco" aria-live="polite">
      <div className="reco-tag">Recommended action</div>
      <div className="reco-head">{advice.headline}</div>
      <div className="reco-body">{advice.rationale}</div>
      <Explainer label="Why this changes">
        The lever changes as the population changes. That is the thesis: once you can <b>see the motivation</b> driving
        the harm, the right response stops being a guess.
      </Explainer>
    </section>
  );
}

export function WorldDashboard({ world }: { world: World }) {
  const m = world.metrics();
  const pop = Math.max(1, m.population);

  return (
    <>
      <Recommendation world={world} />

      <CollapsiblePanel title="National Impact" sub="cumulative">
        <div className="tiles">
          <Big label="Recovery cost" value={money(m.recoveryCost)} tone="attacker" />
          <Big label="Public trust" value={`${m.publicTrust.toFixed(0)}%`} tone={m.publicTrust > 80 ? "advantage" : "attacker"} />
          <Big label="Breaches" value={compact(m.breaches)} />
          <Big label="Victim orgs" value={compact(m.victims)} />
          <Big label="Records stolen" value={compact(m.recordsStolen)} />
          <Big label="Downtime" value={`${compact(m.downtimeHours)}h`} />
        </div>
        <Spark history={world.history} />
        <Explainer>
          Every breach does <b>harm</b>, but only a paying victim gives the attacker <b>revenue</b> — and revenue is what
          recruits the next offender. The real-world payment rate is ~23% (ransomware) / 19% (data-theft) and falling
          (Coveware, Q3 2025). Driving it lower with backups and a no-pay posture starves the ecosystem at its source.
        </Explainer>
      </CollapsiblePanel>

      <CollapsiblePanel title="Defence &amp; Government" sub="activity">
        <div className="tiles">
          <Big label="SOC units" value={compact(m.guardians)} tone="defender" />
          <Big label="Defender captures" value={compact(m.defenderEvictions)} tone="defender" />
          <Big label="Nodes patched" value={compact(m.patches)} tone="defender" />
          <Big label="Gov. takedowns" value={compact(m.takedownOps)} tone="gov" />
          <Big label="Total arrests" value={compact(m.arrestsMade)} tone="gov" />
          <Big label="Desistances" value={compact(m.desistances)} tone="advantage" />
          <Big label="Recruited" value={compact(m.recruited)} tone="attacker" />
          <Big label="Shielded" value={compact(m.shieldedCount)} tone="attacker" />
        </div>
        <Explainer>
          Defenders (blue units) hunt the noisiest offenders and patch weak targets; government takedowns (amber) strike
          infrastructure. Fund <b>Defensive uplift</b>, <b>Arrest certainty</b>, and <b>Cooperation</b> to field more of
          them. <b>Shielded</b> offenders enjoy "controlled impunity" that enforcement can't reach regardless of
          cooperation.
        </Explainer>
      </CollapsiblePanel>

      <CollapsiblePanel title="Response Timescales" sub="lag & leakage">
        <div className="tiles">
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
          <Big label="Disclosed breaches" value={compact(Math.round(m.disclosedBreaches))} tone="defender" />
          <Big
            label="Undisclosed"
            value={compact(Math.max(0, Math.round(m.breaches - m.disclosedBreaches)))}
            tone="attacker"
          />
        </div>
        <Explainer>
          The response is slow and leaky on purpose. Ransomware is spotted in ~19 days, stealthier malware ~93 (breach
          filings); investigations run <b>1–3 years</b> and most never clear; and funded capability takes{" "}
          <b>months to field</b>. Enforcement mostly <i>deters</i> — it rarely catches anyone in the act. Authorities act
          on <b>disclosed</b> data, which trails the real breach count by weeks.
        </Explainer>
      </CollapsiblePanel>

      <CollapsiblePanel title="Who &amp; Where" sub="breakdown">
        <div className="group-lbl">By motivation <span>{compact(m.population)} active</span></div>
        {MOTIVATION_IDS.map((id) => {
          const n = m.byMotivation[id] ?? 0;
          return <HBar key={id} label={MOTIVATIONS[id].name} pct={(n / pop) * 100} color={MOTIVATIONS[id].color} num={compact(n)} />;
        })}
        <div className="group-lbl">Sector economic health <span>low = displacement target</span></div>
        {world.sectors.map((s) => (
          <HBar
            key={s.id}
            label={s.name}
            pct={s.economy}
            color={s.economy > 70 ? "var(--advantage)" : s.economy > 40 ? "var(--warn)" : "var(--crit)"}
            num={`${Math.round(s.economy)}%`}
          />
        ))}
        <div className="group-lbl">By origin <span>reach needs cooperation</span></div>
        {([
          ["domestic", "Domestic", JURISDICTION_COLORS.domestic],
          ["partner", "Partner", JURISDICTION_COLORS.partner],
          ["haven", "Safe haven", JURISDICTION_COLORS.haven],
        ] as const).map(([k, label, col]) => {
          const n = m.byJurisdiction[k] ?? 0;
          return <HBar key={k} label={label} pct={(n / pop) * 100} color={col} num={compact(n)} />;
        })}
      </CollapsiblePanel>

      <CollapsiblePanel title="Investigator Feed" sub="events">
        <ScrollArea maxHeight={260}>
          <div className="feed">
            {world.events.length === 0 && <div className="empty">No major events yet — run the simulation.</div>}
            {world.events.map((e, i) => (
              <div className={`feed-row k-${e.kind}`} key={`${e.tick}-${i}`}>
                <span className="feed-dot" />
                <span className="feed-text">{e.text}</span>
                <span className="feed-t">t{e.tick}</span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CollapsiblePanel>
    </>
  );
}

function Big({ label, value, tone }: { label: string; value: string; tone?: "attacker" | "advantage" | "defender" | "gov" }) {
  return (
    <div className={`tile ${tone ?? ""}`}>
      <div className="t-lbl">{label}</div>
      <div className="t-val">{value}</div>
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
  // Auto-range the y axis (floor rounded down to 10) so small declines are visible.
  const lo = Math.max(0, Math.floor((Math.min(...gdp, ...trust) - 2) / 10) * 10);
  const y = (v: number) => H - 1 - ((v - lo) / (100 - lo)) * (H - 2);
  const path = (vals: number[]) => vals.map((v, i) => `${(i / (n - 1)) * W},${y(v)}`).join(" ");
  return (
    <div className="spark">
      <div className="group-lbl" style={{ marginTop: 0 }}>
        Over time
        <span>
          <i className="swatch" style={{ background: "var(--accent)" }} /> GDP &nbsp; <i className="swatch" style={{ background: "var(--advantage)" }} /> Trust
        </span>
      </div>
      <div className="spark-plot">
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" style={{ display: "block" }}>
          <polyline points={path(gdp)} fill="none" stroke="var(--accent)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
          <polyline points={path(trust)} fill="none" stroke="var(--advantage)" strokeWidth="1.5" strokeDasharray="3 2" vectorEffect="non-scaling-stroke" />
        </svg>
        <span className="spark-axis top">100</span>
        <span className="spark-axis bot">{lo}</span>
      </div>
    </div>
  );
}
