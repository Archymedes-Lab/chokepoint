/** Public surface of the simulation core. UI imports from here. */
export * from "./types";
export { simulate } from "./engine";
export { runBatch, leverageAnalysis } from "./montecarlo";
export { STAGES, STAGE_BY_ID, STAGE_ORDER } from "./catalog/stages";
export { DEFAULT_CONTROLS, defaultControls } from "./catalog/controls";
export { TECHNIQUES, TECHNIQUES_BY_STAGE, TECHNIQUE_BY_ID } from "./catalog/techniques";
export { ARCHETYPES, ARCHETYPE_BY_ID } from "./catalog/archetypes";

import type { Posture } from "./types";
import { defaultControls } from "./catalog/controls";

/** A sensible starting posture: a middling organisation. */
export function defaultPosture(): Posture {
  return {
    controls: defaultControls(),
    responsiveness: 0.5,
    responseThreshold: 0.62,
    targetValue: 1_000_000,
  };
}
