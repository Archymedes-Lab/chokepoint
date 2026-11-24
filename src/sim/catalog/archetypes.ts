import type { Archetype } from "../types";

/**
 * Adversary profiles. These shape the agent's decisions — a low-skill
 * access-buyer behaves nothing like a hands-on-keyboard ransomware affiliate.
 * The engine's decision function (engine.ts) reads these traits each step,
 * which is what makes runs path-dependent and emergent rather than scripted.
 */
export const ARCHETYPES: Archetype[] = [
  {
    id: "raas_affiliate",
    name: "RaaS affiliate",
    blurb:
      "Hands-on-keyboard operator renting ransomware infrastructure. Capable, patient, after encryption + data theft. Keeps 70–90% of the ransom.",
    skill: 0.7,
    budget: 120,
    riskTolerance: 0.55,
    adaptability: 0.75,
    goal: "ransomware",
    buysAccess: 0.6,
  },
  {
    id: "access_broker",
    name: "Initial access broker",
    blurb:
      "Specialises in breaking in and reselling the foothold. Stops early — the sale is the payday, not the ransom.",
    skill: 0.6,
    budget: 60,
    riskTolerance: 0.4,
    adaptability: 0.6,
    goal: "access-resale",
    buysAccess: 0.0,
  },
  {
    id: "bec_crew",
    name: "BEC / fraud crew",
    blurb:
      "Low-tech, high-ROI. Phishes a mailbox and redirects a wire; relies on mule networks to cash out.",
    skill: 0.4,
    budget: 40,
    riskTolerance: 0.5,
    adaptability: 0.5,
    goal: "bec",
    buysAccess: 0.2,
  },
  {
    id: "smash_grab",
    name: "Smash-and-grab extortionist",
    blurb:
      "Opportunistic data-theft extortion. Buys access cheaply, skips persistence, steals and threatens to leak.",
    skill: 0.5,
    budget: 70,
    riskTolerance: 0.7,
    adaptability: 0.55,
    goal: "data-theft",
    buysAccess: 0.7,
  },
  {
    id: "apt_adjacent",
    name: "Sophisticated intruder",
    blurb:
      "Well-resourced and quiet. High skill, deep budget, low risk appetite — prioritises stealth over speed.",
    skill: 0.9,
    budget: 200,
    riskTolerance: 0.3,
    adaptability: 0.9,
    goal: "data-theft",
    buysAccess: 0.3,
  },
];

export const ARCHETYPE_BY_ID: Record<string, Archetype> = Object.fromEntries(
  ARCHETYPES.map((a) => [a.id, a]),
);
