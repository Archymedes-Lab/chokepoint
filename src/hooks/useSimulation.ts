import { useMemo } from "react";
import {
  simulate,
  runBatch,
  leverageAnalysis,
  type Archetype,
  type Posture,
  type SimResult,
  type BatchStats,
  type LeverageRow,
} from "../sim";

/** Memoised single run — recomputes only when inputs change. */
export function useSingleRun(agent: Archetype, posture: Posture, seed: number): SimResult {
  const key = postureKey(posture);
  return useMemo(() => simulate(agent, posture, seed), [agent, key, seed]);
}

/** Memoised Monte-Carlo batch. */
export function useBatch(agent: Archetype, posture: Posture, runs: number): BatchStats {
  const key = postureKey(posture);
  return useMemo(() => runBatch(agent, posture, runs), [agent, key, runs]);
}

/** Memoised leverage analysis (heavier — fewer runs per control). */
export function useLeverage(agent: Archetype, posture: Posture, runs = 300): LeverageRow[] {
  const key = postureKey(posture);
  return useMemo(() => leverageAnalysis(agent, posture, runs), [agent, key, runs]);
}

/** Stable key capturing everything the simulation depends on. */
function postureKey(p: Posture): string {
  return (
    `${p.responsiveness}|${p.responseThreshold}|${p.targetValue}|` +
    p.controls.map((c) => `${c.id}:${c.enabled ? 1 : 0}:${c.coverage.toFixed(2)}`).join(",")
  );
}
