/**
 * Types for the 2D agent-based cybercrime ecosystem.
 *
 * This is a CRIMINOLOGICAL model: it simulates offender motivation, decisions,
 * and population dynamics to help defenders and authorities reason about which
 * interventions reduce harm. It is abstract — agents reason about expected
 * utility over *sectors of the economy*, never about mechanisms. See
 * docs/WORLD.md and docs/ETHICS.md.
 */

export type MotivationId =
  | "economic" // strain / profit-driven
  | "professional" // organised, calculating, ROI-maximising
  | "ideological" // hacktivist / grievance-driven
  | "thrill" // status, notoriety, the challenge
  | "opportunistic"; // low-skill, tooling-enabled, high churn

export interface Motivation {
  id: MotivationId;
  name: string;
  color: string;
  blurb: string;
  // Decision weights (how this type values each term of expected utility).
  greed: number; // weight on monetary reward
  riskBias: number; // >1 risk-seeking, <1 risk-averse
  moralWeight: number; // weight on harm-to-victim cost (conscience)
  deterrability: number; // how much perceived punishment deters (0..1)
  skillFloor: number; // baseline capability
  skillSpread: number; // variance of capability
  statusReward: number; // weight on notoriety as a reward in itself
  // Targeting bias: preferred sectors (by id) get a utility bonus.
  sectorBias: Partial<Record<string, number>>;
}

export type AgentState =
  | "seek"
  | "travel"
  | "operate"
  | "cash"
  | "lay_low"
  | "jailed"
  | "desisted";

export interface Agent {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  mot: MotivationId;
  skill: number;
  riskTolerance: number;
  morality: number;
  greed: number;
  deterrability: number;
  aspiration: number; // wealth target; met → may desist
  wealth: number;
  heat: number; // attention / notoriety 0..1
  state: AgentState;
  targetSector: number; // index into sectors, -1 none
  targetNode: number; // index into that sector's nodes, -1 none
  cooldown: number; // ticks until state can change (travel/operate/jail timer)
  ageTicks: number;
  ops: number;
  busts: number;
  lastEU: number; // last computed expected utility (for the inspector)
  safeHaven: boolean; // outside easy reach unless cooperation is high
  invProgress: number; // 0..1 how far a case has been built against them
}

export interface TargetNode {
  x: number;
  y: number;
  value: number; // attractiveness / payoff scale
  defense: number; // 0..1 local hardening
  health: number; // 0..1 operational health
  cooldown: number; // ticks of disruption after a hit
}

export interface Sector {
  id: string;
  name: string;
  color: string;
  region: { x: number; y: number; w: number; h: number }; // in world units
  gdpWeight: number; // share of the whole economy
  economy: number; // 0..100 current health
  baseDefense: number; // baseline hardening (raised by campaigns)
  harm: number; // weight: how much societal harm an attack here causes
  coupling: Partial<Record<string, number>>; // drag onto other sectors
  nodes: TargetNode[];
  // live accumulators
  loss: number;
  breaches: number;
}

/** External macro drivers — the "why", the causes outside any one offender. */
export interface Drivers {
  economicStrain: number; // 0..1 unemployment / hardship → recruitment & risk
  toolingAvailability: number; // 0..1 RaaS/kits → lowers the skill barrier
  perceivedImpunity: number; // 0..1 belief you won't be caught → entry & risk
  cryptoLiquidity: number; // 0..1 ease of realising/cashing out proceeds
  contagion: number; // 0..1 how strongly success recruits imitators
}

/** Authority interventions — the levers. Each 0..1 intensity, each a cost. */
export interface Interventions {
  takedown: number; // seize infrastructure / tooling
  arrests: number; // raise certainty of punishment
  cashoutDisruption: number; // seize mixers/exchanges → cut realised reward
  hardening: number; // fund sector-wide defensive uplift
  cooperation: number; // international reach into safe havens
  diversion: number; // address root causes / recruitment (desistance programs)
  paymentBan: number; // ban / no-pay norm that suppresses ransom payment
}

/** A defender (SOC / blue-team) unit operating in the landscape. */
export interface Guardian {
  id: number;
  x: number;
  y: number;
  state: "patrol" | "respond";
  targetId: number; // attacker being pursued, -1 none
  vx: number;
  vy: number;
}

export interface Metrics {
  tick: number;
  population: number;
  byMotivation: Record<MotivationId, number>;
  activeOps: number;
  financialLoss: number; // cumulative $
  recoveryCost: number; // cumulative $
  downtimeHours: number;
  recordsStolen: number;
  victims: number;
  gdpIndex: number; // 0..100 weighted economy health
  publicTrust: number; // 0..100
  breaches: number; // cumulative
  arrestsMade: number; // cumulative (all captures)
  desistances: number; // cumulative
  recruited: number; // cumulative
  budgetUsed: number; // 0..1 of authority budget
  // defender & government activity
  guardians: number; // active SOC / blue-team units
  defenderEvictions: number; // cumulative captures made by guardians
  patches: number; // cumulative node hardenings by defenders
  takedownOps: number; // cumulative government infrastructure strikes
  // attacker economy (calibrated to real payment rates — see docs/CALIBRATION.md)
  attackerRevenue: number; // cumulative $ actually paid to offenders
  extortionAttempts: number; // breaches that issued a demand
  paidCount: number; // breaches where the victim paid
  // realistic response timescales (see docs/CALIBRATION.md)
  day: number; // simulated day (1 tick = 6h)
  fieldedCapability: number; // 0..1 enforcement capability actually stood up (lags funding)
  openInvestigations: number; // active cases being built
  meanTimeToArrestDays: number; // from first offence to capture
}

export interface WorldConfig {
  width: number;
  height: number;
  initialAgents: number;
  seed: number;
}
