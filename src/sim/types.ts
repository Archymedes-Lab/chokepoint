/**
 * Core type model for the Chokepoint simulation.
 *
 * The simulation is ABSTRACT. Nothing here describes how to execute an
 * attack. A "technique" is a node in a behavioural model with a few numbers
 * attached (how often it works, how much noise it makes, what it costs) —
 * calibrated from public threat research (see docs/METHODOLOGY.md). The
 * engine resolves those numbers probabilistically; it never performs,
 * emits, or instructs any real-world action.
 */

/** Ordered phases of the intrusion value chain. */
export type StageId =
  | "access" // TA0001 — get a foothold
  | "foothold" // TA0002/3/5 — execute, persist, evade
  | "escalate" // TA0004/6/8 — escalate, steal creds, move
  | "impact" // TA0010/0040 — exfiltrate, extort, encrypt
  | "cashout"; // monetize & launder

export interface Stage {
  id: StageId;
  index: number;
  name: string;
  tactic: string; // ATT&CK tactic label(s)
  blurb: string;
}

/** A defensive control the simulated organisation may deploy. */
export interface Control {
  id: string;
  name: string;
  category: "identity" | "endpoint" | "network" | "data" | "process" | "intel";
  blurb: string;
  /** Deployment completeness 0..1 (e.g. MFA on 90% of accounts). */
  coverage: number;
  /** Whether the organisation has this control at all. */
  enabled: boolean;
  /** Realistic default effort to stand it up, for the posture UI. */
  effort: "low" | "medium" | "high";
}

/** How a control bears on a technique. */
export interface ControlEffect {
  controlId: string;
  /** Multiplicative reduction of success probability, 0..1. */
  block?: number;
  /** Additive boost to per-attempt detection pressure, 0..1. */
  detect?: number;
  /**
   * If true, the control's benefit is near-absolute when fully covered
   * (e.g. FIDO2 vs. AiTM proxying) rather than incremental.
   */
  hard?: boolean;
}

/** A behavioural node: an option an adversary agent can attempt at a stage. */
export interface Technique {
  id: string;
  name: string;
  stage: StageId;
  tactic: string;
  blurb: string;
  /** Probability it advances the goal absent any control, 0..1. */
  baseSuccess: number;
  /** Telemetry generated per attempt, 0..1 (higher = louder). */
  noise: number;
  /** Resource units consumed on attempt. */
  cost: number;
  /** Dwell time added (hours) on attempt. */
  time: number;
  /** Minimum agent skill required to attempt, 0..1. */
  skillReq: number;
  /** Controls that bear on this technique. */
  counteredBy: ControlEffect[];
  /** Flavour: sourced note shown in the catalog/log. */
  note?: string;
}

/** An adversary profile (who is operating). */
export interface Archetype {
  id: string;
  name: string;
  blurb: string;
  skill: number; // 0..1 capability
  budget: number; // resource units available
  riskTolerance: number; // 0..1 willingness to operate while "hot"
  adaptability: number; // 0..1 chance to pivot after a block/failure
  goal: "ransomware" | "data-theft" | "bec" | "access-resale";
  /** Probability the agent buys initial access instead of earning it. */
  buysAccess: number;
}

export interface Posture {
  controls: Control[];
  /** Defender responsiveness: chance to act once detection crosses threshold. */
  responsiveness: number;
  /** Detection pressure needed before a response can trigger, 0..1. */
  responseThreshold: number;
  /** Relative value of the target (scales payouts and losses). */
  targetValue: number;
}

export type Outcome =
  | "blocked" // never got a foothold
  | "evicted" // detected and removed before impact
  | "abandoned" // adversary gave up (too hot / out of budget)
  | "breached" // reached impact (exfil/encryption) undetected enough
  | "cashed_out"; // breached AND successfully monetised

export interface SimEvent {
  step: number;
  stage: StageId;
  techniqueId?: string;
  kind:
    | "start"
    | "attempt"
    | "success"
    | "fail"
    | "blocked"
    | "detected"
    | "pivot"
    | "buy-access"
    | "advance"
    | "response"
    | "terminal";
  text: string;
  heat: number; // detection pressure after this event, 0..1
  cost: number; // cumulative adversary spend
  time: number; // cumulative dwell hours
}

export interface SimResult {
  seed: number;
  outcome: Outcome;
  reachedStage: StageId;
  reachedIndex: number;
  detectedAtStage?: StageId;
  events: SimEvent[];
  dwellHours: number;
  adversaryCost: number;
  adversaryNet: number; // profit after payout/laundering friction
  defenderLoss: number; // downtime/recovery/ransom
}

export interface BatchStats {
  runs: number;
  outcomes: Record<Outcome, number>;
  breachRate: number; // breached + cashed_out
  evictRate: number;
  detectByStage: Record<StageId, number>;
  meanDwell: number;
  meanDefenderLoss: number;
  meanAdversaryNet: number;
}

export interface LeverageRow {
  controlId: string;
  name: string;
  /** Percentage-point increase in breach rate if this control is removed. */
  breachDelta: number;
  /** Increase in mean defender loss if removed. */
  lossDelta: number;
}
