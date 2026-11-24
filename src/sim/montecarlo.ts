import { simulate } from "./engine";
import type {
  Archetype,
  BatchStats,
  LeverageRow,
  Outcome,
  Posture,
  StageId,
} from "./types";
import { STAGE_ORDER } from "./catalog/stages";

const OUTCOMES: Outcome[] = ["blocked", "evicted", "abandoned", "breached", "cashed_out"];

function emptyStageCounts(): Record<StageId, number> {
  return Object.fromEntries(STAGE_ORDER.map((s) => [s, 0])) as Record<StageId, number>;
}

/**
 * Run `runs` independent simulations and aggregate. Each run uses a distinct,
 * deterministic seed derived from `baseSeed`, so a whole batch is reproducible.
 */
export function runBatch(
  agent: Archetype,
  posture: Posture,
  runs: number,
  baseSeed = 1,
): BatchStats {
  const outcomes = Object.fromEntries(OUTCOMES.map((o) => [o, 0])) as Record<Outcome, number>;
  const detectByStage = emptyStageCounts();
  let dwellSum = 0;
  let lossSum = 0;
  let netSum = 0;

  for (let i = 0; i < runs; i++) {
    const r = simulate(agent, posture, baseSeed * 2654435761 + i * 40503 + 7);
    outcomes[r.outcome]++;
    dwellSum += r.dwellHours;
    lossSum += r.defenderLoss;
    netSum += r.adversaryNet;
    if (r.detectedAtStage) detectByStage[r.detectedAtStage]++;
  }

  const breachRate = (outcomes.breached + outcomes.cashed_out) / runs;
  const evictRate = outcomes.evicted / runs;

  return {
    runs,
    outcomes,
    breachRate,
    evictRate,
    detectByStage,
    meanDwell: dwellSum / runs,
    meanDefenderLoss: lossSum / runs,
    meanAdversaryNet: netSum / runs,
  };
}

/**
 * Control-leverage analysis. For each currently-enabled control, re-run the
 * batch with that one control disabled and measure how much worse things get.
 * The controls whose removal most raises the breach rate are the chokepoints
 * — the links the whole chain actually depends on, for THIS posture and THIS
 * adversary. This is dynamic: change the posture and the ranking changes.
 */
export function leverageAnalysis(
  agent: Archetype,
  posture: Posture,
  runs = 300,
  baseSeed = 1,
): LeverageRow[] {
  const base = runBatch(agent, posture, runs, baseSeed);
  const rows: LeverageRow[] = [];

  for (const ctrl of posture.controls) {
    if (!ctrl.enabled) continue;
    const counterfactual: Posture = {
      ...posture,
      controls: posture.controls.map((c) =>
        c.id === ctrl.id ? { ...c, enabled: false } : { ...c },
      ),
    };
    const without = runBatch(agent, counterfactual, runs, baseSeed);
    rows.push({
      controlId: ctrl.id,
      name: ctrl.name,
      breachDelta: (without.breachRate - base.breachRate) * 100,
      lossDelta: without.meanDefenderLoss - base.meanDefenderLoss,
    });
  }

  rows.sort((a, b) => b.breachDelta - a.breachDelta || b.lossDelta - a.lossDelta);
  return rows;
}
