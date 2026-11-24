import type { Drivers, Interventions } from "./types";

/**
 * Named policy worlds for comparison. Each sets the external causes and the
 * authority posture together, as an *established regime* (capability already
 * fielded), so you can load one and read its steady state rather than waiting
 * out the policy lag. Tweaking any slider afterwards drops you back to "Custom".
 */
export interface Scenario {
  id: string;
  name: string;
  note: string;
  drivers: Partial<Drivers>;
  interventions: Partial<Interventions>;
}

export const SCENARIOS: Scenario[] = [
  {
    id: "baseline",
    name: "2025 Baseline",
    note: "The calibrated present: moderate strain, cheap tooling, 23% payment rate, light enforcement.",
    drivers: { economicStrain: 0.5, toolingAvailability: 0.55, perceivedImpunity: 0.6, cryptoLiquidity: 0.6, contagion: 0.4, aiEnabled: 0.4 },
    interventions: { arrests: 0.15, takedown: 0, cashoutDisruption: 0, hardening: 0, cooperation: 0.1, diversion: 0, paymentBan: 0 },
  },
  {
    id: "downturn",
    name: "Economic Downturn",
    note: "Hardship swells recruitment of profit-driven offenders; impunity feels high.",
    drivers: { economicStrain: 0.9, toolingAvailability: 0.6, perceivedImpunity: 0.7, cryptoLiquidity: 0.65, contagion: 0.5, aiEnabled: 0.45 },
    interventions: { arrests: 0.2, cooperation: 0.1 },
  },
  {
    id: "ai_surge",
    name: "Cheap-AI Surge",
    note: "Generative AI + cheap kits collapse the skill barrier — a wave of low-skill opportunists.",
    drivers: { economicStrain: 0.5, toolingAvailability: 0.85, perceivedImpunity: 0.6, cryptoLiquidity: 0.6, contagion: 0.6, aiEnabled: 0.9 },
    interventions: { arrests: 0.2, cooperation: 0.1 },
  },
  {
    id: "ban",
    name: "Payment Ban Enacted",
    note: "A no-pay regime: payments cut hard at the source — attacks persist, revenue starves.",
    drivers: { economicStrain: 0.5, toolingAvailability: 0.55, perceivedImpunity: 0.55, cryptoLiquidity: 0.55, contagion: 0.4, aiEnabled: 0.4 },
    interventions: { arrests: 0.3, cooperation: 0.4, paymentBan: 0.85, hardening: 0.2 },
  },
  {
    id: "crackdown",
    name: "Coordinated Crackdown",
    note: "Maximal enforcement — arrests, takedowns, cash-out disruption, cooperation. Watch the budget.",
    drivers: { economicStrain: 0.5, toolingAvailability: 0.55, perceivedImpunity: 0.45, cryptoLiquidity: 0.6, contagion: 0.4, aiEnabled: 0.4 },
    interventions: { arrests: 0.8, takedown: 0.7, cashoutDisruption: 0.7, cooperation: 0.85, hardening: 0.2, diversion: 0.2 },
  },
  {
    id: "resilient",
    name: "Resilient Nation",
    note: "Defence-first: sector hardening, backups, upstream diversion, strong cooperation.",
    drivers: { economicStrain: 0.4, toolingAvailability: 0.5, perceivedImpunity: 0.45, cryptoLiquidity: 0.5, contagion: 0.35, aiEnabled: 0.4 },
    interventions: { arrests: 0.35, hardening: 0.85, diversion: 0.6, cooperation: 0.5, cashoutDisruption: 0.3, paymentBan: 0.3 },
  },
  {
    id: "impunity",
    name: "Safe-Haven Impunity",
    note: "Non-cooperating havens thrive: easy cash-out, high impunity, no international reach.",
    drivers: { economicStrain: 0.6, toolingAvailability: 0.6, perceivedImpunity: 0.9, cryptoLiquidity: 0.85, contagion: 0.5, aiEnabled: 0.5 },
    interventions: { arrests: 0.1, cooperation: 0.05 },
  },
];
