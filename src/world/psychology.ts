/**
 * Offender psychology. The five motivation profiles below are an abstraction of
 * the cybercriminal typologies that recur across criminological research
 * (see docs/SOURCES.md): economically-driven offenders, organised/professional
 * crews, ideological actors, thrill/status seekers, and low-skill opportunists
 * enabled by cheap tooling.
 *
 * The decision function is a bounded-rational **expected-utility** calculation —
 * Rational Choice / Routine Activity theory applied to cybercrime. An offender
 * weighs perceived reward against the perceived certainty and severity of
 * punishment and the moral cost of the harm, each scaled by their own
 * disposition. Change the world (drivers, interventions, defences) and the
 * utilities change, so behaviour — targeting, persistence, desistance —
 * emerges rather than being scripted.
 */
import type { Drivers, Interventions, Motivation, MotivationId, Sector } from "./types";
import type { RNG } from "../sim/rng";

export const MOTIVATIONS: Record<MotivationId, Motivation> = {
  economic: {
    id: "economic",
    name: "Economic / strain",
    color: "#f0a33c",
    blurb:
      "Driven by money and hardship. Pragmatic, moderate risk, chases the highest payout. Grows when the legitimate economy fails people.",
    greed: 1.3,
    riskBias: 1.0,
    moralWeight: 0.6,
    deterrability: 0.6,
    skillFloor: 0.25,
    skillSpread: 0.4,
    statusReward: 0.1,
    sectorBias: { finance: 1.3, crypto: 1.4, retail: 1.1 },
  },
  professional: {
    id: "professional",
    name: "Professional / organised",
    color: "#f2695e",
    blurb:
      "Calculating, well-resourced, ROI-driven. Low risk appetite, high skill. The RaaS operators and brokers — hit by takedowns and cash-out disruption.",
    greed: 1.5,
    riskBias: 0.7,
    moralWeight: 0.2,
    deterrability: 0.8,
    skillFloor: 0.6,
    skillSpread: 0.35,
    statusReward: 0.15,
    sectorBias: { finance: 1.3, healthcare: 1.2, critical: 1.25, crypto: 1.2 },
  },
  ideological: {
    id: "ideological",
    name: "Ideological / grievance",
    color: "#7aa0ff",
    blurb:
      "Motivated by a cause or grievance, not money. Targets 'the system' — government and critical infrastructure. Hard to deter with punishment.",
    greed: 0.3,
    riskBias: 1.2,
    moralWeight: 0.15, // the cause overrides ordinary conscience
    deterrability: 0.3,
    skillFloor: 0.4,
    skillSpread: 0.4,
    statusReward: 0.6,
    sectorBias: { government: 1.8, critical: 1.6 },
  },
  thrill: {
    id: "thrill",
    name: "Thrill / status",
    color: "#35c48b",
    blurb:
      "In it for the challenge and the notoriety. Notoriety is a reward in itself; deterred more by peers than by prison. Often young.",
    greed: 0.5,
    riskBias: 1.5,
    moralWeight: 0.5,
    deterrability: 0.35,
    skillFloor: 0.3,
    skillSpread: 0.5,
    statusReward: 1.2,
    sectorBias: { government: 1.3, critical: 1.2, finance: 1.1 },
  },
  opportunistic: {
    id: "opportunistic",
    name: "Opportunistic / low-skill",
    color: "#9aa7b8",
    blurb:
      "Low skill, enabled entirely by cheap tooling. Hits the weakest targets, easily deterred, high churn. Surges when kits are cheap and plentiful.",
    greed: 1.0,
    riskBias: 0.9,
    moralWeight: 0.5,
    deterrability: 0.75,
    skillFloor: 0.1,
    skillSpread: 0.3,
    statusReward: 0.3,
    sectorBias: { retail: 1.6 },
  },
};

export const MOTIVATION_IDS = Object.keys(MOTIVATIONS) as MotivationId[];

/** Effective capability, lifted by how much ready-made tooling is around. */
export function effectiveSkill(skill: number, d: Drivers): number {
  return Math.min(1, skill + d.toolingAvailability * (1 - skill) * 0.5);
}

/** Perceived probability of being caught operating on a node in a sector. */
export function perceivedCatch(
  heat: number,
  safeHaven: boolean,
  iv: Interventions,
): number {
  let p = 0.04 + heat * 0.4 + iv.arrests * 0.45;
  if (safeHaven) p *= 0.25 + 0.75 * iv.cooperation; // havens need cooperation to reach
  return Math.min(0.95, p);
}

/**
 * Expected utility of attacking a given sector/node, from this offender's point
 * of view. Positive → worth doing; the agent picks the best sampled option and,
 * if even the best is negative, is effectively deterred (lays low / desists).
 */
export function expectedUtility(
  args: {
    mot: Motivation;
    skill: number;
    riskTolerance: number;
    morality: number;
    greed: number;
    heat: number;
    safeHaven: boolean;
    distance: number; // normalised 0..1
  },
  sector: Sector,
  node: { value: number; defense: number },
  d: Drivers,
  iv: Interventions,
): number {
  const skill = effectiveSkill(args.skill, d);
  const defense = Math.min(0.98, sector.baseDefense + node.defense + iv.hardening * 0.25);
  const pSuccess = clamp01(skill * 0.9 - defense + 0.1);

  // Reward: node value, scaled by cash-out ease, the offender's greed, and
  // (for status-seekers) the notoriety a juicy target confers.
  const cashout = 0.25 + 0.75 * d.cryptoLiquidity * (1 - iv.cashoutDisruption);
  const bias = args.mot.sectorBias[sector.id] ?? 1;
  const money = node.value * cashout * args.greed * args.mot.greed;
  const status = args.mot.statusReward * sector.harm * 40;
  const reward = (money + status) * bias;

  // Punishment: certainty × severity, scaled by how deterrable the offender is.
  const pCaught = perceivedCatch(args.heat, args.safeHaven, iv);
  const severity = 60 * (1 - args.riskTolerance * args.mot.riskBias * 0.6);
  const punishment = pCaught * severity * args.mot.deterrability;

  // Conscience: harm to high-harm sectors (hospitals, infrastructure) costs
  // offenders with a conscience; the cause overrides it for ideologues.
  const moralCost = args.morality * args.mot.moralWeight * sector.harm * 30;

  // Effort: distance across the map + capability gap.
  const effort = args.distance * 12 + Math.max(0, defense - skill) * 20;

  return pSuccess * reward - punishment - moralCost - effort;
}

/**
 * Draw a motivation for a newly-recruited offender. The mix shifts with the
 * drivers: strain breeds economic offenders, cheap tooling breeds opportunists,
 * contagion amplifies whichever type is currently succeeding.
 */
export function recruitMotivation(
  d: Drivers,
  successMix: Record<MotivationId, number>,
  rng: RNG,
): MotivationId {
  const w: Record<MotivationId, number> = {
    economic: 1 + d.economicStrain * 2.2,
    professional: 0.6 + d.cryptoLiquidity * 0.8,
    ideological: 0.5 + d.perceivedImpunity * 0.4,
    thrill: 0.7,
    opportunistic: 0.5 + d.toolingAvailability * 2.5,
  };
  // Social contagion: bias toward motivations that have been succeeding.
  for (const id of MOTIVATION_IDS) w[id] += d.contagion * (successMix[id] ?? 0) * 2;
  const ids = MOTIVATION_IDS;
  return ids[rng.weightedIndex(ids.map((id) => w[id]))];
}

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
